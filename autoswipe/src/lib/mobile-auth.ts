/**
 * Mobile auth helper — supports both NextAuth sessions (web)
 * and Bearer JWT tokens (native app).
 */
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getSession } from '@/lib/auth'

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET!
)

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: string
  isOnboarded: boolean
  avatarUrl?: string
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  // 1. Try Bearer JWT (native app)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const { payload } = await jwtVerify(token, secret)
      return payload as unknown as AuthUser
    } catch {
      return null
    }
  }

  // 2. Fall back to NextAuth session (web app)
  const session = await getSession()
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? '',
      roles: (session.user as any).roles ?? '["BUYER"]',
      isOnboarded: (session.user as any).isOnboarded ?? false,
      avatarUrl: (session.user as any).avatarUrl,
    }
  }

  return null
}
