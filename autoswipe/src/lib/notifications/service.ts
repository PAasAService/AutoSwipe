import { prisma } from '@/lib/db'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
/** Expo docs: batch size per request */
const CHUNK_SIZE = 100

export interface CreateNotificationInput {
  userId: string
  type?: string
  title: string
  body: string
  data?: Record<string, unknown>
}

function serializeData(data?: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0) return '{}'
  try {
    return JSON.stringify(data)
  } catch {
    return '{}'
  }
}

function isExpoPushToken(token: string): boolean {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  )
}

type ExpoPushTicket = {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

type ExpoPushResponse = { data?: ExpoPushTicket[] }

async function sendExpoChunks(
  messages: Array<{
    to: string
    title: string
    body: string
    data: Record<string, unknown>
    sound?: string
  }>,
): Promise<Set<string>> {
  const tokensToRemove = new Set<string>()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
  }

  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE)
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(chunk),
      })
      const json = (await res.json()) as ExpoPushResponse
      const tickets = json.data
      if (!Array.isArray(tickets)) continue
      tickets.forEach((ticket, j) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const to = chunk[j]?.to
          if (typeof to === 'string') tokensToRemove.add(to)
        }
      })
    } catch {
      /* network — skip */
    }
  }

  return tokensToRemove
}

/**
 * Persists an inbox row and sends Expo push to the user's registered devices
 * when pushNotifications is enabled.
 */
export async function createNotification(input: CreateNotificationInput) {
  const dataJson = serializeData(input.data)
  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? 'system',
      title: input.title,
      body: input.body,
      data: dataJson,
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { pushNotifications: true },
  })
  if (user?.pushNotifications) {
    await sendPushForUser(input.userId, {
      title: input.title,
      body: input.body,
      data: { ...input.data, notificationId: row.id },
    })
  }

  return row
}

export async function sendPushForUser(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> },
) {
  const devices = await prisma.pushDevice.findMany({
    where: { userId },
    select: { id: true, token: true },
  })

  const invalidIds: string[] = []
  const messages: Array<{
    to: string
    title: string
    body: string
    data: Record<string, unknown>
    sound: string
  }> = []

  for (const d of devices) {
    if (!isExpoPushToken(d.token)) {
      invalidIds.push(d.id)
      continue
    }
    messages.push({
      to: d.token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default',
    })
  }

  if (invalidIds.length) {
    await prisma.pushDevice.deleteMany({ where: { id: { in: invalidIds } } })
  }

  if (messages.length === 0) return

  const tokensToRemove = await sendExpoChunks(messages)
  if (tokensToRemove.size > 0) {
    await prisma.pushDevice.deleteMany({
      where: { token: { in: Array.from(tokensToRemove) } },
    })
  }
}
