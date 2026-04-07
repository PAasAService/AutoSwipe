import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { ListingStatus } from '@/lib/domain-enums'

// GET — moderation queue (pending review)
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req)
  if ('error' in gate) return gate.error

  const listings = await prisma.carListing.findMany({
    where: { status: ListingStatus.PENDING_REVIEW },
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: {
      seller: { select: { id: true, name: true, email: true } },
      images: { take: 3, orderBy: { order: 'asc' } },
    },
  })

  return NextResponse.json({ data: listings })
}
