import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, buildPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'נדרש כתובת אימייל' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ data: { ok: true } })
    }

    // Invalidate old tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    // Create new token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    })

    const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    await sendEmail({
      to: user.email,
      subject: 'איפוס סיסמה - AutoSwipe',
      html: buildPasswordResetEmail(resetUrl, user.name),
    })

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
