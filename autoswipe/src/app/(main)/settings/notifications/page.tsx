'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Bell } from 'lucide-react'

const STORAGE_KEY = 'notif_prefs'

interface NotifPrefs {
  priceDrop: boolean
  newCars: boolean
  newMessages: boolean
}

const defaultPrefs: NotifPrefs = {
  priceDrop: true,
  newCars: true,
  newMessages: true,
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={[
        'relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
        checked ? 'bg-primary' : 'bg-surface-container-high',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

function SoonBadge() {
  return (
    <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
      בקרוב
    </span>
  )
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPrefs({ ...defaultPrefs, ...JSON.parse(stored) })
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  function toggle(key: keyof NotifPrefs) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-28" dir="rtl">
      {/* Header */}
      <div className="bg-surface-container-low px-5 pt-safe-area-inset-top pb-5">
        <div className="pt-6 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
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
        <div className="text-center mt-4">
          <h1 className="font-headline text-2xl font-bold text-on-surface">התראות</h1>
          <p className="text-on-surface-variant text-sm mt-1">נהל את ההתראות שלך</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* App notifications */}
        <div>
          <h3 className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2 text-right px-1">
            התראות אפליקציה
          </h3>
          <div className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/20 divide-y divide-outline-variant/20">
            <NotifRow
              label="מחירים ירדו"
              description="כאשר מחיר רכב ששמרת יורד"
              checked={prefs.priceDrop}
              onToggle={() => toggle('priceDrop')}
            />
            <NotifRow
              label="רכבים חדשים"
              description="רכבים חדשים שמתאימים להעדפותיך"
              checked={prefs.newCars}
              onToggle={() => toggle('newCars')}
            />
            <NotifRow
              label="הודעות חדשות"
              description="הודעות צ׳אט חדשות ממוכרים"
              checked={prefs.newMessages}
              onToggle={() => toggle('newMessages')}
            />
          </div>
        </div>

        {/* Future */}
        <div>
          <h3 className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2 text-right px-1">
            עתידי
          </h3>
          <div className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/20 divide-y divide-outline-variant/20">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <Toggle checked={false} onChange={() => {}} disabled />
                <SoonBadge />
              </div>
              <div className="text-right">
                <p className="text-on-surface text-sm">התראות דוא&quot;ל</p>
                <p className="text-on-surface-variant text-xs mt-0.5">עדכונים לכתובת המייל שלך</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <Toggle checked={false} onChange={() => {}} disabled />
                <SoonBadge />
              </div>
              <div className="text-right">
                <p className="text-on-surface text-sm">WhatsApp</p>
                <p className="text-on-surface-variant text-xs mt-0.5">התראות ישירות לוואטסאפ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotifRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <Toggle checked={checked} onChange={onToggle} />
      <div className="text-right">
        <p className="text-on-surface text-sm">{label}</p>
        <p className="text-on-surface-variant text-xs mt-0.5">{description}</p>
      </div>
    </div>
  )
}
