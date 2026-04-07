'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, ArrowRight, Car, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import type { UserRole } from '@/types'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleRole = (role: UserRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (name.trim().length < 2) errs.name = 'שם חייב להכיל לפחות 2 תווים'
    if (!email.includes('@')) errs.email = 'כתובת מייל לא תקינה'
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) errs.password = 'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה ומספר'
    if (roles.length === 0) errs.roles = 'יש לבחור לפחות תפקיד אחד'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, roles }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(
            <span>
              המייל הזה כבר רשום.{' '}
              <a href="/login" style={{ textDecoration: 'underline' }}>רוצה להתחבר?</a>
            </span>
          )
        } else if (res.status === 429) {
          toast.error('יותר מדי ניסיונות. נסה שוב מאוחר יותר.')
        } else if (res.status === 400 && data.error) {
          toast.error(data.error)
        } else {
          toast.error(data.error ?? 'שגיאה בהרשמה')
        }
        return
      }

      // Auto sign in
      await signIn('credentials', { email, password, redirect: false })
      toast.success('ברוך הבא ל-AutoSwipe! 🚗')
      router.push('/onboarding')
    } catch {
      toast.error('שגיאת חיבור')
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
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 pt-20 pb-10 gap-6">
        {/* Heading */}
        <div>
          <h1 className="font-headline text-4xl font-bold text-on-surface">הצטרף עכשיו</h1>
          <p className="text-on-surface-variant mt-1">צור חשבון בחינם תוך שניות</p>
        </div>

        {/* Role selector */}
        <div>
          <p className="text-on-surface-variant text-sm mb-3 text-right">אני רוצה...</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { role: 'BUYER' as UserRole, icon: ShoppingBag, label: 'לקנות רכב', sub: 'גלה מכוניות בסוואיפ' },
              { role: 'SELLER' as UserRole, icon: Car, label: 'למכור רכב', sub: 'פרסם מודעה בחינם' },
            ] as const).map(({ role, icon: Icon, label, sub }) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={clsx(
                  'rounded-2xl p-4 flex flex-col items-center gap-2 text-center border-2 transition-all duration-200',
                  roles.includes(role)
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-container border-outline-variant/20 hover:border-outline-variant/50'
                )}
              >
                <Icon
                  className={clsx(
                    'w-8 h-8',
                    roles.includes(role) ? 'text-primary' : 'text-on-surface-variant'
                  )}
                />
                <p
                  className={clsx(
                    'font-bold text-sm',
                    roles.includes(role) ? 'text-primary' : 'text-on-surface'
                  )}
                >
                  {label}
                </p>
                <p className="text-xs text-on-surface-variant">{sub}</p>
              </button>
            ))}
          </div>
          {errors.roles && (
            <p className="text-error text-xs text-right mt-1.5">{errors.roles}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name */}
          <div>
            <label className="text-on-surface-variant text-sm font-medium mb-2 block text-right">
              שם מלא
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ישראל ישראלי"
              autoComplete="name"
              className="w-full bg-surface-container rounded-2xl px-4 py-3.5 text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-right text-sm transition-all"
            />
            {errors.name && (
              <p className="text-error text-xs mt-1.5 text-right">{errors.name}</p>
            )}
          </div>

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
                placeholder="לפחות 8 תווים, אות גדולה ומספר"
                autoComplete="new-password"
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
            יצירת חשבון
          </button>

          {/* Terms */}
          <p className="text-center text-xs text-on-surface-variant">
            בלחיצה על יצירת חשבון אתה מסכים ל
            <Link href="/terms" className="text-primary mx-1 hover:underline">
              תנאי השימוש
            </Link>
            ו
            <Link href="/privacy" className="text-primary mx-1 hover:underline">
              מדיניות הפרטיות
            </Link>
          </p>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-on-surface-variant">
          יש לך חשבון?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            התחברות
          </Link>
        </p>
      </div>
    </main>
  )
}
