'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import posthog from 'posthog-js'

function Tracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    posthog.capture('$pageview', { $current_url: window.location.href })
  }, [pathname, searchParams])
  return null
}

export default function PageViewTracker() {
  return <Suspense fallback={null}><Tracker /></Suspense>
}
