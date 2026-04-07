/**
 * GET /api/vehicle-lookup?plate=<plate_number>
 * ──────────────────────────────────────────────────────────────────────────
 * Server-side proxy for the Israeli Government vehicle data API.
 * Keeping the call on the server means:
 *   - No CORS issues
 *   - No credentials exposed to the browser
 *   - Next.js fetch cache handles deduplication + revalidation
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchVehicleByPlate,
  validateIsraeliPlate,
  normaliseplate,
} from '@/lib/services/vehicle-lookup'

export async function GET(req: NextRequest) {
  const plate = req.nextUrl.searchParams.get('plate') ?? ''

  // ── Basic presence check ──────────────────────────────────────────────────
  if (!plate.trim()) {
    return NextResponse.json(
      { error: 'מספר רכב חסר' },
      { status: 400 },
    )
  }

  // ── Format validation ────────────────────────────────────────────────────
  if (!validateIsraeliPlate(plate)) {
    return NextResponse.json(
      { error: 'מספר הרכב אינו תקין. יש להזין 7 או 8 ספרות.' },
      { status: 422 },
    )
  }

  const cleaned = normaliseplate(plate)

  // ── Lookup ───────────────────────────────────────────────────────────────
  const result = await fetchVehicleByPlate(cleaned)

  if (!result) {
    return NextResponse.json(
      { error: 'לא נמצאו פרטים עבור מספר הרכב הזה' },
      { status: 404 },
    )
  }

  // ── Strip any fields that might carry personal data ───────────────────────
  // (VIN / chassis number and licence-expiry are not in VehicleLookupResult,
  // but be explicit for safety.)
  const safe = {
    brand:          result.brand,
    model:          result.model,
    year:           result.year,
    fuelType:       result.fuelType,
    color:          result.color,
    ownershipType:  result.ownershipType,
    trimLevel:      result.trimLevel,
    vehicleType:    result.vehicleType,
    pollutionGroup: result.pollutionGroup,
    safetyRating:   result.safetyRating,
    firstRoadDate:  result.firstRoadDate,
  }

  return NextResponse.json(
    { data: safe },
    {
      headers: {
        // Allow client-side cache for 1 hour (same plate → same car)
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    },
  )
}
