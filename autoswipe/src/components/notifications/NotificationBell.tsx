'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import clsx from 'clsx'
import type { NotificationsListResponse } from '@/types/notifications'
import { listingPageHref } from '@/lib/notifications/listing-link'
import {
  patchNotificationsMarkRead,
  invalidateNotificationQueries,
} from '@/lib/notifications/mark-read-client'

async function fetchPreview(): Promise<NotificationsListResponse['data']> {
  const res = await fetch('/api/notifications?limit=5')
  if (!res.ok) throw new Error('Failed to load notifications')
  const json = (await res.json()) as NotificationsListResponse
  return json.data
}

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: fetchPreview,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const unreadCount = data?.unreadCount ?? 0
  const items = data?.items ?? []

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] })
    }
  }, [open, queryClient])

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <button
        type="button"
        aria-label="התראות"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-1 text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background"
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2.5rem),20rem)] rounded-xl border border-outline-variant/30 bg-surface-container-high shadow-lg overflow-hidden"
          dir="rtl"
        >
          <div className="max-h-72 overflow-y-auto">
            {isLoading && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">טוען…</p>
            )}
            {isError && (
              <p className="px-4 py-6 text-center text-sm text-red-400">שגיאה בטעינה</p>
            )}
            {!isLoading && !isError && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">אין התראות</p>
            )}
            {!isLoading &&
              !isError &&
              items.map((n) => {
                const href = listingPageHref(n.type, n.data)
                const inner = (
                  <>
                    <p className="text-sm font-semibold text-on-surface text-right">{n.title}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant text-right line-clamp-2">
                      {n.body}
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted text-left" dir="ltr">
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
                return href ? (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => {
                      markThisRead()
                      close()
                    }}
                    className={clsx(
                      'block border-b border-outline-variant/20 px-4 py-3 last:border-0 transition-colors hover:bg-primary/10',
                      !n.readAt && 'bg-primary/5',
                    )}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markThisRead()
                    }}
                    className={clsx(
                      'w-full text-right border-b border-outline-variant/20 px-4 py-3 last:border-0',
                      !n.readAt && 'bg-primary/5',
                    )}
                  >
                    {inner}
                  </button>
                )
              })}
          </div>
          <div className="border-t border-outline-variant/20 p-2">
            <Link
              href="/notifications"
              onClick={close}
              className="block w-full rounded-lg py-2.5 text-center text-sm font-semibold text-accent hover:bg-primary/10 transition-colors"
            >
              כל ההתראות
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
