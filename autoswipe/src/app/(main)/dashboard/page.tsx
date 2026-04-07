import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import { formatILS } from '@/lib/utils/cost-calculator'
import { Eye, Heart, MessageCircle, Car, Plus } from 'lucide-react'
import { ListingActions } from '@/components/dashboard/ListingActions'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const userId = session.user.id!

  const [listings, stats, threads] = await Promise.all([
    prisma.carListing.findMany({
      where: { sellerId: userId, status: { not: 'DELETED' } },
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.carListing.aggregate({
      where: { sellerId: userId, status: 'ACTIVE' },
      _sum: { viewCount: true, likeCount: true },
      _count: { id: true },
    }),
    prisma.messageThread.count({
      where: { sellerId: userId, sellerUnread: { gt: 0 } },
    }),
  ])

  const statusLabel: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'פעיל', color: 'text-green-400' },
    PAUSED: { label: 'מושהה', color: 'text-on-surface-variant' },
    SOLD: { label: 'נמכר', color: 'text-primary' },
  }

  const statCards = [
    { label: 'צפיות', value: (stats._sum.viewCount ?? 0).toLocaleString(), icon: Eye },
    { label: 'פניות פעילות', value: threads.toString(), icon: MessageCircle, accent: threads > 0 },
    { label: 'לייקים', value: (stats._sum.likeCount ?? 0).toString(), icon: Heart },
    { label: 'ממוצע ימים', value: '14', icon: Car },
  ]

  const featuredListing = listings[0]

  return (
    <div className="min-h-screen bg-background pb-6" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold text-on-surface">AutoSwipe</h1>
        <Link href="/messages" aria-label="הודעות" className="relative">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-on-surface" />
          </div>
          {threads > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
          )}
        </Link>
      </header>

      <main className="px-5 pt-4 space-y-10">
        {/* New message notification */}
        {threads > 0 && (
          <Link href="/messages">
            <div className="bg-primary-container text-on-primary-container p-5 rounded-2xl flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <MessageCircle className="w-8 h-8" />
                <div>
                  <p className="font-headline font-bold">הודעה חדשה</p>
                  <p className="text-sm opacity-90">{threads} שיחות עם פניות</p>
                </div>
              </div>
              <span className="text-on-primary-container">←</span>
            </div>
          </Link>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="bg-surface-container p-5 rounded-2xl border border-outline-variant/15">
              <p className="text-on-surface-variant text-xs uppercase tracking-widest mb-2">{label}</p>
              <p className={`font-headline text-3xl font-bold ${accent ? 'text-primary' : 'text-on-surface'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Active Listings */}
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <Link href="/listing/create" className="text-primary font-semibold text-sm">
              + הוסף
            </Link>
            <h2 className="font-headline text-3xl font-bold text-on-surface">המודעות שלי</h2>
          </div>

          {listings.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-8 text-center border border-outline-variant/10">
              <Car className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
              <p className="text-on-surface-variant mb-4">עדיין אין לך מודעות</p>
              <Link
                href="/listing/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
                פרסם מכונית ראשונה
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Featured large card */}
              {featuredListing && (
                <div className="relative group overflow-hidden rounded-2xl aspect-[16/10] bg-surface-container-lowest">
                  {featuredListing.images[0]?.url ? (
                    <Image
                      src={featuredListing.images[0].url}
                      alt={`${featuredListing.brand} ${featuredListing.model} ${featuredListing.year}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Car className="w-16 h-16 text-on-surface-variant/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 inline-block border border-primary/30">
                          {statusLabel[featuredListing.status]?.label ?? featuredListing.status}
                        </span>
                        <h3 className="font-headline text-2xl font-bold text-white leading-tight">
                          {featuredListing.brand} {featuredListing.model}
                        </h3>
                        <p className="text-white/70">{formatILS(featuredListing.price)} · {featuredListing.year}</p>
                      </div>
                      <div className="flex items-end gap-4 mb-2">
                        <div className="text-right">
                          <p className="font-headline text-xl font-bold text-white leading-none">{featuredListing.viewCount}</p>
                          <p className="text-[10px] uppercase text-white/50">צפיות</p>
                        </div>
                        <div className="text-right">
                          <p className="font-headline text-xl font-bold text-primary leading-none">{featuredListing.likeCount}</p>
                          <p className="text-[10px] uppercase text-white/50">לייקים</p>
                        </div>
                        <ListingActions
                          listingId={featuredListing.id}
                          currentStatus={featuredListing.status}
                          title={`${featuredListing.brand} ${featuredListing.model} ${featuredListing.year}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Remaining listings as rows */}
              {listings.slice(1).map((listing) => {
                const thumb = listing.images[0]?.url
                const st = statusLabel[listing.status] ?? { label: listing.status, color: 'text-on-surface-variant' }
                return (
                  <div key={listing.id} className="bg-surface-container rounded-2xl p-4 flex items-center gap-4 border border-outline-variant/10">
                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-surface-container-highest flex-shrink-0">
                      {thumb ? (
                        <Image src={thumb} alt={`${listing.brand} ${listing.model} ${listing.year}`} width={80} height={56} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-6 h-6 text-on-surface-variant" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <h4 className="font-headline font-bold text-on-surface">
                        {listing.brand} {listing.model} {listing.year}
                      </h4>
                      <p className="text-on-surface-variant text-xs mt-0.5">{formatILS(listing.price)}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className={`font-headline font-bold text-sm ${st.color}`}>{st.label}</p>
                      <p className="text-on-surface-variant text-xs">{listing.viewCount} צפיות</p>
                    </div>
                    <ListingActions
                      listingId={listing.id}
                      currentStatus={listing.status}
                      title={`${listing.brand} ${listing.model} ${listing.year}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
