import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      roles: string
      isOnboarded: boolean
      avatarUrl?: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    roles: string
    isOnboarded: boolean
    avatarUrl?: string | null
  }
}
