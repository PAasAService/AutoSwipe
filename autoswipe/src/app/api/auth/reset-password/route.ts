import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).regex(/[A-Z]/, 'חייב להכיל אות גדולה').regex(/[0-9]/, 'חייב להכיל מספר'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = schema.parse(body)

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'קישור לא תקף' }, { status: 400 })
    }
    if (resetToken.usedAt) {
      return NextResponse.json({ error: 'קישור זה כבר שומש' }, { status: 400 })
    }
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ error: 'הקישור פג תוקף. בקש קישור חדש.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
