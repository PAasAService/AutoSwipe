'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const SLIDES = [
  {
    id: 0,
    emoji: '🚗',
    tag: 'גלה',
    title: 'גלה את הרכב\nהבא שלך',
    subtitle: 'אלפי רכבים פרטיים בישראל. סוואיפ ימינה להצלה, שמאלה לדלג.',
    accent: '#f2c35b',
  },
  {
    id: 1,
    emoji: '⚡',
    tag: 'חכם',
    title: 'המלצות\nמותאמות אישית',
    subtitle: 'האלגוריתם שלנו לומד מהסוואיפים שלך ומציג רכבים שמתאימים לתקציב ולטעם.',
    accent: '#a78bfa',
  },
  {
    id: 2,
    emoji: '✅',
    tag: 'חינם',
    title: 'אפס עמלות\nרק אנשים פרטיים',
    subtitle: 'ללא דמי תיווך, ללא עמלות. קנה ומכור ישירות — המחיר שרואים הוא המחיר.',
    accent: '#34d399',
  },
]

export default function SplashPage() {
  const [slide, setSlide] = useState(0)
  const [direction, setDirection] = useState(1)
  const router = useRouter()

  // Auto-advance
  useEffect(() => {
    const t = setTimeout(() => {
      if (slide < SLIDES.length - 1) {
        setDirection(1)
        setSlide((s) => s + 1)
      }
    }, 3500)
    return () => clearTimeout(t)
  }, [slide])

  const goTo = (i: number) => {
    setDirection(i > slide ? 1 : -1)
    setSlide(i)
  }

  const current = SLIDES[slide]

  return (
    <main className="min-h-dvh bg-background flex flex-col overflow-hidden relative" dir="rtl">
      {/* Background glow that changes per slide */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${current.accent}12 0%, transparent 70%)`,
        }}
      />

      {/* Skip / Login button */}
      <div className="relative z-10 flex justify-between items-center px-6 pt-12 pb-2">
        <Link href="/login" className="text-on-surface-variant text-sm font-medium">
          כניסה
        </Link>
        {slide < SLIDES.length - 1 && (
          <button
            onClick={() => { setDirection(1); setSlide(SLIDES.length - 1) }}
            className="text-on-surface-variant text-sm font-medium"
          >
            דלג
          </button>
        )}
      </div>

      {/* Slides */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Illustration circle */}
            <div
              className="w-48 h-48 rounded-[40px] flex items-center justify-center mb-10 text-7xl shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${current.accent}20, ${current.accent}08)`,
                border: `1px solid ${current.accent}30`,
                boxShadow: `0 0 60px ${current.accent}15`,
              }}
            >
              {current.emoji}
            </div>

            {/* Tag pill */}
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{
                background: `${current.accent}15`,
                color: current.accent,
                border: `1px solid ${current.accent}30`,
              }}
            >
              {current.tag}
            </span>

            {/* Title */}
            <h1 className="font-headline text-4xl font-bold text-on-surface leading-tight mb-4 whitespace-pre-line">
              {current.title}
            </h1>

            {/* Subtitle */}
            <p className="text-on-surface-variant text-base leading-relaxed max-w-xs">
              {current.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="relative z-10 px-6 pb-12 flex flex-col gap-5">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                width: i === slide ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === slide ? current.accent : '#4e4636',
              }}
            />
          ))}
        </div>

        {/* CTA */}
        {slide === SLIDES.length - 1 ? (
          <Link
            href="/signup"
            className="flex items-center justify-center w-full h-16 rounded-2xl font-headline font-bold text-lg shadow-2xl active:scale-95 transition-all"
            style={{
              background: current.accent,
              color: '#1a1200',
              boxShadow: `0 10px 30px ${current.accent}35`,
            }}
          >
            בואו נתחיל ←
          </Link>
        ) : (
          <button
            onClick={() => { setDirection(1); setSlide((s) => s + 1) }}
            className="flex items-center justify-center w-full h-16 bg-surface-container border border-outline-variant/20 rounded-2xl font-bold text-on-surface text-base active:scale-95 transition-all"
          >
            הבא
          </button>
        )}

        <Link
          href="/login"
          className="text-center text-on-surface-variant text-sm"
        >
          כבר יש לי חשבון · <span className="text-primary font-semibold">כניסה</span>
        </Link>
      </div>
    </main>
  )
}
