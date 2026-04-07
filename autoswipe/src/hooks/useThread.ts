import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import toast from 'react-hot-toast'
import type { MessageThread, Message } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ThreadWithMessages extends MessageThread {
  messages: Message[]
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchThread(threadId: string): Promise<ThreadWithMessages> {
  const res = await fetch(`/api/messages/${threadId}`)
  if (!res.ok) throw new Error(String(res.status))
  const { data } = await res.json()
  return data
}

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Returns a message thread with its messages.
 *
 * staleTime: 0           — chat should always show the freshest messages.
 * refetchOnWindowFocus   — picks up messages when user tabs back in.
 * refetchInterval: 30s   — lightweight poll so both parties see new messages
 *                          without needing WebSockets. React Query v5 pauses
 *                          the interval automatically when the tab is hidden
 *                          (refetchIntervalInBackground defaults to false).
 * retry: skip 404        — thread not found → we redirect, no point retrying.
 *
 * The poll is safe with optimistic send: onMutate calls cancelQueries which
 * cancels any in-flight interval-triggered fetch before the optimistic append,
 * and onSettled invalidates to guarantee final consistency.
 */
export function useThread(threadId: string) {
  return useQuery({
    queryKey: queryKeys.thread(threadId),
    queryFn:  () => fetchThread(threadId),
    staleTime: 0,
    gcTime:    5 * 60 * 1_000,
    refetchOnWindowFocus:      true,
    refetchInterval:           30_000,   // poll every 30 s while tab is visible
    refetchIntervalInBackground: false,  // explicit: pause when tab is hidden
    retry: (failureCount, error) => {
      // Thread not found → no point retrying
      if (error instanceof Error && error.message === '404') return false
      return failureCount < 2
    },
  })
}

// ── Mutation ──────────────────────────────────────────────────────────────────

interface SendMessageVars {
  text:          string
  /** Current user ID — needed to render the optimistic bubble on the correct side */
  currentUserId: string
}

/**
 * Sends a message to a thread with an optimistic UI update.
 *
 * Flow:
 *   onMutate  → cancel in-flight refetch, snapshot, append optimistic bubble
 *   onSuccess → replace optimistic bubble with real server message
 *   onError   → roll back to snapshot, restore input text via onError callback
 *   onSettled → invalidate thread to guarantee final consistency
 */
export function useSendMessage(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ text }: SendMessageVars) => {
      const res = await fetch(`/api/messages/${threadId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      return data as Message
    },

    onMutate: async ({ text, currentUserId }: SendMessageVars) => {
      // Stop any in-flight refetch from clobbering our optimistic append
      await queryClient.cancelQueries({ queryKey: queryKeys.thread(threadId) })

      // Snapshot for rollback on error
      const snapshot = queryClient.getQueryData<ThreadWithMessages>(
        queryKeys.thread(threadId),
      )

      const optimisticId = `optimistic-${Date.now()}`

      // Append optimistic message
      queryClient.setQueryData<ThreadWithMessages>(
        queryKeys.thread(threadId),
        (old) => {
          if (!old) return old
          const optimisticMsg: Message = {
            id:        optimisticId,
            threadId,
            senderId:  currentUserId,
            sender:    { id: currentUserId, name: '' },
            text,
            isRead:    false,
            createdAt: new Date().toISOString(),
          }
          return { ...old, messages: [...(old.messages ?? []), optimisticMsg] }
        },
      )

      return { snapshot, optimisticId }
    },

    onSuccess: (newMsg, _vars, context) => {
      // Replace the optimistic bubble with the real server message
      queryClient.setQueryData<ThreadWithMessages>(
        queryKeys.thread(threadId),
        (old) => {
          if (!old) return old
          const messages = old.messages.filter((m) => m.id !== context?.optimisticId)
          return { ...old, messages: [...messages, newMsg] }
        },
      )
    },

    onError: (_err, _vars, context) => {
      // Roll back to snapshot — caller also restores the input text
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(queryKeys.thread(threadId), context.snapshot)
      }
      toast.error('שגיאה בשליחת ההודעה')
    },

    onSettled: () => {
      // Final server sync — catches any edge case where optimistic / real differ
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(threadId) })
    },
  })
}
