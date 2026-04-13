import { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { hrefWithReturn } from '../../../src/lib/go-back-safe'
import { Image } from 'expo-image'
import { useThreads, useStartConversation } from '../../../src/hooks/useThread'
import { formatRelativeTime } from '../../../src/lib/utils/format'
import { MessageThread } from '../../../src/types'
import { useCurrentUser } from '../../../src/hooks/useCurrentUser'
import Skeleton from '../../../src/components/ui/Skeleton'
import { listingImageUri } from '../../../src/lib/listing-image-uri'

type TabKey = 'active' | 'pending'
type FilterKey = 'all' | 'contacted_me' | 'i_contacted'

const TAB_LABELS: Record<TabKey, string> = {
  active: 'שיחות פעילות 💬',
  pending: 'ממתינות ⏳',
}

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'הכל',
  contacted_me: 'פנו אליי',
  i_contacted: 'יצרתי קשר',
}

export default function MessagesScreen() {
  const { data: threads, isLoading } = useThreads()
  const { data: me } = useCurrentUser()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabKey>('active')
  const [filter, setFilter] = useState<FilterKey>('all')

  const myId = me?.id ?? ''

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
          <Skeleton width={160} height={28} borderRadius={8} />
        </View>
        <View style={{ gap: 1 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', padding: 16,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 12,
            }}>
              <Skeleton width={56} height={56} borderRadius={10} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="60%" height={15} borderRadius={6} />
                <Skeleton width="40%" height={13} borderRadius={6} />
                <Skeleton width="80%" height={13} borderRadius={6} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    )
  }

  const allThreads = threads ?? []

  // Split into active / pending based on the isActive flag
  const activeThreads = allThreads.filter((t) => t.isActive !== false)
  const pendingThreads = allThreads.filter((t) => t.isActive === false)

  // Apply role filter to whichever tab is selected
  function applyFilter(list: MessageThread[]): MessageThread[] {
    if (filter === 'contacted_me') return list.filter((t) => t.sellerId === myId)
    if (filter === 'i_contacted')  return list.filter((t) => t.buyerId === myId)
    return list
  }

  // Sort active: most recent first
  const sortedActive = applyFilter([...activeThreads]).sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0
    if (!a.lastMessageAt) return 1
    if (!b.lastMessageAt) return -1
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  })

  // Sort pending: super likes first, then regular, within each group newest first
  const sortedPending = applyFilter([...pendingThreads]).sort((a, b) => {
    if (a.isSuperLike !== b.isSuperLike) return a.isSuperLike ? -1 : 1
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  const displayList = activeTab === 'active' ? sortedActive : sortedPending
  const isEmpty = displayList.length === 0

  const pendingCount = pendingThreads.length
  const superLikeCount = pendingThreads.filter((t) => t.isSuperLike).length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {superLikeCount > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: 'rgba(33,150,243,0.12)',
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
              borderWidth: 1, borderColor: 'rgba(33,150,243,0.3)',
            }}>
              <Text style={{ color: '#2196F3', fontSize: 12, fontWeight: '700' }}>
                ⭐ {superLikeCount} סופר לייקים ממתינים
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#F5F5F5', textAlign: 'right', flex: 1 }}>
            הודעות
          </Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={{
        flexDirection: 'row', marginHorizontal: 16, marginTop: 8, marginBottom: 4,
        backgroundColor: '#1A1A1A', borderRadius: 14, padding: 3,
      }}>
        {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => {
          const isSelected = activeTab === tab
          const count = tab === 'pending' ? pendingCount : undefined
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center',
                flexDirection: 'row', justifyContent: 'center', gap: 6,
                backgroundColor: isSelected ? '#D4A843' : 'transparent',
              }}
            >
              <Text style={{
                color: isSelected ? '#0F0F0F' : '#888',
                fontWeight: isSelected ? '700' : '500',
                fontSize: 13,
              }}>
                {TAB_LABELS[tab]}
              </Text>
              {count !== undefined && count > 0 && (
                <View style={{
                  backgroundColor: isSelected ? 'rgba(15,15,15,0.3)' : '#D4A843',
                  borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1,
                }}>
                  <Text style={{ color: isSelected ? '#0F0F0F' : '#0F0F0F', fontSize: 11, fontWeight: '800' }}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Role filter ── */}
      <View style={{
        flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 8,
        justifyContent: 'flex-end',
      }}>
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map((f) => {
          const isSelected = filter === f
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
                borderWidth: 1.5,
                borderColor: isSelected ? '#D4A843' : 'rgba(255,255,255,0.15)',
                backgroundColor: isSelected ? 'rgba(212,168,67,0.12)' : 'transparent',
              }}
            >
              <Text style={{
                color: isSelected ? '#D4A843' : '#888',
                fontSize: 12, fontWeight: isSelected ? '700' : '500',
              }}>
                {FILTER_LABELS[f]}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Empty state ── */}
      {isEmpty ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>
            {activeTab === 'pending' ? '⏳' : '💬'}
          </Text>
          <Text style={{ color: '#F5F5F5', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
            {activeTab === 'pending'
              ? filter !== 'all' ? 'אין תוצאות לפי הסינון' : 'אין בקשות ממתינות'
              : filter !== 'all' ? 'אין שיחות לפי הסינון' : 'אין שיחות פעילות'}
          </Text>
          <Text style={{ color: '#666', textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 20 }}>
            {activeTab === 'pending'
              ? 'כשמישהו שולח סופר לייק לרכב שלך, או לוחץ על "שלח הודעה למוכר", זה יופיע כאן'
              : 'שיחות פעילות מופיעות כאן לאחר שמוכר פתח את השיחה'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ gap: 1 }}
          renderItem={({ item }) =>
            activeTab === 'pending' ? (
              <PendingThreadItem
                thread={item}
                myId={myId}
                onPress={() => router.push(hrefWithReturn(`/(tabs)/messages/${item.id}`, 'messages'))}
                onPressListing={() => router.push(`/listing/${item.listing.id}`)}
              />
            ) : (
              <ActiveThreadItem
                thread={item}
                myId={myId}
                onPress={() => router.push(hrefWithReturn(`/(tabs)/messages/${item.id}`, 'messages'))}
                onPressListing={() => router.push(`/listing/${item.listing.id}`)}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  )
}

// ─── Active Thread Item ────────────────────────────────────────────────────────
function ActiveThreadItem({
  thread,
  myId,
  onPress,
  onPressListing,
}: {
  thread: MessageThread
  myId: string
  onPress: () => void
  onPressListing: () => void
}) {
  const isBuyer = thread.buyerId === myId
  const otherUser = isBuyer ? thread.seller : thread.buyer
  const myUnread = isBuyer ? thread.buyerUnread : thread.sellerUnread
  const theirUnread = isBuyer ? thread.sellerUnread : thread.buyerUnread
  const carImage = thread.listing.images?.[0]

  const turnLabel = myUnread > 0 ? 'תורך לענות ↩' : theirUnread > 0 ? 'ממתין לתגובה...' : null
  const turnColor = myUnread > 0 ? '#D4A843' : '#888888'

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: myUnread > 0 ? 'rgba(212,168,67,0.04)' : '#0F0F0F',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        gap: 12,
      }}
    >
      <TouchableOpacity onPress={onPressListing} activeOpacity={0.75}>
        {carImage ? (
          <Image
            source={{ uri: listingImageUri(carImage.path) }}
            style={{ width: 56, height: 56, borderRadius: 10 }}
            contentFit="cover"
          />
        ) : (
          <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>🚗</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#888888', fontSize: 12 }}>
            {thread.lastMessageAt ? formatRelativeTime(thread.lastMessageAt) : ''}
          </Text>
          <Text style={{ color: '#F5F5F5', fontWeight: myUnread > 0 ? '700' : '400', fontSize: 15 }}>
            {otherUser.name}
          </Text>
        </View>

        <TouchableOpacity onPress={onPressListing} activeOpacity={0.75}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {turnLabel && (
              <Text style={{ color: turnColor, fontSize: 11, fontWeight: '600' }}>{turnLabel}</Text>
            )}
            <Text style={{ color: '#D4A843', fontSize: 13, textAlign: 'right', flex: 1 }}>
              {thread.listing.brand} {thread.listing.model} {thread.listing.year}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {myUnread > 0 && (
            <View style={{ backgroundColor: '#D4A843', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ color: '#0F0F0F', fontSize: 11, fontWeight: '700' }}>{myUnread}</Text>
            </View>
          )}
          <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', flex: 1 }} numberOfLines={1}>
            {thread.lastMessage || 'התחל שיחה...'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── Pending Thread Item ───────────────────────────────────────────────────────
function PendingThreadItem({
  thread,
  myId,
  onPress,
  onPressListing,
}: {
  thread: MessageThread
  myId: string
  onPress: () => void
  onPressListing: () => void
}) {
  const startConversation = useStartConversation()
  const isSeller = thread.sellerId === myId
  const otherUser = thread.sellerId === myId ? thread.buyer : thread.seller
  const carImage = thread.listing.images?.[0]
  const isSuperLike = thread.isSuperLike

  // Gold border + glow for super likes
  const borderColor = isSuperLike ? '#D4A843' : 'rgba(255,255,255,0.08)'
  const bgColor = isSuperLike ? 'rgba(212,168,67,0.06)' : '#0F0F0F'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginHorizontal: 12,
        marginVertical: 4,
        backgroundColor: bgColor,
        borderRadius: 16,
        borderWidth: isSuperLike ? 1.5 : 1,
        borderColor,
        gap: 12,
        // Gold glow for super likes
        ...(isSuperLike ? {
          shadowColor: '#D4A843',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 6,
        } : {}),
      }}
    >
      {/* Car image */}
      <TouchableOpacity onPress={onPressListing} activeOpacity={0.75}>
        <View style={{ position: 'relative' }}>
          {carImage ? (
            <Image
              source={{ uri: listingImageUri(carImage.path) }}
              style={{ width: 58, height: 58, borderRadius: 12 }}
              contentFit="cover"
            />
          ) : (
            <View style={{ width: 58, height: 58, borderRadius: 12, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>🚗</Text>
            </View>
          )}
          {/* Super like badge over image */}
          {isSuperLike && (
            <View style={{
              position: 'absolute', top: -6, right: -6,
              backgroundColor: '#1565C0',
              borderRadius: 10, width: 20, height: 20,
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 1.5, borderColor: '#0F0F0F',
            }}>
              <Text style={{ fontSize: 10 }}>⭐</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Content */}
      <View style={{ flex: 1, gap: 4 }}>
        {/* Name + badge row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {isSuperLike ? (
            <View style={{
              backgroundColor: 'rgba(33,150,243,0.15)',
              paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
              borderWidth: 1, borderColor: 'rgba(33,150,243,0.4)',
            }}>
              <Text style={{ color: '#64B5F6', fontSize: 10, fontWeight: '700' }}>⭐ סופר לייק</Text>
            </View>
          ) : (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.07)',
              paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
            }}>
              <Text style={{ color: '#AAAAAA', fontSize: 10, fontWeight: '700' }}>💬 הודעה</Text>
            </View>
          )}
          <Text style={{ color: '#F5F5F5', fontWeight: '600', fontSize: 14 }}>
            {otherUser.name}
          </Text>
        </View>

        {/* Car name */}
        <TouchableOpacity onPress={onPressListing} activeOpacity={0.75}>
          <Text style={{ color: '#D4A843', fontSize: 12, textAlign: 'right' }}>
            {thread.listing.brand} {thread.listing.model} {thread.listing.year}
          </Text>
        </TouchableOpacity>

        {/* Last message preview */}
        <Text style={{ color: '#666', fontSize: 12, textAlign: 'right' }} numberOfLines={1}>
          {thread.lastMessage || ''}
        </Text>

        {/* Timestamp + start conversation */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <Text style={{ color: '#555', fontSize: 11 }}>
            {thread.lastMessageAt ? formatRelativeTime(thread.lastMessageAt) : ''}
          </Text>
          {isSeller && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation()
                startConversation.mutate(thread.id)
              }}
              disabled={startConversation.isPending}
              style={{
                backgroundColor: isSuperLike ? '#D4A843' : '#1A1A1A',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: isSuperLike ? '#D4A843' : 'rgba(255,255,255,0.2)',
                opacity: startConversation.isPending ? 0.6 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {startConversation.isPending ? (
                <ActivityIndicator size="small" color={isSuperLike ? '#0F0F0F' : '#D4A843'} />
              ) : (
                <Text style={{
                  color: isSuperLike ? '#0F0F0F' : '#D4A843',
                  fontSize: 12,
                  fontWeight: '700',
                }}>
                  התחל שיחה ←
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}
