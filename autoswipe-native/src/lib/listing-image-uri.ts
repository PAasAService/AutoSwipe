import { getApiBaseUrl } from './api-base-url'

/** Absolute URL for a listing image path from the API (e.g. `/uploads/listings/...`). */
export function listingImageUri(path: string | undefined | null): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = getApiBaseUrl().replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
