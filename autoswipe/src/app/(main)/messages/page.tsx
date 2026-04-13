import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Car, Edit } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { listingId?: string }
}) {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const userId = session.user.id!

  // If coming from listing page "Send Message" button, create/get thread and redirect
  if (searchParams.listingId) {
    const listingId = searchParams.listingId
    const listing = await prisma.carListing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })
    if (listing && listing.sellerId !== userId) {
      const sellerId = listing.sellerId
      let thread = await prisma.messageThread.findUnique({
        where: { buyerId_sellerId_listingId: { buyerId: userId, sellerId, listingId } },
      })
      if (!thread) {
        thread = await prisma.messageThread.create({
          data: { buyerId: userId, sellerId, listingId },
        })
      }
      redirect(`/messages/${thread.id}`)
    }
  }

  const threads = await prisma.messageThread.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      buyer: { select: { id: true, name: true, avatarUrl: true } },
      seller: { select: { id: true, name: true, avatarUrl: true } },
      listing: {
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          images: { orderBy: { order: 'asc' }, take: 1 },
        },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-outline-variant/15">
        <h1 className="font-headline text-xl font-bold text-on-surface">AutoSwipe</h1>
      </header>

      <div className="px-5 py-6">
        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-2xl font-bold text-on-surface">הודעות</h2>
          <Edit className="w-5 h-5 text-primary" />
        </div>

        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center" dir="rtl">
            <span className="text-6xl mb-4">💬</span>
            <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">אין שיחות עדיין</h3>
            <p className="text-[#888888]">שלח הודעה למוכר מדף הרכב כדי להתחיל שיחה</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => {
              const isBuyer = thread.buyerId === userId
              const otherUser = isBuyer ? thread.seller : thread.buyer
              const unread = isBuyer ? thread.buyerUnread : thread.sellerUnread
              const listingThumb = thread.listing.images[0]?.path
              const isActive = unread > 0

              return (
                <Link key={thread.id} href={`/messages/${thread.id}`}>
                  <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-surface-container-high border-r-4 border-primary shadow-lg'
                      : 'hover:bg-surface-container'
                  }`}>
                    {/* Avatar / thumb */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container relative">
                        {listingThumb ? (
                          <Image src={listingThumb} alt={`${thread.listing.brand} ${thread.listing.model} ${thread.listing.year}`} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Car className="w-6 h-6 text-on-surface-variant" />
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {thread.lastMessageAt
                            ? formatDistanceToNow(new Date(thread.lastMessageAt), { locale: he, addSuffix: true })
                            : ''}
                        </span>
                        <h3 className={`font-headline font-bold truncate ${isActive ? 'text-on-surface' : 'text-on-surface/80'}`}>
                          {otherUser.name}
                        </h3>
                      </div>
                      <p className={`text-xs font-semibold mb-0.5 ${isActive ? 'text-primary-fixed-dim' : 'text-secondary'}`}>
                        {thread.listing.brand} {thread.listing.model} {thread.listing.year}
                      </p>
                      {thread.lastMessage && (
                        <p className="text-xs text-on-surface-variant truncate">{thread.lastMessage}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
