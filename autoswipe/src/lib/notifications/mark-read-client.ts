import type { QueryClient } from '@tanstack/react-query'

export async function patchNotificationsMarkRead(ids: string[]) {
  const filtered = ids.filter((id) => typeof id === 'string' && id)
  if (filtered.length === 0) return
  try {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: filtered }),
    })
  } catch {
    /* ignore */
  }
}

export function invalidateNotificationQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['notifications-preview'] })
  queryClient.invalidateQueries({ queryKey: ['notifications-inbox'] })
}
