'use client'

import { useState } from 'react'
import { Share2, Heart } from 'lucide-react'
import { useToggleFavorite } from '@/hooks/useFavorites'
import toast from 'react-hot-toast'

interface ListingActionsProps {
  listingId:        string
  initialFavorited: boolean
  listingTitle:     string
  listingUrl:       string
}

export function ListingActions({
  listingId,
  initialFavorited,
  listingTitle,
  listingUrl,
}: ListingActionsProps) {
  // Local boolean drives the immediate optimistic UI
  const [favorited, setFavorited] = useState(initialFavorited)

  const { mutate: toggle, isPending } = useToggleFavorite()

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: listingTitle, url: listingUrl })
        return
      }
    } catch {
      // share was cancelled or failed — fall through to clipboard copy
    }
    try {
      await navigator.clipboard.writeText(listingUrl)
      toast.success('הקישור הועתק ✓')
    } catch {
      toast.error('לא ניתן להעתיק את הקישור')
    }
  }

  function handleFavorite() {
    if (isPending) return

    // Capture current value before toggle for revert
    const wasFavorited = favorited
    const next         = !favorited
    setFavorited(next)

    toggle(
      { listingId, isFavorited: wasFavorited },
      {
        onError: () => {
          // Revert optimistic update on failure (toast comes from the mutation itself)
          setFavorited(wasFavorited)
        },
        // onSettled: ['favorites'] is invalidated by the mutation hook automatically
      },
    )
  }

  return (
    <div className="absolute top-4 left-4 flex gap-2">
      <button
        onClick={handleShare}
        aria-label="שתף מודעה"
        className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all active:scale-95"
      >
        <Share2 className="w-5 h-5" />
      </button>

      <button
        onClick={handleFavorite}
        disabled={isPending}
        aria-label={favorited ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
        className={`w-11 h-11 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95 ${
          favorited
            ? 'bg-primary text-on-primary'
            : 'bg-black/40 text-white'
        }`}
      >
        <Heart className="w-5 h-5" fill={favorited ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
