import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import toast from 'react-hot-toast'
import type { CarListing, ListingImage } from '@/types'

// ── Raw shape returned by GET /api/favorites ──────────────────────────────────

export interface FavoriteRaw {
  id:         string
  userId:     string
  listingId:  string
  createdAt:  string
  listing:    CarListing & {
    images:  ListingImage[]
    seller:  { id: string; name: string | null; avatarUrl: string | null }
  }
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchFavorites(): Promise<FavoriteRaw[]> {
  const res = await fetch('/api/favorites')
  // Throw on 401 so callers (compare page, FavoritesList) can detect session
  // expiry and redirect to /login instead of silently showing an empty list.
  if (!res.ok) throw new Error(String(res.status))
  const { data } = await res.json()
  return data ?? []
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Returns the raw favorites list for the authenticated user.
 * Used by the compare page and any cross-screen sync that needs the full shape.
 *
 * staleTime: 2 min — short enough to feel fresh, long enough to avoid hammering.
 */
export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites(),
    queryFn:  fetchFavorites,
    staleTime: 2 * 60 * 1_000,
    gcTime:    10 * 60 * 1_000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Toggles a listing's favorite state (add or remove).
 *
 * Usage in a component that tracks `favorited` locally:
 *   const { mutate: toggle, isPending } = useToggleFavorite()
 *   toggle({ listingId, isFavorited: true })   // removes
 *   toggle({ listingId, isFavorited: false })  // adds
 *
 * On settled (success or error) it invalidates ['favorites'] so the compare
 * page and any other consumer of useFavorites() sees fresh data.
 *
 * Optimistic UI is left to the calling component for minimal coupling.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listingId,
      isFavorited,
    }: {
      listingId:   string
      isFavorited: boolean
    }) => {
      const res = isFavorited
        ? await fetch(`/api/favorites?listingId=${listingId}`, { method: 'DELETE' })
        : await fetch('/api/favorites', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ listingId }),
          })
      if (!res.ok) throw new Error('API error')
    },

    onError: () => {
      toast.error('אירעה שגיאה, נסה שוב')
    },

    onSettled: () => {
      // Sync the favorites list so the compare page and other consumers refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites() })
    },
  })
}

/**
 * Removes a favorite by listingId.
 * Used by FavoritesList which manages its own optimistic UI.
 * Invalidates favorites on settled for cross-screen sync.
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (listingId: string) => {
      const res = await fetch(`/api/favorites?listingId=${listingId}`, { method: 'DELETE' })
      // Include status code so FavoritesList.onError can distinguish 401 from other failures
      if (!res.ok) throw new Error(String(res.status))
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites() })
    },
  })
}
