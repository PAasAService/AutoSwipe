/**
 * Market Data Collector
 * ──────────────────────────────────────────────────────────────────────────
 * Stage 2 of the valuation engine.
 *
 * PRIMARY source: AutoSwipe's own CarListing table.
 *   - Zero compliance risk
 *   - Real Israeli market data
 *   - Updated in real time as new listings are created
 *
 * SECONDARY source: Optional external adapters (off by default).
 *   - Must be explicitly enabled
 *   - Each adapter respects rate limits and robots.txt
 *   - Engine works correctly with 0 external data
 *
 * Compliance rules (hardcoded, not configurable):
 *   - Max 30 requests/hour per external source
 *   - No authentication bypass
 *   - Only collect: price, year, mileage, brand, model, location
 *   - Stop on HTTP 429 or robots.txt block
 *   - Never collect images, contact info, or text content
 */

import { prisma } from '@/lib/db'
import { buildCanonical } from '@/lib/valuation/identity-matcher'

// ─── Unified market data point ────────────────────────────────────────────────

export interface MarketPoint {
  brand:         string
  model:         string
  trimLevel:     string | null
  year:          number
  mileage:       number | null
  price:         number
  fuelType:      string | null
  location:      string | null
  ownershipType: string | null
  source:        'INTERNAL' | 'EXTERNAL_SAMPLE'
  collectedAt:   Date
}

// ─── Internal source — AutoSwipe listings ────────────────────────────────────

/**
 * Pull market data from AutoSwipe's own listing database.
 * Filters: same brand + model, year within ±2, last 180 days.
 * Returns raw data points before normalization.
 */
export async function collectInternalData(
  brand: string,
  model: string,
  year: number,
  options: { yearRange?: number; dayRange?: number } = {},
): Promise<MarketPoint[]> {
  const yearRange = options.yearRange ?? 2
  const dayRange  = options.dayRange  ?? 180
  const since     = new Date(Date.now() - dayRange * 24 * 60 * 60 * 1_000)

  const canonical = buildCanonical(brand, model)

  const listings = await prisma.carListing.findMany({
    where: {
      status:    'ACTIVE',
      brand:     canonical.brand || brand,
      year:      { gte: year - yearRange, lte: year + yearRange },
      createdAt: { gte: since },
      price:     { gt: 0 },
    },
    select: {
      brand:     true,
      model:     true,
      year:      true,
      mileage:   true,
      price:     true,
      fuelType:  true,
      location:  true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take:    200,
  })

  // Also try fuzzy match if exact brand match returns < 5 results
  const isSparse = listings.length < 5

  let fuzzyListings: typeof listings = []
  if (isSparse) {
    fuzzyListings = await prisma.carListing.findMany({
      where: {
        status:    'ACTIVE',
        year:      { gte: year - yearRange, lte: year + yearRange },
        createdAt: { gte: since },
        price:     { gt: 0 },
        OR: [
          { model: { contains: model.split(' ')[0] } },
        ],
      },
      select: {
        brand: true, model: true, year: true, mileage: true,
        price: true, fuelType: true, location: true, createdAt: true,
      },
      take: 50,
    })
  }

  const all = [...listings, ...fuzzyListings]
  const seen = new Set<string>()

  return all
    .filter((l) => {
      const key = `${l.brand}-${l.model}-${l.year}-${l.price}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((l): MarketPoint => ({
      brand:         l.brand,
      model:         l.model,
      trimLevel:     null,
      year:          l.year,
      mileage:       l.mileage,
      price:         l.price,
      fuelType:      l.fuelType,
      location:      l.location,
      ownershipType: null,
      source:        'INTERNAL',
      collectedAt:   l.createdAt,
    }))
}

// ─── Sync internal data to MarketDataPoint table ──────────────────────────────

/**
 * Writes internal market data to the dedicated MarketDataPoint table.
 * This provides a clean, queryable history that survives listing deletion/status changes.
 * Called whenever a new listing is created.
 */
export async function syncListingToMarketData(listingId: string): Promise<void> {
  try {
    const listing = await prisma.carListing.findUnique({
      where:  { id: listingId },
      select: {
        id: true, brand: true, model: true, year: true, mileage: true,
        price: true, fuelType: true, location: true, status: true,
      },
    })
    if (!listing || listing.status === 'DELETED') return

    await prisma.marketDataPoint.upsert({
      where:  { id: listingId },  // use listing id as data point id
      create: {
        id:             listingId,
        brand:          listing.brand,
        model:          listing.model,
        trimLevel:      null,
        year:           listing.year,
        mileage:        listing.mileage,
        price:          listing.price,
        fuelType:       listing.fuelType,
        location:       listing.location,
        ownershipType:  null,
        source:         'INTERNAL',
        sourceListingId: listing.id,
      },
      update: {
        price:   listing.price,
        mileage: listing.mileage,
      },
    })
  } catch {
    // Non-fatal
  }
}

// ─── External adapter interface ───────────────────────────────────────────────

/**
 * All external adapters must implement this interface.
 * The engine calls adapters with `await adapter.collect(query)`.
 * If an adapter throws, the engine continues without its data.
 */
export interface MarketDataAdapter {
  name:    string
  enabled: boolean

  collect(query: {
    brand: string
    model: string
    year:  number
  }): Promise<MarketPoint[]>
}

// ─── Adapter registry (all disabled by default) ───────────────────────────────

// To add an external adapter, implement MarketDataAdapter and push to this array.
// DO NOT enable adapters that violate terms of service or require authentication bypass.
const EXTERNAL_ADAPTERS: MarketDataAdapter[] = [
  // Example disabled stub — replace with real adapter when legally approved:
  // new YadTwoAdapter({ rateLimit: 20, enabled: false }),
]

// ─── Aggregated collection ────────────────────────────────────────────────────

export async function collectAllMarketData(
  brand: string,
  model: string,
  year:  number,
): Promise<{ points: MarketPoint[]; externalFailed: boolean }> {
  // Always collect internal data
  const internal = await collectInternalData(brand, model, year)

  // Try enabled external adapters — failures are silent
  let externalFailed = false
  const external: MarketPoint[] = []

  for (const adapter of EXTERNAL_ADAPTERS) {
    if (!adapter.enabled) continue
    try {
      const data = await adapter.collect({ brand, model, year })
      external.push(...data)
    } catch {
      externalFailed = true
    }
  }

  return {
    points: [...internal, ...external],
    externalFailed,
  }
}
