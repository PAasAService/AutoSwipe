import { router, type Href } from 'expo-router'

const DEFAULT_FALLBACK: Href = '/(tabs)/swipe'

/** Known `returnTo` query values → where to `replace` when leaving a pushed screen. */
const RETURN_ROUTE_MAP: Record<string, Href> = {
  settings: '/(tabs)/settings',
  explore: '/(tabs)/explore',
  swipe: '/(tabs)/swipe',
  messages: '/(tabs)/messages',
  recommended: '/(tabs)/recommended',
  dashboard: '/(tabs)/dashboard',
  favorites: '/(tabs)/favorites',
}

/**
 * Appends `returnTo=<key>` so the screen can pop back to the right tab/area
 * instead of whatever happens to sit under `router.back()` in the tab navigator.
 */
export function hrefWithReturn(
  href: string,
  returnKey: keyof typeof RETURN_ROUTE_MAP,
): Href {
  if (href.includes('returnTo=')) return href as Href
  const sep = href.includes('?') ? '&' : '?'
  return `${href}${sep}returnTo=${encodeURIComponent(returnKey)}` as Href
}

/**
 * If the screen was opened with `?returnTo=<key>` (see {@link hrefWithReturn}),
 * jump there with `replace`. Otherwise same as {@link goBackSafe}.
 */
export function goBackSafeWithReturn(
  returnTo: string | undefined,
  fallback: Href = DEFAULT_FALLBACK,
) {
  if (returnTo && RETURN_ROUTE_MAP[returnTo]) {
    router.replace(RETURN_ROUTE_MAP[returnTo])
    return
  }
  goBackSafe(fallback)
}

/**
 * Pops the previous screen when the stack allows it; otherwise dismisses a modal
 * or replaces with `fallback` so the control never no-ops (common when `replace`
 * was used upstream or the screen was opened as the only route).
 */
export function goBackSafe(fallback: Href = DEFAULT_FALLBACK) {
  if (router.canGoBack()) {
    router.back()
    return
  }
  if (router.canDismiss()) {
    router.dismiss()
    return
  }
  router.replace(fallback)
}
