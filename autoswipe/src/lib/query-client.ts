import { QueryClient } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't re-fetch in the background on every window-focus — jarring on mobile
        refetchOnWindowFocus: false,
        // 1-minute default staleTime. Individual hooks override where needed.
        staleTime: 60 * 1_000,
        gcTime:    5 * 60 * 1_000,
        // Never retry 401s — they need user action, not retries
        retry: (failureCount, error) => {
          if (error instanceof Error && error.message === '401') return false
          return failureCount < 2
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

/**
 * Returns the singleton QueryClient for the browser,
 * or a fresh one per SSR pass (Next.js App Router safe).
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
