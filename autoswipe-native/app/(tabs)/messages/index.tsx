import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useThreads } from '../../../src/hooks/useThread'
import { formatRelativeTime } from '../../../src/lib/utils/format'
import { MessageThread } from '../../../src/types'
import { useCurrentUser } from '../../../src/hooks/useCurrentUser'
import Skeleton from '../../../src/components/ui/Skeleton'

export default function MessagesScreen() {
  const { data: threads, isLoading } = useThreads()
  const { data: me } = useCurrentUser()
  const router = useRouter()

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
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

  if (!threads?.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>💬</Text>
        <Text style={{ color: '#F5F5F5', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
          אין שיחות עדיין
        </Text>
        <Text style={{ color: '#888888', textAlign: 'center', marginTop: 8 }}>
          שלח הודעה למוכר מדף הרכב
        </Text>
      </SafeAreaView>
    )
  }

  // Sort by most recent activity, threads with no messages go to the bottom
  const sorted = [...threads].sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0
    if (!a.lastMessageAt) return 1
    if (!b.lastMessageAt) return -1
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#F5F5F5', textAlign: 'right' }}>
          הודעות 💬
        </Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ gap: 1 }}
        renderItem={({ item }) => (
          <ThreadItem
            thread={item}
            myId={me?.id ?? ''}
            onPress={() => router.push(`/(tabs)/messages/${item.id}`)}
            onPressListing={() => router.push(`/listing/${item.listing.id}`)}
          />
        )}
      />
    </SafeAreaView>
  )
}

function ThreadItem({
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

  // "Whose turn" logic: if I have unread messages, it's my turn to reply.
  // If they have unread messages (and I don't), I'm waiting for them.
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
      {/* Car image — tappable to listing */}
      <TouchableOpacity onPress={onPressListing} activeOpacity={0.75}>
        {carImage ? (
          <Image
            source={{ uri: carImage.url }}
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
        {/* Row 1: name + timestamp */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#888888', fontSize: 12 }}>
            {thread.lastMessageAt ? formatRelativeTime(thread.lastMessageAt) : ''}
          </Text>
          <Text style={{ color: '#F5F5F5', fontWeight: myUnread > 0 ? '700' : '400', fontSize: 15 }}>
            {otherUser.name}
          </Text>
        </View>

        {/* Row 2: car info — tappable */}
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

        {/* Row 3: unread badge + last message */}
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
