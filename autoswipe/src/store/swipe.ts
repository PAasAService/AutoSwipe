import { create } from 'zustand'
import type { SwipeDirection } from '@/types'

/**
 * Swipe store — pure UI state only.
 *
 * Server data (feed, pagination, loading) has moved to React Query
 * (useRecommendations / useResetFeed in src/hooks/useRecommendations.ts).
 * This store only tracks which card the user is currently viewing.
 */
interface SwipeState {
  currentIndex:       number
  lastSwipeDirection: SwipeDirection | null

  /** Advance to the next card and record the direction */
  swipe:  (direction: SwipeDirection) => void
  /** Reset deck back to card 0 (call together with useResetFeed) */
  reset:  () => void
}

export const useSwipeStore = create<SwipeState>()((set) => ({
  currentIndex:       0,
  lastSwipeDirection: null,

  swipe: (direction) =>
    set((state) => ({
      currentIndex:       state.currentIndex + 1,
      lastSwipeDirection: direction,
    })),

  reset: () =>
    set({ currentIndex: 0, lastSwipeDirection: null }),
}))
