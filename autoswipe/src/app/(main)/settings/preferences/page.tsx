'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Check, MapPin, Wallet, Car, Zap, Star } from 'lucide-react'
import { ISRAELI_CITIES } from '@/lib/constants/cities'
import { CAR_BRANDS_MODELS, VEHICLE_TYPE_HE, FUEL_TYPE_HE } from '@/lib/constants/cars'
import { useResetFeed } from '@/hooks/useRecommendations'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import type { VehicleType, FuelType } from '@/types'

const VEHICLE_OPTIONS: VehicleType[] = [
  'SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'MINIVAN', 'PICKUP', 'WAGON', 'CROSSOVER',
]
const VEHICLE_ICONS: Record<VehicleType, string> = {
  SEDAN: '🚗', SUV: '🚙', HATCHBACK: '🚘', COUPE: '🏎️',
  CONVERTIBLE: '🚗', MINIVAN: '🚐', PICKUP: '🛻', WAGON: '🚗', CROSSOVER: '🚙',
}
const BUDGET_OPTIONS = [
  { label: 'עד ₪50K',   value: 50_000  },
  { label: 'עד ₪80K',   value: 80_000  },
  { label: 'עד ₪120K',  value: 120_000 },
  { label: 'עד ₪150K',  value: 150_000 },
  { label: 'עד ₪200K',  value: 200_000 },
  { label: 'מעל ₪200K', value: 300_000 },
]
const RADIUS_OPTIONS = [20, 50, 100, 200]
const POPULAR_BRANDS = ['Toyota', 'Hyundai', 'Kia', 'Mazda', 'Volkswagen', 'Skoda', 'BMW', 'Honda', 'Nissan', 'Ford']

type Section = 'vehicle' | 'fuel' | 'budget' | 'location' | 'brands'

type PrefsState = {
  budgetMax: number
  budgetMin: number
  preferredBrands: string[]
  preferredModels: string[]
  vehicleTypes: VehicleType[]
  fuelPreferences: FuelType[]
  location: string
  searchRadius: number
  ownershipYears: number
}

const DEFAULT_PREFS: PrefsState = {
  budgetMax: 200_000, budgetMin: 0,
  preferredBrands: [], preferredModels: [],
  vehicleTypes: [], fuelPreferences: [],
  location: '', searchRadius: 50, ownershipYears: 3,
}

function tryParse(val: any, fallback: any) {
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return fallback }
}

const toggle = <T extends string>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]

export default function EditPreferencesPage() {
  const router = useRouter()
  const resetFeed = useResetFeed()
  const [prefs, setPrefs] = useState<PrefsState>(DEFAULT_PREFS)
  const [original, setOriginal] = useState<PrefsState>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openSection, setOpenSection] = useState<Section | null>('vehicle')
  const [showMoreBrands, setShowMoreBrands] = useState(false)

  useEffect(() => {
    fetch('/api/users/preferences')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          const parsed: PrefsState = {
            budgetMax: data.budgetMax ?? 200_000,
            budgetMin: data.budgetMin ?? 0,
            preferredBrands: tryParse(data.preferredBrands, []),
            preferredModels: tryParse(data.preferredModels, []),
            vehicleTypes: tryParse(data.vehicleTypes, []),
            fuelPreferences: tryParse(data.fuelPreferences, []),
            location: data.location ?? '',
            searchRadius: data.searchRadius ?? 50,
            ownershipYears: data.ownershipYears ?? 3,
          }
          setPrefs(parsed)
          setOriginal(parsed)
        }
      })
      .catch(() => toast.error('שגיאה בטעינת ההעדפות'))
      .finally(() => setLoading(false))
  }, [])

  const isDirty = JSON.stringify(prefs) !== JSON.stringify(original)

  const toggleBrand = (brand: string) => {
    const next = toggle(prefs.preferredBrands, brand)
    const removed = !next.includes(brand)
    setPrefs((p) => ({
      ...p,
      preferredBrands: next,
      preferredModels: removed
        ? p.preferredModels.filter((m) => !(CAR_BRANDS_MODELS[brand] ?? []).includes(m))
        : p.preferredModels,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...prefs, roles: undefined }),
      })
      if (!res.ok) throw new Error()
      toast.success('ההעדפות נשמרו — הפיד מתעדכן ✓')
      // Clear RQ cache + reset Zustand index so the deck reloads with new preferences
      resetFeed()
      router.push('/swipe')
    } catch {
      toast.error('שגיאה בשמירת ההעדפות')
    } finally {
      setSaving(false)
    }
  }

  const allBrands = Object.keys(CAR_BRANDS_MODELS)
  const otherBrands = allBrands.filter((b) => !POPULAR_BRANDS.includes(b))

  // Summary chips for the collapsed section headers
  const summaryForSection: Record<Section, string> = {
    vehicle: prefs.vehicleTypes.length
      ? prefs.vehicleTypes.map((t) => VEHICLE_TYPE_HE[t]).slice(0, 3).join(', ')
      : 'לא נבחר',
    fuel: prefs.fuelPreferences.length
      ? prefs.fuelPreferences.map((f) => FUEL_TYPE_HE[f as keyof typeof FUEL_TYPE_HE] ?? f).slice(0, 3).join(', ')
      : 'לא נבחר',
    budget: prefs.budgetMax ? `עד ₪${(prefs.budgetMax / 1000).toFixed(0)}K` : 'לא נבחר',
    location: prefs.location ? `${prefs.location} · ${prefs.searchRadius} ק"מ` : 'לא נבחר',
    brands: prefs.preferredBrands.length
      ? prefs.preferredBrands.slice(0, 3).join(', ') + (prefs.preferredBrands.length > 3 ? ` +${prefs.preferredBrands.length - 3}` : '')
      : 'כל המותגים',
  }

  const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'vehicle', label: 'סוג רכב',       icon: Car    },
    { id: 'fuel',    label: 'סוג דלק',        icon: Zap    },
    { id: 'budget',  label: 'תקציב',          icon: Wallet },
    { id: 'location',label: 'מיקום',          icon: MapPin },
    { id: 'brands',  label: 'מותגים מועדפים', icon: Star   },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-40" dir="rtl">

      {/* Sticky header */}
      <div className="bg-surface-container-lowest/95 backdrop-blur-md px-5 pt-12 pb-4 sticky top-0 z-20 border-b border-outline-variant/15">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1 text-right">
            <h1 className="font-headline text-xl font-bold text-on-surface">העדפות חיפוש</h1>
            <p className="text-on-surface-variant text-xs mt-0.5">
              {isDirty ? '• שינויים שלא נשמרו' : 'עדכן מה מתאים לך — הפיד יתאים את עצמו'}
            </p>
          </div>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="px-5 pt-5 space-y-3">
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const isOpen = openSection === id
          return (
            <div
              key={id}
              className="bg-surface-container rounded-3xl overflow-hidden border border-outline-variant/10"
            >
              {/* Section header — always visible */}
              <button
                onClick={() => setOpenSection(isOpen ? null : id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-right"
              >
                <div className={clsx(
                  'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors',
                  isOpen ? 'bg-primary/15' : 'bg-surface-container-high'
                )}>
                  <Icon className={clsx('w-5 h-5', isOpen ? 'text-primary' : 'text-on-surface-variant')} />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className={clsx('font-semibold text-sm', isOpen ? 'text-primary' : 'text-on-surface')}>{label}</p>
                  <p className="text-on-surface-variant text-xs truncate mt-0.5">{summaryForSection[id]}</p>
                </div>
                <ChevronRight className={clsx('w-4 h-4 text-on-surface-variant flex-shrink-0 transition-transform duration-200', isOpen ? '-rotate-90' : 'rotate-90')} />
              </button>

              {/* Section content */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-outline-variant/10">

                  {id === 'vehicle' && (
                    <div className="grid grid-cols-3 gap-2.5 pt-3">
                      {VEHICLE_OPTIONS.map((type) => {
                        const selected = prefs.vehicleTypes.includes(type)
                        return (
                          <button
                            key={type}
                            onClick={() => setPrefs((p) => ({ ...p, vehicleTypes: toggle(p.vehicleTypes, type) }))}
                            className={clsx(
                              'flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border transition-all active:scale-95',
                              selected
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant'
                            )}
                          >
                            <span className="text-2xl">{VEHICLE_ICONS[type]}</span>
                            <span className="text-xs font-semibold">{VEHICLE_TYPE_HE[type]}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {id === 'fuel' && (
                    <div className="flex flex-wrap gap-2 pt-3">
                      {Object.entries(FUEL_TYPE_HE).map(([v, label]) => {
                        const selected = prefs.fuelPreferences.includes(v as FuelType)
                        return (
                          <button
                            key={v}
                            onClick={() => setPrefs((p) => ({ ...p, fuelPreferences: toggle(p.fuelPreferences, v as FuelType) }))}
                            className={clsx(
                              'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                              selected
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant'
                            )}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {id === 'budget' && (
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      {BUDGET_OPTIONS.map(({ label, value }) => (
                        <button
                          key={value}
                          onClick={() => setPrefs((p) => ({ ...p, budgetMax: value }))}
                          className={clsx(
                            'py-4 rounded-2xl text-sm font-bold border transition-all',
                            prefs.budgetMax === value
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {id === 'location' && (
                    <div className="space-y-4 pt-3">
                      <select
                        value={prefs.location}
                        onChange={(e) => setPrefs((p) => ({ ...p, location: e.target.value }))}
                        className="w-full bg-surface-container-high border border-outline-variant/30 rounded-2xl px-4 py-3.5 text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="">בחר עיר...</option>
                        {ISRAELI_CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <div>
                        <p className="text-on-surface-variant text-xs mb-2 text-right">רדיוס חיפוש</p>
                        <div className="grid grid-cols-4 gap-2">
                          {RADIUS_OPTIONS.map((r) => (
                            <button
                              key={r}
                              onClick={() => setPrefs((p) => ({ ...p, searchRadius: r }))}
                              className={clsx(
                                'py-3 rounded-xl text-xs font-semibold border transition-all',
                                prefs.searchRadius === r
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant'
                              )}
                            >
                              {r === 200 ? 'כל הארץ' : `${r} ק"מ`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {id === 'brands' && (
                    <div className="pt-3 space-y-4">
                      {/* Popular */}
                      <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest text-right">
                        מובילים בישראל
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_BRANDS.map((brand) => {
                          const selected = prefs.preferredBrands.includes(brand)
                          return (
                            <button
                              key={brand}
                              onClick={() => toggleBrand(brand)}
                              className={clsx(
                                'px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                                selected
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant'
                              )}
                            >
                              {brand}
                            </button>
                          )
                        })}
                      </div>

                      {/* More brands */}
                      <button
                        onClick={() => setShowMoreBrands((v) => !v)}
                        className="text-on-surface-variant text-xs font-medium flex items-center gap-1"
                      >
                        <ChevronRight className={clsx('w-3.5 h-3.5 transition-transform', showMoreBrands ? '-rotate-90' : 'rotate-90')} />
                        {showMoreBrands ? 'פחות מותגים' : `עוד מותגים (${otherBrands.length})`}
                      </button>

                      {showMoreBrands && (
                        <div className="flex flex-wrap gap-2">
                          {otherBrands.map((brand) => {
                            const selected = prefs.preferredBrands.includes(brand)
                            return (
                              <button
                                key={brand}
                                onClick={() => toggleBrand(brand)}
                                className={clsx(
                                  'px-3 py-2 rounded-xl text-sm font-medium border transition-all',
                                  selected
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant'
                                )}
                              >
                                {brand}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Models for selected brands */}
                      {prefs.preferredBrands.length > 0 && (
                        <div>
                          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-3 text-right">
                            דגמים ספציפיים (אופציונלי)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {prefs.preferredBrands.flatMap((b) =>
                              (CAR_BRANDS_MODELS[b] ?? []).map((m) => {
                                const selected = prefs.preferredModels.includes(m)
                                return (
                                  <button
                                    key={`${b}-${m}`}
                                    onClick={() => setPrefs((p) => ({ ...p, preferredModels: toggle(p.preferredModels, m) }))}
                                    className={clsx(
                                      'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
                                      selected
                                        ? 'bg-surface-container-highest border-primary/60 text-primary'
                                        : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant'
                                    )}
                                  >
                                    {b} {m}
                                  </button>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Fixed save bar */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 max-w-[430px] mx-auto px-5 py-3 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/15">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={clsx(
            'w-full font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
            isDirty
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
              : 'bg-surface-container text-on-surface-variant cursor-default'
          )}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" />
              {isDirty ? 'שמור ועדכן פיד' : 'אין שינויים'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
