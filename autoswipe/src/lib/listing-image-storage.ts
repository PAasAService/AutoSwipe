import path from 'path'
import fs from 'fs/promises'
import { randomBytes } from 'crypto'
import { existsSync } from 'fs'
import { copyFile, unlink, rm } from 'fs/promises'

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

/** Finalised image under this listing folder (seller reorder / edit). */
export function isListingImagePathForListing(publicPath: string, listingId: string): boolean {
  const prefix = `/uploads/listings/${listingId}/`
  if (!publicPath.startsWith(prefix)) return false
  const rest = publicPath.slice(prefix.length)
  if (!rest || rest.includes('..') || rest.includes('/')) return false
  return /^\d+\.[A-Za-z0-9]+$/.test(rest)
}

/**
 * Replaces ordered images for a listing: copies each source (pending or existing listing file),
 * removes old numbered files in the listing folder, writes 0..n-1 and returns public paths.
 */
export async function replaceListingOrderedImages(
  listingId: string,
  userId: string,
  orderedPublicPaths: readonly string[],
): Promise<string[]> {
  if (orderedPublicPaths.length < 1 || orderedPublicPaths.length > 6) {
    throw new Error('Invalid image count')
  }
  const seen = new Set<string>()
  for (const p of orderedPublicPaths) {
    if (seen.has(p)) throw new Error('Duplicate image path')
    seen.add(p)
    const allowed =
      isPendingPathForUser(p, userId) || isListingImagePathForListing(p, listingId)
    if (!allowed) throw new Error('Invalid image path')
    const abs = resolvePublicFilePath(p)
    if (!abs || !existsSync(abs)) throw new Error('Missing image file')
  }

  const stagingName = `_stg_${randomBytes(16).toString('hex')}`
  const stagingAbs = path.join(listingsUploadRoot(), stagingName)

  await fs.mkdir(stagingAbs, { recursive: true })
  const extensions: string[] = []

  try {
    for (let i = 0; i < orderedPublicPaths.length; i++) {
      const p = orderedPublicPaths[i]!
      const srcAbs = resolvePublicFilePath(p)!
      const ext = path.extname(srcAbs) || '.jpg'
      extensions.push(ext)
      const destAbs = path.join(stagingAbs, `${i}${ext}`)
      await copyFile(srcAbs, destAbs)
      if (isPendingPathForUser(p, userId)) {
        await unlink(srcAbs).catch(() => {})
      }
    }

    const listingDir = path.join(listingsUploadRoot(), listingId)
    if (existsSync(listingDir)) {
      const entries = await fs.readdir(listingDir)
      for (const ent of entries) {
        if (/^\d+\./.test(ent)) {
          await unlink(path.join(listingDir, ent)).catch(() => {})
        }
      }
    } else {
      await fs.mkdir(listingDir, { recursive: true })
    }

    const finalPublic: string[] = []
    for (let i = 0; i < orderedPublicPaths.length; i++) {
      const ext = extensions[i]!
      const fromAbs = path.join(stagingAbs, `${i}${ext}`)
      const destPublic = `/uploads/listings/${listingId}/${i}${ext}`
      const destAbs = resolvePublicFilePath(destPublic)
      if (!destAbs) throw new Error('Invalid destination')
      await copyFile(fromAbs, destAbs)
      finalPublic.push(destPublic)
    }

    await rm(stagingAbs, { recursive: true, force: true })
    return finalPublic
  } catch (e) {
    await rm(stagingAbs, { recursive: true, force: true }).catch(() => {})
    throw e
  }
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
