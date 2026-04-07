import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const listing = await prisma.carListing.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { order: 'asc' } },
      seller: {
        select: { id: true, name: true, avatarUrl: true, phone: true, createdAt: true },
      },
      _count: { select: { favorites: true, swipeActions: true } },
    },
  })

  if (!listing) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  // Increment view count
  await prisma.carListing.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } },
  })

  return NextResponse.json({ data: listing })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.carListing.findUnique({ where: { id: params.id } })
  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const updateSchema = z.object({
    price: z.number().int().min(1000).optional(),
    mileage: z.number().int().min(0).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'SOLD']).optional(),
    insuranceEstimate: z.number().int().min(0).optional(),
    maintenanceEstimate: z.number().int().min(0).optional(),
  })

  const data = updateSchema.parse(body)

  const updated = await prisma.carListing.update({
    where: { id: params.id },
    data,
    include: { images: true },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.carListing.findUnique({ where: { id: params.id } })
  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.carListing.update({
    where: { id: params.id },
    data: { status: 'DELETED' },
  })

  return NextResponse.json({ message: 'מחיקה בוצעה בהצלחה' })
}
