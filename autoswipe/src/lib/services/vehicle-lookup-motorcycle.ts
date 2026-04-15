/**
 * Motorcycle Vehicle Lookup Service
 *
 * Queries Israeli government motorcycle dataset via data.gov.il API
 * Dataset: bf9df4e2-d90d-4c0a-a400-19e15af8e95f (185K motorcycles)
 *
 * Returns UnifiedVehicle formatted data
 */

const GOV_API = 'https://data.gov.il/api/3/action/datastore_search'
const MOTORCYCLE_DATASET_ID = 'bf9df4e2-d90d-4c0a-a400-19e15af8e95f'
const TIMEOUT_MS = 5_000

export interface MotorcycleDatasetRecord {
  mispar_rechev: number
  tozeret_cd: number
  tozeret_nm: string
  degem_nm: string
  shnat_yitzur: number
  sug_delek_nm?: string
  nefach_manoa?: number
  mispar_mekomot?: number
  sug_rechev_nm?: string
}

export interface MotorcycleLookupResult {
  category: 'motorcycle'
  data: {
    licenseState: 'motorcycle'
    category: 'motorcycle'
    brand: string
    model: string
    year: number
    fuelType?: string
    engineCapacityCC?: number
    seatCapacity?: number
    motorcycleType?: string
    isGovVerified: boolean
    tozeret_cd: number
    degem_cd?: number
    shnat_yitzur: number
  }
}

/**
 * Normalize license plate for API query
 */
function normalizePlateForSearch(plate: string): string {
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
 * Parse motorcycle type from Hebrew dataset string
 */
function parseMotorcycleType(hebrewType?: string): string | undefined {
  if (!hebrewType) return undefined

  const typeMap: Record<string, string> = {
    'אופנוע': 'motorcycle',
    'קטנוע': 'scooter',
    'אופני עוצמה': 'ebike',
  }

  return typeMap[hebrewType] || hebrewType
}

/**
 * Detect if a string is an internal code (not human-readable model name)
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
 * Lookup vehicle by license plate in motorcycle dataset
 *
 * @param plate License plate number (7-8 digits)
 * @returns MotorcycleLookupResult or null if not found
 * @throws Error on API failure or timeout
 */
export async function lookupMotorcycleOptimized(
  plate: string
): Promise<MotorcycleLookupResult | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const cleanPlate = normalizePlateForSearch(plate)

    const searchParams = new URLSearchParams()
    searchParams.append('resource_id', MOTORCYCLE_DATASET_ID)
    searchParams.append('q', cleanPlate) // Full-text search by plate
    searchParams.append('limit', '10')

    const url = `${GOV_API}?${searchParams.toString()}`

    const response = await fetch(url, {
      signal: controller.signal,
      timeout: TIMEOUT_MS,
    })

    if (!response.ok) {
      throw new Error(`Motorcycle dataset API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      success: boolean
      result?: { records?: MotorcycleDatasetRecord[] }
    }

    if (!data.success || !data.result?.records || data.result.records.length === 0) {
      return null
    }

    // Use first result
    const record = data.result.records[0]

    // Validate required fields
    if (!record.tozeret_cd || !record.shnat_yitzur) {
      return null
    }

    // Extract model name (reject internal codes)
    const modelCandidate = record.degem_nm?.trim()
    if (!modelCandidate || isInternalCode(modelCandidate)) {
      return null
    }
    const model = modelCandidate

    return {
      category: 'motorcycle',
      data: {
        licenseState: 'motorcycle',
        category: 'motorcycle',
        brand: record.tozeret_nm?.trim() || 'Unknown',
        model: model,
        year: record.shnat_yitzur,
        fuelType: parseFuelType(record.sug_delek_nm),
        engineCapacityCC: record.nefach_manoa || undefined,
        seatCapacity: record.mispar_mekomot || undefined,
        motorcycleType: parseMotorcycleType(record.sug_rechev_nm),
        isGovVerified: true,
        tozeret_cd: record.tozeret_cd,
        shnat_yitzur: record.shnat_yitzur,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Motorcycle dataset lookup timeout (5s)')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
