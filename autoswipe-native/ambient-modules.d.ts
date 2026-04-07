/** Optional runtime dep — `initAnalytics` dynamic-imports this package. */
declare module 'posthog-react-native' {
  export class PostHog {
    constructor(apiKey: string, options?: { host?: string })
    capture(event: string, properties?: Record<string, unknown>): void
    identify(distinctId: string, properties?: Record<string, unknown>): void
    reset(): void
  }
}
