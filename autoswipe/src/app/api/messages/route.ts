import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { updateLearnedSignals } from '@/lib/recommendation/engine'
import { ListingStatus, MessagingMode } from '@/lib/domain-enums'
import {
  canBuyerSendMessage,
  effectiveListingMessagingMode,
  shouldCountBuyerMessage,
} from '@/lib/messaging-policy'

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

// GET /api/messages — list threads for current user
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

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
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  return NextResponse.json({ data: threads })
}

// POST /api/messages — buyer starts thread, or seller starts (BUMBLE) with { listingId, buyerId, text }
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const schema = z.object({
    listingId: z.string(),
    text: z.string().min(1).max(1000).optional(),
    buyerId: z.string().optional(),
  })

  const { listingId, text, buyerId } = schema.parse(await req.json())
  const userId = user.id

  const listing = await prisma.carListing.findUnique({
    where: { id: listingId },
    include: { seller: true },
  })
  if (!listing) return NextResponse.json({ error: 'מודעה לא נמצאה' }, { status: 404 })

  if (listing.status !== ListingStatus.ACTIVE) {
    if (listing.status === ListingStatus.PAUSED) {
      return NextResponse.json(
        {
          error: 'המודעה בהשהיה',
          code: 'LISTING_PAUSED',
          hint: 'POST /api/listings/' + listingId + '/waitlist',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'מודעה לא זמינה לשיחה' }, { status: 400 })
  }

  const effectiveMode = effectiveListingMessagingMode(listing, listing.seller)

  // ── Seller initiates (e.g. BUMBLE): body includes buyerId ─────────────────
  if (buyerId) {
    if (listing.sellerId !== userId) {
      return NextResponse.json({ error: 'אסור' }, { status: 403 })
    }
    if (buyerId === listing.sellerId) {
      return NextResponse.json({ error: 'לא ניתן' }, { status: 400 })
    }
    if (await isBlocked(userId, buyerId)) {
      return NextResponse.json({ error: 'לא ניתן לשלוח הודעה' }, { status: 403 })
    }

    let thread = await prisma.messageThread.findUnique({
      where: {
        buyerId_sellerId_listingId: {
          buyerId,
          sellerId: listing.sellerId,
          listingId,
        },
      },
    })

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          buyerId,
          sellerId: listing.sellerId,
          listingId,
          sellerStartedChat: true,
          openBuyerCapCleared: effectiveMode === MessagingMode.OPEN,
        },
      })
      await updateLearnedSignals(buyerId, listingId, 'MESSAGE_SELLER')
    } else {
      await prisma.messageThread.update({
        where: { id: thread.id },
        data: {
          sellerStartedChat: true,
          ...(effectiveMode === MessagingMode.OPEN ? { openBuyerCapCleared: true } : {}),
        },
      })
    }

    let message = null
    if (text) {
      message = await prisma.message.create({
        data: { threadId: thread.id, senderId: userId, text },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      })
      await prisma.messageThread.update({
        where: { id: thread.id },
        data: {
          lastMessage: text,
          lastMessageAt: new Date(),
          buyerUnread: { increment: 1 },
        },
      })
    }

    return NextResponse.json({ data: { threadId: thread.id, message } }, { status: 201 })
  }

  // ── Buyer flow ─────────────────────────────────────────────────────────────
  const buyerIdResolved = userId
  if (listing.sellerId === buyerIdResolved) {
    return NextResponse.json({ error: 'לא ניתן לשלוח הודעה למודעה שלך' }, { status: 400 })
  }

  if (await isBlocked(buyerIdResolved, listing.sellerId)) {
    return NextResponse.json({ error: 'לא ניתן לשלוח הודעה' }, { status: 403 })
  }

  if (effectiveMode === MessagingMode.BUMBLE) {
    return NextResponse.json(
      {
        error: 'במצב זה המוכר מתחיל את השיחה',
        code: 'BUMBLE_SELLER_FIRST',
      },
      { status: 403 }
    )
  }

  const sellerId = listing.sellerId

  let thread = await prisma.messageThread.findUnique({
    where: {
      buyerId_sellerId_listingId: {
        buyerId: buyerIdResolved,
        sellerId,
        listingId,
      },
    },
  })

  if (!thread) {
    thread = await prisma.messageThread.create({
      data: { buyerId: buyerIdResolved, sellerId, listingId },
    })
    await updateLearnedSignals(buyerIdResolved, listingId, 'MESSAGE_SELLER')
  }

  let message = null
  if (text) {
    const gate = canBuyerSendMessage({
      thread,
      isBuyer: true,
      effectiveMode,
    })
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: 403 })
    }

    message = await prisma.message.create({
      data: { threadId: thread.id, senderId: buyerIdResolved, text },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    const incBuyer =
      shouldCountBuyerMessage(effectiveMode) && effectiveMode === MessagingMode.OPEN

    await prisma.messageThread.update({
      where: { id: thread.id },
      data: {
        lastMessage: text,
        lastMessageAt: new Date(),
        sellerUnread: { increment: 1 },
        ...(incBuyer ? { buyerMessageCount: { increment: 1 } } : {}),
      },
    })
  }

  return NextResponse.json({ data: { threadId: thread.id, message } }, { status: 201 })
}
