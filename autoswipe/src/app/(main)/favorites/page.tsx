import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Heart } from 'lucide-react'
import { FavoritesList } from '@/components/favorites/FavoritesList'
import type { FavoriteListing } from '@/components/favorites/FavoritesList'

export default async function FavoritesPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id! },
    include: {
      listing: {
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200, // safety cap — prevents unbounded query for heavy users
  })

  const items: FavoriteListing[] = favorites
    .filter((f) => f.listing !== null)
    .map((f) => ({
      favoriteId: f.id,
      listingId: f.listing!.id,
      brand: f.listing!.brand,
      model: f.listing!.model,
      year: f.listing!.year,
      price: f.listing!.price,
      mileage: f.listing!.mileage,
      fuelType: f.listing!.fuelType,
      location: f.listing!.location,
      thumb: f.listing!.images[0]?.url ?? null,
      sellerId: f.listing!.sellerId,
    }))

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md px-5 pt-12 pb-4 border-b border-outline-variant/15">
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant text-sm">
            {items.length > 0 ? `${items.length} שמורים` : ''}
          </span>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-current" />
            <h1 className="font-headline text-xl font-bold text-on-surface">מועדפים</h1>
          </div>
        </div>
      </header>

      <main className="px-4 pt-5">
        <FavoritesList items={items} />
      </main>
    </div>
  )
}
