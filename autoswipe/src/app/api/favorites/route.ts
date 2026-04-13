import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { updateLearnedSignals } from '@/lib/recommendation/engine'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      listing: {
        include: {
          images: { orderBy: { order: 'asc' }, take: 3 },
          seller: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200, // safety cap — mirrors the server-side page guard
  })

  return NextResponse.json({ data: favorites })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { listingId } = z.object({ listingId: z.string() }).parse(body)

  // Atomically create the favorite and increment likeCount together.
  // If the favorite already exists the create throws P2002 (unique constraint) —
  // we catch that specifically and treat it as a no-op (idempotent).
  // Any other error is re-thrown.
  const listingRow = await prisma.carListing.findUnique({
    where: { id: listingId },
    select: { price: true },
  })
  if (!listingRow) {
    return NextResponse.json({ error: 'מודעה לא נמצאה' }, { status: 404 })
  }

  let fav
  try {
    fav = await prisma.$transaction(async (tx) => {
      const created = await tx.favorite.create({
        data: {
          userId: user.id,
          listingId,
          lastKnownPrice: listingRow.price,
        },
      })
      await tx.carListing.update({
        where: { id: listingId },
        data: { likeCount: { increment: 1 } },
      })
      return created
    })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2002') {
      // Favorite already exists — fetch it and return without touching likeCount
      fav = await prisma.favorite.findUnique({
        where: { userId_listingId: { userId: user.id, listingId } },
      })
    } else {
      throw err
    }
  }

  return NextResponse.json({ data: fav })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const listingId = searchParams.get('listingId')
  if (!listingId) return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })

  // Delete the favorite. If it was already gone (P2025 — double-tap or concurrent
  // request) return 200 idempotently WITHOUT recording a duplicate skip signal.
  try {
    await prisma.favorite.delete({
      where: { userId_listingId: { userId: user.id, listingId } },
    })
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'P2025') {
      // Favorite was already removed — nothing left to do.
      return NextResponse.json({ message: 'הוסר מהמועדפים' })
    }
    throw err
  }

  // updateMany with likeCount > 0 guard — prevents going negative if count
  // is already 0 due to data inconsistency (seed data, concurrent deletes, etc.)
  await prisma.carListing.updateMany({
    where: { id: listingId, likeCount: { gt: 0 } },
    data: { likeCount: { decrement: 1 } },
  })

  // Treat removal from favorites as a skip: update the recommendation engine's
  // learned signals exactly as a LEFT swipe would (-0.5 on brand/model/vehicleType/
  // fuelType dimensions). This ensures similar cars rank lower in future feeds.
  // Note: we do NOT upsert a SwipeAction record — the user's original RIGHT swipe
  // history must not be overwritten.
  await updateLearnedSignals(user.id, listingId, 'SWIPE_LEFT')

  return NextResponse.json({ message: 'הוסר מהמועדפים' })
}
