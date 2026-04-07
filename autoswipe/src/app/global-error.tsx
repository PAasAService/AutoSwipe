'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <html dir="rtl" lang="he">
      <body style={{ background: '#0F0F0F', color: '#F5F5F5', fontFamily: 'Arial', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#D4A843', fontSize: 24, marginBottom: 16 }}>משהו השתבש</h2>
          <p style={{ color: '#888888', marginBottom: 24 }}>אירעה שגיאה בלתי צפויה</p>
          <button
            onClick={reset}
            style={{ background: '#D4A843', color: '#0F0F0F', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 16 }}
          >
            נסה שוב
          </button>
        </div>
      </body>
    </html>
  )
}
