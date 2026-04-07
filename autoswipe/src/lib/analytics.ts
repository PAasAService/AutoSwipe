import posthog from 'posthog-js'

type Props = Record<string, string | number | boolean | null | undefined>

export function track(event: string, properties?: Props) {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  try { posthog.capture(event, properties) } catch {}
}

export function identify(userId: string, traits?: Props) {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  try { posthog.identify(userId, traits) } catch {}
}

export function resetAnalytics() {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  try { posthog.reset() } catch {}
}
