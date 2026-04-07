'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Send, MessageCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useThread, useSendMessage } from '@/hooks/useThread'

export default function ChatThreadPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')

  // ── Server state ─────────────────────────────────────────────────────────────
  const { data: currentUser }                              = useCurrentUser()
  const { data: threadData, isLoading, isError, error }   = useThread(threadId)
  const sendMessage                                        = useSendMessage(threadId)

  // ── Redirect if thread not found ─────────────────────────────────────────────
  useEffect(() => {
    if (isError && error instanceof Error && error.message === '404') {
      router.push('/messages')
    }
  }, [isError, error, router])

  // ── Scroll to bottom on new messages ─────────────────────────────────────────
  const messages = threadData?.messages ?? []
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // ── Derived ───────────────────────────────────────────────────────────────────
  const currentUserId = currentUser?.id ?? ''

  // ── Send handler ─────────────────────────────────────────────────────────────
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const msgText = text.trim()
    if (!msgText || sendMessage.isPending) return

    setText('') // clear eagerly; restore on error via onError callback below
    sendMessage.mutate(
      { text: msgText, currentUserId },
      {
        // Hook already toasts + rolls back optimistic message; we just restore the input
        onError: () => setText(msgText),
      },
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-container-lowest">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!threadData) return null

  const listing  = threadData.listing
  const otherUser = currentUserId === threadData.buyerId ? threadData.seller : threadData.buyer

  return (
    <div className="flex flex-col h-[calc(100dvh-0px)] bg-surface-container-lowest" dir="rtl">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-surface-container-low/90 backdrop-blur-xl border-b border-outline-variant/20 flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface flex-shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Listing thumbnail */}
          <Link href={`/listing/${listing.id}`}>
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-surface-container relative flex-shrink-0">
              {listing.images?.[0]?.url ? (
                <Image src={listing.images[0].url} alt="" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-on-surface-variant" />
                </div>
              )}
            </div>
          </Link>

          {/* Listing + user info */}
          <div className="flex-1 text-right min-w-0">
            <p className="font-bold text-on-surface text-sm truncate">
              {listing.brand} {listing.model} {listing.year}
            </p>
            <p className="text-on-surface-variant text-xs">{otherUser?.name}</p>
          </div>
        </div>
      </header>

      {/* MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-on-surface-variant/50" />
            </div>
            <p className="text-on-surface-variant text-sm">שלח הודעה ראשונה!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId
          return (
            <div
              key={msg.id}
              className={clsx('flex items-end gap-2', isMe ? 'justify-start' : 'justify-end')}
            >
              <div
                className={clsx(
                  'max-w-[78%] px-4 py-2.5',
                  isMe
                    ? 'bg-primary text-on-primary rounded-2xl rounded-bl-sm'
                    : 'bg-surface-container text-on-surface border border-outline-variant/20 rounded-2xl rounded-br-sm'
                )}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={clsx('text-[10px] mt-1', isMe ? 'text-on-primary/60' : 'text-on-surface-variant')}>
                  {new Date(msg.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div className="flex-shrink-0 bg-surface-container-low/90 backdrop-blur-xl border-t border-outline-variant/20">
        <form
          onSubmit={handleSend}
          className="px-4 py-3 flex items-center gap-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="כתוב הודעה..."
            dir="rtl"
            className="flex-1 bg-surface-container rounded-2xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/30 text-right"
          />
          <button
            type="submit"
            disabled={!text.trim() || sendMessage.isPending}
            className="w-11 h-11 rounded-full bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          >
            <Send className="w-4 h-4 text-on-primary" />
          </button>
        </form>
      </div>

    </div>
  )
}
