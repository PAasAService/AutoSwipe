import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) throw new Error('USER_NOT_FOUND')
        if (!user.passwordHash) throw new Error('OAUTH_ONLY')

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) throw new Error('INVALID_PASSWORD')

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          isOnboarded: user.isOnboarded,
          avatarUrl: user.avatarUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.roles = (user as any).roles
        token.isOnboarded = (user as any).isOnboarded
        token.avatarUrl = (user as any).avatarUrl
      }
      // Handle session update trigger (e.g. after onboarding completes)
      if (trigger === 'update' && session) {
        if (session.isOnboarded !== undefined) token.isOnboarded = session.isOnboarded
        if (session.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).roles = token.roles
        ;(session.user as any).isOnboarded = token.isOnboarded
        ;(session.user as any).avatarUrl = token.avatarUrl
      }
      return session
    },
  },
}

export const getSession = () => getServerSession(authOptions)
