import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { queryKeys } from '@/lib/query-keys'
import { useSwipeStore } from '@/store/swipe'
import type { FeedListing } from '@/types'

type RecsPage = { data: FeedListing[]; page: number; hasMore: boolean }

async function fetchRecsPage(page: number): Promise<RecsPage> {
  const res = await fetch(`/api/recommendations?page=${page}&limit=20`)
  if (!res.ok) throw new Error('Feed fetch failed')
  return res.json()
}

/**
 * Infinite query for the personalised swipe-deck recommendation feed.
 *
 * Rationale for the aggressive caching settings:
 *  - staleTime: Infinity — the feed must not silently re-shuffle mid-session.
 *    The user has already seen / swiped through earlier pages; re-fetching
 *    page 0 would put cards they've already seen back at the front.
 *  - refetchOnWindowFocus: false — same reason: no surprise reshuffles.
 *  - refetchOnMount: false — if the user navigates away and back,
 *    they pick up exactly where they left off.
 *
 * The feed is explicitly reset (via useResetFeed) when:
 *   a) The user preferences change (settings page)
 *   b) The user taps "התחל מחדש" (restart) in the empty-deck state
 */
export function useRecommendations() {
  return useInfiniteQuery({
    queryKey:      queryKeys.recommendations(),
    queryFn:       ({ pageParam }) => fetchRecsPage(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime:           Infinity,
    gcTime:              30 * 60 * 1_000,
    refetchOnWindowFocus: false,
    refetchOnMount:       false,
  })
}

/**
 * Returns a stable callback that completely resets the swipe feed:
 *  1. Removes the React Query cache for recommendations (forces fresh fetch)
 *  2. Resets the Zustand currentIndex to 0
 *
 * Use this whenever a full deck restart is needed (preference change, manual reset).
 */
export function useResetFeed() {
  const queryClient = useQueryClient()
  const resetIndex  = useSwipeStore((s) => s.reset)

  return useCallback(() => {
    queryClient.removeQueries({ queryKey: queryKeys.recommendations() })
    resetIndex()
  }, [queryClient, resetIndex])
}
