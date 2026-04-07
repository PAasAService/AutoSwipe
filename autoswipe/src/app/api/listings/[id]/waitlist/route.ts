import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { ListingStatus } from '@/lib/domain-enums'

// POST — join waitlist for a PAUSED listing
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(_req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.carListing.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, sellerId: true },
  })
  if (!listing) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json({ error: 'לא רלוונטי' }, { status: 400 })
  }
  if (listing.status !== ListingStatus.PAUSED) {
    return NextResponse.json({ error: 'רשימת המתנה זמינה רק למודעה בהשהיה' }, { status: 400 })
  }

  const row = await prisma.listingWaitlist.upsert({
    where: {
      listingId_userId: { listingId: listing.id, userId: user.id },
    },
    create: { listingId: listing.id, userId: user.id },
    update: {},
  })

  return NextResponse.json({ data: row }, { status: 201 })
}
