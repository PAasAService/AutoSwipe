/** Keep in sync with autoswipe/src/lib/notifications/listing-link.ts */
const SELLER_LISTING_NOTIFICATION_TYPES = new Set([
  'listing_like',
  'listing_super_like',
])

/** Expo Router path for listing detail, or null when not applicable. */
export function listingPathFromNotification(
  type: string,
  data: Record<string, unknown>,
): string | null {
  if (!SELLER_LISTING_NOTIFICATION_TYPES.has(type)) return null
  const id = data.listingId
  if (typeof id !== 'string' || !id.trim()) return null
  return `/listing/${id}`
}
