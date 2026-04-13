import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { SwipeDeck } from '@/components/swipe/SwipeDeck'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Settings2 } from 'lucide-react'
import Link from 'next/link'

export default async function SwipePage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (!user.isOnboarded) redirect('/onboarding')

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)]" dir="rtl">
      {/* Header — bell physical top-left; settings physical top-right */}
      <header className="relative flex items-center justify-center px-5 py-4 flex-shrink-0 min-h-[56px]">
        <NotificationBell className="absolute left-5 top-1/2 -translate-y-1/2 z-10" />
        <span className="text-accent font-black text-xl tracking-tight">AutoSwipe</span>
        <Link
          href="/settings"
          aria-label="הגדרות"
          className="absolute right-5 top-1/2 -translate-y-1/2"
        >
          <Settings2 className="w-6 h-6 text-text-muted hover:text-text-secondary transition-colors" />
        </Link>
      </header>

      {/* Swipe deck — takes remaining height */}
      <div className="flex-1 min-h-0">
        <SwipeDeck userId={session.user.id!} />
      </div>
    </div>
  )
}
