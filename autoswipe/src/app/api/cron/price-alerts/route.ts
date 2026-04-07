import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/cron/price-alerts
 * Finds favorites where listing price dropped vs lastKnownPrice; updates lastKnownPrice.
 * Wire email/push in a later task — for now returns summary only.
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

  const favorites = await prisma.favorite.findMany({
    where: { lastKnownPrice: { not: null } },
    include: {
      listing: { select: { id: true, price: true, status: true } },
    },
  })

  let drops = 0
  for (const fav of favorites) {
    const prev = fav.lastKnownPrice
    if (prev == null) continue
    const cur = fav.listing.price
    if (cur < prev && fav.listing.status === 'ACTIVE') {
      drops++
      await prisma.favorite.update({
        where: { id: fav.id },
        data: { lastKnownPrice: cur },
      })
      // TODO: enqueue email/push using notificationPrefs + user email
    } else if (cur !== prev) {
      await prisma.favorite.update({
        where: { id: fav.id },
        data: { lastKnownPrice: cur },
      })
    }
  }

  return NextResponse.json({ checked: favorites.length, priceDrops: drops })
}
