'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-consent')
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="הסכמה לשימוש בעוגיות"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] border-t border-[#2A2A2A] p-4 md:p-6"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4">
        <p className="text-[#888888] text-sm flex-1 text-right">
          אנו משתמשים בעוגיות כדי לשפר את חווית השימוש שלך.{' '}
          <Link href="/privacy" className="text-[#D4A843] underline hover:no-underline">
            מדיניות הפרטיות
          </Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-[#888888] border border-[#333333] rounded-lg hover:border-[#555555] transition-colors"
          >
            דחה
          </button>
          <button
            onClick={accept}
            className="px-6 py-2 text-sm font-semibold bg-[#D4A843] text-[#0F0F0F] rounded-lg hover:bg-[#C49733] transition-colors"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  )
}
