export const queryKeys = {
  me: () => ['me'] as const,
  favorites: () => ['favorites'] as const,
  recommendations: () => ['recommendations'] as const,
  thread: (id: string) => ['thread', id] as const,
  threads: () => ['threads'] as const,
  listing: (id: string) => ['listing', id] as const,
  preferences: () => ['preferences'] as const,
}
