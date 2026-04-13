import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export type NotificationsPreviewData = {
  items: NotificationItem[]
  nextCursor: string | null
  unreadCount: number
}

export function useNotificationsPreview() {
  return useQuery({
    queryKey: ['notifications-preview'],
    queryFn: async () => {
      const json = await api.get<{ data: NotificationsPreviewData }>(
        '/api/notifications?limit=5',
      )
      return json.data
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
