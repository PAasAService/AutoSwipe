'use client'

import { useState, useEffect } from 'react'
import { Accessibility, X } from 'lucide-react'

type FontSize = 0 | 1 | 2  // 0=normal, 1=large, 2=x-large

type A11ySettings = {
  highContrast: boolean
  grayscale: boolean
  reduceMotion: boolean
  underlineLinks: boolean
  fontSize: FontSize
}

const DEFAULT_SETTINGS: A11ySettings = {
  highContrast: false,
  grayscale: false,
  reduceMotion: false,
  underlineLinks: false,
  fontSize: 0,
}

const STORAGE_KEY = 'autoswipe-a11y'

const FONT_SIZE_LABELS = ['רגיל', 'גדול', 'גדול מאוד']

function applyClasses(settings: A11ySettings) {
  const html = document.documentElement
  html.classList.toggle('a11y-high-contrast', settings.highContrast)
  html.classList.toggle('a11y-grayscale', settings.grayscale)
  html.classList.toggle('a11y-reduce-motion', settings.reduceMotion)
  html.classList.toggle('a11y-underline-links', settings.underlineLinks)
  html.classList.remove('a11y-text-lg', 'a11y-text-xl')
  if (settings.fontSize === 1) html.classList.add('a11y-text-lg')
  if (settings.fontSize === 2) html.classList.add('a11y-text-xl')
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS)

  // Restore saved settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: A11ySettings = JSON.parse(raw)
        setSettings(parsed)
        applyClasses(parsed)
      }
    } catch {
      // ignore corrupt storage
    }
  }, [])

  const update = (updates: Partial<A11ySettings>) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    applyClasses(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }

  const reset = () => {
    update(DEFAULT_SETTINGS)
  }

  const toggles: { key: keyof A11ySettings; label: string; icon: string }[] = [
    { key: 'highContrast', label: 'ניגודיות גבוהה', icon: '◐' },
    { key: 'grayscale', label: 'גווני אפור', icon: '⬛' },
    { key: 'reduceMotion', label: 'הפחת אנימציות', icon: '⏸' },
    { key: 'underlineLinks', label: 'קו תחתון לקישורים', icon: 'A̲' },
  ]

  return (
    <>
      {/* Floating accessibility button — bottom-left (IS 5568 requirement) */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        title="נגישות"
        className="fixed bottom-24 left-4 z-50 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Accessibility className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Accessibility panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="הגדרות נגישות"
            dir="rtl"
            className="fixed bottom-40 left-4 z-50 w-72 bg-surface-container rounded-3xl border border-outline-variant/30 shadow-2xl p-5 text-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setOpen(false)}
                aria-label="סגור תפריט נגישות"
                className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-outline-variant/30 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-on-surface text-sm">הגדרות נגישות</h2>
                <Accessibility className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-3">
              {/* Font size control */}
              <div>
                <p className="text-xs text-on-surface-variant mb-2 font-medium">גודל טקסט</p>
                <div
                  role="group"
                  aria-label="גודל טקסט"
                  className="flex items-center bg-surface-container-high rounded-2xl p-1 gap-1"
                >
                  <button
                    onClick={() => update({ fontSize: Math.max(0, settings.fontSize - 1) as FontSize })}
                    disabled={settings.fontSize === 0}
                    aria-label="הקטן גודל טקסט"
                    className="flex-1 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant disabled:opacity-35 transition-all hover:bg-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-bold"
                  >
                    A-
                  </button>
                  <span
                    aria-live="polite"
                    aria-label={`גודל טקסט נוכחי: ${FONT_SIZE_LABELS[settings.fontSize]}`}
                    className="flex-1 text-center text-on-surface text-xs font-semibold"
                  >
                    {FONT_SIZE_LABELS[settings.fontSize]}
                  </span>
                  <button
                    onClick={() => update({ fontSize: Math.min(2, settings.fontSize + 1) as FontSize })}
                    disabled={settings.fontSize === 2}
                    aria-label="הגדל גודל טקסט"
                    className="flex-1 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant disabled:opacity-35 transition-all hover:bg-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-bold"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Toggle buttons */}
              {toggles.map(({ key, label, icon }) => {
                const isOn = !!settings[key]
                return (
                  <button
                    key={key}
                    onClick={() => update({ [key]: !isOn })}
                    role="switch"
                    aria-checked={isOn}
                    aria-label={label}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      isOn
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50'
                    }`}
                  >
                    {/* Toggle pill */}
                    <div
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                        isOn ? 'bg-primary' : 'bg-outline-variant/40'
                      }`}
                      aria-hidden="true"
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          isOn ? 'left-[18px]' : 'left-0.5'
                        }`}
                      />
                    </div>
                    {/* Label */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-base leading-none" aria-hidden="true">{icon}</span>
                    </div>
                  </button>
                )
              })}

              {/* Reset */}
              <button
                onClick={reset}
                className="w-full text-center text-xs text-on-surface-variant py-2 hover:text-on-surface transition-colors underline"
              >
                איפוס כל ההגדרות
              </button>
            </div>

            {/* Compliance note */}
            <p className="text-[10px] text-on-surface-variant/40 text-center mt-4 leading-relaxed">
              כלי זה עומד בתקן ישראלי 5568 ו-WCAG 2.1
            </p>
          </div>
        </>
      )}
    </>
  )
}
