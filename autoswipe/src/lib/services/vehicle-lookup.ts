/**
 * Vehicle Lookup Service
 * ──────────────────────────────────────────────────────────────────────────
 * Queries the Israeli Government Open Data Portal (data.gov.il) to retrieve
 * vehicle details by license plate number.
 *
 * API endpoint : https://data.gov.il/api/3/action/datastore_search
 * Resource ID  : 053cea08-09bc-40ec-8f7a-156f0677aff3
 * No API key required — public dataset.
 *
 * Dataset size : ~4 million records
 * License-plate field : `mispar_rechev` (integer, exact match via `filters`)
 */

import type { FuelType, VehicleType } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const GOV_API   = 'https://data.gov.il/api/3/action/datastore_search'
const RESOURCE  = '053cea08-09bc-40ec-8f7a-156f0677aff3'
const TIMEOUT_MS = 8_000

// ─── Raw API Record ────────────────────────────────────────────────────────────

export interface GovVehicleRecord {
  _id:                     number
  mispar_rechev:           number | string   // license plate
  tozeret_cd:              number            // manufacturer code
  tozeret_nm:              string            // manufacturer name (Hebrew)
  sug_degem:               string            // vehicle type code
  degem_cd:                number            // model code
  degem_nm:                string            // model code string
  kinuy_mishari:           string            // commercial/marketing name
  ramat_gimur:             string            // trim level
  ramat_eivzur_betihuty:   number            // safety rating
  kvutzat_zihum:           number            // pollution group
  shnat_yitzur:            number            // year of manufacture
  degem_manoa:             string            // engine model code
  mivchan_acharon_dt:      string            // last inspection date YYYY-MM-DD
  tokef_dt:                string            // licence expiry date (personal — not returned to client)
  baalut:                  string            // ownership type e.g. פרטי
  misgeret:                string            // VIN / chassis (personal — not returned to client)
  tzeva_cd:                number            // colour code
  tzeva_rechev:            string            // colour name (Hebrew)
  zmig_kidmi:              string            // front tyre size
  zmig_ahori:              string            // rear tyre size
  sug_delek_nm:            string            // fuel type (Hebrew)
  moed_aliya_lakvish:      string            // first-road date YYYY-M
}

// ─── Normalised result exposed to the app ─────────────────────────────────────

export interface VehicleLookupResult {
  /** English brand name, e.g. "Toyota" */
  brand:          string
  /** Commercial model name, e.g. "COROLLA" */
  model:          string
  /** Year of manufacture */
  year:           number
  /** Mapped to our FuelType enum, or null when unknown */
  fuelType:       FuelType | null
  /** Colour in Hebrew as returned by the API */
  color:          string
  /** Ownership type in Hebrew, e.g. "פרטי" */
  ownershipType:  string
  /** Trim level string */
  trimLevel:      string
  /** Mapped to our VehicleType enum, or null when unknown */
  vehicleType:    VehicleType | null
  /** Pollution group 1–15 (1 = cleanest) from kvutzat_zihum */
  pollutionGroup: number | null
  /** Safety equipment rating (1–5 scale) */
  safetyRating:   number | null
  /** First road date in YYYY-M format, e.g. "2019-3" */
  firstRoadDate:  string | null
}

// ─── In-memory cache (per server process, resets on deploy) ──────────────────

const cache = new Map<string, VehicleLookupResult | null>()

// ─── Israeli plate validation ─────────────────────────────────────────────────

/**
 * Accepts 7 or 8 digit strings with optional dashes/spaces between groups.
 * Valid examples: "1234567", "123-45-678", "12-345-67", "12345678"
 */
export function validateIsraeliPlate(raw: string): boolean {
  const digits = raw.replace(/[-\s]/g, '')
  return /^\d{7,8}$/.test(digits)
}

export function normaliseplate(raw: string): string {
  return raw.replace(/[-\s]/g, '').trim()
}

// ─── Brand name mapping: Hebrew → English ────────────────────────────────────
// `tozeret_nm` often looks like "טויוטה יפן" or "יונדאי קוריאה".
// We split on space and look up the first token, then the full string.

const BRAND_MAP: Record<string, string> = {
  'טויוטה':        'Toyota',
  'יונדאי':        'Hyundai',
  'קיה':           'Kia',
  'מאזדה':         'Mazda',
  'פולקסווגן':     'Volkswagen',
  'סקודה':         'Skoda',
  'ב.מ.וו':        'BMW',
  'מרצדס':         'Mercedes-Benz',
  'מרצדס-בנץ':     'Mercedes-Benz',
  'אאודי':         'Audi',
  'פיג׳ו':         'Peugeot',
  'פיגו':          'Peugeot',
  'סיטרואן':       'Citroen',
  'רנו':           'Renault',
  'ניסן':          'Nissan',
  'הונדה':         'Honda',
  'פורד':          'Ford',
  'שברולט':        'Chevrolet',
  'אופל':          'Opel',
  'סובארו':        'Subaru',
  'מיצובישי':      'Mitsubishi',
  'סוזוקי':        'Suzuki',
  'ג׳יפ':          'Jeep',
  'לנד':           'Land Rover',
  'וולוו':         'Volvo',
  'פיאט':          'Fiat',
  'אלפא':          'Alfa Romeo',
  'לקסוס':         'Lexus',
  'אינפיניטי':     'Infiniti',
  'פורשה':         'Porsche',
  'מיני':          'Mini',
  'סמארט':         'Smart',
  'טסלה':          'Tesla',
  'BYD':           'BYD',
  'מג':            'MG',
  'סיאט':          'Seat',
  'דאצ׳יה':        'Dacia',
  'קרייזלר':       'Chrysler',
  'דודג׳':         'Dodge',
  'ג׳אק':          'JAC',
  'צ׳רי':          'Chery',
  'גיאלי':         'Geely',
}

function parseBrand(hebrewName: string): string {
  if (!hebrewName) return ''
  const first = hebrewName.split(' ')[0]
  return (
    BRAND_MAP[first]       ??
    BRAND_MAP[hebrewName]  ??
    // Fallback: return the first Hebrew word as-is (better than nothing)
    first
  )
}

// ─── Fuel type mapping: Hebrew → FuelType enum ────────────────────────────────

const FUEL_MAP: Record<string, FuelType> = {
  'בנזין':           'GASOLINE',
  'סולר':            'DIESEL',
  'דיזל':            'DIESEL',
  'גז':              'GASOLINE',   // LPG — closest enum
  'חשמל':            'ELECTRIC',
  'היברידי':         'HYBRID',
  'היברידי נטען':    'PLUG_IN_HYBRID',
  'פלאג אין':        'PLUG_IN_HYBRID',
  'פלאג-אין היברידי':'PLUG_IN_HYBRID',
  'מימן':            'ELECTRIC',   // hydrogen — closest enum
}

function parseFuelType(hebrew: string): FuelType | null {
  if (!hebrew) return null
  return FUEL_MAP[hebrew.trim()] ?? null
}

// ─── Vehicle type mapping from `sug_degem` code ──────────────────────────────
// The API's `sug_degem` is a short code; we can make a best-effort map.

const VEHICLE_TYPE_MAP: Record<string, VehicleType> = {
  'P':  'SEDAN',     // private passenger
  'M':  'SUV',       // MPV / multi-purpose
  'J':  'SUV',       // jeep-type
  'T':  'PICKUP',    // truck
  'L':  'MINIVAN',   // light commercial / van
  'O':  'WAGON',     // other
}

function parseVehicleType(code: string): VehicleType | null {
  if (!code) return null
  return VEHICLE_TYPE_MAP[code.trim().toUpperCase()] ?? null
}

// ─── Mapper: raw record → normalised result ───────────────────────────────────

function mapRecord(r: GovVehicleRecord): VehicleLookupResult {
  return {
    brand:          parseBrand(r.tozeret_nm ?? ''),
    model:          (r.kinuy_mishari ?? r.degem_nm ?? '').trim(),
    year:           Number(r.shnat_yitzur) || new Date().getFullYear(),
    fuelType:       parseFuelType(r.sug_delek_nm ?? ''),
    color:          (r.tzeva_rechev ?? '').trim(),
    ownershipType:  (r.baalut ?? '').trim(),
    trimLevel:      (r.ramat_gimur ?? '').trim(),
    vehicleType:    parseVehicleType(r.sug_degem ?? ''),
    pollutionGroup: r.kvutzat_zihum ? Number(r.kvutzat_zihum) : null,
    safetyRating:   r.ramat_eivzur_betihuty ? Number(r.ramat_eivzur_betihuty) : null,
    firstRoadDate:  (r.moed_aliya_lakvish ?? '').trim() || null,
  }
}

// ─── Core fetch (server-side only) ────────────────────────────────────────────

async function fetchFromGov(plate: string): Promise<VehicleLookupResult | null> {
  // The API stores mispar_rechev as an integer — pass numeric value
  const filters  = JSON.stringify({ mispar_rechev: parseInt(plate, 10) })
  const url      = `${GOV_API}?resource_id=${RESOURCE}&filters=${encodeURIComponent(filters)}&limit=1`

  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      // Next.js cache: revalidate once per hour — same plate result is stable
      next: { revalidate: 3600 },
    })

    if (!res.ok) return null

    const json = await res.json()

    if (!json?.success || !json?.result?.records?.length) return null

    return mapRecord(json.result.records[0] as GovVehicleRecord)
  } catch (err: unknown) {
    // AbortError = timeout; network errors both return null gracefully
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('[vehicle-lookup] fetch error:', err.message)
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── Internal type for enrichment matching ────────────────────────────────────

export interface VehicleEnrichmentIds {
  tozeret_cd: number
  degem_cd: number
  shnat_yitzur: number
}

// ─── Extended result for internal use ──────────────────────────────────────────

interface FetchedVehicleInternal {
  result: VehicleLookupResult
  enrichmentIds: VehicleEnrichmentIds
}

// ─── Core fetch with enrichment IDs ────────────────────────────────────────────

async function fetchFromGovWithIds(plate: string): Promise<FetchedVehicleInternal | null> {
  const filters  = JSON.stringify({ mispar_rechev: parseInt(plate, 10) })
  const url      = `${GOV_API}?resource_id=${RESOURCE}&filters=${encodeURIComponent(filters)}&limit=1`

  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return null

    const json = await res.json()

    if (!json?.success || !json?.result?.records?.length) return null

    const record = json.result.records[0] as GovVehicleRecord

    return {
      result: mapRecord(record),
      enrichmentIds: {
        tozeret_cd: record.tozeret_cd,
        degem_cd: record.degem_cd,
        shnat_yitzur: record.shnat_yitzur,
      },
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('[vehicle-lookup] fetch error:', err.message)
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Look up a vehicle by Israeli license plate number.
 * Results are cached in-memory for the lifetime of the server process.
 *
 * @param rawPlate - plate number, may include dashes or spaces
 * @returns VehicleLookupResult or null when not found / API unavailable
 */
export async function fetchVehicleByPlate(
  rawPlate: string,
): Promise<VehicleLookupResult | null> {
  const plate = normaliseplate(rawPlate)

  if (cache.has(plate)) {
    return cache.get(plate) ?? null
  }

  const vehicle = await fetchFromGovWithIds(plate)
  const result = vehicle?.result ?? null
  cache.set(plate, result)
  return result
}

/**
 * Internal-only: Fetch vehicle with enrichment IDs for secondary dataset matching.
 * @param rawPlate - plate number, may include dashes or spaces
 * @returns Vehicle data + enrichment identifiers, or null
 */
export async function fetchVehicleWithEnrichmentIds(
  rawPlate: string,
): Promise<FetchedVehicleInternal | null> {
  const plate = normaliseplate(rawPlate)
  return fetchFromGovWithIds(plate)
}
