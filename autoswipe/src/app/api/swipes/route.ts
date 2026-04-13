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

// The automatic message sent on the buyer's behalf when they super like a listing
const SUPER_LIKE_MESSAGE = '⭐ שלחתי לך סופר לייק! מעוניין מאוד ברכב שלך.'

async function isBlocked(aId: string, bId: string): Promise<boolean> {
  const row = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: aId, blockedId: bId },
        { blockerId: bId, blockedId: aId },
      ],
    },
  })
  return !!row
}

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

    // Fetch full user record to check super like count
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, superLikesRemaining: true },
    })
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Enforce super like limit before doing anything
    if (direction === 'SUPER' && dbUser.superLikesRemaining <= 0) {
      return NextResponse.json(
        {
          error: 'אין לך יותר סופר לייקים',
          code: 'NO_SUPER_LIKES_REMAINING',
          superLikesRemaining: 0,
        },
        { status: 403 }
      )
    }

    const listing = await prisma.carListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        price: true,
        sellerId: true,
        status: true,
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

    let superLikesRemaining = dbUser.superLikesRemaining

    if (direction === 'RIGHT' || direction === 'SUPER') {
      await updateLearnedSignals(userId, listingId, 'SWIPE_RIGHT')

      const lp = listing.price
      const hadFavorite = await prisma.favorite.findUnique({
        where: { userId_listingId: { userId, listingId } },
        select: { id: true },
      })

      // ── Add to favorites ────────────────────────────────────────────────────
      // Both RIGHT (regular like) and SUPER save the listing to Favorites.
      // The key difference: RIGHT = favorites only; SUPER = favorites + pending
      // message thread (handled below). Explicit "Send message" from the listing
      // screen is the only other way to create a thread.
      await prisma.favorite.upsert({
        where: { userId_listingId: { userId, listingId } },
        create: { userId, listingId, lastKnownPrice: lp ?? null },
        update: lp != null ? { lastKnownPrice: lp } : {},
      })

      // Only bump listing likeCount for truly new favorites
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

      if (direction === 'SUPER') {
        // ── Decrement super like quota ────────────────────────────────────────
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { superLikesRemaining: { decrement: 1 } },
          select: { superLikesRemaining: true },
        })
        superLikesRemaining = updated.superLikesRemaining

        // ── Create pending thread + auto-message (super likes only) ──────────
        // A super like is an explicit high-intent action — it creates a pending
        // conversation thread so the seller sees it in their Messages inbox.
        // Regular likes (RIGHT) do NOT create threads; messaging starts only
        // when the buyer taps "Send message to seller" from the listing screen.
        if (
          listing.status === 'ACTIVE' &&
          listing.sellerId !== userId &&
          !(await isBlocked(userId, listing.sellerId))
        ) {
          const existingThread = await prisma.messageThread.findUnique({
            where: {
              buyerId_sellerId_listingId: {
                buyerId: userId,
                sellerId: listing.sellerId,
                listingId,
              },
            },
            select: { id: true, isSuperLike: true },
          })

          if (!existingThread) {
            // Fresh thread — create with isSuperLike flag and auto-message
            const thread = await prisma.messageThread.create({
              data: {
                buyerId: userId,
                sellerId: listing.sellerId,
                listingId,
                isSuperLike: true,
                isActive: false,
                initiatedBy: 'BUYER',
                lastMessage: SUPER_LIKE_MESSAGE,
                lastMessageAt: new Date(),
                sellerUnread: 1,
              },
            })
            await prisma.message.create({
              data: {
                threadId: thread.id,
                senderId: userId,
                text: SUPER_LIKE_MESSAGE,
              },
            })
          } else if (!existingThread.isSuperLike) {
            // Thread already exists (e.g. buyer previously tapped "Send message").
            // Upgrade it to super like so it gets priority treatment in the inbox.
            await prisma.messageThread.update({
              where: { id: existingThread.id },
              data: { isSuperLike: true },
            })
          }
          // If existingThread.isSuperLike is already true, nothing to do.
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

    return NextResponse.json({ data: swipe, superLikesRemaining })
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
