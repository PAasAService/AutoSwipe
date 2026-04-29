'use client'

import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/lib/query-client'
import { ServiceWorkerProvider } from './providers/ServiceWorkerProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  // useState(() => ...) ensures the client is created once on mount,
  // not recreated on every render.
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ServiceWorkerProvider />
        {children}
      </SessionProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
