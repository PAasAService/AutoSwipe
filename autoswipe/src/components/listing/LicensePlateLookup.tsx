'use client'

/**
 * LicensePlateLookup
 * ──────────────────────────────────────────────────────────────────────────
 * Lets a seller type their Israeli license plate and auto-populates as many
 * listing fields as the government API provides.
 *
 * Flow:
 *   1. Seller enters plate → click "אחזר פרטים" (or Enter)
 *   2. Server calls data.gov.il — results cached for 1 h per plate
 *   3a. If form already has conflicting brand/model/year → show MismatchWarning
 *       Seller picks "קבל נתונים רשמיים" or "השאר ערכים שלי"
 *   3b. No conflict → onFill(data) called immediately, onVerified(plate) called
 *   4. Success banner shows which fields were filled
 *
 * States: idle | loading | success | mismatch | notfound | error
 */

import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, CheckCircle2, AlertCircle, Info, X, Car } from 'lucide-react'
import { clsx } from 'clsx'
import { detectMismatches, type MismatchField } from '@/lib/utils/vehicle-validation'
import { MismatchWarning } from '@/components/listing/MismatchWarning'
import type { FuelType, VehicleType } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlateAutoFillResult {
  brand:          string
  model:          string
  year:           number
  fuelType:       FuelType | null
  color:          string
  vehicleType:    VehicleType | null
  ownershipType:  string
  trimLevel:      string
  pollutionGroup: number | null
  safetyRating:   number | null
  firstRoadDate:  string | null
}

interface Props {
  /** Called when data arrives — parent merges into form state */
  onFill: (data: PlateAutoFillResult) => void
  /** Called when lookup succeeds with NO mismatch, or user accepts official data */
  onVerified?: (plateNumber: string) => void
  /** Let parent know lookup is dismissed / cleared */
  onClear?: () => void
  /**
   * Current values the seller has already typed in the form.
   * Used to detect brand/model/year mismatches against the API result.
   */
  currentFormValues?: { brand?: string; model?: string; year?: number }
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIELD_LABELS: Partial<Record<keyof PlateAutoFillResult, string>> = {
  brand:          'מותג',
  model:          'דגם',
  year:           'שנה',
  fuelType:       'סוג דלק',
  color:          'צבע',
  vehicleType:    'סוג רכב',
  ownershipType:  'בעלות',
  trimLevel:      'רמת גימור',
  pollutionGroup: 'קבוצת זיהום',
}

function filledFields(data: PlateAutoFillResult): string[] {
  return (Object.keys(data) as (keyof PlateAutoFillResult)[])
    .filter((k) => {
      const v = data[k]
      return v !== null && v !== '' && v !== 0 && k in FIELD_LABELS
    })
    .map((k) => FIELD_LABELS[k] ?? k)
}

function isValidIsraeliPlate(raw: string): boolean {
  const digits = raw.replace(/[-\s]/g, '')
  return /^\d{7,8}$/.test(digits)
}

function formatPlateDisplay(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`
  if (d.length === 7) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
  if (d.length === 8) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
  return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
}

// ─── Component ────────────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'success' | 'mismatch' | 'notfound' | 'error'

export default function LicensePlateLookup({
  onFill,
  onVerified,
  onClear,
  currentFormValues,
  className,
}: Props) {
  const [plate,     setPlate]     = useState('')
  const [status,    setStatus]    = useState<Status>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')
  const [filled,    setFilled]    = useState<string[]>([])
  const [dismissed, setDismissed] = useState(false)

  // Pending data when a mismatch was found — held until user decides
  const [pendingData,       setPendingData]       = useState<PlateAutoFillResult | null>(null)
  const [pendingPlate,      setPendingPlate]      = useState('')
  const [pendingMismatches, setPendingMismatches] = useState<MismatchField[]>([])

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Input ──────────────────────────────────────────────────────────────────

  const handleInput = (raw: string) => {
    const sanitised = raw.replace(/[^\d-]/g, '').slice(0, 11)
    setPlate(sanitised)
    if (status !== 'idle') {
      setStatus('idle')
      setFilled([])
      setPendingData(null)
    }
  }

  const handleBlur = () => {
    const digits = plate.replace(/\D/g, '')
    if (digits.length >= 7) setPlate(formatPlateDisplay(digits))
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    if (status === 'loading') return

    const raw = plate.replace(/\D/g, '')

    if (!isValidIsraeliPlate(raw)) {
      setErrorMsg('מספר רכב לא תקין — יש להזין 7 או 8 ספרות')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')
    setFilled([])
    setPendingData(null)
    setPendingMismatches([])

    try {
      const res  = await fetch(`/api/vehicle-lookup?plate=${encodeURIComponent(raw)}`)
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 404) {
          setStatus('notfound')
        } else {
          setErrorMsg(json.error ?? 'שגיאה בחיפוש פרטי הרכב')
          setStatus('error')
        }
        return
      }

      const data: PlateAutoFillResult = json.data

      // ── Mismatch detection ───────────────────────────────────────────────
      // Only check fields the seller has explicitly filled in.
      if (currentFormValues?.brand || currentFormValues?.model || currentFormValues?.year) {
        const result = detectMismatches(
          {
            brand: currentFormValues.brand,
            model: currentFormValues.model,
            year:  currentFormValues.year,
          },
          { brand: data.brand, model: data.model, year: data.year },
        )

        if (result.hasMismatch) {
          // Hold the data — don't fill yet, let seller decide
          setPendingData(data)
          setPendingPlate(raw)
          setPendingMismatches(result.mismatches)
          setStatus('mismatch')
          setDismissed(false)
          return
        }
      }

      // No conflict — fill immediately and mark as verified
      const fields = filledFields(data)
      setFilled(fields)
      setStatus('success')
      setDismissed(false)
      onFill(data)
      onVerified?.(raw)
    } catch {
      setErrorMsg('לא ניתן להתחבר לשירות — אנא מלא את הפרטים ידנית')
      setStatus('error')
    }
  }

  // ── Mismatch decisions ─────────────────────────────────────────────────────

  /** Seller chose to accept official API data — overwrite conflicting fields */
  const handleAcceptOfficial = () => {
    if (!pendingData) return
    const fields = filledFields(pendingData)
    setFilled(fields)
    setStatus('success')
    setDismissed(false)
    onFill(pendingData)
    onVerified?.(pendingPlate)
    setPendingData(null)
    setPendingMismatches([])
  }

  /** Seller keeps their values — only fill non-conflicting fields */
  const handleKeepMine = () => {
    if (!pendingData) return
    const conflictFields = new Set(pendingMismatches.map((m) => m.field))

    const filteredData: PlateAutoFillResult = {
      ...pendingData,
      // Zero-out / empty fields the seller chose to keep from their own input
      brand: conflictFields.has('brand') ? '' : pendingData.brand,
      model: conflictFields.has('model') ? '' : pendingData.model,
      year:  conflictFields.has('year')  ? 0  : pendingData.year,
    }

    const fields = filledFields(filteredData)
    setFilled(fields)
    setStatus('success')
    setDismissed(false)
    onFill(filteredData)
    // Do NOT call onVerified — data is not fully verified when seller overrides fields
    setPendingData(null)
    setPendingMismatches([])
  }

  // ── Clear ──────────────────────────────────────────────────────────────────

  const handleClear = () => {
    setPlate('')
    setStatus('idle')
    setFilled([])
    setErrorMsg('')
    setDismissed(false)
    setPendingData(null)
    setPendingMismatches([])
    onClear?.()
    inputRef.current?.focus()
  }

  if (dismissed) return null

  return (
    <div className={clsx('space-y-3', className)} dir="rtl">

      {/* ── Input card ───────────────────────────────────────────────────── */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Car className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-semibold text-on-surface">מספר רכב</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              הזן את מספר הרישוי ואנחנו נמלא את הפרטים אוטומטית
            </p>
          </div>
        </div>

        {/* Input row */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={fetchData}
            disabled={status === 'loading' || plate.replace(/\D/g, '').length < 7}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0',
              status === 'loading'
                ? 'bg-primary/20 text-primary cursor-not-allowed'
                : plate.replace(/\D/g, '').length >= 7
                  ? 'bg-primary text-background hover:bg-primary/90 active:scale-95'
                  : 'bg-outline-variant/20 text-on-surface-variant/50 cursor-not-allowed',
            )}
          >
            {status === 'loading' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>מחפש</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>אחזר</span>
              </>
            )}
          </button>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="12-345-67"
              value={plate}
              onChange={(e) => handleInput(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              className={clsx(
                'w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-on-surface text-sm text-center tracking-widest font-mono border focus:outline-none focus:ring-2 transition-all',
                status === 'error'
                  ? 'border-red-500/50 focus:ring-red-500/30'
                  : status === 'success'
                    ? 'border-green-500/50 focus:ring-green-500/30'
                    : status === 'mismatch'
                      ? 'border-amber-500/50 focus:ring-amber-500/30'
                      : 'border-outline-variant/30 focus:ring-primary/30',
              )}
              maxLength={11}
            />
            {plate.length > 0 && status !== 'loading' && (
              <button
                onClick={handleClear}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant"
                tabIndex={-1}
                aria-label="נקה"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Status banners ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Mismatch warning — seller must decide before fill is applied */}
        {status === 'mismatch' && pendingData && (
          <MismatchWarning
            key="mismatch"
            mismatches={pendingMismatches}
            onAccept={handleAcceptOfficial}
            onKeep={handleKeepMine}
          />
        )}

        {/* Success */}
        {status === 'success' && !dismissed && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="relative bg-green-500/10 border border-green-500/25 rounded-2xl px-4 py-3.5"
          >
            <button
              onClick={() => setDismissed(true)}
              className="absolute left-3 top-3 text-green-400/60 hover:text-green-400"
              aria-label="סגור"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start gap-2.5 pr-1">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-right flex-1">
                <p className="text-sm font-semibold text-green-400">
                  הרכב זוהה! הפרטים מולאו אוטומטית
                </p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {filled.length > 0
                    ? `מולאו: ${filled.join(' · ')}`
                    : 'הנתונים הועברו לטופס'}
                </p>
                <p className="text-xs text-on-surface-variant/60 mt-1.5 flex items-center gap-1 justify-end">
                  <Info className="w-3 h-3" />
                  ניתן לערוך כל שדה לפי הרכב הספציפי שלך
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Not found */}
        {status === 'notfound' && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3.5"
          >
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-right">
              <p className="text-sm font-semibold text-amber-400">
                מספר הרכב לא נמצא במאגר
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                ייתכן שהרכב חדש מאוד או שהמספר שגוי. מלא את הפרטים ידנית.
              </p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-3.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-right">
              <p className="text-sm font-semibold text-red-400">שגיאה</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{errorMsg}</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Skip hint */}
      {status === 'idle' && plate.length === 0 && (
        <p className="text-xs text-on-surface-variant/50 text-center pb-1">
          אין לך את המספר? ניתן לדלג ולמלא הכול ידנית
        </p>
      )}
    </div>
  )
}
