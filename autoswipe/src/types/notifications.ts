export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export type NotificationsListResponse = {
  data: {
    items: NotificationItem[]
    nextCursor: string | null
    unreadCount: number
  }
}
