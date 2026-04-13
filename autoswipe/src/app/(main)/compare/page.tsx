'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { formatILS, calculateCostBreakdown } from '@/lib/utils/cost-calculator'
import { estimateMarketPrice, computePriceVsMarket } from '@/lib/utils/price-intelligence'
import { FUEL_TYPE_HE, VEHICLE_TYPE_HE } from '@/lib/constants/cars'
import { ArrowRight, X, Plus, Check, Trophy, Car, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useFavorites } from '@/hooks/useFavorites'
import type { CarListing, CostBreakdown } from '@/types'

// ── helpers ──────────────────────────────────────────────────

/** Returns index of the winner (min or max) among numeric values */
function winnerIdx(values: number[], lowerIsBetter = true): number {
  if (values.length === 0) return -1
  return values.reduce((best, v, i) => {
    const bv = values[best]
    return lowerIsBetter ? (v < bv ? i : best) : (v > bv ? i : best)
  }, 0)
}

function RelBar({ value, max, isWinner }: { value: number; max: number; isWinner: boolean }) {
  const pct = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1 rounded-full bg-surface-container-high mt-1.5 overflow-hidden">
      <div
        className={clsx('h-full rounded-full transition-all duration-500', isWinner ? 'bg-primary' : 'bg-outline-variant/40')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-5 pb-2">
      <span className="text-base leading-none">{icon}</span>
      <h3 className="font-bold text-on-surface-variant text-xs uppercase tracking-widest">{title}</h3>
    </div>
  )
}

// ── main ─────────────────────────────────────────────────────

function CompareContent() {
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<CarListing[]>([])

  // React Query — invalidated automatically when favorites are added/removed elsewhere
  const { data: rawFavs, isLoading: loading, isError, error, refetch } = useFavorites()
  const favorites: CarListing[] = (rawFavs ?? []).map((f) => f.listing).filter(Boolean)

  // Pre-select cars from ?ids= URL param once favorites finish loading
  // (this param is set by FavoritesList's "השווה" floating button)
  useEffect(() => {
    if (!rawFavs) return // wait for data
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? []
    if (ids.length >= 2) {
      const pre = ids
        .map((id) => favorites.find((l) => l.id === id))
        .filter((l): l is CarListing => !!l)
        .slice(0, 3)
      if (pre.length >= 2) setSelected(pre)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawFavs])

  const toggleCar = (listing: CarListing) => {
    if (selected.find((s) => s.id === listing.id)) {
      setSelected((prev) => prev.filter((s) => s.id !== listing.id))
    } else if (selected.length >= 3) {
      toast.error('ניתן להשוות עד 3 רכבים')
    } else {
      setSelected((prev) => [...prev, listing])
    }
  }

  // ── derived data ──
  const n = selected.length
  const breakdowns: CostBreakdown[] = selected.map((l) => calculateCostBreakdown(l) as CostBreakdown)
  const marketAvgs = selected.map((l) => l.marketAvgPrice ?? estimateMarketPrice(l.brand, l.model, l.year))
  const marketDeltas = selected.map((l, i) => computePriceVsMarket(l.price, marketAvgs[i]))

  const wPrice    = n >= 2 ? winnerIdx(selected.map((l) => l.price)) : -1
  const wMonthly  = n >= 2 ? winnerIdx(breakdowns.map((b) => b.monthly)) : -1
  const wFuel     = n >= 2 ? winnerIdx(breakdowns.map((b) => b.fuel)) : -1
  const wMileage  = n >= 2 ? winnerIdx(selected.map((l) => l.mileage)) : -1
  const wYear     = n >= 2 ? winnerIdx(selected.map((l) => l.year), false) : -1
  const wMarket   = n >= 2 ? winnerIdx(marketDeltas) : -1

  // Tally overall score
  const scores = selected.map(() => 0)
  if (n >= 2) {
    ;[
      [wPrice, 2], [wMonthly, 2], [wMarket, 1], [wMileage, 1], [wYear, 1],
    ].forEach(([wi, pts]) => {
      if (wi >= 0) scores[wi as number] += pts as number
    })
  }
  const verdictIdx = scores.indexOf(Math.max(...scores))

  const cols = `84px repeat(${n}, 1fr)`

  // ── row cell helpers ──
  const cell = (i: number, isWinner: boolean, children: React.ReactNode) => (
    <div
      key={i}
      className={clsx(
        'px-2 py-3 text-center',
        i < n - 1 && 'border-r border-outline-variant/10',
        isWinner && 'bg-primary/5'
      )}
    >
      {children}
    </div>
  )

  const labelCell = (text: string) => (
    <div className="px-3 py-3 bg-surface-container-high border-r border-outline-variant/10 flex items-center justify-end">
      <p className="text-on-surface-variant text-xs text-right leading-tight">{text}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-32" dir="rtl">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md px-4 pt-12 pb-4 border-b border-outline-variant/15">
        <div className="flex items-center gap-3">
          <Link href="/favorites" className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-4 h-4 text-on-surface-variant" />
          </Link>
          <h1 className="font-headline text-xl font-bold text-on-surface flex-1 text-right">השוואת רכבים</h1>
          {n >= 2 && (
            <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full flex-shrink-0">
              {n} רכבים
            </span>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        /* ── Error state: session expired or network failure ── */
        <div className="flex flex-col items-center text-center mt-24 gap-4 px-8">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-on-surface-variant" />
          </div>
          {error instanceof Error && error.message === '401' ? (
            <>
              <p className="text-on-surface font-bold">פג תוקף החיבור</p>
              <p className="text-on-surface-variant text-sm">יש להתחבר מחדש כדי לצפות במועדפים</p>
              <Link href="/login" className="bg-primary text-on-primary font-bold rounded-2xl px-6 py-3 text-sm">
                התחברות
              </Link>
            </>
          ) : (
            <>
              <p className="text-on-surface font-bold">שגיאה בטעינת המועדפים</p>
              <p className="text-on-surface-variant text-sm">לא ניתן היה לטעון את הרשימה. בדוק את החיבור ונסה שוב.</p>
              <button
                onClick={() => refetch()}
                className="bg-primary text-on-primary font-bold rounded-2xl px-6 py-3 text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </button>
            </>
          )}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center text-center mt-24 gap-4 px-8">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
            <Car className="w-8 h-8 text-on-surface-variant" />
          </div>
          <p className="text-on-surface font-bold">אין רכבים שמורים</p>
          <p className="text-on-surface-variant text-sm">שמור רכבים למועדפים כדי להשוות</p>
          <Link href="/swipe" className="bg-primary text-on-primary font-bold rounded-2xl px-6 py-3 text-sm">
            גלה מכוניות
          </Link>
        </div>
      ) : (
        <div className="px-4 pt-4">

          {/* Car selector chips */}
          <div className="mb-5">
            <p className="text-on-surface-variant text-xs mb-3 text-right">
              {n < 2 ? `בחר לפחות 2 רכבים · ${n}/3 נבחרו` : `${n}/3 נבחרו — גלול למטה לתוצאות`}
            </p>
            <div className="flex flex-wrap gap-2">
              {favorites.map((l) => {
                const isSel = !!selected.find((s) => s.id === l.id)
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleCar(l)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      isSel
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
                    )}
                  >
                    {isSel ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {l.brand} {l.model} {l.year}
                  </button>
                )
              })}
            </div>
          </div>

          {n === 1 && (
            <p className="text-center text-on-surface-variant text-sm mt-8">בחר עוד רכב אחד לפחות</p>
          )}

          {n >= 2 && (
            <div className="space-y-1">

              {/* ── CAR HEADER STRIP ── */}
              <div className="bg-surface-container rounded-2xl overflow-hidden">
                <div className="grid" style={{ gridTemplateColumns: cols }}>
                  <div className="bg-surface-container-high" />
                  {selected.map((l, i) => (
                    <div
                      key={l.id}
                      className={clsx('p-3 text-center', i < n - 1 && 'border-r border-outline-variant/10')}
                    >
                      <div className="relative w-full h-[72px] rounded-xl overflow-hidden bg-surface-container-high mb-2">
                        {l.images[0]?.path ? (
                          <Image src={l.images[0].path} alt="" fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Car className="w-6 h-6 text-on-surface-variant/30" />
                          </div>
                        )}
                        {i === verdictIdx && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                            <Trophy className="w-3 h-3 text-on-primary" />
                          </div>
                        )}
                      </div>
                      <p className="text-on-surface font-bold text-xs leading-tight">{l.brand} {l.model}</p>
                      <p className="text-on-surface-variant text-[10px]">{l.year}</p>
                      <button
                        onClick={() => toggleCar(l)}
                        className="mt-1.5 w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center mx-auto"
                      >
                        <X className="w-3 h-3 text-on-surface-variant" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SECTION: PRICE ── */}
              <SectionHeader icon="💰" title="מחיר" />
              <div className="bg-surface-container rounded-2xl overflow-hidden">

                {/* Asking price */}
                <div className="grid border-b border-outline-variant/10" style={{ gridTemplateColumns: cols }}>
                  {labelCell('מחיר')}
                  {selected.map((l, i) => {
                    const isWin = i === wPrice
                    return cell(i, isWin,
                      <>
                        <div className="flex items-center justify-center gap-1">
                          {isWin && <Trophy className="w-3 h-3 text-primary flex-shrink-0" />}
                          <p className={clsx('font-bold text-xs', isWin ? 'text-primary' : 'text-on-surface')}>
                            {formatILS(l.price)}
                          </p>
                        </div>
                        <RelBar value={l.price} max={Math.max(...selected.map((s) => s.price))} isWinner={isWin} />
                      </>
                    )
                  })}
                </div>

                {/* vs market */}
                <div className="grid" style={{ gridTemplateColumns: cols }}>
                  {labelCell('vs שוק')}
                  {selected.map((l, i) => {
                    const pct = Math.round(marketDeltas[i] * 100)
                    const isWin = i === wMarket
                    const color = pct < -5 ? 'text-green-400' : pct > 5 ? 'text-red-400' : 'text-on-surface-variant'
                    return cell(i, isWin,
                      <>
                        <p className={clsx('font-semibold text-xs', color)}>
                          {marketAvgs[i] === 0 ? '—' : pct === 0 ? 'מחיר שוק' : `${pct > 0 ? '+' : ''}${pct}%`}
                        </p>
                        {isWin && marketAvgs[i] > 0 && pct < 0 && (
                          <p className="text-green-400 text-[10px] mt-0.5">עסקה טובה</p>
                        )}
                      </>
                    )
                  })}
                </div>
              </div>

              {/* ── SECTION: MONTHLY COST ── */}
              <SectionHeader icon="📊" title="עלות חודשית" />
              <div className="bg-surface-container rounded-2xl overflow-hidden">

                {/* Total monthly */}
                <div className="grid border-b border-outline-variant/10" style={{ gridTemplateColumns: cols }}>
                  {labelCell('סה"כ')}
                  {breakdowns.map((bd, i) => {
                    const isWin = i === wMonthly
                    return cell(i, isWin,
                      <>
                        <div className="flex items-center justify-center gap-1">
                          {isWin && <Trophy className="w-3 h-3 text-primary flex-shrink-0" />}
                          <p className={clsx('font-bold text-xs', isWin ? 'text-primary' : 'text-on-surface')}>
                            {formatILS(bd.monthly)}
                          </p>
                        </div>
                        <p className="text-on-surface-variant text-[10px] mt-0.5">לחודש</p>
                        <RelBar value={bd.monthly} max={Math.max(...breakdowns.map((b) => b.monthly))} isWinner={isWin} />
                      </>
                    )
                  })}
                </div>

                {/* Fuel/month */}
                <div className="grid border-b border-outline-variant/10" style={{ gridTemplateColumns: cols }}>
                  {labelCell('דלק/חודש')}
                  {breakdowns.map((bd, i) => {
                    const isWin = i === wFuel
                    return cell(i, false,
                      <p className={clsx('text-xs', isWin ? 'text-primary font-bold' : 'text-on-surface')}>
                        {bd.fuel === 0 ? '₪0 ⚡' : formatILS(bd.fuel)}
                      </p>
                    )
                  })}
                </div>

                {/* Insurance/year */}
                <div className="grid border-b border-outline-variant/10" style={{ gridTemplateColumns: cols }}>
                  {labelCell('ביטוח/שנה')}
                  {breakdowns.map((bd, i) =>
                    cell(i, false, <p className="text-on-surface text-xs">{formatILS(bd.insurance * 12)}</p>)
                  )}
                </div>

                {/* Depreciation/year */}
                <div className="grid" style={{ gridTemplateColumns: cols }}>
                  {labelCell('פחת/שנה')}
                  {breakdowns.map((bd, i) =>
                    cell(i, false, <p className="text-on-surface text-xs">{formatILS(bd.depreciation * 12)}</p>)
                  )}
                </div>
              </div>

              {/* ── SECTION: SPECS ── */}
              <SectionHeader icon="🚗" title="מאפיינים" />
              <div className="bg-surface-container rounded-2xl overflow-hidden">

                {/* Year */}
                <div className="grid border-b border-outline-variant/10" style={{ gridTemplateColumns: cols }}>
                  {labelCell('שנה')}
                  {selected.map((l, i) => {
                    const isWin = i === wYear
                    return cell(i, isWin,
                      <>
                        <p className={clsx('font-bold text-xs', isWin ? 'text-primary' : 'text-on-surface')}>{l.year}</p>
                        {isWin && <p className="text-primary text-[10px] mt-0.5">חדש יותר</p>}
                      </>
                    )
                  })}
                </div>

                {/* Mileage */}
                <div className="grid border-b border-outline-variant/10" style={{ gridTemplateColumns: cols }}>
                  {labelCell('ק"מ')}
                  {selected.map((l, i) => {
                    const isWin = i === wMileage
                    return cell(i, isWin,
                      <>
                        <div className="flex items-center justify-center gap-1">
                          {isWin && <Trophy className="w-3 h-3 text-primary flex-shrink-0" />}
                          <p className={clsx('font-bold text-xs', isWin ? 'text-primary' : 'text-on-surface')}>
                            {(l.mileage / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <RelBar value={l.mileage} max={Math.max(...selected.map((s) => s.mileage))} isWinner={isWin} />
                      </>
                    )
                  })}
                </div>

                {/* Fuel type */}
                <div className="grid border-b border-outline-variant/10" style={{ gridTemplateColumns: cols }}>
                  {labelCell('דלק')}
                  {selected.map((l, i) =>
                    cell(i, false,
                      <p className={clsx('text-xs font-medium',
                        l.fuelType === 'ELECTRIC' ? 'text-primary' :
                        l.fuelType === 'HYBRID' || l.fuelType === 'PLUG_IN_HYBRID' ? 'text-green-400' :
                        'text-on-surface'
                      )}>
                        {FUEL_TYPE_HE[l.fuelType]}
                      </p>
                    )
                  )}
                </div>

                {/* Consumption */}
                <div className="grid border-b border-outline-variant/10" style={{ gridTemplateColumns: cols }}>
                  {labelCell('צריכה')}
                  {selected.map((l, i) =>
                    cell(i, false,
                      <p className="text-on-surface text-xs">
                        {l.fuelConsumption
                          ? l.fuelType === 'ELECTRIC'
                            ? `${l.fuelConsumption} kWh`
                            : `${l.fuelConsumption} ל'`
                          : '—'}
                      </p>
                    )
                  )}
                </div>

                {/* Location */}
                <div className="grid" style={{ gridTemplateColumns: cols }}>
                  {labelCell('מיקום')}
                  {selected.map((l, i) =>
                    cell(i, false,
                      <p className="text-on-surface text-xs leading-tight">{l.location}</p>
                    )
                  )}
                </div>
              </div>

              {/* ── VERDICT CARD ── */}
              {verdictIdx >= 0 && selected[verdictIdx] && (
                <div className="mt-3 bg-primary/8 border border-primary/25 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4 text-right">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-on-surface-variant text-xs">הרכב המומלץ עבורך</p>
                      <p className="font-headline font-bold text-on-surface text-lg leading-tight">
                        {selected[verdictIdx].brand} {selected[verdictIdx].model} {selected[verdictIdx].year}
                      </p>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div className="space-y-2.5 mb-5">
                    {wPrice === verdictIdx && (() => {
                      const others = selected.map((l) => l.price).filter((_, i) => i !== verdictIdx)
                      const diff = Math.max(...others) - selected[verdictIdx].price
                      return diff > 1000 ? (
                        <div className="flex gap-2 items-start text-right">
                          <span className="text-sm leading-none mt-0.5">💰</span>
                          <p className="text-on-surface-variant text-xs">
                            זול ב-<span className="text-primary font-bold">{formatILS(diff)}</span> מהיתרים
                          </p>
                        </div>
                      ) : null
                    })()}

                    {wMonthly === verdictIdx && (() => {
                      const others = breakdowns.map((b) => b.monthly).filter((_, i) => i !== verdictIdx)
                      const diff = Math.max(...others) - breakdowns[verdictIdx].monthly
                      return diff > 100 ? (
                        <div className="flex gap-2 items-start text-right">
                          <span className="text-sm leading-none mt-0.5">📊</span>
                          <p className="text-on-surface-variant text-xs">
                            חיסכון של <span className="text-primary font-bold">{formatILS(diff)}/חודש</span> בעלות השוטפת
                          </p>
                        </div>
                      ) : null
                    })()}

                    {wMileage === verdictIdx && (() => {
                      const others = selected.map((l) => l.mileage).filter((_, i) => i !== verdictIdx)
                      const diff = Math.max(...others) - selected[verdictIdx].mileage
                      return diff > 5000 ? (
                        <div className="flex gap-2 items-start text-right">
                          <span className="text-sm leading-none mt-0.5">🚗</span>
                          <p className="text-on-surface-variant text-xs">
                            נמוך ב-<span className="text-primary font-bold">{(diff / 1000).toFixed(0)}K ק"מ</span> מהמתחרים
                          </p>
                        </div>
                      ) : null
                    })()}

                    {wMarket === verdictIdx && marketDeltas[verdictIdx] < -0.05 && (
                      <div className="flex gap-2 items-start text-right">
                        <span className="text-sm leading-none mt-0.5">📈</span>
                        <p className="text-on-surface-variant text-xs">
                          מחיר <span className="text-green-400 font-bold">{Math.abs(Math.round(marketDeltas[verdictIdx] * 100))}% מתחת לשוק</span> — עסקה טובה
                        </p>
                      </div>
                    )}

                    {wYear === verdictIdx && (() => {
                      const others = selected.map((l) => l.year).filter((_, i) => i !== verdictIdx)
                      return selected[verdictIdx].year > Math.min(...others) ? (
                        <div className="flex gap-2 items-start text-right">
                          <span className="text-sm leading-none mt-0.5">🗓️</span>
                          <p className="text-on-surface-variant text-xs">
                            החדש ביותר — <span className="text-primary font-bold">שנת {selected[verdictIdx].year}</span>
                          </p>
                        </div>
                      ) : null
                    })()}
                  </div>

                  <Link
                    href={`/listing/${selected[verdictIdx].id}`}
                    className="block w-full bg-primary text-on-primary font-bold rounded-xl py-3.5 text-sm text-center"
                  >
                    צפה ברכב המנצח →
                  </Link>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}
