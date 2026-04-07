/**
 * Sentry error reporting stub.
 * Works in dev (console logs). For production Sentry:
 * 1. Run: npx expo install @sentry/react-native
 * 2. Follow: https://docs.sentry.io/platforms/react-native/
 */

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error('[Sentry] Exception:', error, context ?? '')
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (__DEV__) {
    console.log(`[Sentry] ${level.toUpperCase()}: ${message}`)
  }
}

export function setUser(user: { id: string; email: string } | null): void {
  // production: Sentry.setUser(user)
}
