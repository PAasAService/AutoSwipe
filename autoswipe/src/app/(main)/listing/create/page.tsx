'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Check, Sparkles, Info,
  TrendingDown, TrendingUp, Minus, Loader2, Wand2,
} from 'lucide-react'
import { ISRAELI_CITIES } from '@/lib/constants/cities'
import { CAR_BRANDS_MODELS, FUEL_TYPE_HE, VEHICLE_TYPE_HE, TRANSMISSION_HE } from '@/lib/constants/cars'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import type { FuelType, VehicleType, Transmission } from '@/types'
import type { PricingAnalysis } from '@/app/api/ai-pricing/route'
import LicensePlateLookup, { type PlateAutoFillResult } from '@/components/listing/LicensePlateLookup'
import { VerifiedBadge } from '@/components/listing/VerifiedBadge'
import { ImageUploader, type UploadedImage } from '@/components/listing/ImageUploader'

const STEPS = [
  { title: 'פרטי הרכב', subtitle: 'מותג, דגם ושנה' },
  { title: 'מצב הרכב', subtitle: 'קילומטרז׳ ופרטים נוספים' },
  { title: 'מחיר ומיקום', subtitle: 'קבע מחיר ומיקום' },
  { title: 'עלויות', subtitle: 'עזור לקונים לחשב עלות אמיתית' },
  { title: 'תמונות', subtitle: 'הוסף תמונות מפתות' },
]

type FormData = {
  brand: string; model: string; year: number
  mileage: number; price: number; location: string
  fuelType: FuelType | ''; fuelConsumption: number
  vehicleType: VehicleType | ''; transmission: Transmission
  engineSize: number; color: string; doors: number; seats: number
  insuranceEstimate: number; maintenanceEstimate: number
  depreciationRate: number; description: string; images: UploadedImage[]
}

const INITIAL: FormData = {
  brand: '', model: '', year: new Date().getFullYear(),
  mileage: 0, price: 0, location: '',
  fuelType: '', fuelConsumption: 7.0,
  vehicleType: '', transmission: 'AUTOMATIC',
  engineSize: 0, color: '', doors: 4, seats: 5,
  insuranceEstimate: 4800, maintenanceEstimate: 3600,
  depreciationRate: 0.12, description: '', images: [],
}

const CURRENT_YEAR = new Date().getFullYear()

const inputCls = 'w-full bg-surface-container rounded-2xl px-4 py-3.5 text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 text-right text-sm'
const selectCls = 'w-full bg-surface-container rounded-2xl px-4 py-3.5 text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 text-right text-sm appearance-none'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide text-right px-1 mb-1.5">
      {children}
    </p>
  )
}

// ── Pricing verdict badge colours ──────────────────────────────────────────
const VERDICT_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  icon: <TrendingDown className="w-4 h-4" /> },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: <Minus className="w-4 h-4" /> },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: <TrendingUp className="w-4 h-4" /> },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    icon: <TrendingUp className="w-4 h-4" /> },
}

export default function CreateListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)

  // ── Plate lookup + verification state ──
  const [plateFilledFields, setPlateFilledFields] = useState<string[]>([])
  const [plateNumber,       setPlateNumber]       = useState('')
  const [isGovVerified,     setIsGovVerified]     = useState(false)

  // ── AI auto-fill state ──
  const [specsLoading, setSpecsLoading] = useState(false)
  const [specsFilledBy, setSpecsFilledBy] = useState<string | null>(null)
  const lastFetchRef = useRef<string>('')

  // ── AI description state ──
  const [descLoading, setDescLoading] = useState(false)
  const [descGenerated, setDescGenerated] = useState(false)

  // ── AI pricing state ──
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingResult, setPricingResult] = useState<PricingAnalysis | null>(null)
  const lastPricingRef = useRef<string>('')

  // ── Image upload state ──
  // uploadsBusy = true while any XHR is in flight; blocks the publish button
  const [uploadsBusy, setUploadsBusy] = useState(false)
  const handleUploadBusyChange = useCallback((busy: boolean) => setUploadsBusy(busy), [])

  const set = (key: keyof FormData, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  // ── Plate lookup → form merge ──────────────────────────────────────────────
  const handlePlateAutoFill = (data: PlateAutoFillResult) => {
    // Reset AI-specs key so it re-fetches with the new brand/model/year
    lastFetchRef.current = ''
    setSpecsFilledBy(null)

    setForm((prev) => ({
      ...prev,
      brand:       data.brand       || prev.brand,
      model:       data.model       || prev.model,
      year:        data.year        || prev.year,
      fuelType:    data.fuelType    ?? prev.fuelType,
      color:       data.color       || prev.color,
      vehicleType: data.vehicleType ?? prev.vehicleType,
    }))

    // Track which fields were filled for the banner shown on later steps
    const filled: string[] = []
    if (data.brand)       filled.push('מותג')
    if (data.model)       filled.push('דגם')
    if (data.year)        filled.push('שנה')
    if (data.fuelType)    filled.push('סוג דלק')
    if (data.color)       filled.push('צבע')
    if (data.vehicleType) filled.push('סוג רכב')
    setPlateFilledFields(filled)

    toast.success('פרטי הרכב מולאו ממאגר משרד הרישוי 🇮🇱', { duration: 3500 })
  }

  // Called only when fetch succeeded with no mismatch (or user accepted official data)
  const handleVerified = (plate: string) => {
    setPlateNumber(plate)
    setIsGovVerified(true)
  }

  const handlePlateClear = () => {
    setPlateFilledFields([])
    setPlateNumber('')
    setIsGovVerified(false)
  }

  const goTo = (target: number) => {
    setDirection(target > step ? 1 : -1)
    setStep(target)
  }

  // ── Auto-fetch vehicle specs ──
  useEffect(() => {
    const { brand, model, year } = form
    if (!brand || !model || !year) return

    const key = `${brand}__${model}__${year}`
    if (lastFetchRef.current === key) return
    lastFetchRef.current = key

    const controller = new AbortController()
    const fetchSpecs = async () => {
      setSpecsLoading(true)
      try {
        const params = new URLSearchParams({ brand, model, year: year.toString() })
        const res = await fetch(`/api/vehicle-specs?${params}`, { signal: controller.signal })
        if (!res.ok) return
        const { data } = await res.json()
        if (!data) return

        setForm((prev) => ({
          ...prev,
          fuelType:            data.fuelType            ?? prev.fuelType,
          fuelConsumption:     data.fuelConsumption     ?? prev.fuelConsumption,
          vehicleType:         data.vehicleType         ?? prev.vehicleType,
          transmission:        data.transmission        ?? prev.transmission,
          engineSize:          data.engineSize          ?? prev.engineSize,
          doors:               data.doors               ?? prev.doors,
          seats:               data.seats               ?? prev.seats,
          color:               data.color               ?? prev.color,
          insuranceEstimate:   data.insuranceEstimate   ?? prev.insuranceEstimate,
          maintenanceEstimate: data.maintenanceEstimate ?? prev.maintenanceEstimate,
          depreciationRate:    data.depreciationRate    ?? prev.depreciationRate,
          description:         prev.description || data.briefDescription || prev.description,
        }))

        setSpecsFilledBy(key)
        toast.success('פרטי הרכב מולאו אוטומטית 🤖', { duration: 3000 })
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') { /* silent */ }
      } finally {
        setSpecsLoading(false)
      }
    }

    fetchSpecs()
    return () => controller.abort()
  }, [form.brand, form.model, form.year])

  // ── AI Description generator ──
  const generateDescription = useCallback(async () => {
    if (descLoading) return
    setDescLoading(true)
    setDescGenerated(false)

    // Abort controller — cancels stream after 20 seconds to prevent infinite hang
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 20_000)

    try {
      const params = new URLSearchParams({
        brand:        form.brand,
        model:        form.model,
        year:         form.year.toString(),
        mileage:      form.mileage.toString(),
        fuelType:     form.fuelType,
        vehicleType:  form.vehicleType,
        transmission: form.transmission,
        color:        form.color,
        engineSize:   form.engineSize.toString(),
        price:        form.price.toString(),
      })

      const res = await fetch(`/api/ai-description?${params}`, { signal: controller.signal })
      if (!res.ok || !res.body) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''

      // Clear existing description and stream in new one
      set('description', '')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setForm((prev) => ({ ...prev, description: text }))
      }

      setDescGenerated(true)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        toast.error('פסק זמן — נסה שנית')
      } else {
        toast.error('שגיאה בייצור התיאור')
      }
    } finally {
      clearTimeout(timeoutId)
      setDescLoading(false)
    }
  }, [form, descLoading])

  // ── AI Pricing analyser ──
  const analyzePricing = useCallback(async () => {
    if (pricingLoading || !form.price || form.price <= 0) return

    const key = `${form.brand}__${form.model}__${form.year}__${form.price}`
    if (lastPricingRef.current === key) return
    lastPricingRef.current = key

    setPricingLoading(true)
    setPricingResult(null)

    try {
      const params = new URLSearchParams({
        brand:   form.brand,
        model:   form.model,
        year:    form.year.toString(),
        mileage: form.mileage.toString(),
        price:   form.price.toString(),
      })

      const res = await fetch(`/api/ai-pricing?${params}`)
      if (!res.ok) throw new Error('Failed')
      const { data } = await res.json()
      if (data) setPricingResult(data)
    } catch {
      toast.error('שגיאה בניתוח המחיר')
      lastPricingRef.current = '' // allow retry
    } finally {
      setPricingLoading(false)
    }
  }, [form.brand, form.model, form.year, form.mileage, form.price, pricingLoading])

  const handleImagesChange = useCallback((uploaded: UploadedImage[]) => {
    set('images', uploaded)
  }, [])

  const handleSubmit = async () => {
    if (form.images.length === 0) { toast.error('יש להוסיף לפחות תמונה אחת'); return }
    setLoading(true)
    try {
      const payload = {
        ...form,
        year: Number(form.year), mileage: Number(form.mileage), price: Number(form.price),
        fuelConsumption: Number(form.fuelConsumption),
        engineSize: Number(form.engineSize) || undefined,
        doors: Number(form.doors), seats: Number(form.seats),
        insuranceEstimate: Number(form.insuranceEstimate),
        maintenanceEstimate: Number(form.maintenanceEstimate),
        depreciationRate: Number(form.depreciationRate),
        plateNumber:   plateNumber   || undefined,
        isGovVerified: isGovVerified,
      }
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('המודעה פורסמה בהצלחה! 🎉')
      router.push(`/listing/${data.data.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בפרסום המודעה')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 0) return !!(form.brand && form.model && form.year && form.vehicleType)
    if (step === 1) return !!(form.mileage >= 0 && form.fuelType)
    if (step === 2) return !!(form.price > 0 && form.location)
    if (step === 3) return form.insuranceEstimate >= 0
    return true
  }

  // Reset pricing when price changes
  const handlePriceChange = (val: number) => {
    set('price', val)
    if (pricingResult) {
      setPricingResult(null)
      lastPricingRef.current = ''
    }
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest px-5 pb-10 pt-12" dir="rtl">

      {/* PROGRESS HEADER */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => step > 0 ? goTo(step - 1) : router.back()}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
            aria-label="חזור"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <span className="text-on-surface-variant text-sm font-medium">{step + 1} / {STEPS.length}</span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={clsx(
                'h-1 flex-1 rounded-full transition-all duration-300',
                i <= step ? 'bg-primary' : 'bg-outline-variant/30'
              )}
            />
          ))}
        </div>
      </div>

      {/* STEP CONTENT */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.22 }}
          className="space-y-5 mt-2"
        >
          <div className="text-right">
            <h2 className="font-headline text-2xl font-bold text-on-surface">{STEPS[step].title}</h2>
            <p className="text-on-surface-variant text-sm mt-0.5">{STEPS[step].subtitle}</p>
          </div>

          {/* ── AI loading banner (Step 0) ── */}
          {step === 0 && specsLoading && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3"
            >
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-primary text-sm font-medium">מחפש פרטי רכב אוטומטית...</p>
            </motion.div>
          )}

          {/* ── Auto-fill banners (steps 1+) ── */}
          {step >= 1 && plateFilledFields.length > 0 && (
            <div className="flex items-start gap-3 bg-surface-container rounded-2xl px-4 py-3 border border-outline-variant/20">
              <span className="text-base flex-shrink-0 mt-0.5">🇮🇱</span>
              <div className="text-right flex-1">
                <p className="text-on-surface text-xs font-semibold">מולא ממאגר משרד הרישוי</p>
                <p className="text-on-surface-variant text-xs mt-0.5">
                  {plateFilledFields.join(' · ')} — בדוק ועדכן לפי הרכב הספציפי שלך
                </p>
              </div>
            </div>
          )}
          {step >= 1 && specsFilledBy && (
            <div className="flex items-start gap-3 bg-surface-container rounded-2xl px-4 py-3 border border-outline-variant/20">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-right flex-1">
                <p className="text-on-surface text-xs font-semibold">מולא אוטומטית על ידי AI</p>
                <p className="text-on-surface-variant text-xs mt-0.5">
                  הערכים הובאו ממסד ידע רכבי. בדוק ועדכן לפי הרכב הספציפי שלך.
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* Step 0 — Brand / Model / Year / Vehicle Type               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 0 && (
            <div className="space-y-5">

              {/* ── License plate auto-fill ── */}
              <LicensePlateLookup
                onFill={handlePlateAutoFill}
                onVerified={handleVerified}
                onClear={handlePlateClear}
                currentFormValues={{ brand: form.brand, model: form.model, year: form.year }}
              />

              {/* Verified confirmation for the seller */}
              {isGovVerified && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <VerifiedBadge size="md" />
                </motion.div>
              )}

              {/* ── Divider ── */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-outline-variant/20" />
                <span className="text-xs text-on-surface-variant/50">או מלא ידנית</span>
                <div className="flex-1 h-px bg-outline-variant/20" />
              </div>

              <div>
                <FieldLabel>מותג הרכב</FieldLabel>
                <select
                  className={selectCls}
                  value={form.brand}
                  onChange={(e) => {
                    set('brand', e.target.value)
                    set('model', '')
                    lastFetchRef.current = ''
                    setSpecsFilledBy(null)
                  }}
                >
                  <option value="">בחר מותג...</option>
                  {Object.keys(CAR_BRANDS_MODELS).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {form.brand && (
                <div>
                  <FieldLabel>דגם</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.model}
                    onChange={(e) => {
                      set('model', e.target.value)
                      lastFetchRef.current = ''
                      setSpecsFilledBy(null)
                    }}
                  >
                    <option value="">בחר דגם...</option>
                    {(CAR_BRANDS_MODELS[form.brand] ?? []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <FieldLabel>שנת ייצור</FieldLabel>
                <select
                  className={selectCls}
                  value={form.year.toString()}
                  onChange={(e) => {
                    set('year', parseInt(e.target.value))
                    lastFetchRef.current = ''
                    setSpecsFilledBy(null)
                  }}
                >
                  {Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => {
                    const y = CURRENT_YEAR - i
                    return <option key={y} value={y.toString()}>{y}</option>
                  })}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    {specsLoading && (
                      <span className="flex items-center gap-1 text-primary">
                        <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                        מזהה אוטומטית...
                      </span>
                    )}
                    {!specsLoading && specsFilledBy && (
                      <span className="flex items-center gap-1 text-primary">
                        <Sparkles className="w-3 h-3" />
                        זוהה ע"י AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">סוג רכב</p>
                </div>
                <select
                  className={selectCls}
                  value={form.vehicleType}
                  onChange={(e) => set('vehicleType', e.target.value)}
                >
                  <option value="">בחר סוג רכב...</option>
                  {Object.entries(VEHICLE_TYPE_HE).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {form.brand && form.model && !specsLoading && !specsFilledBy && (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container rounded-xl px-3 py-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>בחר שנה כדי שה-AI ימלא פרטים אוטומטית</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* Step 1 — Condition                                         */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <FieldLabel>קילומטרז׳</FieldLabel>
                <input
                  className={inputCls} type="number" inputMode="numeric"
                  value={form.mileage || ''}
                  onChange={(e) => set('mileage', parseInt(e.target.value) || 0)}
                  placeholder="לדוגמה: 85,000"
                />
              </div>

              <div>
                <FieldLabel>סוג דלק</FieldLabel>
                <select className={selectCls} value={form.fuelType}
                  onChange={(e) => set('fuelType', e.target.value)}>
                  <option value="">בחר סוג דלק...</option>
                  {Object.entries(FUEL_TYPE_HE).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>
                  {form.fuelType === 'ELECTRIC' ? 'צריכת אנרגיה (kWh/100km)' : 'צריכת דלק (ל׳/100 ק"מ)'}
                </FieldLabel>
                <input
                  className={inputCls} type="number" inputMode="decimal" step="0.1"
                  value={form.fuelConsumption || ''}
                  onChange={(e) => set('fuelConsumption', parseFloat(e.target.value) || 0)}
                  placeholder={form.fuelType === 'ELECTRIC' ? 'לדוגמה: 16.5' : 'לדוגמה: 7.5'}
                />
              </div>

              <div>
                <FieldLabel>תיבת הילוכים</FieldLabel>
                <select className={selectCls} value={form.transmission}
                  onChange={(e) => set('transmission', e.target.value)}>
                  {Object.entries(TRANSMISSION_HE).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>צבע ומספר דלתות</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} value={form.color}
                    onChange={(e) => set('color', e.target.value)}
                    placeholder="צבע — לדוגמה: לבן" />
                  <input className={inputCls} type="number" inputMode="numeric"
                    value={form.doors || ''}
                    onChange={(e) => set('doors', parseInt(e.target.value) || 4)}
                    placeholder="מס׳ דלתות" />
                </div>
              </div>

              <div>
                <FieldLabel>נפח מנוע (אופציונלי)</FieldLabel>
                <input
                  className={inputCls} type="number" inputMode="decimal" step="0.1"
                  value={form.engineSize || ''}
                  onChange={(e) => set('engineSize', parseFloat(e.target.value) || 0)}
                  placeholder="לדוגמה: 1.6 (ליטר)"
                />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* Step 2 — Price, Location & Description                     */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5">

              {/* ── Price input + AI Pricing ── */}
              <div>
                <FieldLabel>מחיר מבוקש (₪)</FieldLabel>
                <div className="flex gap-2">
                  <input
                    className={clsx(inputCls, 'flex-1')}
                    type="number" inputMode="numeric"
                    value={form.price || ''}
                    onChange={(e) => handlePriceChange(parseInt(e.target.value) || 0)}
                    placeholder="לדוגמה: 120,000"
                  />
                  {/* Analyse button — visible once brand+model+year+price are set */}
                  {form.brand && form.model && form.price > 0 && (
                    <button
                      type="button"
                      onClick={analyzePricing}
                      disabled={pricingLoading}
                      className={clsx(
                        'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all',
                        'bg-primary/10 border border-primary/30 text-primary',
                        'hover:bg-primary/20 active:scale-95 disabled:opacity-50'
                      )}
                      aria-label="נתח מחיר AI"
                    >
                      {pricingLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Sparkles className="w-3.5 h-3.5" />}
                      {pricingLoading ? 'מנתח...' : 'נתח מחיר'}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Pricing Analysis Result Card ── */}
              <AnimatePresence>
                {pricingResult && (() => {
                  const style = VERDICT_STYLES[pricingResult.verdictColor] ?? VERDICT_STYLES.yellow
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className={clsx(
                        'rounded-2xl border p-4 space-y-3 text-right',
                        style.bg, style.border
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className={clsx('flex items-center gap-1.5', style.text)}>
                          {style.icon}
                          <span className="font-bold text-sm">{pricingResult.verdictHe}</span>
                        </div>
                        <span className="text-xs text-on-surface-variant font-medium">ניתוח מחיר AI</span>
                      </div>

                      {/* Price range */}
                      <div className="bg-surface-container/60 rounded-xl px-3 py-2.5 flex items-center justify-between">
                        <span className="text-on-surface-variant text-xs">טווח מחיר ריאלי</span>
                        <span className="text-on-surface font-bold text-sm">
                          ₪{pricingResult.suggestedMin.toLocaleString('he-IL')}
                          {' — '}
                          ₪{pricingResult.suggestedMax.toLocaleString('he-IL')}
                        </span>
                      </div>

                      {/* Explanation */}
                      <p className="text-on-surface-variant text-xs leading-relaxed">
                        {pricingResult.explanation}
                      </p>

                      {/* Tip */}
                      <div className="flex items-start gap-2 bg-surface-container/40 rounded-xl px-3 py-2">
                        <span className="text-sm">💡</span>
                        <p className="text-xs text-on-surface font-medium leading-relaxed">{pricingResult.tipHe}</p>
                      </div>

                      {/* Disclaimer */}
                      <p className="text-on-surface-variant/60 text-[10px] leading-relaxed">
                        * הניתוח מבוסס על מידע שוק ממוצע ואינו מהווה הערכת שמאות מקצועית.
                      </p>
                    </motion.div>
                  )
                })()}
              </AnimatePresence>

              {/* Hint when no price yet */}
              {!pricingResult && !pricingLoading && form.brand && form.model && form.price <= 0 && (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container rounded-xl px-3 py-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>הזן מחיר ולחץ &quot;נתח מחיר&quot; לניתוח AI</span>
                </div>
              )}

              {/* ── Location ── */}
              <div>
                <FieldLabel>מיקום הרכב</FieldLabel>
                <select className={selectCls} value={form.location}
                  onChange={(e) => set('location', e.target.value)}>
                  <option value="">בחר עיר...</option>
                  {ISRAELI_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* ── Description + AI generator ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  {/* AI generate button */}
                  {form.brand && form.model && (
                    <button
                      type="button"
                      onClick={generateDescription}
                      disabled={descLoading}
                      className={clsx(
                        'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all',
                        'bg-primary/10 border border-primary/30 text-primary',
                        'hover:bg-primary/20 active:scale-95 disabled:opacity-50',
                        descGenerated && 'border-green-500/40 text-green-400 bg-green-500/10'
                      )}
                      aria-label="צור תיאור AI"
                    >
                      {descLoading
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : descGenerated
                          ? <Check className="w-3 h-3" />
                          : <Wand2 className="w-3 h-3" />}
                      {descLoading ? 'כותב...' : descGenerated ? 'נוצר! ✓' : '✨ צור תיאור'}
                    </button>
                  )}
                  <FieldLabel>תיאור הרכב</FieldLabel>
                </div>

                <div className="relative">
                  <textarea
                    className={clsx(inputCls, 'min-h-[110px] resize-none leading-relaxed')}
                    value={form.description}
                    onChange={(e) => {
                      set('description', e.target.value)
                      if (descGenerated) setDescGenerated(false)
                    }}
                    placeholder={form.brand && form.model
                      ? `לחץ "✨ צור תיאור" לייצור תיאור אוטומטי, או כתוב כאן בעצמך...`
                      : 'תאר את הרכב — היסטוריה, מצב, תוספות, מידע נוסף...'}
                    rows={4}
                  />
                  {/* Typing cursor while streaming */}
                  {descLoading && (
                    <span className="absolute bottom-4 left-4 inline-block w-0.5 h-4 bg-primary animate-pulse rounded-full" />
                  )}
                </div>

                {descGenerated && (
                  <p className="text-xs text-on-surface-variant mt-1.5 px-1 text-right">
                    ✨ תיאור נוצר על ידי AI — ניתן לערוך לפי הצורך
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* Step 3 — Costs                                             */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20 text-right space-y-2">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <p className="text-on-surface text-sm font-semibold">עלויות שנתיות</p>
                  <Info className="w-4 h-4 text-on-surface-variant" />
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  מידע זה עוזר לקונים להבין את <strong className="text-on-surface">העלות האמיתית</strong> של הרכב.
                </p>
                {specsFilledBy && (
                  <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-xl p-3 mt-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-on-surface-variant text-right leading-relaxed">
                      <strong className="text-primary">הערכות ה-AI</strong> מבוססות על נתוני שוק ממוצעים בישראל.
                      אלו <u>הערכות בלבד</u> ועשויות להשתנות לפי גיל הרכב, פרופיל הנהג ורמת הכיסוי.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <FieldLabel>ביטוח שנתי (₪)</FieldLabel>
                <input className={inputCls} type="number" inputMode="numeric"
                  value={form.insuranceEstimate || ''}
                  onChange={(e) => set('insuranceEstimate', parseInt(e.target.value) || 0)}
                  placeholder="לדוגמה: 4,800" />
              </div>

              <div>
                <FieldLabel>תחזוקה שנתית (₪)</FieldLabel>
                <input className={inputCls} type="number" inputMode="numeric"
                  value={form.maintenanceEstimate || ''}
                  onChange={(e) => set('maintenanceEstimate', parseInt(e.target.value) || 0)}
                  placeholder="לדוגמה: 3,600" />
              </div>

              <div>
                <FieldLabel>שיעור פחת שנתי</FieldLabel>
                <div className="flex gap-2">
                  {[0.08, 0.12, 0.15, 0.20].map((rate) => (
                    <button
                      key={rate} type="button"
                      onClick={() => set('depreciationRate', rate)}
                      className={clsx(
                        'flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all',
                        form.depreciationRate === rate
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50'
                      )}
                    >
                      {(rate * 100).toFixed(0)}%
                    </button>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-2 text-right px-1">
                  רכבים חדשים ~8%, רכבים ישנים יותר ~15–20%
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* Step 4 — Images                                            */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <FieldLabel>תמונות הרכב (עד 6)</FieldLabel>
                {/* ImageUploader is rendered always-mounted below AnimatePresence */}
                <p className="text-on-surface-variant text-xs text-right mt-1">
                  התמונה הראשונה תוצג כתמונה הראשית במודעה.
                </p>
              </div>

              <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20 text-right space-y-2">
                <p className="text-on-surface text-sm font-semibold">📸 טיפים לצילום:</p>
                <ul className="text-on-surface-variant text-xs space-y-1 list-disc list-inside">
                  <li>צלם ב-60 מעלות מלפנים וצד</li>
                  <li>כלול תמונות פנים וחדר מנוע</li>
                  <li>אור טבעי משפר את הסיכוי למכור</li>
                  <li>הימנע מצילום בלילה או בתנאי תאורה חלשים</li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Always-mounted ImageUploader — preserved across step navigation, hidden via CSS when not on step 4 */}
      <div className={step === 4 ? 'mt-2' : 'hidden'}>
        <ImageUploader
          onChange={handleImagesChange}
          onBusyChange={handleUploadBusyChange}
          maxImages={6}
        />
      </div>

      {/* BOTTOM BUTTON */}
      <div className="mt-8">
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => goTo(step + 1)}
            disabled={!canProceed() || (step === 0 && specsLoading)}
            className="w-full bg-primary text-on-primary font-bold rounded-2xl py-4 disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity active:scale-[0.98]"
          >
            {step === 0 && specsLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                מחפש פרטי רכב...
              </>
            ) : (
              'הבא ←'
            )}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || uploadsBusy || form.images.length === 0}
            className="w-full bg-primary text-on-primary font-bold rounded-2xl py-4 disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              : uploadsBusy
                ? <><Loader2 className="w-5 h-5 animate-spin" /> מעלה תמונות...</>
                : <><Check className="w-5 h-5" /> פרסם מודעה</>
            }
          </button>
        )}
      </div>

    </div>
  )
}
