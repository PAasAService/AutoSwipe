/**
 * Seller-side notifications that refer to a specific listing (deep-link target).
 * Extend this set when adding new listing-scoped seller notifications.
 */
export const SELLER_LISTING_NOTIFICATION_TYPES = new Set([
  'listing_like',
  'listing_super_like',
])

/** Next.js app path for the listing detail page, or null when not applicable. */
export function listingPageHref(
  type: string,
  data: Record<string, unknown>,
): string | null {
  if (!SELLER_LISTING_NOTIFICATION_TYPES.has(type)) return null
  const id = data.listingId
  if (typeof id !== 'string' || !id.trim()) return null
  return `/listing/${id}`
}
