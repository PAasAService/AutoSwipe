import { prisma } from '@/lib/db'

/** Matches API `/api/users/notifications` key `listingStatus` (seller listing updates). */
export async function isListingStatusNotificationsEnabled(
  userId: string,
): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true },
  })
  if (!row?.notificationPrefs || row.notificationPrefs === '{}') return true
  try {
    const p = JSON.parse(row.notificationPrefs) as Record<string, unknown>
    if (typeof p.listingStatus === 'boolean') return p.listingStatus
  } catch {
    /* keep default */
  }
  return true
}
