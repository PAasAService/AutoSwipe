import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { createNotification } from '@/lib/notifications/service'

/**
 * Dev-only: create a test notification for the current user (and send push if configured).
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.NOTIFICATION_TEST_SECRET
    const header = req.headers.get('x-notification-test-secret')
    if (!secret || header !== secret) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const authUser = await getAuthUser(req)
  if (!authUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let title = 'התראת בדיקה'
  let body = 'זוהי התראה לבדיקת התשתית.'
  try {
    const json = await req.json()
    if (json && typeof json === 'object') {
      if (typeof (json as { title?: unknown }).title === 'string') {
        title = (json as { title: string }).title
      }
      if (typeof (json as { body?: unknown }).body === 'string') {
        body = (json as { body: string }).body
      }
    }
  } catch {
    /* use defaults */
  }

  const row = await createNotification({
    userId: authUser.id,
    type: 'system',
    title,
    body,
    data: { source: 'test' },
  })

  return NextResponse.json({
    data: { id: row.id, createdAt: row.createdAt.toISOString() },
  })
}
