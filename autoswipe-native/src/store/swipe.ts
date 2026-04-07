import { create } from 'zustand'
import { SwipeDirection } from '../types'

interface SwipeState {
  currentIndex: number
  lastSwipeDirection: SwipeDirection | null
  swipe: (direction: SwipeDirection) => void
  reset: () => void
}

export const useSwipeStore = create<SwipeState>((set) => ({
  currentIndex: 0,
  lastSwipeDirection: null,

  swipe: (direction) =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      lastSwipeDirection: direction,
    })),

  reset: () =>
    set({
      currentIndex: 0,
      lastSwipeDirection: null,
    }),
}))
