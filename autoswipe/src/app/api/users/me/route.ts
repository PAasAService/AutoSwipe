import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import {
  USER_DISPLAY_NAME_TAKEN_CODE,
  USER_DISPLAY_NAME_TAKEN_HE,
} from '@/lib/user-display-name'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        avatarUrl: true,
        phone: true,
        isVerified: true,
        isOnboarded: true,
        messagingMode: true,
        emailNotifications: true,
        emailFrequency: true,
        pushNotifications: true,
        superLikesRemaining: true,
        createdAt: true,
        buyerPreferences: true,
        _count: {
          select: {
            listings: { where: { status: 'ACTIVE' } },
            favorites: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ data: user })
  } catch (err) {
    console.error('[api/users/me GET]', err)
    const message =
      err instanceof Error ? err.message : 'שגיאת שרת'
    return NextResponse.json({ message, error: 'UserFetchError' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    name,
    phone,
    messagingMode,
    emailNotifications,
    emailFrequency,
    pushNotifications,
    isOnboarded,
    currentPassword,
    newPassword,
  } = body

  const hasPasswordChange =
    currentPassword !== undefined || newPassword !== undefined
  if (hasPasswordChange) {
    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      !currentPassword ||
      !newPassword
    ) {
      return NextResponse.json(
        { message: 'סיסמה נוכחית וחדשה נדרשות' },
        { status: 400 }
      )
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' },
        { status: 400 }
      )
    }
  }

  if (typeof name === 'string' && name.trim().length > 0) {
    const trimmed = name.trim().slice(0, 80)
    const conflict = await prisma.user.findFirst({
      where: { name: trimmed, NOT: { id: authUser.id } },
    })
    if (conflict) {
      return NextResponse.json(
        { error: USER_DISPLAY_NAME_TAKEN_HE, code: USER_DISPLAY_NAME_TAKEN_CODE },
        { status: 409 }
      )
    }
  }

  const data: Prisma.UserUpdateInput = {
    ...(name && { name: name.trim().slice(0, 80) }),
    ...(phone !== undefined && { phone: phone?.trim() ?? null }),
    ...(messagingMode !== undefined && { messagingMode }),
    ...(emailNotifications !== undefined && { emailNotifications }),
    ...(emailFrequency !== undefined && { emailFrequency }),
    ...(pushNotifications !== undefined && { pushNotifications }),
    ...(isOnboarded !== undefined && { isOnboarded }),
  }

  if (hasPasswordChange) {
    const existing = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { passwordHash: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!existing.passwordHash) {
      return NextResponse.json(
        { message: 'חשבון זה מקושר ל-Google/Apple — נהל סיסמה דרך הספק' },
        { status: 400 }
      )
    }
    const valid = await bcrypt.compare(currentPassword!, existing.passwordHash)
    if (!valid) {
      return NextResponse.json({ message: 'סיסמה נוכחית שגויה' }, { status: 400 })
    }
    data.passwordHash = await bcrypt.hash(newPassword!, 10)
  }

  const select = {
    id: true,
    email: true,
    name: true,
    phone: true,
    avatarUrl: true,
    roles: true,
    isOnboarded: true,
    messagingMode: true,
    emailNotifications: true,
    emailFrequency: true,
    pushNotifications: true,
  } as const

  if (Object.keys(data).length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select,
    })
    return NextResponse.json({ data: user })
  }

  try {
    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data,
      select,
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta as { target?: string[] } | undefined)?.target
      if (Array.isArray(target) && target.includes('name')) {
        return NextResponse.json(
          { error: USER_DISPLAY_NAME_TAKEN_HE, code: USER_DISPLAY_NAME_TAKEN_CODE },
          { status: 409 }
        )
      }
    }
    throw err
  }
}
