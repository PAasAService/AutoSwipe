import { Platform } from 'react-native'

let ph: any = null

export async function initAnalytics(): Promise<void> {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY
  if (!key) return
  try {
    const { PostHog } = await import('posthog-react-native')
    ph = new PostHog(key, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    })
  } catch {
    // posthog-react-native not installed — silent fail
  }
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!ph) return
  try { ph.capture(event, { ...properties, platform: Platform.OS }) } catch {}
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!ph) return
  try { ph.identify(userId, traits) } catch {}
}

export function resetAnalytics(): void {
  if (!ph) return
  try { ph.reset() } catch {}
}
