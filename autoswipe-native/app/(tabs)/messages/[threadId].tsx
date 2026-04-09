import { useState, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { useThread, useSendMessage, useStartConversation } from '../../../src/hooks/useThread'
import { useCurrentUser } from '../../../src/hooks/useCurrentUser'
import { Message } from '../../../src/types'
import { formatRelativeTime } from '../../../src/lib/utils/format'
import { queryKeys } from '../../../src/lib/query-keys'

// Default max buyer messages before seller must reply
const BUYER_MESSAGE_LIMIT = 3

export default function ChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { data, isLoading } = useThread(threadId)
  const { data: me } = useCurrentUser()
  const sendMessage = useSendMessage(threadId)
  const startConversation = useStartConversation()
  const [text, setText] = useState('')
  const listRef = useRef<FlatList>(null)

  function handleSend() {
    const msg = text.trim()
    if (!msg) return
    setText('')
    sendMessage.mutate(msg)
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }

  function handleStartConversation() {
    startConversation.mutate(threadId, {
      onSuccess: () => {
        // Refresh both the thread detail and the thread list
        qc.invalidateQueries({ queryKey: queryKeys.thread(threadId) })
      },
    })
  }

  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4A843" />
      </View>
    )
  }

  const { thread, messages } = data
  const isBuyer = thread.buyerId === me?.id
  const isSeller = thread.sellerId === me?.id
  const otherUser = isBuyer ? thread.seller : thread.buyer

  // ── Pending state: thread not yet activated by seller ──────────────────────
  const isPending = thread.isActive === false

  // Buyer message limit: disable input when buyer has hit the limit and seller hasn't replied yet
  const effectiveLimit = thread.buyerMessageLimit ?? BUYER_MESSAGE_LIMIT
  const buyerLimitReached = isBuyer &&
    !thread.sellerHasReplied &&
    (thread.buyerMessageCount ?? 0) >= effectiveLimit

  const inputDisabled = buyerLimitReached || sendMessage.isPending

  const isSuperLike = thread.isSuperLike === true

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#D4A843', fontSize: 16 }}>→</Text>
        </TouchableOpacity>

        {/* Car info — tappable to listing */}
        <TouchableOpacity
          onPress={() => router.push(`/listing/${thread.listing.id}`)}
          activeOpacity={0.75}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}
        >
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 15 }}>{otherUser.name}</Text>
            <Text style={{ color: '#D4A843', fontSize: 12 }}>
              {thread.listing.brand} {thread.listing.model} ←
            </Text>
          </View>
          {thread.listing.images?.[0] && (
            <Image
              source={{ uri: thread.listing.images[0].url }}
              style={{ width: 44, height: 44, borderRadius: 8 }}
              contentFit="cover"
            />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMe={item.senderId === me?.id} />
          )}
        />

        {/* ── Pending state footer — replaces the input bar completely ── */}
        {isPending ? (
          isSeller ? (
            /* Seller view: prompt to activate the thread */
            <View style={{
              margin: 16,
              padding: 16,
              borderRadius: 14,
              backgroundColor: isSuperLike ? 'rgba(212,168,67,0.10)' : 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: isSuperLike ? 'rgba(212,168,67,0.5)' : 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              gap: 12,
            }}>
              <Text style={{ fontSize: 22 }}>{isSuperLike ? '⭐' : '💬'}</Text>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
                {isSuperLike ? 'קיבלת סופר לייק!' : 'קונה מעוניין ברכב שלך!'}
              </Text>
              <Text style={{ color: '#AAAAAA', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                {otherUser.name} {isSuperLike ? 'ממש מעוניין ברכב שלך.' : 'מעוניין ברכב שלך.'}{'\n'}
                לחץ על "התחל שיחה" כדי לפתוח את הצ'אט.
              </Text>
              <TouchableOpacity
                onPress={handleStartConversation}
                disabled={startConversation.isPending}
                style={{
                  backgroundColor: isSuperLike ? '#D4A843' : '#2A7AFF',
                  borderRadius: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 28,
                  opacity: startConversation.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 15 }}>
                  {startConversation.isPending ? 'טוען...' : 'התחל שיחה ←'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Buyer view: informational — waiting for seller */
            <View style={{
              margin: 16,
              padding: 16,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              gap: 8,
            }}>
              <Text style={{ fontSize: 22 }}>📩</Text>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
                בקשת הקשר נשלחה!
              </Text>
              <Text style={{ color: '#AAAAAA', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                המוכר יצור איתך קשר ברגע שיאשר את השיחה. ⏳
              </Text>
            </View>
          )
        ) : (
          /* ── Active thread: normal input bar ── */
          <>
            {/* Buyer limit notice */}
            {buyerLimitReached && (
              <View style={{
                paddingHorizontal: 16, paddingVertical: 12,
                backgroundColor: 'rgba(255,152,0,0.08)',
                borderTopWidth: 1, borderTopColor: 'rgba(255,152,0,0.2)',
              }}>
                <Text style={{ color: '#FF9800', fontSize: 13, textAlign: 'right' }}>
                  שלחת {thread.buyerMessageCount} הודעות. ממתין לתגובת המוכר לפני שתוכל לשלוח עוד. 🔒
                </Text>
              </View>
            )}

            <View style={{
              flexDirection: 'row',
              padding: 12,
              gap: 8,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.08)',
              backgroundColor: '#1A1A1A',
              alignItems: 'flex-end',
            }}>
              <TouchableOpacity
                onPress={handleSend}
                disabled={!text.trim() || inputDisabled}
                style={{
                  backgroundColor: '#D4A843',
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: (!text.trim() || inputDisabled) ? 0.4 : 1,
                }}
              >
                <Text style={{ fontSize: 18 }}>↑</Text>
              </TouchableOpacity>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={buyerLimitReached ? 'ממתין לתגובת המוכר...' : 'הקלד הודעה...'}
                placeholderTextColor="#888888"
                multiline
                textAlign="right"
                editable={!buyerLimitReached}
                style={{
                  flex: 1,
                  backgroundColor: buyerLimitReached ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: 12,
                  color: '#F5F5F5',
                  fontSize: 15,
                  maxHeight: 100,
                  opacity: buyerLimitReached ? 0.5 : 1,
                }}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function MessageBubble({ message, isMe }: { message: Message; isMe: boolean }) {
  return (
    <View style={{ alignItems: isMe ? 'flex-start' : 'flex-end' }}>
      <View style={{
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        borderBottomLeftRadius: isMe ? 4 : 16,
        borderBottomRightRadius: isMe ? 16 : 4,
        backgroundColor: isMe ? '#D4A843' : '#1A1A1A',
      }}>
        <Text style={{
          color: isMe ? '#0F0F0F' : '#F5F5F5',
          fontSize: 15,
          textAlign: isMe ? 'left' : 'right',
        }}>
          {message.text}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <Text style={{ color: '#888888', fontSize: 11 }}>
          {formatRelativeTime(message.createdAt)}
        </Text>
        {isMe && (
          <Text style={{ color: message.isRead ? '#D4A843' : '#666666', fontSize: 11, fontWeight: '700' }}>
            {message.isRead ? '✓✓' : '✓'}
          </Text>
        )}
      </View>
    </View>
  )
}
