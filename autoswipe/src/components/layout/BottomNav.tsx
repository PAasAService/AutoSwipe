'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Heart, MessageCircle, PlusCircle, User } from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/swipe', icon: Car, label: 'גלה' },
  { href: '/favorites', icon: Heart, label: 'שמורים' },
  { href: '/messages', icon: MessageCircle, label: 'הודעות' },
  { href: '/listing/create', icon: PlusCircle, label: 'מכור' },
  { href: '/settings', icon: User, label: 'פרופיל' },
]

interface BottomNavProps {
  unreadMessages?: number
}

export function BottomNav({ unreadMessages = 0 }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50">
      <div className="bg-surface-container-highest/90 backdrop-blur-xl rounded-xl py-3 px-4 flex items-center justify-between shadow-2xl border border-outline-variant/20">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/listing/create' && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="relative">
                <Icon
                  className={clsx(
                    'w-6 h-6 transition-all duration-200',
                    isActive
                      ? 'text-primary drop-shadow-[0_0_8px_rgba(242,195,91,0.5)]'
                      : 'text-on-surface-variant group-hover:text-on-surface'
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  fill={isActive ? 'currentColor' : 'none'}
                />
                {href === '/messages' && unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-highest" />
                )}
              </div>
              <span className={clsx(
                'text-[10px] font-bold transition-colors',
                isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
              )}>
                {label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
