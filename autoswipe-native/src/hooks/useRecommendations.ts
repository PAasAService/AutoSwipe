import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import { FeedListing } from '../types'
import { useSwipeStore } from '../store/swipe'

interface RecommendationsPage {
  data: FeedListing[]
  page: number
  hasMore: boolean
}

export function useRecommendations() {
  return useInfiniteQuery({
    queryKey: queryKeys.recommendations(),
    queryFn: ({ pageParam = 0 }) =>
      api.get<RecommendationsPage>(`/api/recommendations?page=${pageParam}&limit=20`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useResetFeed() {
  const qc = useQueryClient()
  const reset = useSwipeStore((s) => s.reset)

  return async () => {
    // Clear server-side swipe history so backend returns fresh listings
    await api.delete('/api/swipes').catch(() => {})
    reset()
    await qc.resetQueries({ queryKey: queryKeys.recommendations() })
  }
}
