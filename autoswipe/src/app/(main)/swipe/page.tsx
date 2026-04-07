import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { SwipeDeck } from '@/components/swipe/SwipeDeck'
import { Settings2, Bell } from 'lucide-react'
import Link from 'next/link'

export default async function SwipePage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (!user.isOnboarded) redirect('/onboarding')

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)]" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <Link href="/settings" aria-label="הגדרות">
          <Settings2 className="w-6 h-6 text-text-muted hover:text-text-secondary transition-colors" />
        </Link>
        <span className="text-accent font-black text-xl tracking-tight">AutoSwipe</span>
        <Link href="/settings/notifications" aria-label="התראות">
          <Bell className="w-6 h-6 text-text-muted hover:text-text-secondary transition-colors" />
        </Link>
      </header>

      {/* Swipe deck — takes remaining height */}
      <div className="flex-1 min-h-0">
        <SwipeDeck userId={session.user.id!} />
      </div>
    </div>
  )
}
