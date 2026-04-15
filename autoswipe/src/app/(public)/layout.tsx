import { Metadata } from 'next'

/**
 * Public layout — NO authentication required.
 * Used for publicly shareable pages like listing views.
 */
export const metadata: Metadata = {
  robots: 'index, follow',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-md mx-auto relative">
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
