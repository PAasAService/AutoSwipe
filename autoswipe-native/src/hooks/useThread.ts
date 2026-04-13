import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import { Message, MessageThread } from '../types'

export interface ThreadWithMessages extends MessageThread {
  messages: Message[]
}

interface ThreadResponse {
  thread: ThreadWithMessages
  messages: Message[]
}

export function useThread(threadId: string) {
  return useQuery({
    queryKey: queryKeys.thread(threadId),
    queryFn: () =>
      api.get<{ data: ThreadWithMessages }>(`/api/messages/${threadId}`).then((r) => ({
        thread: r.data,
        messages: r.data.messages ?? [],
      })),
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function useThreads() {
  return useQuery({
    queryKey: queryKeys.threads(),
    queryFn: () =>
      api.get<{ data: MessageThread[] }>('/api/messages').then((r) => r.data),
    staleTime: 1000 * 30,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function useSendMessage(threadId: string, currentUserId?: string) {
  const qc = useQueryClient()
  const queryKey = queryKeys.thread(threadId)

  return useMutation({
    mutationFn: (text: string) =>
      api.post<{ data: Message }>(`/api/messages/${threadId}`, { text }).then((r) => r.data ?? r),

    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey })
      const snapshot = qc.getQueryData<ThreadResponse>(queryKey)

      if (snapshot) {
        // Use the real user id so MessageBubble's isMe check (senderId === me?.id)
        // renders the optimistic message on the correct side immediately.
        const optimisticMessage: Message = {
          id: `optimistic-${Date.now()}`,
          threadId,
          senderId: currentUserId ?? 'optimistic',
          sender: { id: currentUserId ?? 'optimistic', name: '' },
          text,
          isRead: false,
          createdAt: new Date().toISOString(),
        }
        qc.setQueryData<ThreadResponse>(queryKey, {
          ...snapshot,
          messages: [...snapshot.messages, optimisticMessage],
        })
      }

      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        qc.setQueryData(queryKey, context.snapshot)
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })
}

/**
 * Seller activates a pending thread → moves it from "Pending Chats" to "Active Chats".
 * Calls PATCH /api/messages/[threadId]
 */
export function useStartConversation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (threadId: string) =>
      api.patch<{ data: { ok: boolean } }>(`/api/messages/${threadId}`, {}),

    onSuccess: () => {
      // Refresh the thread list so the thread moves from pending → active
      qc.invalidateQueries({ queryKey: queryKeys.threads() })
    },
  })
}
