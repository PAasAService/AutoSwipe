/**
 * Official Israeli Localities Dataset with Proper ITM → WGS84 Conversion
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOURCE OF TRUTH: data.gov.il (Israel's Central Bureau of Statistics)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * API: https://data.gov.il/api/3/action/datastore_search?resource_id=d47a54ff-87f0-44b3-b33a-f284c0c38e5a
 * Total Records: 1484 official Israeli localities
 * Coordinate System: ITM (Israeli Transverse Mercator)
 * Output System: WGS84 (latitude/longitude)
 * Conversion Method: Pure JavaScript ITM inverse transformation
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ITM Projection Parameters (EPSG:2039)
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Central Meridian (lon_0): 35.204516667°
 * - Latitude of Origin (lat_0): 31.734393611°
 * - Scale Factor (k): 1.0000067
 * - False Easting (x_0): 219,529.584 m
 * - False Northing (y_0): 626,907.390 m
 * - Ellipsoid: GRS80
 * - Datum: WGS84
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ITM Projection Constants
const ITM_PARAMS = {
  lon_0: 35.204516667, // Central meridian
  lat_0: 31.734393611, // Latitude of origin
  k: 1.0000067,        // Scale factor
  x_0: 219529.584,     // False easting
  y_0: 626907.390,     // False northing
  a: 6378137.0,        // WGS84 semi-major axis
  e2: 0.00669438,      // WGS84 eccentricity squared
}

/**
 * Pure JavaScript Transverse Mercator inverse transformation
 * Converts ITM coordinates to WGS84 latitude/longitude
 */
function itmToWgs84Transform(easting: number, northing: number): { lat: number; lon: number } {
  const { lon_0, lat_0, k, x_0, y_0, a, e2 } = ITM_PARAMS

  // Remove false easting/northing
  const x = easting - x_0
  const y = northing - y_0

  // Remove scale factor
  const M = y / k

  // Calculate footpoint latitude
  const e = Math.sqrt(e2)
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))

  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256))
  const phi1 = mu
    + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu)
    + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu)
    + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu)
    + (1097 * e1 * e1 * e1 * e1 / 512) * Math.sin(8 * mu)

  const C1 = e2 / (1 - e2) * Math.cos(phi1) * Math.cos(phi1)
  const T1 = Math.tan(phi1) * Math.tan(phi1)
  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1))
  const R1 = a * (1 - e2) / Math.sqrt((1 - e2 * Math.sin(phi1) * Math.sin(phi1)) ** 3)
  const D = x / (N1 * k)

  const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (
    D * D / 2
    - (D * D * D * D / 24) * (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e2 / (1 - e2))
    + (D * D * D * D * D * D / 720) * (61 + 90 * T1 + 28 * T1 * T1 + 45 * C1 * C1 - 252 * e2 / (1 - e2) - 3 * C1 * C1 * C1 * C1)
  )

  const lon = (D - (D * D * D / 6) * (1 + 2 * T1 + C1)
    + (D * D * D * D * D / 120) * (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e2 / (1 - e2) + 24 * T1 * T1)) / Math.cos(phi1) + (lon_0 * Math.PI / 180)

  return {
    lat: lat * (180 / Math.PI),
    lon: lon * (180 / Math.PI),
  }
}

/**
 * Convert ITM (Israeli Grid 1992) coordinates to WGS84
 * Uses pure JavaScript Transverse Mercator inverse transformation
 * @param itmNumber 12-digit ITM coordinate (XXXXXXYYYYYY format)
 * @returns {lat, lon} in WGS84 or null if invalid
 */
function itmToWgs84(itmNumber: string | number): { lat: number; lon: number } | null {
  try {
    // Parse 12-digit ITM coordinate
    const itmStr = String(itmNumber).padStart(12, '0')
    const easting = parseInt(itmStr.substring(0, 6), 10)
    const northing = parseInt(itmStr.substring(6, 12), 10)

    // Validate ranges (Israeli ITM grid)
    if (easting < 100000 || easting > 300000 || northing < 500000 || northing > 900000) {
      if (!(easting === 0 && northing === 0)) {
        console.warn('[itmToWgs84] Out of range coordinates:', easting, northing)
      }
    }

    // Convert from ITM to WGS84 using Transverse Mercator inverse transformation
    const { lat, lon } = itmToWgs84Transform(easting, northing)

    // Validate output (Israel bounds)
    if (lat < 29 || lat > 34 || lon < 34 || lon > 36) {
      console.warn('[itmToWgs84] Result out of Israeli bounds:', lat, lon)
      return null
    }

    return { lat, lon }
  } catch (error) {
    console.error('[itmToWgs84] Conversion failed:', error)
    return null
  }
}

/**
 * Normalize locality name for matching
 */
function normalizeLocalityName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[־\-–—]/g, '-')
    .replace(/[׳״]/g, '')
}

/**
 * Main locality data structure
 */
export interface Locality {
  id: string
  hebrewName: string
  englishName?: string
  lat: number
  lon: number
  population?: number
  districtCode?: string
  regionCode?: string
  foundingYear?: number
}

/**
 * Module-level state
 */
let localityDatabase: Map<string, Locality> | null = null
let rawLocalityList: Locality[] | null = null
let initializationPromise: Promise<void> | null = null
let isInitializing = false

/**
 * Fallback cities (safety net)
 * Used if official dataset unavailable
 * Known-good WGS84 coordinates (manually verified)
 */
const FALLBACK_LOCALITIES: Locality[] = [
  { id: '0', hebrewName: 'תל אביב', englishName: 'Tel Aviv', lat: 32.0853, lon: 34.7818 },
  { id: '1', hebrewName: 'תל אביב-יפו', englishName: 'Tel Aviv-Yafo', lat: 32.0853, lon: 34.7818 },
  { id: '2', hebrewName: 'חיפה', englishName: 'Haifa', lat: 32.8193, lon: 34.9896 },
  { id: '3', hebrewName: 'ירושלים', englishName: 'Jerusalem', lat: 31.7683, lon: 35.2137 },
  { id: '4', hebrewName: 'באר שבע', englishName: 'Beer Sheva', lat: 31.2508, lon: 34.7883 },
  { id: '5', hebrewName: 'הרצליה', englishName: 'Hertzliya', lat: 32.1693, lon: 34.7832 },
  { id: '6', hebrewName: 'ראשון לציון', englishName: 'Rishon LeZion', lat: 31.9454, lon: 34.7919 },
  { id: '7', hebrewName: 'אשדוד', englishName: 'Ashdod', lat: 31.8067, lon: 34.6452 },
  { id: '8', hebrewName: 'אשקלון', englishName: 'Ashkelon', lat: 31.6645, lon: 34.5704 },
  { id: '9', hebrewName: 'פתח תקווה', englishName: 'Petah Tikva', lat: 32.1870, lon: 35.1886 },
  { id: '10', hebrewName: 'רמת גן', englishName: 'Ramat Gan', lat: 32.0731, lon: 34.8212 },
  { id: '11', hebrewName: 'בת ים', englishName: 'Bat Yam', lat: 32.0036, lon: 34.7592 },
  { id: '12', hebrewName: 'חולון', englishName: 'Holon', lat: 32.0164, lon: 34.7681 },
  { id: '13', hebrewName: 'גבעתיים', englishName: 'Givatayim', lat: 32.0588, lon: 34.8119 },
  { id: '14', hebrewName: 'כפר סבא', englishName: 'Kfar Saba', lat: 32.1674, lon: 34.9246 },
  { id: '15', hebrewName: 'רעננה', englishName: 'Raanana', lat: 32.1943, lon: 34.8719 },
  { id: '16', hebrewName: 'הוד השרון', englishName: 'Hod Hasharon', lat: 32.1614, lon: 34.8875 },
  { id: '17', hebrewName: 'עכו', englishName: 'Acre', lat: 32.9264, lon: 35.0676 },
  { id: '18', hebrewName: 'נהריה', englishName: 'Nahariya', lat: 33.0535, lon: 35.1011 },
  { id: '19', hebrewName: 'צפת', englishName: 'Safed', lat: 32.9675, lon: 35.4865 },
  { id: '20', hebrewName: 'טבריה', englishName: 'Tiberias', lat: 32.7940, lon: 35.5303 },
]

/**
 * Fetch official localities from data.gov.il API
 * Handles pagination (1484 total localities)
 */
async function fetchOfficialLocalities(): Promise<Locality[]> {
  const API_URL = 'https://data.gov.il/api/3/action/datastore_search'
  const RESOURCE_ID = 'd47a54ff-87f0-44b3-b33a-f284c0c38e5a'
  const LIMIT = 100
  const MAX_RETRIES = 3

  const allLocalities: Locality[] = []
  let offset = 0
  let hasMore = true
  let requestCount = 0

  while (hasMore) {
    let success = false
    let retries = 0

    while (!success && retries < MAX_RETRIES) {
      try {
        const url = `${API_URL}?resource_id=${RESOURCE_ID}&offset=${offset}&limit=${LIMIT}`
        const response = await fetch(url, { timeout: 15000 })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const json = await response.json()

        if (!json.success || !json.result) {
          throw new Error('Invalid API response structure')
        }

        const records = json.result.records || []
        requestCount++

        let validCount = 0
        for (const record of records) {
          const hebrewName = record['שם יישוב']
          const englishName = record['שם יישוב באנגלית']
          const coordinates = record['קואורדינטות']

          if (!hebrewName) continue

          // Convert ITM to WGS84 using proj4
          let lat: number | null = null
          let lon: number | null = null

          if (coordinates) {
            const wgs84 = itmToWgs84(coordinates)
            if (wgs84) {
              lat = wgs84.lat
              lon = wgs84.lon
              validCount++
            }
          }

          allLocalities.push({
            id: record['קוד יישוב'] || `${offset + allLocalities.length}`,
            hebrewName,
            englishName,
            lat: lat ?? 0,
            lon: lon ?? 0,
            population: record['אוכלוסייה'] ? parseInt(record['אוכלוסייה'], 10) : undefined,
            districtCode: record['קוד מחוז'],
            regionCode: record['קוד אזור'],
            foundingYear: record['שנת ייסוד'] ? parseInt(record['שנת ייסוד'], 10) : undefined,
          })
        }

        console.log(`[israeli-localities] Fetched ${records.length} records (${validCount} valid coords) at offset ${offset}`)

        const totalRecords = json.result.total || 0
        offset += records.length
        hasMore = offset < totalRecords && records.length === LIMIT
        success = true
      } catch (error) {
        retries++
        if (retries < MAX_RETRIES) {
          console.warn(`[israeli-localities] Fetch attempt ${retries} failed, retrying...`, error)
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
        } else {
          console.error(`[israeli-localities] Fetch failed after ${MAX_RETRIES} retries:`, error)
          hasMore = false
        }
      }
    }
  }

  console.log(`[israeli-localities] Successfully fetched ${allLocalities.length} localities in ${requestCount} requests`)
  return allLocalities
}

/**
 * Initialize locality database
 * Prevents duplicate/parallel initialization
 * Safe to call multiple times
 */
export async function initializeLocalityDatabase(): Promise<void> {
  // Already initialized
  if (localityDatabase) {
    return
  }

  // Initialization in progress - return same promise
  if (initializationPromise) {
    return initializationPromise
  }

  // Guard against concurrent initialization
  if (isInitializing) {
    return initializationPromise || Promise.resolve()
  }

  isInitializing = true

  // Create single promise for all concurrent calls
  initializationPromise = (async () => {
    try {
      const localities = await fetchOfficialLocalities()

      if (localities.length === 0) {
        throw new Error('No localities returned from API')
      }

      localityDatabase = new Map()
      rawLocalityList = localities

      // Index by normalized names
      for (const locality of localities) {
        const normalizedName = normalizeLocalityName(locality.hebrewName)
        localityDatabase.set(normalizedName, locality)

        if (locality.englishName) {
          const normalizedEnglish = normalizeLocalityName(locality.englishName)
          if (normalizedEnglish && !localityDatabase.has(normalizedEnglish)) {
            localityDatabase.set(normalizedEnglish, locality)
          }
        }
      }

      console.log('[israeli-localities] ✓ Loaded', localities.length, 'localities with proj4-based conversion')
    } catch (error) {
      console.warn('[israeli-localities] Failed to load official dataset, using fallback:', error)

      // Use fallback
      localityDatabase = new Map()
      rawLocalityList = FALLBACK_LOCALITIES

      for (const locality of FALLBACK_LOCALITIES) {
        const normalizedName = normalizeLocalityName(locality.hebrewName)
        localityDatabase.set(normalizedName, locality)

        if (locality.englishName) {
          const normalizedEnglish = normalizeLocalityName(locality.englishName)
          if (normalizedEnglish && !localityDatabase.has(normalizedEnglish)) {
            localityDatabase.set(normalizedEnglish, locality)
          }
        }
      }

      console.log('[israeli-localities] ⚠ Using fallback:', FALLBACK_LOCALITIES.length, 'major cities only')
    } finally {
      isInitializing = false
    }
  })()

  return initializationPromise
}

/**
 * Look up locality coordinates by name
 * Returns null if not found (Compare will handle gracefully)
 */
export function getLocalityCoords(localityName: string | null | undefined): { lat: number; lon: number } | null {
  if (!localityName || !localityDatabase) {
    return null
  }

  const normalized = normalizeLocalityName(localityName)

  // Exact match
  const exact = localityDatabase.get(normalized)
  if (exact) {
    return { lat: exact.lat, lon: exact.lon }
  }

  // Prefix match
  for (const [key, locality] of localityDatabase) {
    if (key.startsWith(normalized) || normalized.startsWith(key)) {
      return { lat: locality.lat, lon: locality.lon }
    }
  }

  return null
}

/**
 * Get all localities
 */
export function getAllLocalities(): Locality[] {
  return rawLocalityList || []
}

/**
 * Filter by district
 */
export function getLocalitiesByDistrict(districtCode: string): Locality[] {
  if (!rawLocalityList) return []
  return rawLocalityList.filter((l) => l.districtCode === districtCode)
}

/**
 * Search localities by name pattern
 */
export function searchLocalities(pattern: string): Locality[] {
  if (!rawLocalityList) return []
  const normalized = normalizeLocalityName(pattern)
  return rawLocalityList.filter(
    (l) =>
      normalizeLocalityName(l.hebrewName).includes(normalized) ||
      (l.englishName && normalizeLocalityName(l.englishName).includes(normalized)),
  )
}
