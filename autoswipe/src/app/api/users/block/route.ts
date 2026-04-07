import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { blockedId } = z.object({ blockedId: z.string() }).parse(await req.json())
  if (blockedId === user.id) {
    return NextResponse.json({ error: 'לא ניתן' }, { status: 400 })
  }

  await prisma.userBlock.upsert({
    where: {
      blockerId_blockedId: { blockerId: user.id, blockedId },
    },
    create: { blockerId: user.id, blockedId },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
