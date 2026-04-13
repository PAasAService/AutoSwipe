import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { verifyAppleIdToken, verifyGoogleIdToken } from '@/lib/oauth-verify'
import { jwtUserPayload, signAppJwt } from '@/lib/jwt-mobile'
import {
  USER_DISPLAY_NAME_TAKEN_CODE,
  USER_DISPLAY_NAME_TAKEN_HE,
} from '@/lib/user-display-name'

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
  /** Native Apple/Google may send display name (e.g. Apple only includes full name in the SDK on first sign-in). */
  displayName: z.string().max(80).optional(),
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
  return Array.from(set)
}

/** Apple JWT `aud` — bundle ID / Services ID from env, plus Expo Go in development. */
function appleAudiences(): string[] {
  const raw = process.env.APPLE_CLIENT_ID?.trim()
  const fromEnv = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []
  const set = new Set(fromEnv)
  if (process.env.NODE_ENV === 'development') {
    set.add('host.exp.Exponent')
  }
  return Array.from(set)
}

/** Ensures auto-generated SSO names never collide (user-chosen names are validated separately). */
async function uniqueAutoDisplayName(base: string): Promise<string> {
  const slug = (base.trim().slice(0, 80) || 'משתמש').slice(0, 80)
  for (let i = 0; i < 5000; i++) {
    const suffix = i === 0 ? '' : `_${i}`
    const candidate = (slug.slice(0, Math.max(1, 80 - suffix.length)) + suffix).slice(0, 80)
    const clash = await prisma.user.findFirst({ where: { name: candidate } })
    if (!clash) return candidate
  }
  return `${slug.slice(0, 50)}_${Date.now()}`.slice(0, 80)
}

/**
 * POST /api/auth/oauth — sign-in or register in one step (native SSO).
 * Body: { provider, idToken, displayName? } — `displayName` optional (Apple SDK full name, etc.).
 *
 * Resolution order:
 * 1. Existing OAuth link (provider + provider `sub`) → JWT for that user, `created: false`.
 * 2. Else if ID token has an email and a user exists with that email → link OAuth row, JWT, `created: false`.
 * 3. Else → create user + OAuth link, JWT, `created: true` (HTTP 201).
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
    const { provider, idToken, displayName: displayNameRaw } = bodySchema.parse(await req.json())
    const displayFromClient =
      typeof displayNameRaw === 'string' && displayNameRaw.trim().length > 0
        ? displayNameRaw.trim().slice(0, 80)
        : undefined

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
      typeof payload.name === 'string' && payload.name.trim().length > 0
        ? payload.name.trim()
        : email
          ? email.split('@')[0]!
          : 'משתמש'

    const resolvedName = displayFromClient ?? nameFromToken

    function isPlaceholderName(userName: string, userEmail: string | null): boolean {
      if (userName === 'משתמש') return true
      if (userEmail && userEmail.includes('@')) {
        const local = userEmail.split('@')[0]!
        if (userName === local) return true
      }
      return false
    }

    const existingLink = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      include: { user: true },
    })

    if (existingLink) {
      let user = existingLink.user
      if (displayFromClient && isPlaceholderName(user.name, user.email)) {
        const taken = await prisma.user.findFirst({
          where: { name: displayFromClient, NOT: { id: user.id } },
        })
        if (!taken) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name: displayFromClient },
          })
        }
      }
      const token = await signAppJwt(user)
      return NextResponse.json({
        token,
        user: jwtUserPayload(user),
        created: false,
      })
    }

    if (email) {
      const byEmail = await prisma.user.findUnique({ where: { email } })
      if (byEmail) {
        try {
          await prisma.oAuthAccount.create({
            data: {
              userId: byEmail.id,
              provider,
              providerAccountId,
            },
          })
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            const link = await prisma.oAuthAccount.findUnique({
              where: { provider_providerAccountId: { provider, providerAccountId } },
              include: { user: true },
            })
            if (link) {
              const token = await signAppJwt(link.user)
              return NextResponse.json({
                token,
                user: jwtUserPayload(link.user),
                created: false,
              })
            }
          }
          throw e
        }
        let linkedUser = await prisma.user.findUniqueOrThrow({ where: { id: byEmail.id } })
        if (displayFromClient && isPlaceholderName(byEmail.name, byEmail.email)) {
          const taken = await prisma.user.findFirst({
            where: { name: displayFromClient, NOT: { id: byEmail.id } },
          })
          if (!taken) {
            linkedUser = await prisma.user.update({
              where: { id: byEmail.id },
              data: { name: displayFromClient },
            })
          }
        }
        const token = await signAppJwt(linkedUser)
        return NextResponse.json({
          token,
          user: jwtUserPayload(linkedUser),
          created: false,
        })
      }
    }

    const syntheticEmail = `${provider}_${providerAccountId}@oauth.autoswipe.local`

    if (displayFromClient) {
      const taken = await prisma.user.findFirst({ where: { name: displayFromClient } })
      if (taken) {
        return NextResponse.json(
          {
            message: USER_DISPLAY_NAME_TAKEN_HE,
            error: USER_DISPLAY_NAME_TAKEN_HE,
            code: USER_DISPLAY_NAME_TAKEN_CODE,
          },
          { status: 409 }
        )
      }
    }

    const finalCreateName = displayFromClient
      ? displayFromClient
      : await uniqueAutoDisplayName(resolvedName)

    try {
      const user = await prisma.user.create({
        data: {
          email: email ?? syntheticEmail,
          name: finalCreateName,
          passwordHash: null,
          oauthAccounts: {
            create: { provider, providerAccountId },
          },
        },
      })

      const token = await signAppJwt(user)
      return NextResponse.json(
        { token, user: jwtUserPayload(user), created: true },
        { status: 201 }
      )
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = (e.meta as { target?: string[] } | undefined)?.target
        if (Array.isArray(target) && target.includes('name') && displayFromClient) {
          return NextResponse.json(
            {
              message: USER_DISPLAY_NAME_TAKEN_HE,
              error: USER_DISPLAY_NAME_TAKEN_HE,
              code: USER_DISPLAY_NAME_TAKEN_CODE,
            },
            { status: 409 }
          )
        }
        const link = await prisma.oAuthAccount.findUnique({
          where: { provider_providerAccountId: { provider, providerAccountId } },
          include: { user: true },
        })
        if (link) {
          const token = await signAppJwt(link.user)
          return NextResponse.json({
            token,
            user: jwtUserPayload(link.user),
            created: false,
          })
        }
      }
      throw e
    }
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
