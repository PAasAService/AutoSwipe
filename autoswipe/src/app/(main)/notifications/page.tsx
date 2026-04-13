'use client'

import Link from 'next/link'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import clsx from 'clsx'
import type { NotificationsListResponse } from '@/types/notifications'
import { listingPageHref } from '@/lib/notifications/listing-link'
import {
  patchNotificationsMarkRead,
  invalidateNotificationQueries,
} from '@/lib/notifications/mark-read-client'

type PageData = NotificationsListResponse['data']

async function fetchPage(cursor: string | null): Promise<PageData> {
  const q = cursor
    ? `?limit=20&cursor=${encodeURIComponent(cursor)}`
    : '?limit=20'
  const res = await fetch(`/api/notifications${q}`)
  if (!res.ok) throw new Error('Failed to load')
  const json = (await res.json()) as NotificationsListResponse
  return json.data
}

export default function NotificationsInboxPage() {
  const queryClient = useQueryClient()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['notifications-inbox'],
      queryFn: ({ pageParam }) => fetchPage(pageParam ?? null),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    })

  const items = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-28" dir="rtl">
      <div className="bg-surface-container-low px-5 pt-safe-area-inset-top pb-4 border-b border-outline-variant/20">
        <div className="pt-4 flex items-center justify-between">
          <Link
            href="/swipe"
            className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm"
          >
            <span>גלילה</span>
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Link>
          <h1 className="text-lg font-bold text-on-surface">כל ההתראות</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLoading && (
          <p className="text-center text-on-surface-variant py-12">טוען…</p>
        )}
        {isError && (
          <p className="text-center text-red-400 py-12">שגיאה בטעינת ההתראות</p>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <p className="text-center text-on-surface-variant py-12">אין התראות עדיין</p>
        )}
        <ul className="space-y-2">
          {items.map((n) => {
            const href = listingPageHref(n.type, n.data)
            const cardClass = clsx(
              'block w-full rounded-2xl border border-outline-variant/20 bg-surface-container p-4 text-right transition-colors cursor-pointer hover:bg-primary/10',
              !n.readAt && 'border-primary/30 bg-primary/5',
            )
            const inner = (
              <>
                <p className="font-semibold text-on-surface text-right">{n.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant text-right">{n.body}</p>
                <p className="mt-2 text-xs text-text-muted text-left" dir="ltr">
                  {formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                    locale: he,
                  })}
                </p>
              </>
            )
            const markThisRead = () => {
              if (!n.readAt) {
                void patchNotificationsMarkRead([n.id]).then(() =>
                  invalidateNotificationQueries(queryClient),
                )
              }
            }
            return (
              <li key={n.id}>
                {href ? (
                  <Link
                    href={href}
                    className={cardClass}
                    onClick={() => {
                      markThisRead()
                    }}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={cardClass}
                    onClick={() => {
                      markThisRead()
                    }}
                  >
                    {inner}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mt-6 mb-8 w-full rounded-xl border border-outline-variant/30 py-3 text-sm font-medium text-accent hover:bg-primary/10 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'טוען…' : 'טען עוד'}
          </button>
        )}
      </div>
    </div>
  )
}
