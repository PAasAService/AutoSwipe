'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle2, Car, ShoppingBag, Users, Zap, Leaf, Flame, Plug } from 'lucide-react'
import { ISRAELI_CITIES } from '@/lib/constants/cities'
import { CAR_BRANDS_MODELS, VEHICLE_TYPE_HE } from '@/lib/constants/cars'
import { usePreferencesStore } from '@/store/preferences'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import type { VehicleType, FuelType } from '@/types'

const VEHICLE_OPTIONS: VehicleType[] = ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'MINIVAN', 'PICKUP', 'WAGON', 'CROSSOVER']

const VEHICLE_ICONS: Record<VehicleType, string> = {
  SEDAN: '🚗', SUV: '🚙', HATCHBACK: '🚘', COUPE: '🏎️',
  CONVERTIBLE: '🚗', MINIVAN: '🚐', PICKUP: '🛻', WAGON: '🚗', CROSSOVER: '🚙',
}

const FUEL_OPTIONS: { value: FuelType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'GASOLINE',      label: 'בנזין',    icon: Flame,   color: 'text-orange-400' },
  { value: 'HYBRID',        label: 'היברידי',  icon: Leaf,    color: 'text-green-400'  },
  { value: 'ELECTRIC',      label: 'חשמלי',    icon: Zap,     color: 'text-primary'    },
  { value: 'DIESEL',        label: 'דיזל',     icon: Flame,   color: 'text-yellow-600' },
  { value: 'PLUG_IN_HYBRID',label: 'PHEV',     icon: Plug,    color: 'text-blue-400'   },
]

const BUDGET_OPTIONS = [
  { label: 'עד ₪50K',  value: 50_000  },
  { label: 'עד ₪80K',  value: 80_000  },
  { label: 'עד ₪120K', value: 120_000 },
  { label: 'עד ₪150K', value: 150_000 },
  { label: 'עד ₪200K', value: 200_000 },
  { label: 'מעל ₪200K',value: 300_000 },
]

// Most-searched brands in Israel — shown first
const POPULAR_BRANDS = ['Toyota', 'Hyundai', 'Kia', 'Mazda', 'Volkswagen', 'Skoda', 'BMW', 'Honda', 'Nissan', 'Ford']

const RADIUS_OPTIONS = [
  { value: 20,  label: '20 ק"מ', desc: 'אזור מקומי' },
  { value: 50,  label: '50 ק"מ', desc: 'אזורי'       },
  { value: 100, label: '100 ק"מ',desc: 'ארצי'        },
  { value: 200, label: 'כל הארץ',desc: ''            },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const { onboarding, setStep, setRoles, updatePrefs, toggleBrand, toggleModel, toggleVehicleType, toggleFuelType } = usePreferencesStore()
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)
  const [showMoreBrands, setShowMoreBrands] = useState(false)

  const step = onboarding.step ?? 0

  const goNext = () => { setDirection(1); setStep(step + 1) }
  const goBack = () => { setDirection(-1); setStep(step - 1) }

  const handleSellerOnly = async () => {
    setLoading(true)
    try {
      await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roles: ['SELLER'], budgetMax: 200_000,
          preferredBrands: [], preferredModels: [], fuelPreferences: [],
          vehicleTypes: [], location: 'תל אביב', searchRadius: 50, ownershipYears: 3,
        }),
      })
      await updateSession({ isOnboarded: true })
      router.push('/dashboard')
    } catch {
      toast.error('שגיאה בשמירת הפרופיל')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roles: onboarding.roles ?? ['BUYER'],
          budgetMin: 0,
          budgetMax: onboarding.budgetMax ?? 200_000,
          preferredBrands: onboarding.preferredBrands ?? [],
          preferredModels: onboarding.preferredModels ?? [],
          fuelPreferences: onboarding.fuelPreferences ?? [],
          vehicleTypes: onboarding.vehicleTypes ?? [],
          location: onboarding.location || 'תל אביב',
          searchRadius: onboarding.searchRadius ?? 50,
          ownershipYears: 3,
        }),
      })
      if (!res.ok) throw new Error()
      await updateSession({ isOnboarded: true })
      router.push('/swipe')
    } catch {
      toast.error('שגיאה בשמירת ההעדפות')
    } finally {
      setLoading(false)
    }
  }

  const allBrands = Object.keys(CAR_BRANDS_MODELS)
  const otherBrands = allBrands.filter((b) => !POPULAR_BRANDS.includes(b))

  return (
    <main className="min-h-dvh bg-surface-container-lowest flex flex-col overflow-hidden relative" dir="rtl">

      {/* Progress dots — steps 2–4 */}
      {step >= 2 && step <= 4 && (
        <div className="relative z-10 px-6 pt-10 pb-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goBack}
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex gap-2 mx-auto">
              {[2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={clsx(
                    'rounded-full transition-all duration-400',
                    i === step
                      ? 'w-6 h-2 bg-primary'
                      : i < step
                      ? 'w-2 h-2 bg-primary/50'
                      : 'w-2 h-2 bg-outline-variant/30'
                  )}
                />
              ))}
            </div>
            <span className="text-on-surface-variant text-xs opacity-60">{step - 1}/3</span>
          </div>
        </div>
      )}

      {/* Slides */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >

            {/* ── STEP 0: HERO ── */}
            {step === 0 && (
              <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest via-surface-container-lowest to-[#0a0808] pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none" />
                <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-10">
                  <div className="flex items-center justify-center mb-12">
                    <div className="w-56 h-56 rounded-[48px] bg-primary/8 border border-primary/20 flex items-center justify-center text-9xl shadow-[0_0_80px_rgba(242,195,91,0.12)]">
                      🚗
                    </div>
                  </div>
                  <div className="space-y-4 mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                      AutoSwipe
                    </span>
                    <h1 className="font-headline text-5xl font-bold text-on-surface leading-none">
                      מצא את הרכב
                      <span className="text-primary italic block">שחלמת עליו</span>
                    </h1>
                    <p className="text-on-surface-variant text-base leading-relaxed">
                      שאלות קצרות כדי שנציג לך רק את הרכבים שמתאימים לך — לא פחות, לא יותר.
                    </p>
                  </div>
                  <button
                    onClick={goNext}
                    className="w-full h-16 bg-primary text-on-primary font-headline font-bold text-xl rounded-2xl shadow-[0_10px_30px_rgba(242,195,91,0.3)] active:scale-95 transition-all"
                  >
                    בואו נתחיל ←
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 1: ROLE ── */}
            {step === 1 && (
              <div className="flex-1 flex flex-col px-6 pt-16 pb-10">
                <div className="mb-10 text-right">
                  <h2 className="font-headline text-4xl font-bold text-on-surface mb-3">אני רוצה...</h2>
                  <p className="text-on-surface-variant">בחר את הדרך שלך באפליקציה</p>
                </div>
                <div className="space-y-4 flex-1">
                  <button
                    onClick={() => { setRoles(['BUYER']); goNext() }}
                    className="w-full flex items-center gap-5 p-6 rounded-3xl bg-surface-container border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-[0.98] text-right"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-headline text-lg font-bold text-on-surface">לקנות רכב</p>
                      <p className="text-on-surface-variant text-sm mt-1">גלה מכוניות עם סוואיפ חכם</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant rotate-180" />
                  </button>
                  <button
                    onClick={() => { setRoles(['SELLER']); handleSellerOnly() }}
                    disabled={loading}
                    className="w-full flex items-center gap-5 p-6 rounded-3xl bg-surface-container border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-[0.98] text-right disabled:opacity-50"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                      <Car className="w-7 h-7 text-on-surface-variant" />
                    </div>
                    <div className="flex-1">
                      <p className="font-headline text-lg font-bold text-on-surface">למכור רכב</p>
                      <p className="text-on-surface-variant text-sm mt-1">פרסם מודעה בחינם תוך דקות</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant rotate-180" />
                  </button>
                  <button
                    onClick={() => { setRoles(['BUYER', 'SELLER']); goNext() }}
                    className="w-full flex items-center gap-5 p-6 rounded-3xl bg-surface-container border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-[0.98] text-right"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-7 h-7 text-on-surface-variant" />
                    </div>
                    <div className="flex-1">
                      <p className="font-headline text-lg font-bold text-on-surface">גם וגם</p>
                      <p className="text-on-surface-variant text-sm mt-1">לקנות וגם למכור</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: VEHICLE TYPE + FUEL ── */}
            {step === 2 && (
              <div className="flex-1 flex flex-col px-6 pt-2 pb-6 overflow-y-auto">
                <div className="mb-6 text-right">
                  <h2 className="font-headline text-3xl font-bold text-on-surface mb-1">איזה רכב מתאים לך?</h2>
                  <p className="text-on-surface-variant text-sm">זה יעזור לנו לסנן את הפיד שלך</p>
                </div>

                {/* Vehicle types */}
                <p className="text-on-surface text-sm font-semibold mb-3 text-right">סוג רכב</p>
                <div className="grid grid-cols-3 gap-2.5 mb-7">
                  {VEHICLE_OPTIONS.map((type) => {
                    const isSelected = onboarding.vehicleTypes?.includes(type)
                    return (
                      <button
                        key={type}
                        onClick={() => toggleVehicleType(type)}
                        className={clsx(
                          'flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all active:scale-95',
                          isSelected
                            ? 'bg-primary/12 border-primary text-primary'
                            : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
                        )}
                      >
                        <span className="text-2xl">{VEHICLE_ICONS[type]}</span>
                        <span className="text-xs font-semibold">{VEHICLE_TYPE_HE[type]}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Fuel preference */}
                <p className="text-on-surface text-sm font-semibold mb-3 text-right">העדפת דלק</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {FUEL_OPTIONS.map(({ value, label, icon: Icon, color }) => {
                    const isSelected = onboarding.fuelPreferences?.includes(value)
                    return (
                      <button
                        key={value}
                        onClick={() => toggleFuelType(value)}
                        className={clsx(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
                        )}
                      >
                        <Icon className={clsx('w-3.5 h-3.5', isSelected ? 'text-primary' : color)} />
                        {label}
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-3 mt-auto">
                  <button onClick={goNext} className="text-on-surface-variant text-sm font-medium px-5 py-4">
                    דלג
                  </button>
                  <button onClick={goNext} className="flex-1 bg-primary text-on-primary font-bold rounded-2xl py-4">
                    הבא
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: BUDGET + LOCATION ── */}
            {step === 3 && (
              <div className="flex-1 flex flex-col px-6 pt-2 pb-6 overflow-y-auto">
                <div className="mb-6 text-right">
                  <h2 className="font-headline text-3xl font-bold text-on-surface mb-1">תקציב ואזור</h2>
                  <p className="text-on-surface-variant text-sm">נציג רק רכבים שמתאימים לתקציב ולמרחק שלך</p>
                </div>

                {/* Budget */}
                <p className="text-on-surface text-sm font-semibold mb-3 text-right">תקציב מקסימלי</p>
                <div className="grid grid-cols-2 gap-2 mb-7">
                  {BUDGET_OPTIONS.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => updatePrefs({ budgetMax: value })}
                      className={clsx(
                        'py-4 rounded-2xl text-sm font-bold border transition-all active:scale-95',
                        onboarding.budgetMax === value
                          ? 'bg-primary/12 border-primary text-primary'
                          : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* City */}
                <p className="text-on-surface text-sm font-semibold mb-2 text-right">עיר מגורים</p>
                <select
                  value={onboarding.location ?? ''}
                  onChange={(e) => updatePrefs({ location: e.target.value })}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-4 py-3.5 text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-primary/40 mb-6"
                >
                  <option value="">בחר עיר...</option>
                  {ISRAELI_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Radius */}
                <p className="text-on-surface text-sm font-semibold mb-3 text-right">רדיוס חיפוש</p>
                <div className="grid grid-cols-4 gap-2 mb-8">
                  {RADIUS_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updatePrefs({ searchRadius: value })}
                      className={clsx(
                        'py-3 rounded-xl text-xs font-semibold border transition-all active:scale-95 text-center',
                        onboarding.searchRadius === value
                          ? 'bg-primary/12 border-primary text-primary'
                          : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-auto">
                  <button onClick={goNext} className="text-on-surface-variant text-sm font-medium px-5 py-4">
                    דלג
                  </button>
                  <button onClick={goNext} className="flex-1 bg-primary text-on-primary font-bold rounded-2xl py-4">
                    הבא
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: BRANDS + MODELS ── */}
            {step === 4 && (
              <div className="flex-1 flex flex-col px-6 pt-2 pb-6 overflow-y-auto">
                <div className="mb-6 text-right">
                  <h2 className="font-headline text-3xl font-bold text-on-surface mb-1">מותגים מועדפים</h2>
                  <p className="text-on-surface-variant text-sm">לא חובה — ניתן לדלג. ניתן לשנות בכל עת.</p>
                </div>

                {/* Popular brands */}
                <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-3 text-right">
                  מובילים בישראל
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {POPULAR_BRANDS.map((brand) => {
                    const isSelected = onboarding.preferredBrands?.includes(brand)
                    return (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className={clsx(
                          'px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                          isSelected
                            ? 'bg-primary/12 border-primary text-primary'
                            : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
                        )}
                      >
                        {brand}
                      </button>
                    )
                  })}
                </div>

                {/* More brands toggle */}
                <button
                  onClick={() => setShowMoreBrands((v) => !v)}
                  className="text-on-surface-variant text-xs font-medium mb-3 text-right flex items-center gap-1"
                >
                  <ChevronRight className={clsx('w-3.5 h-3.5 transition-transform', showMoreBrands ? '-rotate-90' : 'rotate-90')} />
                  {showMoreBrands ? 'פחות מותגים' : `עוד מותגים (${otherBrands.length})`}
                </button>

                {showMoreBrands && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {otherBrands.map((brand) => {
                      const isSelected = onboarding.preferredBrands?.includes(brand)
                      return (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className={clsx(
                            'px-3 py-2 rounded-xl text-sm font-medium border transition-all',
                            isSelected
                              ? 'bg-primary/12 border-primary text-primary'
                              : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
                          )}
                        >
                          {brand}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Model chips — appear when brands are selected */}
                {(onboarding.preferredBrands?.length ?? 0) > 0 && (
                  <div className="mb-5">
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-3 text-right">
                      דגמים ספציפיים (אופציונלי)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(onboarding.preferredBrands ?? []).flatMap((b) =>
                        (CAR_BRANDS_MODELS[b] ?? []).map((m) => (
                          <button
                            key={`${b}-${m}`}
                            onClick={() => toggleModel(m)}
                            className={clsx(
                              'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
                              onboarding.preferredModels?.includes(m)
                                ? 'bg-surface-container-high border-primary/60 text-primary'
                                : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
                            )}
                          >
                            {b} {m}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-auto">
                  <button onClick={goNext} className="text-on-surface-variant text-sm font-medium px-5 py-4">
                    דלג
                  </button>
                  <button onClick={goNext} className="flex-1 bg-primary text-on-primary font-bold rounded-2xl py-4">
                    הבא
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: DONE ── */}
            {step === 5 && (
              <div className="flex-1 flex flex-col items-center justify-between px-6 pt-16 pb-10">
                <div className="flex flex-col items-center text-center gap-6 w-full">
                  <div className="w-28 h-28 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center shadow-[0_0_60px_rgba(242,195,91,0.2)]">
                    <CheckCircle2 className="w-14 h-14 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-headline text-4xl font-bold text-on-surface mb-3">הפרופיל מוכן!</h2>
                    <p className="text-on-surface-variant text-base">
                      הפיד שלך יהיה מותאם אישית בדיוק בשבילך.
                    </p>
                  </div>

                  {/* Summary card */}
                  <div className="w-full bg-surface-container rounded-2xl divide-y divide-outline-variant/15 border border-outline-variant/20 overflow-hidden text-right">
                    {onboarding.location && (
                      <div className="flex justify-between items-center px-5 py-3.5">
                        <span className="text-primary font-semibold text-sm">{onboarding.location} · {onboarding.searchRadius ?? 50} ק"מ</span>
                        <span className="text-on-surface-variant text-sm">📍 אזור</span>
                      </div>
                    )}
                    {(onboarding.budgetMax ?? 0) > 0 && (
                      <div className="flex justify-between items-center px-5 py-3.5">
                        <span className="text-primary font-semibold text-sm">
                          עד ₪{((onboarding.budgetMax ?? 0) / 1000).toFixed(0)}K
                        </span>
                        <span className="text-on-surface-variant text-sm">💰 תקציב</span>
                      </div>
                    )}
                    {(onboarding.vehicleTypes?.length ?? 0) > 0 && (
                      <div className="flex justify-between items-center px-5 py-3.5">
                        <span className="text-primary font-semibold text-sm">
                          {onboarding.vehicleTypes?.map((t) => VEHICLE_TYPE_HE[t]).slice(0, 3).join(', ')}
                        </span>
                        <span className="text-on-surface-variant text-sm">🚗 סוג רכב</span>
                      </div>
                    )}
                    {(onboarding.fuelPreferences?.length ?? 0) > 0 && (
                      <div className="flex justify-between items-center px-5 py-3.5">
                        <span className="text-primary font-semibold text-sm">
                          {onboarding.fuelPreferences?.slice(0, 3).map((f) => ({
                            GASOLINE: 'בנזין', HYBRID: 'היברידי', ELECTRIC: 'חשמלי', DIESEL: 'דיזל', PLUG_IN_HYBRID: 'PHEV'
                          }[f] ?? f)).join(', ')}
                        </span>
                        <span className="text-on-surface-variant text-sm">⛽ דלק</span>
                      </div>
                    )}
                    {(onboarding.preferredBrands?.length ?? 0) > 0 && (
                      <div className="flex justify-between items-center px-5 py-3.5">
                        <span className="text-primary font-semibold text-sm">
                          {onboarding.preferredBrands?.slice(0, 3).join(', ')}
                          {(onboarding.preferredBrands?.length ?? 0) > 3 ? ` +${(onboarding.preferredBrands?.length ?? 0) - 3}` : ''}
                        </span>
                        <span className="text-on-surface-variant text-sm">⭐ מותגים</span>
                      </div>
                    )}
                  </div>

                  <p className="text-on-surface-variant text-xs opacity-70">
                    ניתן לשנות את כל ההעדפות בכל עת מתפריט ההגדרות
                  </p>
                </div>

                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full bg-primary text-on-primary font-headline font-bold text-xl rounded-2xl py-5 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(242,195,91,0.3)] disabled:opacity-50 active:scale-95 transition-all"
                >
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : null}
                  בוא נגלה רכבים 🚗
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
