'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, ArrowLeft, GitCompareArrows, Car } from 'lucide-react'
import { formatILS } from '@/lib/utils/cost-calculator'
import { useRemoveFavorite } from '@/hooks/useFavorites'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const FUEL_LABEL: Record<string, string> = {
  ELECTRIC: 'חשמלי', HYBRID: 'היברידי', GASOLINE: 'בנזין',
  DIESEL: 'דיזל', PLUG_IN_HYBRID: 'PHEV',
}

export interface FavoriteListing {
  favoriteId: string
  listingId: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  fuelType: string
  location: string
  thumb: string | null
  sellerId: string
}

interface Props {
  items: FavoriteListing[]
}

export function FavoritesList({ items: initial }: Props) {
  const router = useRouter()
  const [items, setItems]     = useState(initial)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [removing, setRemoving] = useState<Set<string>>(new Set())

  // Mutation handles the API call + invalidates ['favorites'] (for compare page sync)
  const removeMutation = useRemoveFavorite()

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      } else {
        toast('ניתן להשוות עד 3 רכבים', { icon: 'ℹ️' })
      }
      return next
    })
  }

  const handleRemove = (favoriteId: string, listingId: string) => {
    // Snapshot the list BEFORE the optimistic remove so we can revert precisely.
    // Previously this reverted to `initial` (the server-rendered list), which
    // meant a successful prior removal was un-done if a later removal failed.
    const snapshot = [...items]

    // Optimistic remove
    setRemoving((p) => new Set(p).add(listingId))
    setItems((p) => p.filter((i) => i.favoriteId !== favoriteId))
    setSelected((p) => { const n = new Set(p); n.delete(listingId); return n })

    removeMutation.mutate(listingId, {
      onSuccess: () => toast.success('הוסר מהמועדפים'),
      onError: (err) => {
        // Session expired — redirect to login instead of showing a confusing error
        if (err instanceof Error && err.message === '401') {
          router.push('/login')
          return
        }
        // Any other failure — revert to snapshot (not `initial`) so prior
        // successful removals in the same session are preserved
        setItems(snapshot)
        toast.error('שגיאה, נסה שוב')
      },
      onSettled: () => {
        setRemoving((p) => { const n = new Set(p); n.delete(listingId); return n })
      },
    })
  }

  const handleCompare = () => {
    const ids = Array.from(selected).join(',')
    router.push(`/compare?ids=${ids}`)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center" dir="rtl">
        <span className="text-6xl mb-4">❤️</span>
        <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">אין רכבים שמורים עדיין</h3>
        <p className="text-[#888888] mb-6">החלק ימינה על רכבים שאהבת כדי לשמור אותם כאן</p>
        <Link href="/swipe" className="px-6 py-3 bg-[#D4A843] text-[#0F0F0F] font-semibold rounded-xl hover:bg-[#C49733] transition-colors">
          חזור לגלול
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Compare mode hint */}
      {items.length >= 2 && selected.size === 0 && (
        <p className="text-on-surface-variant text-xs text-right px-1 pb-1">
          בחר עד 3 רכבים להשוואה
        </p>
      )}

      {items.map((item) => {
        const isSelected = selected.has(item.listingId)
        const isRemoving = removing.has(item.listingId)

        return (
          <div
            key={item.favoriteId}
            className={clsx(
              'bg-surface-container rounded-2xl overflow-hidden transition-all duration-200',
              isSelected && 'ring-2 ring-primary',
              isRemoving && 'opacity-40 scale-[0.98]'
            )}
          >
            <div className="flex gap-3 p-3">
              {/* Thumbnail */}
              <Link href={`/listing/${item.listingId}`} className="flex-shrink-0">
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-surface-container-high relative">
                  {item.thumb ? (
                    <Image src={item.thumb} alt={`${item.brand} ${item.model}`} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Car className="w-8 h-8 text-on-surface-variant/30" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => handleRemove(item.favoriteId, item.listingId)}
                    disabled={isRemoving}
                    aria-label="הסר מהמועדפים"
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors mt-0.5"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface text-sm leading-tight truncate">
                      {item.brand} {item.model}
                    </p>
                    <p className="text-on-surface-variant text-xs mt-0.5">
                      {item.year} · {item.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1.5">
                    <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                      {FUEL_LABEL[item.fuelType] ?? item.fuelType}
                    </span>
                    <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                      {(item.mileage / 1000).toFixed(0)}K ק"מ
                    </span>
                  </div>
                  <p className="font-headline font-bold text-primary text-base">{formatILS(item.price)}</p>
                </div>
              </div>
            </div>

            {/* Action row */}
            <div className="flex border-t border-outline-variant/10">
              {/* Compare toggle */}
              <button
                onClick={() => toggleSelect(item.listingId)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors',
                  isSelected
                    ? 'text-primary bg-primary/8'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                )}
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
                {isSelected ? 'נבחר' : 'השווה'}
              </button>

              <div className="w-px bg-outline-variant/10" />

              {/* Message seller */}
              <Link
                href={`/messages?listingId=${item.listingId}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                הודעה
              </Link>

              <div className="w-px bg-outline-variant/10" />

              {/* View detail */}
              <Link
                href={`/listing/${item.listingId}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                פרטים
              </Link>
            </div>
          </div>
        )
      })}

      {/* Count */}
      <p className="text-center text-on-surface-variant text-xs pt-2 pb-1">
        {items.length} {items.length === 1 ? 'רכב שמור' : 'רכבים שמורים'}
      </p>

      {/* Floating compare button */}
      {selected.size >= 2 && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 max-w-[430px] mx-auto px-5 py-3">
          <button
            onClick={handleCompare}
            className="w-full bg-primary text-on-primary font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(212,168,67,0.35)]"
          >
            <GitCompareArrows className="w-5 h-5" />
            השווה {selected.size} רכבים
          </button>
        </div>
      )}
    </div>
  )
}
