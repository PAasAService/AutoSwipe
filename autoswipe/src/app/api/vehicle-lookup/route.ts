/**
 * GET /api/vehicle-lookup?plate=<plate_number>
 * ──────────────────────────────────────────────────────────────────────────
 * Unified vehicle lookup endpoint.
 * Queries car and motorcycle datasets in parallel.
 * Returns deterministic category + vehicle data.
 *
 * Response always has same shape:
 * { category: 'car' | 'motorcycle' | 'truck', data: UnifiedVehicle | null }
 */

import { NextRequest, NextResponse } from 'next/server'
import { lookupVehicleByPlate } from '@/lib/services/vehicle-lookup-orchestrator'

/**
 * Validate Israeli license plate format (7-8 digits)
 */
function validateIsraeliPlate(plate: string): boolean {
  const cleaned = plate.replace(/[^\d]/g, '')
  return cleaned.length === 7 || cleaned.length === 8
}

export async function GET(req: NextRequest) {
  const plate = req.nextUrl.searchParams.get('plate') ?? ''

  // ── Validate presence ────────────────────────────────────────────────────
  if (!plate.trim()) {
    return NextResponse.json(
      { error: 'Plate required' },
      { status: 400 }
    )
  }

  // ── Validate format ─────────────────────────────────────────────────────
  if (!validateIsraeliPlate(plate)) {
    return NextResponse.json(
      { error: 'Invalid plate format (7-8 digits)' },
      { status: 422 }
    )
  }

  try {
    const result = await lookupVehicleByPlate(plate)

    // ── Return consistent response shape ────────────────────────────────
    return NextResponse.json(
      {
        category: result.category,
        data: result.data,
      },
      {
        headers: {
          // No caching - always get fresh data
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[vehicle-lookup] Orchestration failed:', message)

    // Service unavailable (both datasets failed)
    return NextResponse.json(
      { error: 'Vehicle lookup service unavailable' },
      { status: 503 }
    )
  }
}
