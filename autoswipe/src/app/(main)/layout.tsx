import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-md mx-auto relative">
      <main className="flex-1 pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
