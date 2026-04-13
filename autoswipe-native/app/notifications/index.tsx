import { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { goBackSafeWithReturn } from '../../src/lib/go-back-safe'
import { useReturnTo } from '../../src/hooks/useReturnTo'
import { ScreenHeader } from '../../src/components/ui/ScreenHeader'
import { SCREEN_EDGE } from '../../src/constants/layout'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../src/lib/api'
import type { NotificationItem } from '../../src/hooks/useNotificationsPreview'
import { listingPathFromNotification } from '../../src/lib/notification-listing-link'

type PageData = {
  items: NotificationItem[]
  nextCursor: string | null
  unreadCount: number
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'עכשיו'
    if (m < 60) return `לפני ${m} דק׳`
    const h = Math.floor(m / 60)
    if (h < 48) return `לפני ${h} שע׳`
    return d.toLocaleDateString('he-IL')
  } catch {
    return ''
  }
}

export default function NotificationsInboxScreen() {
  const router = useRouter()
  const returnTo = useReturnTo()
  const queryClient = useQueryClient()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['notifications-inbox-native'],
      initialPageParam: null as string | null,
      queryFn: async ({ pageParam }) => {
        const q = pageParam
          ? `?limit=20&cursor=${encodeURIComponent(pageParam)}`
          : '?limit=20'
        const json = await api.get<{ data: PageData }>(`/api/notifications${q}`)
        return json.data
      },
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    })

  const markNotificationRead = useCallback(
    async (id: string, readAt: string | null) => {
      if (readAt) return
      try {
        await api.patch('/api/notifications', { ids: [id] })
      } catch {
        /* ignore */
      }
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-inbox-native'] })
    },
    [queryClient],
  )

  const items = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
      <ScreenHeader
        onBack={() => goBackSafeWithReturn(returnTo, '/(tabs)/settings')}
        backVariant="text"
        backLabel="סגור"
        title="כל ההתראות"
        titleSize={18}
      />

      {isLoading && (
        <View style={{ paddingTop: 48, alignItems: 'center' }}>
          <ActivityIndicator color="#D4A843" />
        </View>
      )}
      {isError && (
        <Text style={{ color: '#F44336', textAlign: 'center', marginTop: 32, paddingHorizontal: 24 }}>
          שגיאה בטעינה
        </Text>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>אין התראות עדיין</Text>
      )}
      {!isLoading && !isError && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: SCREEN_EDGE, paddingBottom: 32 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage()
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#D4A843" style={{ marginTop: 16 }} />
            ) : null
          }
          renderItem={({ item }) => {
            const path = listingPathFromNotification(item.type, item.data)
            const cardStyle = {
              backgroundColor: '#1A1A1A',
              borderRadius: 12,
              padding: 16,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: item.readAt ? 'rgba(255,255,255,0.06)' : 'rgba(212,168,67,0.35)',
            } as const
            const body = (
              <>
                <Text style={{ color: '#F5F5F5', fontSize: 16, fontWeight: '600', textAlign: 'right' }}>
                  {item.title}
                </Text>
                <Text style={{ color: '#AAA', fontSize: 14, marginTop: 6, textAlign: 'right' }}>
                  {item.body}
                </Text>
                <Text style={{ color: '#666', fontSize: 11, marginTop: 8, textAlign: 'left' }}>
                  {formatTime(item.createdAt)}
                </Text>
              </>
            )
            return path ? (
              <TouchableOpacity
                activeOpacity={0.75}
                style={cardStyle}
                onPress={async () => {
                  await markNotificationRead(item.id, item.readAt)
                  router.push(path as never)
                }}
              >
                {body}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.75}
                style={cardStyle}
                onPress={() => {
                  void markNotificationRead(item.id, item.readAt)
                }}
              >
                {body}
              </TouchableOpacity>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
