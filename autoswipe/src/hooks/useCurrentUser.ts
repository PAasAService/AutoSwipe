import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import type { User } from '@/types'

async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch('/api/users/me')
  if (res.status === 401) return null            // session expired — return null, not an error
  if (!res.ok) throw new Error(String(res.status))
  const { data } = await res.json()
  return data ?? null
}

/**
 * Returns the currently authenticated user.
 * staleTime: 5 min — user profile rarely changes mid-session.
 * retry: false — 401 should not retry.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn:  fetchCurrentUser,
    staleTime: 5 * 60 * 1_000,
    gcTime:    30 * 60 * 1_000,
    retry:     false,
  })
}
