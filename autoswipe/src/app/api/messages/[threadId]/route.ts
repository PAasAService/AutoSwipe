import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { MessagingMode } from '@/lib/domain-enums'
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

// GET messages in a thread
export async function GET(req: NextRequest, { params }: { params: { threadId: string } }) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thread = await prisma.messageThread.findUnique({
    where: { id: params.threadId },
    include: {
      buyer: { select: { id: true, name: true, avatarUrl: true } },
      seller: { select: { id: true, name: true, avatarUrl: true } },
      listing: {
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
        },
      },
      messages: {
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!thread) {
    return NextResponse.json({ error: 'שיחה לא נמצאה' }, { status: 404 })
  }

  const userId = user.id
  if (thread.buyerId !== userId && thread.sellerId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Mark messages as read
  const isBuyer = thread.buyerId === userId
  await prisma.message.updateMany({
    where: {
      threadId: params.threadId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  })
  await prisma.messageThread.update({
    where: { id: params.threadId },
    data: isBuyer ? { buyerUnread: 0 } : { sellerUnread: 0 },
  })

  return NextResponse.json({ data: thread })
}

// PATCH — seller starts conversation (moves thread from pending → active)
export async function PATCH(req: NextRequest, { params }: { params: { threadId: string } }) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thread = await prisma.messageThread.findUnique({
    where: { id: params.threadId },
    select: { id: true, sellerId: true, buyerId: true, isActive: true },
  })
  if (!thread) return NextResponse.json({ error: 'שיחה לא נמצאה' }, { status: 404 })

  // Only the seller can start the conversation
  if (thread.sellerId !== user.id) {
    return NextResponse.json({ error: 'רק המוכר יכול להתחיל את השיחה' }, { status: 403 })
  }

  if (thread.isActive) {
    return NextResponse.json({ data: { ok: true, alreadyActive: true } })
  }

  const updated = await prisma.messageThread.update({
    where: { id: params.threadId },
    data: { isActive: true, sellerStartedChat: true },
    select: { id: true, isActive: true },
  })

  return NextResponse.json({ data: updated })
}

// POST — send a message in an existing thread
export async function POST(req: NextRequest, { params }: { params: { threadId: string } }) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let msgBody: unknown
  try {
    msgBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }
  const msgParsed = z.object({ text: z.string().min(1).max(1000) }).safeParse(msgBody)
  if (!msgParsed.success) {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }
  const { text } = msgParsed.data
  const userId = user.id

  const thread = await prisma.messageThread.findUnique({
    where: { id: params.threadId },
    include: {
      listing: { include: { seller: true } },
    },
  })
  if (!thread) return NextResponse.json({ error: 'שיחה לא נמצאה' }, { status: 404 })
  if (thread.buyerId !== userId && thread.sellerId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Guard: both sides are blocked from sending messages until the seller activates the thread
  if (!thread.isActive) {
    return NextResponse.json(
      {
        error: 'השיחה עדיין ממתינה לאישור המוכר — לא ניתן לשלוח הודעות עדיין',
        code: 'THREAD_NOT_ACTIVE',
      },
      { status: 403 }
    )
  }

  if (await isBlocked(thread.buyerId, thread.sellerId)) {
    return NextResponse.json({ error: 'לא ניתן לשלוח הודעה' }, { status: 403 })
  }

  const isBuyer = thread.buyerId === userId
  const effectiveMode = effectiveListingMessagingMode(thread.listing, thread.listing.seller)

  if (isBuyer) {
    const gate = canBuyerSendMessage({
      thread,
      isBuyer: true,
      effectiveMode,
    })
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: 403 })
    }
  }

  const message = await prisma.message.create({
    data: { threadId: params.threadId, senderId: userId, text },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  })

  const sellerSent = thread.sellerId === userId
  const incBuyer =
    isBuyer &&
    shouldCountBuyerMessage(effectiveMode) &&
    effectiveMode === MessagingMode.OPEN

  await prisma.messageThread.update({
    where: { id: params.threadId },
    data: {
      lastMessage: text,
      lastMessageAt: new Date(),
      ...(isBuyer ? { sellerUnread: { increment: 1 } } : { buyerUnread: { increment: 1 } }),
      ...(sellerSent && effectiveMode === MessagingMode.BUMBLE && !thread.sellerStartedChat
        ? { sellerStartedChat: true }
        : {}),
      ...(sellerSent && effectiveMode === MessagingMode.OPEN ? { openBuyerCapCleared: true } : {}),
      ...(incBuyer ? { buyerMessageCount: { increment: 1 } } : {}),
    },
  })

  return NextResponse.json({ data: message }, { status: 201 })
}
