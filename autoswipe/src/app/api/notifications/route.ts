import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'

function parseDataJson(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown
    return v && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function mapItem(row: {
  id: string
  type: string
  title: string
  body: string
  data: string
  readAt: Date | null
  createdAt: Date
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: parseDataJson(row.data),
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limitRaw = searchParams.get('limit')
  let limit = limitRaw ? parseInt(limitRaw, 10) : 20
  if (Number.isNaN(limit) || limit < 1) limit = 20
  if (limit > 50) limit = 50

  const cursorId = searchParams.get('cursor')

  let cursorRow: { createdAt: Date; id: string } | null = null
  if (cursorId) {
    cursorRow = await prisma.notification.findFirst({
      where: { id: cursorId, userId: authUser.id },
      select: { createdAt: true, id: true },
    })
    if (!cursorRow) {
      return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 })
    }
  }

  const where = cursorRow
    ? {
        userId: authUser.id,
        OR: [
          { createdAt: { lt: cursorRow.createdAt } },
          {
            AND: [
              { createdAt: cursorRow.createdAt },
              { id: { lt: cursorRow.id } },
            ],
          },
        ],
      }
    : { userId: authUser.id }

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        data: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { userId: authUser.id, readAt: null },
    }),
  ])

  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null

  return NextResponse.json({
    data: {
      items: page.map(mapItem),
      nextCursor,
      unreadCount,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const b = body as { markAllRead?: boolean; ids?: unknown }

  if (b.markAllRead === true) {
    await prisma.notification.updateMany({
      where: { userId: authUser.id, readAt: null },
      data: { readAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  if (Array.isArray(b.ids) && b.ids.every((x) => typeof x === 'string')) {
    const ids = b.ids as string[]
    await prisma.notification.updateMany({
      where: { userId: authUser.id, id: { in: ids }, readAt: null },
      data: { readAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json(
    { error: 'Expected markAllRead: true or ids: string[]' },
    { status: 400 },
  )
}
