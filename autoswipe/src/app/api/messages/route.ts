import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { updateLearnedSignals } from '@/lib/recommendation/engine'
import { ListingStatus, MessagingMode } from '@/lib/domain-enums'
import {
  effectiveListingMessagingMode,
} from '@/lib/messaging-policy'

// The automatic interest message sent on behalf of the buyer when they tap "Contact Seller"
const BUYER_INTEREST_MESSAGE = 'מעוניין ברכב שלך'

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
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      listingId: true,
      lastMessage: true,
      lastMessageAt: true,
      buyerUnread: true,
      sellerUnread: true,
      buyerMessageCount: true,
      sellerStartedChat: true,
      openBuyerCapCleared: true,
      isSuperLike: true,
      isActive: true,
      initiatedBy: true,
      createdAt: true,
      updatedAt: true,
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
    // text is only accepted from the seller-initiation (BUMBLE) path — buyer flow no longer
    // accepts free text; a predefined interest message is always used instead
    text: z.string().min(1).max(1000).optional(),
    buyerId: z.string().optional(),
  })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }
  const schemaResult = schema.safeParse(rawBody)
  if (!schemaResult.success) {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }
  const { listingId, text, buyerId } = schemaResult.data
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

  // ── Seller initiates (BUMBLE): body includes buyerId ──────────────────────
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

  // Check whether a thread already exists for this buyer/seller/listing triple
  const existingThread = await prisma.messageThread.findUnique({
    where: {
      buyerId_sellerId_listingId: {
        buyerId: buyerIdResolved,
        sellerId,
        listingId,
      },
    },
    select: { id: true },
  })

  if (existingThread) {
    // Thread already exists (e.g. buyer already swiped or contacted before).
    // Return the existing threadId without creating a duplicate message.
    return NextResponse.json({ data: { threadId: existingThread.id } }, { status: 200 })
  }

  // ── New thread: create pending with predefined interest message ────────────
  // Wrapped in try-catch: a concurrent POST (e.g. rapid double-tap) could create
  // the same thread (P2002 unique constraint) between our findUnique check and this
  // create. On P2002 we return the existing thread idempotently.
  let thread: { id: string }
  try {
    thread = await prisma.messageThread.create({
      data: {
        buyerId: buyerIdResolved,
        sellerId,
        listingId,
        // New threads always start as pending — seller must activate via PATCH
        isActive: false,
        initiatedBy: 'BUYER',
        lastMessage: BUYER_INTEREST_MESSAGE,
        lastMessageAt: new Date(),
        // Notify seller of the new interest
        sellerUnread: 1,
      },
    })
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: buyerIdResolved,
        text: BUYER_INTEREST_MESSAGE,
      },
    })
    await updateLearnedSignals(buyerIdResolved, listingId, 'MESSAGE_SELLER')
  } catch (createErr: any) {
    // P2002: concurrent request created the thread — return existing thread id
    if (createErr?.code !== 'P2002') throw createErr
    const existing = await prisma.messageThread.findUnique({
      where: {
        buyerId_sellerId_listingId: { buyerId: buyerIdResolved, sellerId, listingId },
      },
      select: { id: true },
    })
    if (!existing) throw createErr
    return NextResponse.json({ data: { threadId: existing.id } }, { status: 200 })
  }

  return NextResponse.json({ data: { threadId: thread.id } }, { status: 201 })
}
