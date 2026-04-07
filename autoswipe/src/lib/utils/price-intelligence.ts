import type { DealTag, MarketPriceEstimate } from '@/types'

// Thresholds for deal classification
const GREAT_DEAL_THRESHOLD = -0.20   // 20%+ below market → Great Deal
const BELOW_MARKET_THRESHOLD = -0.08 // 8–20% below market → Below Market
const ABOVE_MARKET_THRESHOLD = 0.10  // 10%+ above market → Above Market

/**
 * Classify a listing's price vs its market average
 * priceVsMarket: negative = cheaper than market, positive = more expensive
 */
export function classifyDeal(
  listingPrice: number,
  marketAvgPrice: number | null | undefined,
  isNewListing = false,
  hasPriceDrop = false
): DealTag | null {
  if (hasPriceDrop) return 'PRICE_DROP'
  if (isNewListing) return 'NEW_LISTING'
  if (!marketAvgPrice) return null

  const ratio = (listingPrice - marketAvgPrice) / marketAvgPrice

  if (ratio <= GREAT_DEAL_THRESHOLD) return 'GREAT_DEAL'
  if (ratio <= BELOW_MARKET_THRESHOLD) return 'BELOW_MARKET'
  if (ratio >= ABOVE_MARKET_THRESHOLD) return 'ABOVE_MARKET'
  return 'FAIR_PRICE'
}

/**
 * Compute price deviation ratio from market average
 * Returns e.g. -0.15 meaning 15% below market
 */
export function computePriceVsMarket(
  listingPrice: number,
  marketAvgPrice: number
): number {
  return (listingPrice - marketAvgPrice) / marketAvgPrice
}

/**
 * Return a human-readable percentage string
 * e.g. -0.15 → "15% מתחת למחיר שוק"
 */
export function formatPriceVsMarket(ratio: number): string {
  const pct = Math.abs(Math.round(ratio * 100))
  if (ratio < -0.01) return `${pct}% מתחת למחיר שוק`
  if (ratio > 0.01) return `${pct}% מעל מחיר שוק`
  return 'מחיר הוגן'
}

/**
 * Simulate market average price using simple heuristics.
 * In production this would query the MarketPrice table.
 * Placeholder until enough data is collected.
 */
export function estimateMarketPrice(
  brand: string,
  model: string,
  year: number
): number {
  // Base prices by segment (rough ILS estimates, 2024)
  const segmentBase: Record<string, number> = {
    // Premium
    BMW: 150_000,
    Mercedes: 160_000,
    Audi: 145_000,
    Volvo: 140_000,
    Lexus: 155_000,
    Porsche: 350_000,
    Land_Rover: 280_000,
    // Mid-range
    Toyota: 100_000,
    Hyundai: 90_000,
    Kia: 88_000,
    Mazda: 105_000,
    Honda: 95_000,
    Volkswagen: 110_000,
    Skoda: 95_000,
    Seat: 88_000,
    Cupra: 115_000,
    Ford: 85_000,
    Renault: 80_000,
    Peugeot: 82_000,
    // Economy
    Fiat: 70_000,
    Dacia: 65_000,
    Suzuki: 75_000,
    // EV
    Tesla: 180_000,
    BYD: 130_000,
    MG: 95_000,
  }

  const base = segmentBase[brand] ?? 90_000
  const currentYear = new Date().getFullYear()
  const age = currentYear - year

  // Depreciation: ~15% per year, compounded
  const depreciated = base * Math.pow(0.85, age)

  return Math.round(depreciated)
}

// ─── DETAILED ESTIMATE (with mileage + range) ─────────────────────────────────

/**
 * Average annual km driven in Israel.
 * Source: Central Bureau of Statistics / industry benchmarks.
 */
const ISRAEL_AVG_ANNUAL_KM = 15_000

/**
 * Returns a mileage-adjusted fair price estimate with a ±range,
 * replacing the single-point `estimateMarketPrice` for display purposes.
 *
 * Mileage model:
 *   - For every 10% a car is OVER the age-expected mileage → price -3%
 *   - For every 10% UNDER expected mileage               → price +3%
 *   - Cap: ±20% mileage adjustment
 *
 * Confidence: always MEDIUM for heuristic estimates.
 * When a real DB market price is available, pass it as `dbMarketAvg` and
 * confidence automatically upgrades to HIGH.
 */
export function estimateMarketPriceDetailed(
  brand: string,
  model: string,
  year: number,
  mileage?: number,
  dbMarketAvg?: number | null,
): MarketPriceEstimate {
  const currentYear = new Date().getFullYear()
  const age = Math.max(0, currentYear - year)

  // If we have a real DB average, use it as the centre; otherwise heuristic
  const baseEstimate = dbMarketAvg ?? estimateMarketPrice(brand, model, year)
  const source: MarketPriceEstimate['source'] = dbMarketAvg ? 'DB' : 'HEURISTIC'

  // ── Mileage adjustment ──────────────────────────────────────────────────────
  let mileageAdjustment = 0
  if (mileage != null && age > 0) {
    const expectedKm = age * ISRAEL_AVG_ANNUAL_KM
    // How far is actual mileage from expected, as a fraction of expected
    const deviation = (expectedKm - mileage) / Math.max(expectedKm, 1)
    // 10% km deviation → 3% price shift, capped at ±20%
    mileageAdjustment = Math.max(-0.20, Math.min(0.20, deviation * 0.3))
  }

  const estimate = Math.round(baseEstimate * (1 + mileageAdjustment))

  // ── Uncertainty range ───────────────────────────────────────────────────────
  // DB sources are tighter (±8%); heuristics are wider (±15%)
  const spread = source === 'DB' ? 0.08 : 0.15
  const confidence: MarketPriceEstimate['confidence'] =
    source === 'DB' ? 'HIGH' : 'MEDIUM'

  return {
    estimate,
    rangeLow: Math.round(estimate * (1 - spread)),
    rangeHigh: Math.round(estimate * (1 + spread)),
    confidence,
    source,
    mileageAdjustment,
  }
}

/**
 * Returns a buyer-friendly description of the mileage vs. expected average.
 * Used as a supporting note in the price analysis card.
 */
export function describeMileageContext(
  year: number,
  mileage: number,
): { text: string; sentiment: 'positive' | 'neutral' | 'negative' } | null {
  const age = new Date().getFullYear() - year
  if (age <= 0) return null

  const expectedKm = age * ISRAEL_AVG_ANNUAL_KM
  const deviation = (mileage - expectedKm) / expectedKm

  if (deviation < -0.25) {
    return { text: 'ק"מ נמוך מהממוצע לגיל הרכב — מגדיל את ערכו', sentiment: 'positive' }
  }
  if (deviation > 0.35) {
    return { text: 'ק"מ גבוה מהממוצע לגיל הרכב — מוריד מעט את ערכו', sentiment: 'negative' }
  }
  return null
}
