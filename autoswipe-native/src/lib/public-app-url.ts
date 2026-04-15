/**
 * Public app URL — for sharing listing links
 *
 * In production, this should be set to your actual domain.
 * In development, it falls back to a configured base URL.
 *
 * DO NOT hardcode localhost in production builds.
 */
function getPublicAppUrl(): string {
  // First, check environment variable (set in .env for production)
  const envUrl = process.env.EXPO_PUBLIC_APP_URL?.trim()
  if (envUrl && envUrl !== 'http://localhost:3000' && envUrl !== 'http://localhost:3002') {
    return envUrl
  }

  // In development, use a fallback (local testing)
  // This should be overridden by EXPO_PUBLIC_APP_URL in production
  return 'http://localhost:3002'
}

/**
 * Generate a public listing share URL
 */
export function getListingShareUrl(listingId: string): string {
  const baseUrl = getPublicAppUrl()
  return `${baseUrl}/listing/${listingId}`
}

/**
 * Get the base public app URL
 */
export function getPublicBaseUrl(): string {
  return getPublicAppUrl()
}
