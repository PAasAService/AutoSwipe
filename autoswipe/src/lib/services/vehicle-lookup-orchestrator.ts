/**
 * Vehicle Lookup Orchestrator
 *
 * Coordinates parallel lookup across car and motorcycle datasets.
 * Applies deterministic priority: car > motorcycle > truck fallback.
 *
 * Features:
 * - Parallel API calls (no sequential fallback)
 * - Graceful degradation (single failure is acceptable)
 * - Car enrichment applied automatically
 * - Truck fallback when no match found
 */

import { lookupCarOptimized, CarLookupResult } from './vehicle-lookup-car'
import { lookupMotorcycleOptimized, MotorcycleLookupResult } from './vehicle-lookup-motorcycle'
import { enrichVehicleData, toPublicEnrichmentData } from './vehicle-enrichment'

export interface UnifiedVehicle {
  licenseState: string
  category: 'car' | 'motorcycle' | 'truck'
  brand?: string
  model?: string
  year?: number
  fuelType?: string
  color?: string
  engineCapacityCC?: number
  seatCapacity?: number
  motorcycleType?: string
  maxGrossWeight?: number
  cargoCapacity?: number
  vehicleType?: string
  isGovVerified: boolean
  tozeret_cd?: number
  degem_cd?: number
  shnat_yitzur?: number
}

export interface VehicleLookupResponse {
  category: 'car' | 'motorcycle' | 'truck'
  data: UnifiedVehicle | null
}

/**
 * Normalize license plate
 */
function normalizeplate(plate: string): string {
  return plate.replace(/[\s\-]/g, '').trim()
}

/**
 * Validate Israeli license plate format (7-8 digits)
 */
function validateIsraeliPlate(plate: string): boolean {
  const cleaned = plate.replace(/[^\d]/g, '')
  return cleaned.length === 7 || cleaned.length === 8
}

/**
 * Lookup vehicle across all datasets with deterministic priority.
 *
 * Priority:
 *   1. If car dataset has data → use car
 *   2. Else if motorcycle dataset has data → use motorcycle
 *   3. Else if at least one dataset succeeded → truck (fallback)
 *   4. Else (both failed) → throw error
 *
 * @param plate License plate
 * @returns VehicleLookupResponse with category and data
 * @throws Error if both datasets fail
 */
export async function lookupVehicleByPlate(plate: string): Promise<VehicleLookupResponse> {
  const cleanedPlate = normalizeplate(plate)

  if (!validateIsraeliPlate(plate)) {
    throw new Error('Invalid Israeli plate format (7-8 digits)')
  }

  // Parallel lookup: both datasets simultaneously
  const [carPromise, motorcyclePromise] = await Promise.allSettled([
    lookupCarOptimized(cleanedPlate),
    lookupMotorcycleOptimized(cleanedPlate),
  ])

  // Extract results and failures
  const carResult = carPromise.status === 'fulfilled' ? carPromise.value : null
  const carFailed = carPromise.status === 'rejected'
  const carError = carFailed ? carPromise.reason : null

  const motorcycleResult = motorcyclePromise.status === 'fulfilled' ? motorcyclePromise.value : null
  const motorcycleFailed = motorcyclePromise.status === 'rejected'
  const motorcycleError = motorcycleFailed ? motorcyclePromise.reason : null

  // Log for debugging (temporary)
  console.log('[vehicle-lookup-orchestrator]', {
    plate: cleanedPlate,
    carResult: carResult ? { category: 'car', brand: carResult.data.brand } : null,
    carFailed,
    carError: carError?.message,
    motorcycleResult: motorcycleResult
      ? { category: 'motorcycle', brand: motorcycleResult.data.brand }
      : null,
    motorcycleFailed,
    motorcycleError: motorcycleError?.message,
  })

  // Priority 1: Car has data
  if (carResult) {
    console.log('[vehicle-lookup-orchestrator] Selected: car')
    console.log('[vehicle-lookup-orchestrator] Car model from lookupCarOptimized:', carResult.data.model)

    // Apply enrichment for cars
    let enrichmentData = {}
    try {
      const internalEnrichment = await enrichVehicleData(
        carResult.data.tozeret_cd,
        carResult.data.degem_cd,
        carResult.data.shnat_yitzur,
      )
      enrichmentData = toPublicEnrichmentData(internalEnrichment)
      console.log('[vehicle-lookup-orchestrator] Enrichment applied:', enrichmentData)
    } catch (error) {
      console.error('[vehicle-lookup-orchestrator] Enrichment failed:', error)
      // Non-critical; continue without enrichment
    }

    const finalResult: VehicleLookupResponse = {
      category: 'car',
      data: {
        ...carResult.data,
        ...enrichmentData,
      } as UnifiedVehicle,
    }
    console.log('[vehicle-lookup-orchestrator] Final response model:', finalResult.data?.model)
    return finalResult
  }

  // Priority 2: Motorcycle has data
  if (motorcycleResult) {
    console.log('[vehicle-lookup-orchestrator] Selected: motorcycle')
    return {
      category: 'motorcycle',
      data: motorcycleResult.data,
    }
  }

  // Priority 3: At least one succeeded (even with no match)
  if (!carFailed || !motorcycleFailed) {
    console.log('[vehicle-lookup-orchestrator] Selected: truck (fallback)')
    return {
      category: 'truck',
      data: null,
    }
  }

  // Priority 4: Both failed
  console.error('[vehicle-lookup-orchestrator] All datasets failed', {
    carError: carError?.message,
    motorcycleError: motorcycleError?.message,
  })

  throw new Error(
    `Vehicle lookup failed: ${carError?.message || 'unknown'} | ${motorcycleError?.message || 'unknown'}`
  )
}
