import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'

const PLATFORMS = new Set(['ios', 'android'])

export async function POST(req: NextRequest) {
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

  const { token, platform } = body as { token?: unknown; platform?: unknown }
  if (typeof token !== 'string' || token.length < 10) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  if (typeof platform !== 'string' || !PLATFORMS.has(platform)) {
    return NextResponse.json(
      { error: 'platform must be ios or android' },
      { status: 400 },
    )
  }

  await prisma.pushDevice.upsert({
    where: { token },
    create: {
      userId: authUser.id,
      token,
      platform,
    },
    update: {
      userId: authUser.id,
      platform,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  let token = url.searchParams.get('token')

  if (!token) {
    try {
      const body = await req.json()
      if (body && typeof body === 'object' && typeof (body as { token?: unknown }).token === 'string') {
        token = (body as { token: string }).token
      }
    } catch {
      /* ignore */
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  await prisma.pushDevice.deleteMany({
    where: { userId: authUser.id, token },
  })

  return NextResponse.json({ ok: true })
}
