import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.min(Math.max(0, parseInt(searchParams.get('page') ?? '0', 10)), 500)
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)), 50)

  const where = {
    sellerId: user.id,
    status: { not: 'DELETED' },
  }

  const [listings, total] = await Promise.all([
    prisma.carListing.findMany({
      where,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: page * limit,
      take: limit,
    }),
    prisma.carListing.count({ where }),
  ])

  return NextResponse.json({
    data: listings,
    total,
    page,
    pageSize: limit,
    hasMore: (page + 1) * limit < total,
  })
}
