import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import { CarListing } from '../types'

interface FavoriteRaw {
  id: string
  userId: string
  listingId: string
  createdAt: string
  listing: CarListing
}

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites(),
    queryFn: () =>
      api.get<{ data: FavoriteRaw[] }>('/api/favorites').then((r) =>
        r.data.map((f) => f.listing)
      ),
    staleTime: 1000 * 60 * 2,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ listingId, isFavorited }: { listingId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        return api.delete(`/api/favorites?listingId=${listingId}`)
      }
      return api.post('/api/favorites', { listingId })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites() })
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'שגיאה בעדכון המועדפים' })
    },
  })
}

export function useRemoveFavorite() {
  const qc = useQueryClient()
  const queryKey = queryKeys.favorites()

  return useMutation({
    mutationFn: (listingId: string) =>
      api.delete(`/api/favorites?listingId=${listingId}`),

    onMutate: async (listingId: string) => {
      await qc.cancelQueries({ queryKey })
      const snapshot = qc.getQueryData<CarListing[]>(queryKey)
      if (snapshot) {
        qc.setQueryData<CarListing[]>(queryKey, snapshot.filter((f) => f.id !== listingId))
      }
      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        qc.setQueryData(queryKey, context.snapshot)
      }
      Toast.show({ type: 'error', text1: 'שגיאה בהסרה מהמועדפים' })
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })
}
