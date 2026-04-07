/**
 * Centralised React Query key factory.
 *
 * All keys live here to prevent typos and make mass-invalidations easy.
 * Keys are typed `as const` so TypeScript infers exact tuple literals.
 */
export const queryKeys = {
  /** Authenticated user's own profile */
  me: () => ['me'] as const,

  /** Full favorites list: GET /api/favorites */
  favorites: () => ['favorites'] as const,

  /** Infinite recommendation feed: GET /api/recommendations */
  recommendations: () => ['recommendations'] as const,

  /** Single message thread + messages: GET /api/messages/:id */
  thread: (threadId: string) => ['thread', threadId] as const,
} as const
