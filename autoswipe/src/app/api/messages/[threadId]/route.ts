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

// POST — send a message in an existing thread
export async function POST(req: NextRequest, { params }: { params: { threadId: string } }) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = z.object({ text: z.string().min(1).max(1000) }).parse(await req.json())
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
