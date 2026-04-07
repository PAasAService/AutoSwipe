/**
 * PriceAnalysisCard
 *
 * Buyer-facing price analysis panel for the listing detail page.
 * Computes (or accepts) a market estimate and renders:
 *   1. Verdict headline + copy (colour-coded)
 *   2. Two-column: asking price vs. fair range
 *   3. Gradient gauge showing where the price sits
 *   4. Optional mileage context note
 *   5. Confidence disclaimer
 *
 * Pure server component — all logic runs at render time; no client state.
 */

import { TrendingDown, TrendingUp, Minus, Info, CheckCircle2 } from 'lucide-react'
import { formatILS } from '@/lib/utils/cost-calculator'
import {
  estimateMarketPriceDetailed,
  classifyDeal,
  describeMileageContext,
} from '@/lib/utils/price-intelligence'
import type { DealTag } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceAnalysisCardProps {
  price: number
  brand: string
  model: string
  year: number
  mileage: number
  /** Market average from DB if available — used as the primary estimate */
  marketAvgPrice?: number | null
  /** Pre-computed deal tag (if available from DB) */
  dealTag?: DealTag | string | null
}

// ─── Verdict config ───────────────────────────────────────────────────────────

const VERDICTS: Record<
  string,
  {
    headline: (pct: number) => string
    copy: string
    colorClass: string
    bgClass: string
    borderClass: string
    Icon: React.ElementType
  }
> = {
  GREAT_DEAL: {
    headline: (p) => `מחיר נמוך ב־${p}% מממוצע השוק`,
    copy: 'עסקה יוצאת דופן — הרכב מתומחר משמעותית מתחת לממוצע הצפוי.',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20',
    Icon: TrendingDown,
  },
  BELOW_MARKET: {
    headline: (p) => `מחיר אטרקטיבי — ${p}% מתחת לשוק`,
    copy: 'מחיר טוב ביחס לשוק. שווה לשים לב לרכב הזה.',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/8',
    borderClass: 'border-green-500/15',
    Icon: TrendingDown,
  },
  FAIR_PRICE: {
    headline: () => 'מחיר הוגן ותואם שוק',
    copy: 'המחיר המבוקש תואם את ממוצע השוק לרכב מסוג זה.',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/8',
    borderClass: 'border-primary/15',
    Icon: CheckCircle2,
  },
  ABOVE_MARKET: {
    headline: (p) => `מחיר גבוה ב־${p}% מממוצע השוק`,
    copy: 'המחיר גבוה מהממוצע — כדאי לנסות לנהל משא ומתן עם המוכר.',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/8',
    borderClass: 'border-red-500/15',
    Icon: TrendingUp,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(hi, Math.max(lo, v))
}

function shortILS(v: number): string {
  if (v >= 1_000_000) return `₪${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `₪${Math.round(v / 1_000)}K`
  return `₪${v}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PriceAnalysisCard({
  price,
  brand,
  model,
  year,
  mileage,
  marketAvgPrice,
  dealTag,
}: PriceAnalysisCardProps) {
  // ── Compute estimate ──────────────────────────────────────────────────────
  const mpe = estimateMarketPriceDetailed(brand, model, year, mileage, marketAvgPrice)
  const { estimate, rangeLow, rangeHigh, confidence, source } = mpe

  // ── Classify ──────────────────────────────────────────────────────────────
  // Prefer pre-computed dealTag if present; otherwise classify live
  const ratio = (price - estimate) / estimate
  const tag: DealTag =
    (dealTag as DealTag) ??
    classifyDeal(price, estimate) ??
    'FAIR_PRICE'

  const absPct = Math.abs(Math.round(ratio * 100))
  const verdict = VERDICTS[tag] ?? VERDICTS.FAIR_PRICE
  const { Icon } = verdict

  // ── Gauge maths ───────────────────────────────────────────────────────────
  // Visible gauge range = estimate ± 35%
  const gaugeMin = estimate * 0.65
  const gaugeMax = estimate * 1.35
  const gaugeSpan = gaugeMax - gaugeMin

  const toPct = (v: number) => clamp(((v - gaugeMin) / gaugeSpan) * 100)

  const pricePct  = toPct(price)
  const marketPct = toPct(estimate)  // ≈ 50% by design
  const fairLoPct = toPct(rangeLow)
  const fairHiPct = toPct(rangeHigh)
  const fairWidth = fairHiPct - fairLoPct

  // ── Mileage context ───────────────────────────────────────────────────────
  const mileageNote = describeMileageContext(year, mileage)

  // ── Confidence label ──────────────────────────────────────────────────────
  const confidenceNote =
    source === 'DB'
      ? 'הערכה מבוססת על נתוני עסקאות אמיתיות בשוק הישראלי.'
      : 'הערכה מבוססת על נתוני שוק כלליים לפי מותג, שנה וק"מ. הטווח הינו קירוב בלבד.'

  return (
    <div className="bg-surface-container rounded-3xl p-5 space-y-4" dir="rtl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-on-surface font-bold text-base">ניתוח מחיר</h2>
        {confidence === 'MEDIUM' && (
          <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
            הערכה ~
          </span>
        )}
      </div>

      {/* ── Verdict pill ────────────────────────────────────────────────── */}
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${verdict.bgClass} ${verdict.borderClass}`}
      >
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${verdict.colorClass}`} />
        <div className="text-right flex-1 min-w-0">
          <p className={`font-bold text-sm leading-snug ${verdict.colorClass}`}>
            {verdict.headline(absPct)}
          </p>
          <p className="text-on-surface-variant text-xs mt-0.5 leading-relaxed">
            {verdict.copy}
          </p>
        </div>
      </div>

      {/* ── Price vs. range ─────────────────────────────────────────────── */}
      <div className="flex gap-3">
        {/* Asking price */}
        <div className="flex-1 bg-surface-container-high rounded-2xl px-4 py-3 text-right">
          <p className="text-on-surface-variant text-[11px] mb-0.5">מחיר מבוקש</p>
          <p className="font-headline font-bold text-xl text-primary leading-none">
            {formatILS(price)}
          </p>
        </div>
        {/* Fair range */}
        <div className="flex-1 bg-surface-container-high rounded-2xl px-4 py-3 text-right">
          <p className="text-on-surface-variant text-[11px] mb-0.5">טווח הוגן משוער</p>
          <p className="font-semibold text-sm text-on-surface leading-none">
            {shortILS(rangeLow)}
            <span className="text-on-surface-variant mx-1">–</span>
            {shortILS(rangeHigh)}
          </p>
          <p className="text-on-surface-variant text-[10px] mt-0.5">
            סביב {shortILS(estimate)}
          </p>
        </div>
      </div>

      {/* ── Gradient gauge ──────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        {/* Track + markers */}
        <div className="relative" style={{ height: '28px' }}>
          {/* Gradient track */}
          <div className="absolute inset-x-0 top-[8px] h-3 rounded-full overflow-hidden">
            {/* Background gradient: green → yellow → red */}
            <div className="absolute inset-0 bg-gradient-to-l from-green-500/55 via-amber-400/35 to-red-500/55" />
            {/* Fair-zone highlight band */}
            <div
              className="absolute top-0 bottom-0 bg-white/20 border-x border-white/30"
              style={{
                left: `${fairLoPct}%`,
                width: `${fairWidth}%`,
              }}
            />
            {/* Market-average tick */}
            <div
              className="absolute top-0 bottom-0 w-px bg-white/50"
              style={{ left: `${marketPct}%` }}
            />
          </div>

          {/* Price dot — floats above track so it's not clipped */}
          <div
            className="absolute top-0 w-7 h-7 rounded-full border-2 border-surface-container shadow-lg flex items-center justify-center transition-all"
            style={{
              left: `calc(${pricePct}% - 14px)`,
              backgroundColor:
                tag === 'GREAT_DEAL' || tag === 'BELOW_MARKET'
                  ? 'rgb(34 197 94)'   // green-500
                  : tag === 'ABOVE_MARKET'
                  ? 'rgb(239 68 68)'   // red-500
                  : 'var(--color-primary, #D4A843)',
            }}
          >
            <span className="text-white text-[9px] font-black leading-none">₪</span>
          </div>
        </div>

        {/* Labels row */}
        <div className="flex justify-between text-[10px] text-on-surface-variant px-0.5">
          <span>גבוה</span>
          <span className="text-on-surface-variant/70">
            ממוצע שוק · {formatILS(estimate)}
          </span>
          <span>זול</span>
        </div>
      </div>

      {/* ── Mileage context note ─────────────────────────────────────────── */}
      {mileageNote && (
        <div
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
            mileageNote.sentiment === 'positive'
              ? 'bg-green-500/8 text-green-400'
              : 'bg-amber-500/8 text-amber-400'
          }`}
        >
          <span className="text-base leading-none">
            {mileageNote.sentiment === 'positive' ? '✅' : '⚠️'}
          </span>
          <span>{mileageNote.text}</span>
        </div>
      )}

      {/* ── Confidence disclaimer ────────────────────────────────────────── */}
      <div className="flex items-start gap-2 text-[11px] text-on-surface-variant/60">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <p className="leading-relaxed">{confidenceNote}</p>
      </div>
    </div>
  )
}
