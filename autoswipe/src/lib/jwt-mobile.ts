import { SignJWT } from 'jose'
import type { User } from '@prisma/client'

const secret = () =>
  new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? '')

export async function signAppJwt(user: Pick<User, 'id' | 'email' | 'name' | 'roles' | 'isOnboarded' | 'avatarUrl'>) {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET is not set')
  }
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    isOnboarded: user.isOnboarded,
    avatarUrl: user.avatarUrl,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret())
}

export function jwtUserPayload(user: Pick<User, 'id' | 'email' | 'name' | 'roles' | 'isOnboarded' | 'avatarUrl'>) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    isOnboarded: user.isOnboarded,
    avatarUrl: user.avatarUrl,
  }
}
