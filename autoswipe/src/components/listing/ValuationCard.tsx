'use client'

/**
 * ValuationCard
 *
 * Fetches (or accepts pre-fetched) valuation data from the engine and renders:
 *   1. Price range bar  — quickSale / average / premium
 *   2. Confidence badge — LOW / MEDIUM / HIGH
 *   3. Price status     — below_market / fair / above_market
 *   4. Hebrew insights  — bullet list from engine
 *   5. Adjustments      — chip list of factors applied
 *
 * Usage:
 *   <ValuationCard brand="Toyota" model="Corolla" year={2020} mileage={80000} />
 *   <ValuationCard brand="Toyota" model="Corolla" year={2020} mileage={80000} askingPrice={95000} />
 *   <ValuationCard plateNumber="12345678" year={2020} mileage={80000} askingPrice={95000} />
 */

import { useEffect, useState }   from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingDown, TrendingUp, Minus,
  ChevronDown, ChevronUp, Info, Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValuationRange {
  quickSale: number
  average:   number
  premium:   number
}

interface ValuationData {
  vehicleId?:   string | null
  marketRange:  ValuationRange
  confidence:   'LOW' | 'MEDIUM' | 'HIGH'
  sampleSize:   number
  priceStatus?: 'below_market' | 'fair' | 'above_market'
  insights:     string[]
  adjustments:  Record<string, number>
  dataSource:   'MARKET_DATA' | 'HEURISTIC'
  validUntil:   string
}

interface ValuationCardProps {
  // Vehicle identity — either plate OR brand+model
  plateNumber?:   string
  brand?:         string
  model?:         string
  trimLevel?:     string
  year:           number
  mileage:        number
  ownership?:     string
  owners?:        number
  fuelType?:      string
  askingPrice?:   number
  // Optional pre-fetched data (e.g. from server component)
  initialData?:   ValuationData
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatILS(n: number): string {
  return '₪' + n.toLocaleString('he-IL')
}

function shortILS(n: number): string {
  if (n >= 1_000_000) return `₪${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `₪${Math.round(n / 1_000)}K`
  return `₪${n}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const map = {
    HIGH:   { label: 'אמינות גבוהה',   cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
    MEDIUM: { label: 'אמינות בינונית', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    LOW:    { label: 'אמינות נמוכה',   cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25'  },
  }
  const { label, cls } = map[level]
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

function PriceStatusBadge({ status }: { status: ValuationData['priceStatus'] }) {
  if (!status) return null
  const map = {
    below_market: { label: 'מחיר אטרקטיבי ↓', cls: 'bg-green-500/15 text-green-400', Icon: TrendingDown },
    fair:         { label: 'מחיר הוגן',        cls: 'bg-primary/15 text-primary',    Icon: Minus        },
    above_market: { label: 'מחיר גבוה ↑',       cls: 'bg-red-500/15 text-red-400',   Icon: TrendingUp   },
  }
  const { label, cls, Icon } = map[status]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ValuationCard({
  plateNumber,
  brand,
  model,
  trimLevel,
  year,
  mileage,
  ownership,
  owners,
  fuelType,
  askingPrice,
  initialData,
}: ValuationCardProps) {
  const [data,    setData]    = useState<ValuationData | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)
  const [error,   setError]   = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (initialData) return

    const params = new URLSearchParams()
    if (plateNumber) params.set('plate', plateNumber)
    if (brand)       params.set('brand', brand)
    if (model)       params.set('model', model)
    if (trimLevel)   params.set('trimLevel', trimLevel)
    params.set('year',    String(year))
    params.set('mileage', String(mileage))
    if (ownership)   params.set('ownership', ownership)
    if (owners)      params.set('owners', String(owners))
    if (fuelType)    params.set('fuelType', fuelType)
    if (askingPrice) params.set('askingPrice', String(askingPrice))

    setLoading(true)
    fetch(`/api/valuation?${params.toString()}`)
      .then((r) => {
        // 401 means session expired mid-view — render nothing, not an error card
        if (r.status === 401) return null
        if (!r.ok) throw new Error('שגיאה בטעינת הערכת שווי')
        return r.json() as Promise<ValuationData>
      })
      .then((d) => {
        if (!d) return // 401 path — leave data null and error null
        setData(d)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateNumber, brand, model, year, mileage, ownership, owners, fuelType, askingPrice])

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-surface-container rounded-3xl p-5 flex items-center justify-center gap-3 min-h-[120px]">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <span className="text-sm text-on-surface-variant">מחשב הערכת שווי…</span>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-surface-container rounded-3xl p-5 text-center space-y-1">
        <p className="text-sm text-on-surface-variant">לא ניתן לטעון הערכת שווי</p>
        <p className="text-xs text-red-400">{error}</p>
      </div>
    )
  }

  // No data and no error — session expired (401) or engine returned nothing.
  // Render nothing rather than a broken or misleading card.
  if (!data) return null

  const { marketRange, confidence, sampleSize, priceStatus, insights, adjustments, dataSource } = data

  // ── Price range bar maths ────────────────────────────────────────────────
  const lo   = marketRange.quickSale
  const mid  = marketRange.average
  const hi   = marketRange.premium
  const span = hi - lo || 1

  const midPct = ((mid - lo) / span) * 100

  // Asking price position on the bar
  const askPct = askingPrice != null
    ? Math.min(100, Math.max(0, ((askingPrice - lo) / span) * 100))
    : null

  // Adjustment chips — only show non-zero factors
  const adjEntries = Object.entries(adjustments).filter(([, v]) => v !== 0)

  return (
    <div className="bg-surface-container rounded-3xl p-5 space-y-4" dir="rtl">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-on-surface font-bold text-base">הערכת שווי שוק</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <ConfidenceBadge level={confidence} />
          {sampleSize > 0 && (
            <span className="text-[10px] text-on-surface-variant/60">
              {sampleSize} רכבים דומים
            </span>
          )}
        </div>
      </div>

      {/* ── Price status badge ───────────────────────────────────────────── */}
      {priceStatus && (
        <div>
          <PriceStatusBadge status={priceStatus} />
        </div>
      )}

      {/* ── Price range cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'מכירה מהירה', value: lo,  hint: 'P25' },
          { label: 'שוק הוגן',    value: mid, hint: 'P50', highlight: true },
          { label: 'מחיר פרמיום', value: hi,  hint: 'P75' },
        ].map(({ label, value, hint, highlight }) => (
          <div
            key={hint}
            className={`rounded-2xl px-3 py-3 text-center ${
              highlight
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-surface-container-high'
            }`}
          >
            <p className={`text-[10px] mb-0.5 ${highlight ? 'text-primary' : 'text-on-surface-variant'}`}>
              {label}
            </p>
            <p className={`font-bold text-sm leading-none ${highlight ? 'text-primary' : 'text-on-surface'}`}>
              {shortILS(value)}
            </p>
            <p className="text-[9px] text-on-surface-variant/50 mt-0.5">{hint}</p>
          </div>
        ))}
      </div>

      {/* ── Visual range bar ─────────────────────────────────────────────── */}
      <div className="space-y-1">
        {/* Track */}
        <div className="relative h-3 rounded-full bg-gradient-to-l from-green-500/40 via-primary/30 to-green-500/20 overflow-visible">
          {/* Average tick */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary/60 rounded-full"
            style={{ left: `${midPct}%` }}
          />
          {/* Asking price dot */}
          {askPct != null && (
            <div
              className="absolute -top-1 w-5 h-5 rounded-full border-2 border-surface-container shadow-lg flex items-center justify-center"
              style={{
                left: `calc(${askPct}% - 10px)`,
                backgroundColor:
                  priceStatus === 'below_market' ? 'rgb(34 197 94)' :
                  priceStatus === 'above_market' ? 'rgb(239 68 68)' :
                  'var(--color-primary, #D4A843)',
              }}
            >
              <span className="text-white text-[7px] font-black">₪</span>
            </div>
          )}
        </div>
        {/* Range labels */}
        <div className="flex justify-between text-[10px] text-on-surface-variant/60">
          <span>{shortILS(lo)}</span>
          <span>{shortILS(hi)}</span>
        </div>
      </div>

      {/* ── Adjustment chips ─────────────────────────────────────────────── */}
      {adjEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {adjEntries.map(([key, val]) => {
            const positive = val > 0
            const label = {
              mileage:        'ק"מ',
              ownership_type: 'סוג בעלות',
              owners_count:   'מספר בעלים',
            }[key] ?? key
            return (
              <span
                key={key}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  positive
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {label} {positive ? '+' : ''}{val}%
              </span>
            )
          })}
        </div>
      )}

      {/* ── Insights — expandable ────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="font-medium">תובנות שוק</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.ul
                key="insights"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 overflow-hidden"
              >
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 text-[10px] text-on-surface-variant/50 pt-1 border-t border-white/5">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>
          {dataSource === 'HEURISTIC'
            ? 'הערכה מבוססת על נוסחת פחת — אין מספיק נתוני שוק לטווח זה'
            : 'ההערכה מבוססת על נתוני עסקאות אמיתיות בשוק הישראלי'}
        </span>
      </div>
    </div>
  )
}
