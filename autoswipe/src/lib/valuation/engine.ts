/**
 * Valuation Engine — Stage 3
 * ──────────────────────────────────────────────────────────────────────────
 * Converts raw market data + vehicle technical profile into a trustworthy
 * price range with confidence scoring and human-readable insights.
 *
 * Algorithm:
 *   1. Collect market data points (Stage 2)
 *   2. Clean data — remove junk, outliers (IQR method)
 *   3. Calculate percentile distribution: P25 / P50 / P75
 *   4. Apply Israeli market adjustment factors:
 *        - Mileage vs expected annual average
 *        - Ownership type (private / company / leasing / rental)
 *        - Number of previous owners
 *   5. Return structured output with confidence level and insights
 *
 * Fallback chain (no market data):
 *   → Heuristic depreciation model from price-intelligence.ts
 *   → Confidence: LOW, wider range (±20%)
 *
 * What is deterministic (rules):
 *   - Adjustment factors
 *   - Outlier removal thresholds
 *   - Confidence scoring
 *   - Insight generation
 *
 * What is statistical:
 *   - IQR percentile calculation
 *   - Sample size requirements
 *
 * What is AI (future v2, not in MVP):
 *   - ML regression model trained on 12+ months of internal data
 *   - LLM-generated insight explanations
 */

import { collectAllMarketData, type MarketPoint } from './market-collector'
import { estimateMarketPrice } from '@/lib/utils/price-intelligence'
import type { OwnershipType } from '@/lib/services/vehicle-tech-lookup'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValuationInput {
  brand:          string
  model:          string
  trimLevel?:     string
  year:           number
  mileage:        number
  ownershipType?: OwnershipType
  numberOfOwners?: number
  fuelType?:      string
  askingPrice?:   number   // used only to compute priceStatus
}

export interface ValuationOutput {
  vehicleId?:  string
  marketRange: {
    quickSale: number   // P25 adjusted (realistic sell-fast price)
    average:   number   // P50 adjusted (fair market value)
    premium:   number   // P75 adjusted (strong condition asking price)
  }
  confidence:    'LOW' | 'MEDIUM' | 'HIGH'
  sampleSize:    number
  priceStatus?:  'below_market' | 'fair' | 'above_market'
  insights:      string[]
  adjustments:   Record<string, number>  // factor name → % adjustment applied
  dataSource:    'MARKET_DATA' | 'HEURISTIC'
  validUntil:    string  // ISO timestamp, 1 hour from generation
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ISRAEL_AVG_KM_PER_YEAR = 15_000  // CBS / industry benchmark

// Minimum clean sample size for each confidence tier
const MIN_SAMPLE_HIGH   = 15
const MIN_SAMPLE_MEDIUM = 5

// Outlier bounds: prices outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR] are removed
const IQR_MULTIPLIER = 1.5

// Minimum and maximum plausible prices (sanity guards)
const MIN_PRICE = 5_000
const MAX_PRICE = 3_000_000

// ─── Data cleaning ────────────────────────────────────────────────────────────

function cleanDataPoints(points: MarketPoint[]): MarketPoint[] {
  // Step 1: basic sanity filters
  let clean = points.filter((p) =>
    p.price >= MIN_PRICE &&
    p.price <= MAX_PRICE &&
    (p.mileage === null || (p.mileage >= 0 && p.mileage <= 1_500_000))
  )

  if (clean.length < 4) return clean  // too few to compute IQR

  // Step 2: IQR outlier removal on price
  const sorted = [...clean].map((p) => p.price).sort((a, b) => a - b)
  const q1 = percentile(sorted, 25)
  const q3 = percentile(sorted, 75)
  const iqr = q3 - q1
  const lo  = q1 - IQR_MULTIPLIER * iqr
  const hi  = q3 + IQR_MULTIPLIER * iqr

  clean = clean.filter((p) => p.price >= lo && p.price <= hi)

  return clean
}

// ─── Percentile calculation ───────────────────────────────────────────────────

function percentile(sortedArr: number[], pct: number): number {
  if (sortedArr.length === 0) return 0
  if (sortedArr.length === 1) return sortedArr[0]

  const index  = (pct / 100) * (sortedArr.length - 1)
  const lower  = Math.floor(index)
  const upper  = Math.ceil(index)
  const weight = index - lower

  return Math.round(sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight)
}

// ─── Israeli adjustment factors ───────────────────────────────────────────────

/**
 * Mileage adjustment: ±3% per 10,000 km deviation from age-expected,
 * capped at ±20%.
 * Lower mileage than expected → positive adjustment (car worth more).
 */
function mileageAdjustment(mileage: number, year: number): { factor: number; label: string } {
  const age         = Math.max(1, new Date().getFullYear() - year)
  const expectedKm  = age * ISRAEL_AVG_KM_PER_YEAR
  const deviation   = (expectedKm - mileage) / expectedKm   // positive = under expected
  const factor      = Math.max(-0.20, Math.min(0.20, deviation * 0.30))
  return { factor, label: 'mileage' }
}

/**
 * Ownership type adjustment.
 * Rental and leasing cars carry a stigma of high usage and less personal care.
 */
function ownershipAdjustment(type?: OwnershipType): { factor: number; label: string } {
  const map: Record<OwnershipType, number> = {
    PRIVATE: 0.00,
    COMPANY: -0.05,
    LEASING: -0.08,
    RENTAL:  -0.12,
    UNKNOWN:  0.00,
  }
  const factor = map[type ?? 'UNKNOWN'] ?? 0
  return { factor, label: 'ownership_type' }
}

/**
 * Number-of-owners adjustment.
 * Israeli buyers highly prefer single-owner cars.
 */
function ownersAdjustment(numOwners?: number): { factor: number; label: string } {
  if (numOwners == null) return { factor: 0, label: 'owners_count' }
  if (numOwners === 1)   return { factor: 0.03, label: 'owners_count' }
  if (numOwners === 2)   return { factor: 0.00, label: 'owners_count' }
  if (numOwners === 3)   return { factor: -0.03, label: 'owners_count' }
  return { factor: -0.06, label: 'owners_count' }   // 4+
}

function applyAdjustments(
  base: number,
  adjustmentList: { factor: number; label: string }[],
): { adjusted: number; factors: Record<string, number> } {
  let total = 0
  const factors: Record<string, number> = {}

  for (const adj of adjustmentList) {
    total += adj.factor
    factors[adj.label] = Math.round(adj.factor * 100)  // store as %
  }

  // Cap total adjustment at ±30%
  const capped = Math.max(-0.30, Math.min(0.30, total))
  return {
    adjusted: Math.round(base * (1 + capped)),
    factors,
  }
}

// ─── Insight generator ────────────────────────────────────────────────────────

function generateInsights(input: ValuationInput, sampleSize: number): string[] {
  const insights: string[] = []
  const age = new Date().getFullYear() - input.year

  // Mileage insight
  if (input.mileage != null && age > 0) {
    const expectedKm  = age * ISRAEL_AVG_KM_PER_YEAR
    const deviation   = (input.mileage - expectedKm) / expectedKm

    if (deviation < -0.25) {
      insights.push(`הק"מ נמוך ב-${Math.round(Math.abs(deviation) * 100)}% מהממוצע לגיל הרכב — מגדיל ערך`)
    } else if (deviation > 0.35) {
      insights.push(`הק"מ גבוה ב-${Math.round(deviation * 100)}% מהממוצע לגיל הרכב — מוריד ערך`)
    } else {
      insights.push('הק"מ תואם את הממוצע הצפוי לגיל הרכב')
    }
  }

  // Ownership type insight
  if (input.ownershipType && input.ownershipType !== 'UNKNOWN') {
    const ownershipInsights: Record<OwnershipType, string> = {
      PRIVATE: 'הרכב היה בבעלות פרטית — עדיפות בשוק הישראלי',
      COMPANY: 'הרכב שימש רכב חברה — מוריד מעט את הערך המקובל',
      LEASING: 'הרכב היה ברכב ליסינג — מוריד כ-8% מהשווי המקובל',
      RENTAL:  'הרכב שימש כרכב השכרה — מוריד כ-12% מהשווי המקובל',
      UNKNOWN: '',
    }
    const msg = ownershipInsights[input.ownershipType]
    if (msg) insights.push(msg)
  }

  // Owners count insight
  if (input.numberOfOwners != null) {
    if (input.numberOfOwners === 1) {
      insights.push('יד ראשונה — מוסיף ערך משמעותי בשוק')
    } else if (input.numberOfOwners >= 4) {
      insights.push(`${input.numberOfOwners} בעלים קודמים — מוריד מהשווי`)
    }
  }

  // Sample size caveat
  if (sampleSize < MIN_SAMPLE_MEDIUM) {
    insights.push('הערכה מבוססת על נתונים מוגבלים — הטווח רחב יותר מהרגיל')
  } else if (sampleSize >= MIN_SAMPLE_HIGH) {
    insights.push(`ההערכה מבוססת על ${sampleSize} עסקאות דומות בשוק`)
  }

  return insights
}

// ─── Price status classification ─────────────────────────────────────────────

function classifyPriceStatus(
  askingPrice: number,
  average: number,
): ValuationOutput['priceStatus'] {
  const ratio = (askingPrice - average) / average
  if (ratio <= -0.08) return 'below_market'
  if (ratio >= 0.10)  return 'above_market'
  return 'fair'
}

// ─── Heuristic fallback ───────────────────────────────────────────────────────

function heuristicValuation(input: ValuationInput): ValuationOutput {
  const base = estimateMarketPrice(input.brand, input.model, input.year)

  const adjustmentList = [
    mileageAdjustment(input.mileage, input.year),
    ownershipAdjustment(input.ownershipType),
    ownersAdjustment(input.numberOfOwners),
  ]

  const { adjusted, factors } = applyAdjustments(base, adjustmentList)

  const quickSale = Math.round(adjusted * 0.88)
  const premium   = Math.round(adjusted * 1.12)
  const average   = adjusted

  return {
    marketRange: { quickSale, average, premium },
    confidence:  'LOW',
    sampleSize:  0,
    priceStatus: input.askingPrice
      ? classifyPriceStatus(input.askingPrice, average)
      : undefined,
    insights:    [
      ...generateInsights(input, 0),
      'הערכה מבוססת על נוסחת פחת — אין מספיק נתוני שוק לטווח זה',
    ],
    adjustments: factors,
    dataSource:  'HEURISTIC',
    validUntil:  new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
  }
}

// ─── Main valuation function ──────────────────────────────────────────────────

export async function valuate(input: ValuationInput): Promise<ValuationOutput> {
  // Collect market data
  const { points } = await collectAllMarketData(input.brand, input.model, input.year)

  // Clean the dataset
  const clean = cleanDataPoints(points)

  // Fall back to heuristic if insufficient clean data
  if (clean.length < 3) {
    return heuristicValuation(input)
  }

  // Sort prices for percentile calculation
  const sortedPrices = clean.map((p) => p.price).sort((a, b) => a - b)

  const p25Base = percentile(sortedPrices, 25)
  const p50Base = percentile(sortedPrices, 50)
  const p75Base = percentile(sortedPrices, 75)

  // Build adjustment list
  const adjustmentList = [
    mileageAdjustment(input.mileage, input.year),
    ownershipAdjustment(input.ownershipType),
    ownersAdjustment(input.numberOfOwners),
  ]

  // Apply adjustments to each percentile
  const { adjusted: quickSale, factors } = applyAdjustments(p25Base, adjustmentList)
  const { adjusted: average }            = applyAdjustments(p50Base, adjustmentList)
  const { adjusted: premium }            = applyAdjustments(p75Base, adjustmentList)

  // Confidence based on sample size and year match
  const exactYearCount = clean.filter((p) => p.year === input.year).length
  let confidence: ValuationOutput['confidence'] = 'LOW'
  if (clean.length >= MIN_SAMPLE_HIGH && exactYearCount >= 5)  confidence = 'HIGH'
  else if (clean.length >= MIN_SAMPLE_MEDIUM)                  confidence = 'MEDIUM'

  const insights = generateInsights(input, clean.length)

  return {
    marketRange: { quickSale, average, premium },
    confidence,
    sampleSize:  clean.length,
    priceStatus: input.askingPrice
      ? classifyPriceStatus(input.askingPrice, average)
      : undefined,
    insights,
    adjustments: factors,
    dataSource:  'MARKET_DATA',
    validUntil:  new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
  }
}

// ─── Cache key builder ────────────────────────────────────────────────────────

export function buildCacheKey(input: Omit<ValuationInput, 'askingPrice'>): string {
  const mileageBucket = Math.round((input.mileage ?? 0) / 10_000) * 10_000
  return [
    input.brand.toLowerCase(),
    input.model.toLowerCase(),
    input.trimLevel?.toLowerCase() ?? '',
    input.year,
    mileageBucket,
    input.ownershipType ?? 'UNKNOWN',
    input.numberOfOwners ?? 0,
  ].join('|')
}
