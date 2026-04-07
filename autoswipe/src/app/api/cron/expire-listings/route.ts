import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ListingStatus } from '@/lib/domain-enums'

/**
 * GET /api/cron/expire-listings
 * Secured by CRON_SECRET header (or Authorization: Bearer).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  const auth =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    req.headers.get('x-cron-secret')
  if (auth !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const result = await prisma.carListing.updateMany({
    where: {
      status: ListingStatus.ACTIVE,
      expiresAt: { lt: now },
    },
    data: { status: ListingStatus.EXPIRED },
  })

  return NextResponse.json({ expired: result.count })
}
