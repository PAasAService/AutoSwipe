import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import { copyFile, unlink } from 'fs/promises'

const PUBLIC = path.join(process.cwd(), 'public')

/** Absolute path under public/, or null if outside uploads. */
export function resolvePublicFilePath(publicUrl: string): string | null {
  if (!publicUrl.startsWith('/uploads/')) return null
  const relative = publicUrl.replace(/^\//, '')
  const resolved = path.normalize(path.join(PUBLIC, relative))
  const uploadsBase = path.join(PUBLIC, 'uploads')
  if (!resolved.startsWith(uploadsBase)) return null
  if (relative.includes('..')) return null
  return resolved
}

export function listingsUploadRoot(): string {
  return path.join(PUBLIC, 'uploads', 'listings')
}

export function pendingDirForUser(userId: string): string {
  return path.join(listingsUploadRoot(), 'pending', userId)
}

export function pendingPublicPrefix(userId: string): string {
  return `/uploads/listings/pending/${userId}`
}

export function isPendingPathForUser(publicPath: string, userId: string): boolean {
  const prefix = `${pendingPublicPrefix(userId)}/`
  if (!publicPath.startsWith(prefix)) return false
  const rest = publicPath.slice(prefix.length)
  if (!rest || rest.includes('/') || rest.includes('..')) return false
  return /^[a-zA-Z0-9._-]+$/.test(rest)
}

export function extFromMime(mime: string): string {
  if (mime === 'image/png') return '.png'
  if (mime === 'image/webp') return '.webp'
  if (mime === 'image/gif') return '.gif'
  return '.jpg'
}

/** Move file from pending to final listing folder; public paths like /uploads/listings/{id}/0.jpg */
export async function movePendingToListing(
  pendingPublicPath: string,
  listingId: string,
  order: number,
): Promise<string> {
  const srcAbs = resolvePublicFilePath(pendingPublicPath)
  if (!srcAbs || !existsSync(srcAbs)) {
    throw new Error('Source image missing')
  }
  const ext = path.extname(srcAbs) || '.jpg'
  const destPublic = `/uploads/listings/${listingId}/${order}${ext}`
  const destAbs = resolvePublicFilePath(destPublic)
  if (!destAbs) throw new Error('Invalid destination')

  await fs.mkdir(path.dirname(destAbs), { recursive: true })
  try {
    await fs.rename(srcAbs, destAbs)
  } catch {
    await copyFile(srcAbs, destAbs)
    await unlink(srcAbs)
  }
  return destPublic
}

export async function deletePublicUploadFile(publicPath: string, userId: string): Promise<boolean> {
  if (!isPendingPathForUser(publicPath, userId)) return false
  const abs = resolvePublicFilePath(publicPath)
  if (!abs) return false
  try {
    await unlink(abs)
    return true
  } catch {
    return false
  }
}
