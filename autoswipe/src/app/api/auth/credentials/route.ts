import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { jwtUserPayload, signAppJwt } from '@/lib/jwt-mobile'

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

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.' }, { status: 429 })
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'אימייל וסיסמה נדרשים' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user?.passwordHash) {
      return NextResponse.json(
        { message: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { message: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      )
    }

    const token = await signAppJwt(user)

    return NextResponse.json({
      token,
      user: jwtUserPayload(user),
    })
  } catch (err) {
    console.error('[credentials]', err)
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
