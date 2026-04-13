import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { hrefWithReturn } from '../../lib/go-back-safe'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useNotificationsPreview } from '../../hooks/useNotificationsPreview'
import { listingPathFromNotification } from '../../lib/notification-listing-link'

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

export function SwipeNotificationsEntry() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useNotificationsPreview()

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

  useEffect(() => {
    if (open) refetch()
  }, [open, refetch])

  const unread = data?.unreadCount ?? 0
  const items = data?.items ?? []

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{ padding: 6, marginRight: 4 }}
        accessibilityLabel="התראות"
      >
        <View style={{ position: 'relative' }}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
          {unread > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#F44336',
                borderWidth: 2,
                borderColor: '#0F0F0F',
              }}
            />
          )}
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'flex-start',
            paddingTop: 100,
            paddingHorizontal: 16,
          }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              maxHeight: '70%',
              overflow: 'hidden',
            }}
          >
            <Text
              style={{
                color: '#F5F5F5',
                fontSize: 17,
                fontWeight: '700',
                textAlign: 'right',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.08)',
              }}
            >
              התראות
            </Text>
            <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
              {isLoading && (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <ActivityIndicator color="#D4A843" />
                </View>
              )}
              {isError && (
                <Text style={{ color: '#F44336', textAlign: 'center', padding: 20 }}>שגיאה בטעינה</Text>
              )}
              {!isLoading && !isError && items.length === 0 && (
                <Text style={{ color: '#888', textAlign: 'center', padding: 24 }}>אין התראות</Text>
              )}
              {!isLoading &&
                !isError &&
                items.map((n) => {
                  const path = listingPathFromNotification(n.type, n.data)
                  const rowStyle = {
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.06)',
                    backgroundColor: n.readAt ? 'transparent' : 'rgba(212,168,67,0.06)',
                  } as const
                  const body = (
                    <>
                      <Text style={{ color: '#F5F5F5', fontWeight: '600', textAlign: 'right' }}>
                        {n.title}
                      </Text>
                      <Text
                        style={{ color: '#AAA', fontSize: 13, marginTop: 4, textAlign: 'right' }}
                        numberOfLines={2}
                      >
                        {n.body}
                      </Text>
                      <Text style={{ color: '#666', fontSize: 11, marginTop: 4, textAlign: 'left' }}>
                        {formatTime(n.createdAt)}
                      </Text>
                    </>
                  )
                  return path ? (
                    <TouchableOpacity
                      key={n.id}
                      style={rowStyle}
                      activeOpacity={0.75}
                      onPress={async () => {
                        await markNotificationRead(n.id, n.readAt)
                        setOpen(false)
                        router.push(path as never)
                      }}
                    >
                      {body}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      key={n.id}
                      style={rowStyle}
                      activeOpacity={0.75}
                      onPress={() => {
                        void markNotificationRead(n.id, n.readAt)
                      }}
                    >
                      {body}
                    </TouchableOpacity>
                  )
                })}
            </ScrollView>
            <TouchableOpacity
              onPress={() => {
                setOpen(false)
                router.push(hrefWithReturn('/notifications', 'swipe'))
              }}
              style={{
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: '#D4A843', fontWeight: '700', textAlign: 'center', fontSize: 16 }}>
                כל ההתראות
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
