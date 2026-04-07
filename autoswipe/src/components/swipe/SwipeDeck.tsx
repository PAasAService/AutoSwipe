'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Zap, RotateCcw } from 'lucide-react'
import { SwipeCard } from './SwipeCard'
import { useSwipeStore } from '@/store/swipe'
import { useRecommendations, useResetFeed } from '@/hooks/useRecommendations'
import toast from 'react-hot-toast'
import type { SwipeDirection } from '@/types'

const CARDS_IN_STACK    = 3   // how many cards to render at once
const PRELOAD_THRESHOLD = 5   // fetch next batch when this many cards remain

interface SwipeDeckProps {
  userId: string
}

export function SwipeDeck({ userId }: SwipeDeckProps) {
  const router = useRouter()

  // ── Server state: React Query ────────────────────────────────────────────
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useRecommendations()

  const resetFeed = useResetFeed()

  // ── UI state: Zustand ────────────────────────────────────────────────────
  const { currentIndex, swipe } = useSwipeStore()

  // ── Swipe lock — leading-edge throttle ───────────────────────────────────
  // Prevents duplicate deck advances + duplicate POST /api/swipes from rapid
  // repeated input (held keyboard arrow key, double-tap on action buttons).
  // Using a ref so the lock never causes a re-render.
  // 400 ms matches the card exit animation (~300 ms) with a small buffer.
  const swipeLockRef = useRef(false)

  // Flatten all fetched pages into a single feed array
  const feed = data?.pages.flatMap((p) => p.data ?? []) ?? []

  // ── Reset feed when the authenticated user changes ───────────────────────
  useEffect(() => {
    resetFeed()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pre-fetch next batch when running low ────────────────────────────────
  useEffect(() => {
    const remaining = feed.length - currentIndex
    if (remaining <= PRELOAD_THRESHOLD && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [currentIndex, feed.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Error toast ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isError) toast.error('שגיאה בטעינת המודעות')
  }, [isError])

  // ── Swipe handler ────────────────────────────────────────────────────────
  const handleSwipe = useCallback(
    async (direction: SwipeDirection, listingId: string) => {
      // Drop the call if a swipe is already in progress (rapid input guard)
      if (swipeLockRef.current) return
      swipeLockRef.current = true
      setTimeout(() => { swipeLockRef.current = false }, 400)

      swipe(direction)

      // Fire-and-forget — swipe signal for recommendation engine, not critical UX
      fetch('/api/swipes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ listingId, direction }),
      }).catch(() => {})

      if (direction === 'RIGHT') {
        toast.success('נשמר במועדפים! ❤️', { duration: 1200, position: 'top-center' })
      }
      if (direction === 'SUPER') {
        toast.success('סופר לייק! ⭐', { duration: 1500, position: 'top-center' })
      }
    },
    [swipe],
  )

  const handleTap = useCallback(
    (listingId: string) => router.push(`/listing/${listingId}`),
    [router],
  )

  // ── Keyboard shortcuts (desktop) ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const current = feed[currentIndex]
      if (!current) return
      if (e.key === 'ArrowLeft')  handleSwipe('LEFT',  current.id)
      if (e.key === 'ArrowRight') handleSwipe('RIGHT', current.id)
      if (e.key === 'ArrowUp')    handleSwipe('SUPER', current.id)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [feed, currentIndex, handleSwipe])

  // ── Derived ───────────────────────────────────────────────────────────────
  const visibleCards = feed.slice(currentIndex, currentIndex + CARDS_IN_STACK)
  const isEmpty      = !isLoading && !isFetchingNextPage && visibleCards.length === 0

  // ── Loading state (initial fetch only) ───────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">טוען מכוניות...</p>
      </div>
    )
  }

  // ── Empty deck ────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
        <div className="text-6xl">🚗</div>
        <div>
          <h3 className="text-text-primary font-bold text-xl mb-2">
            {hasNextPage || isFetchingNextPage ? 'טוען עוד...' : 'כל הכרטיסים נגמרו!'}
          </h3>
          <p className="text-text-muted text-sm">
            {hasNextPage || isFetchingNextPage
              ? 'מחפשים מכוניות נוספות עבורך'
              : 'ראית את כל המודעות הרלוונטיות. נסה להרחיב את החיפוש.'}
          </p>
        </div>
        <button
          onClick={resetFeed}
          className="flex items-center gap-2 text-accent text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          התחל מחדש
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Card stack */}
      <div className="relative flex-1 mx-4">
        <AnimatePresence>
          {visibleCards.map((listing, i) => (
            <SwipeCard
              key={listing.id}
              listing={listing}
              isTop={i === 0}
              zIndex={CARDS_IN_STACK - i}
              onSwipe={handleSwipe}
              onTap={handleTap}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-5 py-5 px-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          aria-label="דלג"
          onClick={() => { const c = feed[currentIndex]; if (c) handleSwipe('LEFT', c.id) }}
          className="w-14 h-14 rounded-full bg-background-card border border-surface-border flex items-center justify-center shadow-card hover:border-status-error/50 hover:bg-status-error/5 transition-colors"
        >
          <X className="w-7 h-7 text-status-error" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          aria-label="סופר לייק"
          onClick={() => { const c = feed[currentIndex]; if (c) handleSwipe('SUPER', c.id) }}
          className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center hover:bg-accent/20 transition-colors"
        >
          <Zap className="w-5 h-5 text-accent" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          aria-label="שמור למועדפים"
          onClick={() => { const c = feed[currentIndex]; if (c) handleSwipe('RIGHT', c.id) }}
          className="w-14 h-14 rounded-full bg-background-card border border-surface-border flex items-center justify-center shadow-card hover:border-status-success/50 hover:bg-status-success/5 transition-colors"
        >
          <Heart className="w-7 h-7 text-status-success" />
        </motion.button>
      </div>
    </div>
  )
}
