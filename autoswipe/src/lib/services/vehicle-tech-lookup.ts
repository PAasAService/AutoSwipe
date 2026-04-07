/**
 * Vehicle Technical Specs Lookup Service
 * ──────────────────────────────────────────────────────────────────────────
 * Queries the Israeli Government Open Data Portal (data.gov.il) for
 * FULL technical specifications of a vehicle by license plate.
 *
 * API:      https://data.gov.il/api/3/action/datastore_search
 * Resource: 053530c3-0ed7-40e1-9f93-169874052382  (technical specs dataset)
 *
 * This is the valuation engine's Stage 1 data source.
 * It provides: engine volume, ownership type, trim level, etc.
 * that the basic registry lookup (vehicle-lookup.ts) does not include.
 *
 * Caching strategy:
 *   - In-memory Map for the lifetime of the server process
 *   - DB-level TTL (VehicleTechnicalRecord.expiresAt = 24h)
 */

import { prisma } from '@/lib/db'
import type { FuelType, VehicleType } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const GOV_API    = 'https://data.gov.il/api/3/action/datastore_search'
const RESOURCE   = '053530c3-0ed7-40e1-9f93-169874052382'
const TIMEOUT_MS = 10_000
const TTL_MS     = 24 * 60 * 60 * 1_000  // 24 hours

// ─── Raw API Record ───────────────────────────────────────────────────────────

export interface GovTechRecord {
  _id:                   number
  mispar_rechev:         number | string
  tozeret_cd:            number
  tozeret_nm:            string            // manufacturer name (Hebrew)
  degem_cd:              number
  degem_nm:              string            // model code string
  kinuy_mishari:         string            // commercial/marketing name
  shnat_yitzur:          number            // year of manufacture
  sug_degem:             string            // vehicle type code (P/M/J...)
  ramat_gimur:           string            // trim level
  nefah_manoa:           number | string   // engine volume in cc
  sug_delek_nm:          string            // fuel type (Hebrew)
  kvutzat_zihum:         number            // pollution group 1-15
  ramat_eivzur_betihuty: number            // safety rating
  baalut:                string            // ownership type (Hebrew)
  moed_aliya_lakvish:    string            // first road date YYYY-M
  // Personal data fields — NEVER returned to caller:
  // tokef_dt, misgeret (VIN)
}

// ─── Normalised output ────────────────────────────────────────────────────────

export interface VehicleTechProfile {
  plateNumber:    string
  brand:          string
  model:          string
  trimLevel:      string
  year:           number
  engineVolumeCc: number | null
  fuelType:       FuelType | null
  vehicleType:    VehicleType | null
  ownershipType:  OwnershipType
  pollutionGroup: number | null
  safetyRating:   number | null
  firstRoadDate:  string | null
}

export type OwnershipType = 'PRIVATE' | 'COMPANY' | 'LEASING' | 'RENTAL' | 'UNKNOWN'

// ─── In-memory L1 cache ───────────────────────────────────────────────────────

const memCache = new Map<string, VehicleTechProfile>()

// ─── Plate validation ─────────────────────────────────────────────────────────

export function validatePlate(raw: string): boolean {
  const digits = raw.replace(/[-\s]/g, '')
  return /^\d{7,8}$/.test(digits)
}

export function normalisePlate(raw: string): string {
  return raw.replace(/[-\s]/g, '').trim()
}

// ─── Brand mapping ────────────────────────────────────────────────────────────

const BRAND_MAP: Record<string, string> = {
  'טויוטה': 'Toyota', 'יונדאי': 'Hyundai', 'קיה': 'Kia',
  'מאזדה': 'Mazda', 'פולקסווגן': 'Volkswagen', 'סקודה': 'Skoda',
  'ב.מ.וו': 'BMW', 'מרצדס': 'Mercedes-Benz', 'מרצדס-בנץ': 'Mercedes-Benz',
  'אאודי': 'Audi', 'פיג׳ו': 'Peugeot', 'פיגו': 'Peugeot',
  'סיטרואן': 'Citroen', 'רנו': 'Renault', 'ניסן': 'Nissan',
  'הונדה': 'Honda', 'פורד': 'Ford', 'שברולט': 'Chevrolet',
  'אופל': 'Opel', 'סובארו': 'Subaru', 'מיצובישי': 'Mitsubishi',
  'סוזוקי': 'Suzuki', "ג'יפ": 'Jeep', 'לנד': 'Land Rover',
  'וולוו': 'Volvo', 'פיאט': 'Fiat', 'אלפא': 'Alfa Romeo',
  'לקסוס': 'Lexus', 'אינפיניטי': 'Infiniti', 'פורשה': 'Porsche',
  'מיני': 'Mini', 'סמארט': 'Smart', 'טסלה': 'Tesla',
  'BYD': 'BYD', 'מג': 'MG', 'סיאט': 'Seat', "דאצ'יה": 'Dacia',
  'קרייזלר': 'Chrysler', "דודג'": 'Dodge', "ג'אק": 'JAC',
  "צ'רי": 'Chery', 'גיאלי': 'Geely', 'ולו': 'Volvo',
}

function parseBrand(hebrewName: string): string {
  if (!hebrewName) return ''
  const first = hebrewName.split(' ')[0]
  return BRAND_MAP[first] ?? BRAND_MAP[hebrewName] ?? first
}

// ─── Fuel mapping ─────────────────────────────────────────────────────────────

const FUEL_MAP: Record<string, FuelType> = {
  'בנזין': 'GASOLINE', 'סולר': 'DIESEL', 'דיזל': 'DIESEL',
  'גז': 'GASOLINE', 'חשמל': 'ELECTRIC', 'היברידי': 'HYBRID',
  'היברידי נטען': 'PLUG_IN_HYBRID', 'פלאג אין': 'PLUG_IN_HYBRID',
  'פלאג-אין היברידי': 'PLUG_IN_HYBRID', 'מימן': 'ELECTRIC',
}

function parseFuelType(hebrew: string): FuelType | null {
  return FUEL_MAP[hebrew?.trim()] ?? null
}

// ─── Vehicle type mapping ─────────────────────────────────────────────────────

const VEHICLE_TYPE_MAP: Record<string, VehicleType> = {
  'P': 'SEDAN', 'M': 'SUV', 'J': 'SUV', 'T': 'PICKUP',
  'L': 'MINIVAN', 'O': 'WAGON',
}

function parseVehicleType(code: string): VehicleType | null {
  return VEHICLE_TYPE_MAP[code?.trim().toUpperCase()] ?? null
}

// ─── Ownership type mapping ───────────────────────────────────────────────────

function parseOwnershipType(hebrew: string): OwnershipType {
  const h = (hebrew ?? '').trim()
  if (h.includes('פרטי'))     return 'PRIVATE'
  if (h.includes('ליסינג'))   return 'LEASING'
  if (h.includes('השכרה'))    return 'RENTAL'
  if (h.includes('חברה'))     return 'COMPANY'
  if (h.includes('ממשל'))     return 'COMPANY'
  return 'UNKNOWN'
}

// ─── Map raw API record → VehicleTechProfile ─────────────────────────────────

function mapRecord(plate: string, r: GovTechRecord): VehicleTechProfile {
  const engineRaw = typeof r.nefah_manoa === 'string'
    ? parseInt(r.nefah_manoa, 10)
    : Number(r.nefah_manoa)

  return {
    plateNumber:    plate,
    brand:          parseBrand(r.tozeret_nm ?? ''),
    model:          (r.kinuy_mishari ?? r.degem_nm ?? '').trim(),
    trimLevel:      (r.ramat_gimur ?? '').trim(),
    year:           Number(r.shnat_yitzur) || new Date().getFullYear(),
    engineVolumeCc: isNaN(engineRaw) || engineRaw <= 0 ? null : engineRaw,
    fuelType:       parseFuelType(r.sug_delek_nm ?? ''),
    vehicleType:    parseVehicleType(r.sug_degem ?? ''),
    ownershipType:  parseOwnershipType(r.baalut ?? ''),
    pollutionGroup: r.kvutzat_zihum ? Number(r.kvutzat_zihum) : null,
    safetyRating:   r.ramat_eivzur_betihuty ? Number(r.ramat_eivzur_betihuty) : null,
    firstRoadDate:  (r.moed_aliya_lakvish ?? '').trim() || null,
  }
}

// ─── Safe strip (remove personal fields before persisting) ───────────────────

function stripPersonal(r: GovTechRecord): Omit<GovTechRecord, 'tokef_dt' | 'misgeret'> {
  const { ...safe } = r as unknown as Record<string, unknown>
  delete safe['tokef_dt']
  delete safe['misgeret']
  return safe as Omit<GovTechRecord, 'tokef_dt' | 'misgeret'>
}

// ─── Government fetch ─────────────────────────────────────────────────────────

async function fetchFromGov(plate: string): Promise<VehicleTechProfile | null> {
  const filters    = JSON.stringify({ mispar_rechev: parseInt(plate, 10) })
  const url        = `${GOV_API}?resource_id=${RESOURCE}&filters=${encodeURIComponent(filters)}&limit=1`
  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { Accept: 'application/json' },
      next:    { revalidate: 3600 },
    })

    if (!res.ok) return null
    const json = await res.json()
    if (!json?.success || !json?.result?.records?.length) return null

    const record = json.result.records[0] as GovTechRecord
    return mapRecord(plate, record)
  } catch (err: unknown) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('[vehicle-tech-lookup] fetch error:', err.message)
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── DB cache read/write ──────────────────────────────────────────────────────

async function readDbCache(plate: string): Promise<VehicleTechProfile | null> {
  try {
    const record = await prisma.vehicleTechnicalRecord.findUnique({
      where: { plateNumber: plate },
    })
    if (!record) return null
    if (record.expiresAt < new Date()) return null  // expired

    return {
      plateNumber:    record.plateNumber,
      brand:          record.brand,
      model:          record.model,
      trimLevel:      record.trimLevel ?? '',
      year:           record.year,
      engineVolumeCc: record.engineVolumeCc,
      fuelType:       record.fuelType as FuelType | null,
      vehicleType:    record.vehicleType as VehicleType | null,
      ownershipType:  (record.ownershipType ?? 'UNKNOWN') as OwnershipType,
      pollutionGroup: record.pollutionGroup,
      safetyRating:   record.safetyRating,
      firstRoadDate:  record.firstRoadDate,
    }
  } catch {
    return null
  }
}

async function writeDbCache(profile: VehicleTechProfile, rawRecord: GovTechRecord): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_MS)
  try {
    await prisma.vehicleTechnicalRecord.upsert({
      where:  { plateNumber: profile.plateNumber },
      create: {
        plateNumber:    profile.plateNumber,
        brand:          profile.brand,
        model:          profile.model,
        trimLevel:      profile.trimLevel || null,
        year:           profile.year,
        engineVolumeCc: profile.engineVolumeCc,
        fuelType:       profile.fuelType,
        vehicleType:    profile.vehicleType,
        ownershipType:  profile.ownershipType,
        pollutionGroup: profile.pollutionGroup,
        safetyRating:   profile.safetyRating,
        firstRoadDate:  profile.firstRoadDate,
        rawJson:        JSON.stringify(stripPersonal(rawRecord)),
        expiresAt,
      },
      update: {
        brand:          profile.brand,
        model:          profile.model,
        trimLevel:      profile.trimLevel || null,
        year:           profile.year,
        engineVolumeCc: profile.engineVolumeCc,
        fuelType:       profile.fuelType,
        vehicleType:    profile.vehicleType,
        ownershipType:  profile.ownershipType,
        pollutionGroup: profile.pollutionGroup,
        safetyRating:   profile.safetyRating,
        firstRoadDate:  profile.firstRoadDate,
        rawJson:        JSON.stringify(stripPersonal(rawRecord)),
        expiresAt,
      },
    })
  } catch {
    // Cache write failure is non-fatal
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch full technical profile for a vehicle by Israeli plate number.
 * Lookup order: L1 memory → L2 DB → L3 government API
 */
export async function fetchVehicleTechProfile(
  rawPlate: string,
): Promise<VehicleTechProfile | null> {
  if (!validatePlate(rawPlate)) return null
  const plate = normalisePlate(rawPlate)

  // L1: memory
  if (memCache.has(plate)) return memCache.get(plate) ?? null

  // L2: database
  const dbHit = await readDbCache(plate)
  if (dbHit) {
    memCache.set(plate, dbHit)
    return dbHit
  }

  // L3: government API
  const filters    = JSON.stringify({ mispar_rechev: parseInt(plate, 10) })
  const url        = `${GOV_API}?resource_id=${RESOURCE}&filters=${encodeURIComponent(filters)}&limit=1`
  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { Accept: 'application/json' },
      next:    { revalidate: 3600 },
    })

    if (!res.ok) return null
    const json = await res.json()
    if (!json?.success || !json?.result?.records?.length) return null

    const rawRecord = json.result.records[0] as GovTechRecord
    const profile   = mapRecord(plate, rawRecord)

    memCache.set(plate, profile)
    await writeDbCache(profile, rawRecord)

    return profile
  } catch (err: unknown) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('[vehicle-tech-lookup] API error:', err.message)
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── Cache invalidation (for admin use) ──────────────────────────────────────

export function evictMemoryCache(plate: string): void {
  memCache.delete(normalisePlate(plate))
}
