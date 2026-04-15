/**
 * Car Vehicle Lookup Service
 *
 * Queries Israeli government car dataset via data.gov.il API
 * Dataset: 053cea08-09bc-40ec-8f7a-156f0677aff3 (4.1M vehicles)
 *
 * Returns UnifiedVehicle with enrichment IDs for secondary dataset matching
 */

const GOV_API = 'https://data.gov.il/api/3/action/datastore_search'
const CAR_DATASET_ID = '053cea08-09bc-40ec-8f7a-156f0677aff3'
const TIMEOUT_MS = 5_000

export interface CarDatasetRecord {
  mispar_rechev: number
  tozeret_cd: number
  tozeret_nm: string
  degem_cd: number
  degem_nm: string
  shnat_yitzur: number
  sug_delek_nm?: string
  tzeva_rechev?: string
  kinuy_mishari?: string
}

export interface CarLookupResult {
  category: 'car'
  data: {
    licenseState: 'car'
    category: 'car'
    brand: string
    model: string
    year: number
    fuelType?: string
    color?: string
    isGovVerified: boolean
    tozeret_cd: number
    degem_cd: number
    shnat_yitzur: number
  }
}

/**
 * Normalize license plate for API query
 */
function normalizePlateForSearch(plate: string): string {
  // Remove spaces, dashes, return as string
  return plate.replace(/[\s\-]/g, '').trim()
}

/**
 * Parse fuel type from Hebrew dataset string
 */
function parseFuelType(hebrewFuel?: string): string | undefined {
  if (!hebrewFuel) return undefined

  const fuelMap: Record<string, string> = {
    בנזין: 'petrol',
    דיזל: 'diesel',
    חשמל: 'electric',
    היברידי: 'hybrid',
    גז: 'lpg',
  }

  return fuelMap[hebrewFuel] || hebrewFuel
}

/**
 * Parse color from Hebrew dataset string
 */
function parseColor(hebrewColor?: string): string | undefined {
  if (!hebrewColor) return undefined

  const colorMap: Record<string, string> = {
    'שחור': 'black',
    'לבן': 'white',
    'אדום': 'red',
    'כסף': 'silver',
    'אפור': 'gray',
    'כחול': 'blue',
    'ירוק': 'green',
    'זהב': 'gold',
    'חום': 'brown',
  }

  return colorMap[hebrewColor] || hebrewColor
}

/**
 * Detect if a string is an internal code (not human-readable model name)
 * Internal codes include:
 * - Mixed case alphanumeric (e.g., 5RBU0D, kinui123)
 * - Dash-separated IDs (e.g., MXPA11L-BHXNBW)
 * - Short alphanumeric sequences without clear words
 * - All-caps multi-segment codes (e.g., ABC-DEF-GHI)
 */
function isInternalCode(value: string): boolean {
  if (!value) return false

  // All-caps with dashes (e.g., MXPA11L-BHXNBW)
  if (/^[A-Z0-9]+-[A-Z0-9]+/.test(value)) {
    return true
  }

  // Mixed case with numbers or mixed case pattern (e.g., 5RBU0D)
  if (/^[a-zA-Z0-9]{6,}$/.test(value) && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value)) {
    return true
  }

  // Short codes like 5RBU0D (short mixed-case alphanumeric)
  if (/^[A-Z0-9]*[a-z][A-Z0-9]*$/.test(value) && value.length <= 10) {
    return true
  }

  // Values that look like database keys or internal identifiers
  if (/^[A-Z]{2,4}\d{2,}[A-Z]?$/.test(value) && value.length <= 8) {
    return true
  }

  return false
}

/**
 * Extract human-readable model name from dataset record
 * Primary: kinuy_mishari (commercial/marketing name) if human-readable
 * Fallback: degem_nm (if human-readable and kinuy_mishari not available)
 * Return: null if all candidates are internal codes or unavailable
 */
function extractModel(record: CarDatasetRecord): string | null {
  console.log('[extractModel] kinuy_mishari:', record.kinuy_mishari)
  console.log('[extractModel] degem_nm:', record.degem_nm)

  // Primary: kinuy_mishari (human-readable commercial name)
  if (record.kinuy_mishari?.trim()) {
    const trimmed = record.kinuy_mishari.trim()
    if (!isInternalCode(trimmed)) {
      console.log('[extractModel] RETURNING kinuy_mishari (human-readable):', trimmed)
      return trimmed
    }
    console.log('[extractModel] kinuy_mishari is internal code, skipping:', trimmed)
  }

  // Fallback: degem_nm (if primary unavailable or is internal code)
  if (record.degem_nm?.trim()) {
    const trimmed = record.degem_nm.trim()
    if (!isInternalCode(trimmed)) {
      console.log('[extractModel] RETURNING degem_nm (fallback, human-readable):', trimmed)
      return trimmed
    }
    console.log('[extractModel] degem_nm is internal code, skipping:', trimmed)
  }

  // Both unavailable or all are internal codes
  console.log('[extractModel] RETURNING null - no human-readable model found')
  return null
}

/**
 * Lookup vehicle by license plate in car dataset
 *
 * @param plate License plate number (7-8 digits)
 * @returns CarLookupResult or null if not found
 * @throws Error on API failure or timeout
 */
export async function lookupCarOptimized(plate: string): Promise<CarLookupResult | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const cleanPlate = normalizePlateForSearch(plate)

    const searchParams = new URLSearchParams()
    searchParams.append('resource_id', CAR_DATASET_ID)
    searchParams.append('q', cleanPlate) // Full-text search by plate
    searchParams.append('limit', '10') // Get multiple results to handle variations

    const url = `${GOV_API}?${searchParams.toString()}`

    const response = await fetch(url, {
      signal: controller.signal,
      timeout: TIMEOUT_MS,
    })

    if (!response.ok) {
      throw new Error(`Car dataset API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      success: boolean
      result?: { records?: CarDatasetRecord[] }
    }

    if (!data.success || !data.result?.records || data.result.records.length === 0) {
      return null
    }

    // Use first result (should be exact match or closest)
    const record = data.result.records[0]

    // Validate required fields
    if (!record.tozeret_cd || !record.degem_cd || !record.shnat_yitzur) {
      return null
    }

    const model = extractModel(record)
    console.log('[lookupCarOptimized] Final model value:', model)

    if (!model) {
      console.log('[lookupCarOptimized] Model is null, returning null')
      return null
    }

    const result = {
      category: 'car',
      data: {
        licenseState: 'car',
        category: 'car',
        brand: record.tozeret_nm?.trim() || 'Unknown',
        model: model,
        year: record.shnat_yitzur,
        fuelType: parseFuelType(record.sug_delek_nm),
        color: parseColor(record.tzeva_rechev),
        isGovVerified: true,
        tozeret_cd: record.tozeret_cd,
        degem_cd: record.degem_cd,
        shnat_yitzur: record.shnat_yitzur,
      },
    }

    console.log('[lookupCarOptimized] Returning result:', { category: result.category, model: result.data.model })
    return result
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Car dataset lookup timeout (5s)')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
