/**
 * Vehicle Enrichment Service
 * ──────────────────────────────────────────────────────────────────────────
 * Enriches primary vehicle lookup data with specifications from secondary
 * government dataset (doors, engine capacity, seats).
 *
 * Per-field validation: Each field is evaluated independently for consistency.
 * Only fields with "high" confidence (identical across all matching records)
 * are enriched. Confidence tracking is internal; API returns simple values only.
 */

const GOV_API = 'https://data.gov.il/api/3/action/datastore_search'
const ENRICHMENT_RESOURCE = '142afde2-6228-49f9-8a29-9b6c3a0cbe40'
const TIMEOUT_MS = 5_000
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// ─── Internal types (confidence tracking, not exposed to API) ──────────────

interface EnrichmentFieldResult {
  value: number | string | null
  confidence: 'high' | 'none'
}

interface InternalEnrichmentData {
  doors: EnrichmentFieldResult
  engineCapacityCC: EnrichmentFieldResult
  seats: EnrichmentFieldResult
}

// ─── Secondary dataset record structure ───────────────────────────────────

interface SecondaryRecord {
  tozeret_cd: number
  degem_cd: number
  shnat_yitzur: number
  mispar_dlatot: number | null
  nefah_manoa: number | null
  mispar_moshavim: number | null
}

// ─── Public API response (simple, no confidence) ──────────────────────────

export interface PublicEnrichmentData {
  doors?: number
  engineCapacityCC?: number
  seats?: number
}

// ─── Cache ────────────────────────────────────────────────────────────────

const enrichmentCache = new Map<string, InternalEnrichmentData>()
const cacheExpiry = new Map<string, number>()

function getCacheKey(tozeret_cd: number, degem_cd: number, year: number): string {
  return `${tozeret_cd}|${degem_cd}|${year}`
}

function isCacheValid(key: string): boolean {
  const expiry = cacheExpiry.get(key)
  return expiry !== undefined && expiry > Date.now()
}

// ─── Per-field validation ─────────────────────────────────────────────────

/**
 * Validates that all records have the same value for a given field.
 * Returns the consistent value with "high" confidence, or null with "none".
 */
function validateField(
  records: SecondaryRecord[],
  fieldName: 'mispar_dlatot' | 'nefah_manoa' | 'mispar_moshavim'
): EnrichmentFieldResult {
  if (records.length === 0) {
    return { value: null, confidence: 'none' }
  }

  // Extract non-null values from all records
  const values = records
    .map((r) => r[fieldName])
    .filter((v) => v !== null && v !== undefined)

  // If no valid values exist, no enrichment
  if (values.length === 0) {
    return { value: null, confidence: 'none' }
  }

  // Check if all values are identical
  const firstValue = values[0]
  const allIdentical = values.every((v) => v === firstValue)

  if (allIdentical) {
    // Additional validation: value must be positive and reasonable
    if (typeof firstValue === 'number' && firstValue > 0) {
      return { value: firstValue, confidence: 'high' }
    }
  }

  // Inconsistent or invalid values
  return { value: null, confidence: 'none' }
}

// ─── Enrichment retrieval ─────────────────────────────────────────────────

/**
 * Fetches matching records from secondary dataset using numeric matching.
 * Returns empty array if API fails or times out.
 */
async function fetchSecondaryRecords(
  tozeret_cd: number,
  degem_cd: number,
  year: number
): Promise<SecondaryRecord[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const searchParams = new URLSearchParams()
    searchParams.append('resource_id', ENRICHMENT_RESOURCE)
    searchParams.append(
      'filters',
      JSON.stringify({
        tozeret_cd,
        degem_cd,
        shnat_yitzur: year,
      })
    )
    searchParams.append('limit', '100') // Get all variants

    const url = `${GOV_API}?${searchParams.toString()}`
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      console.error(`[VehicleEnrichment] HTTP ${response.status} from secondary API`)
      return []
    }

    const data = (await response.json()) as {
      success: boolean
      result?: { records?: SecondaryRecord[] }
      error?: unknown
    }

    if (!data.success || !data.result?.records) {
      return []
    }

    return data.result.records
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[VehicleEnrichment] Secondary API timeout')
    } else {
      console.error('[VehicleEnrichment] Secondary API error:', error)
    }
    return []
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Main enrichment function ─────────────────────────────────────────────

/**
 * Enriches vehicle data using per-field validation.
 * Each field is validated independently for consistency across all matching records.
 * Only fields with "high" confidence are returned to the public API.
 *
 * @param tozeret_cd Manufacturer code from primary lookup
 * @param degem_cd Model code from primary lookup
 * @param year Year from primary lookup
 * @returns Internal enrichment data with per-field confidence
 */
async function enrichVehicleData(
  tozeret_cd: number,
  degem_cd: number,
  year: number
): Promise<InternalEnrichmentData> {
  // Validate inputs
  if (!tozeret_cd || !degem_cd || !year || year < 1900 || year > 2100) {
    return {
      doors: { value: null, confidence: 'none' },
      engineCapacityCC: { value: null, confidence: 'none' },
      seats: { value: null, confidence: 'none' },
    }
  }

  const cacheKey = getCacheKey(tozeret_cd, degem_cd, year)

  // Check cache
  if (enrichmentCache.has(cacheKey) && isCacheValid(cacheKey)) {
    return enrichmentCache.get(cacheKey)!
  }

  // Fetch from secondary dataset
  const records = await fetchSecondaryRecords(tozeret_cd, degem_cd, year)

  // Validate each field independently
  const enrichment: InternalEnrichmentData = {
    doors: validateField(records, 'mispar_dlatot'),
    engineCapacityCC: validateField(records, 'nefah_manoa'),
    seats: validateField(records, 'mispar_moshavim'),
  }

  // Cache the result
  enrichmentCache.set(cacheKey, enrichment)
  cacheExpiry.set(cacheKey, Date.now() + CACHE_TTL_MS)

  return enrichment
}

/**
 * Converts internal enrichment data to public API response.
 * Only includes fields with "high" confidence; others are omitted.
 */
export function toPublicEnrichmentData(internal: InternalEnrichmentData): PublicEnrichmentData {
  const result: PublicEnrichmentData = {}

  if (internal.doors.confidence === 'high' && internal.doors.value !== null) {
    result.doors = internal.doors.value as number
  }

  if (
    internal.engineCapacityCC.confidence === 'high' &&
    internal.engineCapacityCC.value !== null
  ) {
    result.engineCapacityCC = internal.engineCapacityCC.value as number
  }

  if (internal.seats.confidence === 'high' && internal.seats.value !== null) {
    result.seats = internal.seats.value as number
  }

  return result
}

// ─── Public exports ───────────────────────────────────────────────────────

export { enrichVehicleData }
export type { InternalEnrichmentData }
