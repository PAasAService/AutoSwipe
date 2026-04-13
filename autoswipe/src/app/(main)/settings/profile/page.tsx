'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { USER_DISPLAY_NAME_TAKEN_CODE } from '@/lib/user-display-name'

export default function EditProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((j) => {
        const u = j.data
        if (u) {
          setName(u.name ?? '')
          setPhone(u.phone ?? '')
        }
      })
      .catch(() => toast.error('שגיאה בטעינת הפרופיל'))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    if (!name.trim()) {
      toast.error('שם תצוגה הוא שדה חובה')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 409 && json.code === USER_DISPLAY_NAME_TAKEN_CODE) {
          toast.error(json.error ?? 'שם התצוגה תפוס')
          return
        }
        throw new Error(json.message || json.error || 'שגיאה')
      }
      toast.success('הפרופיל עודכן')
      router.push('/settings')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center pb-28" dir="rtl">
        <p className="text-on-surface-variant">טוען…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-28" dir="rtl">
      <div className="bg-surface-container-low px-5 pt-safe-area-inset-top pb-5 border-b border-outline-variant/20">
        <div className="pt-6 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <Link
              href="/settings"
              className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors text-sm"
            >
              <ChevronRight className="w-4 h-4" />
              <span>הגדרות</span>
            </Link>
          </div>
        </div>
        <h1 className="text-center font-headline text-2xl font-bold text-on-surface mt-4">עריכת פרופיל</h1>
        <p className="text-center text-on-surface-variant text-sm mt-1">שם תצוגה ייחודי, טלפון</p>
      </div>

      <div className="px-4 pt-6 space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-on-surface-variant text-sm mb-1.5 text-right">שם תצוגה</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface text-right"
            placeholder="השם שיוצג לאחרים"
          />
          <p className="text-xs text-on-surface-variant mt-1.5 text-right">השם חייב להיות ייחודי במערכת</p>
        </div>
        <div>
          <label className="block text-on-surface-variant text-sm mb-1.5 text-right">טלפון (אופציונלי)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface text-right"
            placeholder="050-0000000"
            dir="ltr"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl disabled:opacity-50 mt-4"
        >
          {saving ? 'שומר…' : 'שמור'}
        </button>
      </div>
    </div>
  )
}
