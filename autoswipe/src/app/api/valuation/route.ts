/**
 * GET /api/valuation
 *
 * Query params:
 *   plate?       — Israeli plate number (triggers Stage 1 tech-lookup)
 *   brand        — vehicle brand (required if no plate)
 *   model        — vehicle model (required if no plate)
 *   year         — manufacture year (required)
 *   mileage      — current odometer in km (required)
 *   ownership?   — PRIVATE | COMPANY | LEASING | RENTAL | UNKNOWN
 *   owners?      — number of previous owners (integer)
 *   askingPrice? — seller's price (used to compute priceStatus)
 *
 * Response: ValuationOutput JSON
 *
 * Caching: DB (ValuationResult table, 1h TTL)
 * If a valid cache hit exists → serve it.
 * Otherwise → run valuation engine → persist → serve.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { prisma }                    from '@/lib/db'
import { getAuthUser }               from '@/lib/mobile-auth'
import { valuate, buildCacheKey }    from '@/lib/valuation/engine'
import { fetchVehicleTechProfile }   from '@/lib/services/vehicle-tech-lookup'
import type { ValuationInput }       from '@/lib/valuation/engine'
import type { OwnershipType }        from '@/lib/services/vehicle-tech-lookup'

// ─── Validation ───────────────────────────────────────────────────────────────

const querySchema = z.object({
  plate:        z.string().optional(),
  brand:        z.string().min(1).max(80).optional(),
  model:        z.string().min(1).max(80).optional(),
  year:         z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  mileage:      z.coerce.number().int().min(0).max(1_500_000),
  ownership:    z.enum(['PRIVATE', 'COMPANY', 'LEASING', 'RENTAL', 'UNKNOWN']).optional(),
  owners:       z.coerce.number().int().min(1).max(20).optional(),
  askingPrice:  z.coerce.number().int().min(0).optional(),
  trimLevel:    z.string().max(60).optional(),
  fuelType:     z.string().max(30).optional(),
})

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function readCache(cacheKey: string) {
  try {
    const row = await prisma.valuationResult.findUnique({ where: { cacheKey } })
    if (!row) return null
    if (row.expiresAt < new Date()) return null
    return row
  } catch {
    return null
  }
}

async function writeCache(
  cacheKey: string,
  input: ValuationInput,
  output: Awaited<ReturnType<typeof valuate>>,
  plateNumber?: string,
) {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1_000)
  try {
    await prisma.valuationResult.upsert({
      where:  { cacheKey },
      create: {
        cacheKey,
        plateNumber:    plateNumber ?? null,
        brand:          input.brand,
        model:          input.model,
        trimLevel:      input.trimLevel ?? null,
        year:           input.year,
        mileage:        input.mileage,
        ownershipType:  input.ownershipType ?? null,
        quickSalePrice: output.marketRange.quickSale,
        averagePrice:   output.marketRange.average,
        premiumPrice:   output.marketRange.premium,
        confidence:     output.confidence,
        sampleSize:     output.sampleSize,
        insights:       JSON.stringify(output.insights),
        adjustments:    JSON.stringify(output.adjustments),
        priceStatus:    output.priceStatus ?? null,
        expiresAt,
      },
      update: {
        quickSalePrice: output.marketRange.quickSale,
        averagePrice:   output.marketRange.average,
        premiumPrice:   output.marketRange.premium,
        confidence:     output.confidence,
        sampleSize:     output.sampleSize,
        insights:       JSON.stringify(output.insights),
        adjustments:    JSON.stringify(output.adjustments),
        priceStatus:    output.priceStatus ?? null,
        expiresAt,
      },
    })
  } catch {
    // Cache write failure is non-fatal
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth guard — valuation is a logged-in feature
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw    = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = querySchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const params = parsed.data

  // ── Stage 1: resolve brand/model from plate if supplied ──────────────────
  let resolvedBrand = params.brand
  let resolvedModel = params.model
  let resolvedTrim  = params.trimLevel
  let resolvedOwnership = params.ownership as OwnershipType | undefined
  let plateNumber: string | undefined = params.plate

  if (params.plate) {
    const tech = await fetchVehicleTechProfile(params.plate)
    if (tech) {
      resolvedBrand     = resolvedBrand     ?? tech.brand
      resolvedModel     = resolvedModel     ?? tech.model
      resolvedTrim      = resolvedTrim      ?? tech.trimLevel
      resolvedOwnership = resolvedOwnership ?? tech.ownershipType
      plateNumber       = params.plate
    }
  }

  if (!resolvedBrand || !resolvedModel) {
    return NextResponse.json(
      { error: 'brand and model are required when no plate is provided' },
      { status: 400 },
    )
  }

  // ── Build engine input ───────────────────────────────────────────────────
  const input: ValuationInput = {
    brand:           resolvedBrand,
    model:           resolvedModel,
    trimLevel:       resolvedTrim,
    year:            params.year,
    mileage:         params.mileage,
    ownershipType:   resolvedOwnership,
    numberOfOwners:  params.owners,
    fuelType:        params.fuelType,
    askingPrice:     params.askingPrice,
  }

  // ── Check DB cache ───────────────────────────────────────────────────────
  const cacheKey = buildCacheKey(input)
  const cached   = await readCache(cacheKey)

  if (cached) {
    return NextResponse.json({
      vehicleId:   plateNumber ?? null,
      marketRange: {
        quickSale: cached.quickSalePrice,
        average:   cached.averagePrice,
        premium:   cached.premiumPrice,
      },
      confidence:  cached.confidence,
      sampleSize:  cached.sampleSize,
      priceStatus: cached.priceStatus ?? undefined,
      insights:    JSON.parse(cached.insights) as string[],
      adjustments: JSON.parse(cached.adjustments) as Record<string, number>,
      dataSource:  'MARKET_DATA',
      validUntil:  cached.expiresAt.toISOString(),
      fromCache:   true,
    })
  }

  // ── Run valuation engine ─────────────────────────────────────────────────
  try {
    const output = await valuate(input)

    // Persist result
    await writeCache(cacheKey, input, output, plateNumber)

    return NextResponse.json({
      vehicleId: plateNumber ?? null,
      ...output,
      fromCache: false,
    })
  } catch (err) {
    console.error('[api/valuation] engine error:', err)
    return NextResponse.json(
      { error: 'Valuation engine failed' },
      { status: 500 },
    )
  }
}
