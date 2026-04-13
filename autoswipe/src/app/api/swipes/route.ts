import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { updateLearnedSignals } from '@/lib/recommendation/engine'
import { createNotification } from '@/lib/notifications/service'
import { isListingStatusNotificationsEnabled } from '@/lib/notifications/listing-prefs'
import { z } from 'zod'

const schema = z.object({
  listingId: z.string(),
  direction: z.enum(['LEFT', 'RIGHT', 'SUPER']),
})

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ message: 'בקשה לא תקינה' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'בקשה לא תקינה' }, { status: 400 })
    }

    const { listingId, direction } = parsed.data
    const userId = user.id

    const listing = await prisma.carListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        price: true,
        sellerId: true,
        brand: true,
        model: true,
        year: true,
      },
    })
    if (!listing) {
      return NextResponse.json({ message: 'מודעה לא נמצאה' }, { status: 404 })
    }

    // Record swipe (upsert to handle re-swipe edge cases)
    const swipe = await prisma.swipeAction.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId, direction },
      update: { direction },
    })

    if (direction === 'RIGHT' || direction === 'SUPER') {
      await updateLearnedSignals(userId, listingId, 'SWIPE_RIGHT')

      const lp = listing.price
      const hadFavorite = await prisma.favorite.findUnique({
        where: { userId_listingId: { userId, listingId } },
        select: { id: true },
      })

      await prisma.favorite.upsert({
        where: { userId_listingId: { userId, listingId } },
        create: { userId, listingId, lastKnownPrice: lp ?? null },
        update: lp != null ? { lastKnownPrice: lp } : {},
      })

      // Only bump listing likeCount when this swipe newly adds a favorite (avoids double-count with re-swipes or a separate /api/favorites call).
      if (!hadFavorite) {
        await prisma.carListing.update({
          where: { id: listingId },
          data: { likeCount: { increment: 1 } },
        })

        // Notify seller on first like / super-like (not self-swipe)
        const sellerId = listing.sellerId
        if (sellerId !== userId) {
          const allow = await isListingStatusNotificationsEnabled(sellerId)
          if (allow) {
            const buyer = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true },
            })
            const who = buyer?.name?.trim()?.split(/\s+/)[0] ?? 'קונה'
            const carLabel = `${listing.brand} ${listing.model} · ${listing.year}`
            const isSuper = direction === 'SUPER'
            try {
              await createNotification({
                userId: sellerId,
                type: isSuper ? 'listing_super_like' : 'listing_like',
                title: isSuper ? 'סופר לייק על המודעה שלך!' : 'לייק חדש על המודעה שלך',
                body: isSuper
                  ? `${who} עשה סופר לייק ל-${carLabel}`
                  : `${who} עשה לייק ל-${carLabel}`,
                data: {
                  listingId,
                  actorId: userId,
                  direction,
                },
              })
            } catch (e) {
              console.error('[api/swipes] seller notification', e)
            }
          }
        }
      }
    } else {
      await updateLearnedSignals(userId, listingId, 'SWIPE_LEFT')
    }

    await prisma.userBehavior.create({
      data: {
        userId,
        listingId,
        action: direction === 'LEFT' ? 'SWIPE_LEFT' : 'SWIPE_RIGHT',
      },
    })

    return NextResponse.json({ data: swipe })
  } catch (err) {
    console.error('[api/swipes POST]', err)
    const message =
      err instanceof Error ? err.message : 'שגיאת שרת'
    return NextResponse.json({ message, error: 'SwipeError' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.swipeAction.deleteMany({ where: { userId: user.id } })

  return NextResponse.json({ data: { ok: true } })
}
