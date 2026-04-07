import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyAppleIdToken, verifyGoogleIdToken } from '@/lib/oauth-verify'
import { jwtUserPayload, signAppJwt } from '@/lib/jwt-mobile'

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

const bodySchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string().min(10),
})

/**
 * Google ID token `aud` must match one of these OAuth client IDs.
 * Mirror Apple: set native + web IDs — e.g. Web (Expo / server), iOS client, Android client — comma-separated or via dedicated env vars.
 */
function googleAudiences(): string[] {
  const chunks = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ]
  const set = new Set<string>()
  for (const c of chunks) {
    if (!c?.trim()) continue
    for (const part of c.split(',')) {
      const t = part.trim()
      if (t) set.add(t)
    }
  }
  return [...set]
}

/** Apple JWT `aud` — bundle ID / Services ID from env, plus Expo Go in development. */
function appleAudiences(): string[] {
  const raw = process.env.APPLE_CLIENT_ID?.trim()
  const fromEnv = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []
  const set = new Set(fromEnv)
  if (process.env.NODE_ENV === 'development') {
    set.add('host.exp.Exponent')
  }
  return [...set]
}

/**
 * POST /api/auth/oauth
 * Body: { provider: 'google' | 'apple', idToken: string }
 * Returns same shape as /api/auth/credentials (app JWT + user).
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.' }, { status: 429 })
  }

  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ message: 'שרת לא מוגדר' }, { status: 503 })
  }

  try {
    const { provider, idToken } = bodySchema.parse(await req.json())

    if (provider === 'google' && googleAudiences().length === 0) {
      return NextResponse.json(
        { message: 'Google OAuth לא הוגדר בשרת (GOOGLE_CLIENT_ID)' },
        { status: 503 }
      )
    }

    let payload: Awaited<ReturnType<typeof verifyGoogleIdToken>>
    if (provider === 'google') {
      const aud = googleAudiences()
      payload = await verifyGoogleIdToken(idToken, aud)
    } else {
      const aud = appleAudiences()
      if (aud.length === 0) {
        return NextResponse.json(
          { message: 'Apple Sign In לא הוגדר בשרת (APPLE_CLIENT_ID)' },
          { status: 503 }
        )
      }
      payload = await verifyAppleIdToken(idToken, aud)
    }

    const providerAccountId = String(payload.sub)
    const emailClaim = payload.email
    const email =
      typeof emailClaim === 'string' && emailClaim.includes('@')
        ? emailClaim.toLowerCase()
        : null
    const nameFromToken =
      typeof payload.name === 'string'
        ? payload.name
        : email
          ? email.split('@')[0]
          : 'משתמש'

    const existingLink = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      include: { user: true },
    })

    if (existingLink) {
      const token = await signAppJwt(existingLink.user)
      return NextResponse.json({ token, user: jwtUserPayload(existingLink.user) })
    }

    if (email) {
      const byEmail = await prisma.user.findUnique({ where: { email } })
      if (byEmail) {
        await prisma.oAuthAccount.create({
          data: {
            userId: byEmail.id,
            provider,
            providerAccountId,
          },
        })
        const token = await signAppJwt(byEmail)
        return NextResponse.json({ token, user: jwtUserPayload(byEmail) })
      }
    }

    const syntheticEmail = `${provider}_${providerAccountId}@oauth.autoswipe.local`

    const user = await prisma.user.create({
      data: {
        email: email ?? syntheticEmail,
        name: nameFromToken,
        passwordHash: null,
        oauthAccounts: {
          create: { provider, providerAccountId },
        },
      },
    })

    const token = await signAppJwt(user)
    return NextResponse.json(
      { token, user: jwtUserPayload(user) },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: 'בקשה לא תקינה' }, { status: 400 })
    }
    console.error('[auth/oauth]', err)
    return NextResponse.json(
      { message: 'אימות נכשל — נסה שוב או בדוק את הגדרות הלקוח' },
      { status: 401 }
    )
  }
}
