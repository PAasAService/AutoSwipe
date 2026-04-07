'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError('שגיאת חיבור. בדוק את החיבור לאינטרנט.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#D4A843] text-center mb-2">שכחתי סיסמה</h1>
        {sent ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-[#2A2A2A]">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-[#F5F5F5] font-semibold text-lg mb-2">בדוק את תיבת הדואר</h2>
            <p className="text-[#888888] text-sm mb-6">
              אם הכתובת רשומה במערכת, שלחנו לך קישור לאיפוס הסיסמה.
            </p>
            <Link href="/login" className="text-[#D4A843] text-sm hover:underline">
              חזור להתחברות
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#1A1A1A] rounded-2xl p-8 border border-[#2A2A2A]">
            <p className="text-[#888888] text-sm text-center mb-6">
              הכנס את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
            </p>
            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-1">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0F0F0F] border border-[#333333] rounded-xl px-4 py-3 text-[#F5F5F5] focus:border-[#D4A843] outline-none text-right"
                placeholder="your@email.com"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4A843] text-[#0F0F0F] font-bold py-3 rounded-xl hover:bg-[#C49733] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
            </button>
            <div className="text-center mt-4">
              <Link href="/login" className="text-[#888888] text-sm hover:text-[#D4A843]">
                חזור להתחברות
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
