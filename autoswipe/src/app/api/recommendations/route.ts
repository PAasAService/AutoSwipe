import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { buildFeed } from '@/lib/recommendation/engine'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page  = Math.min(Math.max(0, parseInt(searchParams.get('page')  ?? '0')),  500)
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20')), 50)

  try {
    const feed = await buildFeed({
      userId: user.id,
      page,
      limit,
    })

    return NextResponse.json({
      data: feed,
      page,
      hasMore: feed.length === limit,
    })
  } catch (err) {
    console.error('[api/recommendations]', err)
    const message =
      err instanceof Error ? err.message : 'שגיאת שרת'
    return NextResponse.json({ message, error: 'FeedError' }, { status: 500 })
  }
}
