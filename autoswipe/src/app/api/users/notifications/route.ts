import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'

const KEYS = ['messages', 'matches', 'priceDrops', 'listingStatus'] as const
type PrefKey = (typeof KEYS)[number]

const DEFAULTS: Record<PrefKey, boolean> = {
  messages: true,
  matches: true,
  priceDrops: true,
  listingStatus: true,
}

function parsePrefs(raw: string | null | undefined): Record<PrefKey, boolean> {
  const out = { ...DEFAULTS }
  if (!raw || raw === '{}') return out
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    for (const k of KEYS) {
      if (typeof parsed[k] === 'boolean') out[k] = parsed[k]
    }
  } catch {
    /* keep defaults */
  }
  return out
}

function serializePrefs(prefs: Record<string, boolean>): string {
  const obj: Record<string, boolean> = {}
  for (const k of KEYS) {
    obj[k] = typeof prefs[k] === 'boolean' ? prefs[k] : DEFAULTS[k]
  }
  return JSON.stringify(obj)
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const row = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { notificationPrefs: true },
  })

  const data = parsePrefs(row?.notificationPrefs)
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const row = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { notificationPrefs: true },
  })
  const merged = { ...parsePrefs(row?.notificationPrefs) }
  for (const k of KEYS) {
    if (typeof body[k] === 'boolean') merged[k] = body[k]
  }

  await prisma.user.update({
    where: { id: authUser.id },
    data: { notificationPrefs: serializePrefs(merged) },
  })

  return NextResponse.json({ data: merged })
}
