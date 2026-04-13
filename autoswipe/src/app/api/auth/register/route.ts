import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import {
  USER_DISPLAY_NAME_TAKEN_CODE,
  USER_DISPLAY_NAME_TAKEN_HE,
  USER_EMAIL_TAKEN_CODE,
} from '@/lib/user-display-name'
import { sendEmail, buildWelcomeEmail } from '@/lib/email'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)

// Simple in-memory rate limiter (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  password: z.string().min(8).regex(/[A-Z]/, 'חייב להכיל אות גדולה').regex(/[0-9]/, 'חייב להכיל מספר'),
  // roles is accepted for backward compat but always defaults to both BUYER+SELLER
  roles: z.array(z.enum(['BUYER', 'SELLER'])).optional(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { name, email, phone, password } = schema.parse(body)
    // Every user is always both buyer and seller — no role selection needed
    const roles = ['BUYER', 'SELLER']

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'כתובת המייל כבר קיימת במערכת', code: USER_EMAIL_TAKEN_CODE },
        { status: 409 }
      )
    }

    const nameTrimmed = name.trim()
    const nameTaken = await prisma.user.findFirst({ where: { name: nameTrimmed } })
    if (nameTaken) {
      return NextResponse.json(
        { error: USER_DISPLAY_NAME_TAKEN_HE, code: USER_DISPLAY_NAME_TAKEN_CODE },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: nameTrimmed,
        email,
        passwordHash,
        roles: JSON.stringify(roles),
        ...(phone ? { phone: phone.trim() } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        isOnboarded: true,
        createdAt: true,
      },
    })

    // Send welcome email (non-blocking)
    sendEmail({
      to: user.email,
      subject: 'ברוך הבא ל-AutoSwipe! 🚗',
      html: buildWelcomeEmail(user.name),
    }).catch((err) => console.error('[welcome-email]', err))

    // Generate JWT token (same format as /api/auth/credentials)
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      isOnboarded: user.isOnboarded,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(secret)

    return NextResponse.json({ token, user }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta as { target?: string[] } | undefined)?.target
      if (Array.isArray(target) && target.includes('name')) {
        return NextResponse.json(
          { error: USER_DISPLAY_NAME_TAKEN_HE, code: USER_DISPLAY_NAME_TAKEN_CODE },
          { status: 409 }
        )
      }
      if (Array.isArray(target) && target.includes('email')) {
        return NextResponse.json(
          { error: 'כתובת המייל כבר קיימת במערכת', code: USER_EMAIL_TAKEN_CODE },
          { status: 409 }
        )
      }
    }
    console.error('[register]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
