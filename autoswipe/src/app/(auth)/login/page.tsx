'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, ArrowRight, Car } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const errs: typeof errors = {}
    if (!email.includes('@')) errs.email = 'כתובת מייל לא תקינה'
    if (password.length < 6) errs.password = 'סיסמה חייבת להכיל לפחות 6 תווים'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'USER_NOT_FOUND') {
          toast.error('המייל לא רשום במערכת')
        } else if (result.error === 'INVALID_PASSWORD') {
          toast.error('הסיסמה שגויה')
        } else if (result.error === 'TOO_MANY_REQUESTS') {
          toast.error('יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.')
        } else {
          toast.error('פרטי התחברות שגויים')
        }
        return
      }

      // Redirect based on onboarding status
      router.push('/swipe')
      router.refresh()
    } catch {
      toast.error('שגיאת חיבור. בדוק את החיבור לאינטרנט.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-surface-container-lowest flex flex-col" dir="rtl">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
      </Link>

      {/* Center content */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 gap-8">
        {/* Logo + heading */}
        <div>
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-5">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-headline text-4xl font-bold text-on-surface">ברוך הבא</h1>
          <p className="text-on-surface-variant text-base mt-2">התחבר לחשבון AutoSwipe שלך</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-on-surface-variant text-sm font-medium mb-2 block text-right">
              כתובת מייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full bg-surface-container rounded-2xl px-4 py-3.5 text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-right text-sm transition-all"
            />
            {errors.email && (
              <p className="text-error text-xs mt-1.5 text-right">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-on-surface-variant text-sm font-medium mb-2 block text-right">
              סיסמה
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                autoComplete="current-password"
                className="w-full bg-surface-container rounded-2xl px-4 py-3.5 pr-12 text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-right text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-error text-xs mt-1.5 text-right">{errors.password}</p>
            )}
          </div>

          {/* Forgot password */}
          <div className="text-left">
            <Link href="/forgot-password" className="text-primary text-sm hover:underline">
              שכחת סיסמה?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold rounded-2xl py-4 text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity"
          >
            {loading ? (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : null}
            התחברות
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px border-t border-outline-variant/30" />
          <span className="text-on-surface-variant text-sm">או</span>
          <div className="flex-1 h-px border-t border-outline-variant/30" />
        </div>

        {/* Sign up link */}
        <Link
          href="/signup"
          className="w-full border border-outline-variant/40 text-on-surface font-semibold rounded-2xl py-4 text-sm text-center block hover:bg-surface-container transition-colors"
        >
          הצטרף עכשיו — בחינם
        </Link>
      </div>
    </main>
  )
}
