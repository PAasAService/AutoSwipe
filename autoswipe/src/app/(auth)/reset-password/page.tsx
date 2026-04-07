'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) { setError('הסיסמה חייבת להכיל לפחות 8 תווים'); return }
    if (!/[A-Z]/.test(password)) { setError('הסיסמה חייבת להכיל לפחות אות גדולה אחת'); return }
    if (!/[0-9]/.test(password)) { setError('הסיסמה חייבת להכיל לפחות ספרה אחת'); return }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'שגיאת שרת'); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('שגיאת חיבור')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400">קישור לא תקף</p>
        <Link href="/forgot-password" className="text-[#D4A843] text-sm mt-4 inline-block hover:underline">בקש קישור חדש</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1A1A1A] rounded-2xl p-8 border border-[#2A2A2A]">
      {done ? (
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-[#F5F5F5] font-semibold text-lg mb-2">הסיסמה אופסה בהצלחה</h2>
          <p className="text-[#888888] text-sm">מועבר להתחברות...</p>
        </div>
      ) : (
        <>
          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
          <div className="mb-4">
            <label className="block text-[#888888] text-sm mb-1">סיסמה חדשה</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-[#0F0F0F] border border-[#333333] rounded-xl px-4 py-3 text-[#F5F5F5] focus:border-[#D4A843] outline-none"
              placeholder="לפחות 8 תווים, אות גדולה ומספר" />
          </div>
          <div className="mb-6">
            <label className="block text-[#888888] text-sm mb-1">אימות סיסמה</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              className="w-full bg-[#0F0F0F] border border-[#333333] rounded-xl px-4 py-3 text-[#F5F5F5] focus:border-[#D4A843] outline-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#D4A843] text-[#0F0F0F] font-bold py-3 rounded-xl hover:bg-[#C49733] transition-colors disabled:opacity-50">
            {loading ? 'מאפס...' : 'אפס סיסמה'}
          </button>
        </>
      )}
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#D4A843] text-center mb-6">איפוס סיסמה</h1>
        <Suspense fallback={<div className="text-center text-[#888888]">טוען...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
