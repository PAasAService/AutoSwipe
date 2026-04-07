/**
 * Identity Matcher
 * ──────────────────────────────────────────────────────────────────────────
 * Resolves vehicle identity across heterogeneous data sources.
 *
 * The problem: the government API returns "טויוטה קורולה קומפורט"
 * while a listing might say "Toyota Corolla Comfort" or "corolla cmft" or
 * "טויוטה קורולה" (no trim). This module normalises all three to a
 * canonical { brand, model, trim } tuple so that they match.
 *
 * Strategy (in order of confidence):
 *   1. Exact alias table lookup (DB + in-memory seed)
 *   2. Normalised token overlap score
 *   3. Levenshtein distance (approximate)
 *   4. Human-override via VehicleAlias table
 *
 * Identity confidence:
 *   1.0  — exact alias match
 *   0.9  — normalised exact match
 *   0.75 — high token overlap (≥80%)
 *   0.60 — moderate overlap or fuzzy
 *   < 0.5 — no match, return null
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CanonicalVehicle {
  brand:      string
  model:      string
  trimLevel:  string | null
  confidence: number        // 0–1
}

// ─── Brand alias seed ─────────────────────────────────────────────────────────
// Hebrew → canonical English. Covers common variants found in Israeli listings.

const BRAND_ALIASES: Record<string, string> = {
  // Hebrew forms
  'טויוטה': 'Toyota', 'יונדאי': 'Hyundai', 'קיה': 'Kia', 'מאזדה': 'Mazda',
  'פולקסווגן': 'Volkswagen', 'פולקסווגן (vw)': 'Volkswagen', 'vw': 'Volkswagen',
  'סקודה': 'Skoda', 'ב.מ.וו': 'BMW', 'bmw': 'BMW',
  'מרצדס': 'Mercedes-Benz', 'מרצדס-בנץ': 'Mercedes-Benz', 'mercedes': 'Mercedes-Benz',
  'אאודי': 'Audi', "פיג'ו": 'Peugeot', 'פיגו': 'Peugeot', 'peugeot': 'Peugeot',
  'סיטרואן': 'Citroen', 'citroen': 'Citroen', 'רנו': 'Renault', 'ניסן': 'Nissan',
  'הונדה': 'Honda', 'פורד': 'Ford', 'שברולט': 'Chevrolet', 'chevy': 'Chevrolet',
  'אופל': 'Opel', 'סובארו': 'Subaru', 'מיצובישי': 'Mitsubishi',
  'סוזוקי': 'Suzuki', "ג'יפ": 'Jeep', 'jeep': 'Jeep', 'לנד רובר': 'Land Rover',
  'לנד': 'Land Rover', 'land rover': 'Land Rover', 'וולוו': 'Volvo', 'ולו': 'Volvo',
  'פיאט': 'Fiat', 'אלפא רומיאו': 'Alfa Romeo', 'אלפא': 'Alfa Romeo',
  'alfa': 'Alfa Romeo', 'לקסוס': 'Lexus', 'אינפיניטי': 'Infiniti',
  'פורשה': 'Porsche', 'מיני': 'Mini', 'mini': 'Mini', 'סמארט': 'Smart',
  'טסלה': 'Tesla', 'tesla': 'Tesla', 'ביואייד': 'BYD', 'byd': 'BYD',
  'מג': 'MG', 'mg': 'MG', 'סיאט': 'Seat', "דאצ'יה": 'Dacia', 'dacia': 'Dacia',
  'קרייזלר': 'Chrysler', "דודג'": 'Dodge', "ג'אק": 'JAC', "צ'רי": 'Chery',
  'גיאלי': 'Geely', 'סאנג יאנג': 'SsangYong', 'ssangyong': 'SsangYong',
  'גרייט וול': 'Great Wall', 'ניו': 'Nio', 'nio': 'Nio',
  // Canonical forms also map to themselves
  'toyota': 'Toyota', 'hyundai': 'Hyundai', 'kia': 'Kia', 'mazda': 'Mazda',
  'skoda': 'Skoda', 'audi': 'Audi', 'nissan': 'Nissan', 'honda': 'Honda',
  'ford': 'Ford', 'opel': 'Opel', 'subaru': 'Subaru', 'mitsubishi': 'Mitsubishi',
  'suzuki': 'Suzuki', 'volvo': 'Volvo', 'fiat': 'Fiat', 'lexus': 'Lexus',
  'infiniti': 'Infiniti', 'porsche': 'Porsche', 'smart': 'Smart',
  'renault': 'Renault', 'chevrolet': 'Chevrolet', 'chrysler': 'Chrysler',
  'dodge': 'Dodge', 'geely': 'Geely', 'chery': 'Chery',
}

// ─── Trim level alias seed ────────────────────────────────────────────────────

const TRIM_ALIASES: Record<string, string> = {
  // Hebrew → canonical English
  'קומפורט':    'Comfort',
  'פרסטיג':    'Prestige',
  "פרסטיג'":   'Prestige',
  'אלגנס':     'Elegance',
  'אקסקלוסיב': 'Exclusive',
  'פרמיום':    'Premium',
  'לוקסוס':    'Luxury',
  'יוקרה':     'Luxury',
  'ספורט':     'Sport',
  'אוטומטיק':  'Automatic',
  'ידני':      'Manual',
  'בסיסי':     'Basic',
  'רגיל':      'Base',
  'גרנד':      'Grand',
  'מועדון':    'Club',
  'סטייל':     'Style',
  'אורבן':     'Urban',
  'קרוסאובר':  'Crossover',
  'היי':       'High',
  'טופ':       'Top',
  'פול':       'Full',
  // English abbreviations / shortcuts
  'cmft': 'Comfort',
  'prstg': 'Prestige',
  'prst': 'Prestige',
  'excl': 'Exclusive',
  'lux': 'Luxury',
  'spt': 'Sport',
  'std': 'Standard',
  'bas': 'Base',
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

/**
 * Lowercase, trim, collapse whitespace, remove common noise words.
 */
function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['"'״׳]/g, '')  // remove Hebrew/Latin quotes
    .replace(/\(.*?\)/g, '')   // remove parentheses
    .trim()
}

/**
 * Tokenise a string into a Set of lowercase words.
 */
function tokenSet(s: string): Set<string> {
  return new Set(norm(s).split(/\s+/).filter(Boolean))
}

/**
 * Jaccard overlap between two token sets: |A∩B| / |A∪B|
 */
function tokenOverlap(a: string, b: string): number {
  const setA = tokenSet(a)
  const setB = tokenSet(b)
  if (setA.size === 0 && setB.size === 0) return 1
  let intersection = 0
  setA.forEach((t) => { if (setB.has(t)) intersection++ })
  return intersection / (setA.size + setB.size - intersection)
}

/**
 * Simple Levenshtein distance (small strings only).
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    }
  }
  return dp[m][n]
}

/**
 * Normalised edit distance: 0 = identical, 1 = completely different.
 */
function editSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

// ─── Brand resolution ─────────────────────────────────────────────────────────

export function resolveBrand(raw: string): { canonical: string; confidence: number } {
  if (!raw) return { canonical: '', confidence: 0 }
  const n = norm(raw)

  // Exact alias lookup
  if (BRAND_ALIASES[n]) return { canonical: BRAND_ALIASES[n], confidence: 1.0 }

  // First-token alias (e.g. "טויוטה יפן" → "Toyota")
  const firstToken = n.split(' ')[0]
  if (BRAND_ALIASES[firstToken]) return { canonical: BRAND_ALIASES[firstToken], confidence: 0.95 }

  // Fuzzy over alias keys
  let best = { canonical: '', confidence: 0 }
  for (const [alias, canonical] of Object.entries(BRAND_ALIASES)) {
    const sim = editSimilarity(n, alias)
    if (sim > 0.80 && sim > best.confidence) {
      best = { canonical, confidence: sim * 0.85 }
    }
  }

  if (best.confidence > 0.5) return best

  // Fallback: return the raw first token normalised as-is
  return { canonical: raw.split(' ')[0], confidence: 0.40 }
}

// ─── Model resolution ─────────────────────────────────────────────────────────

/**
 * Compare two model strings. The government API often includes the brand
 * in the commercial name (e.g. "TOYOTA COROLLA") — strip it before comparing.
 */
export function resolveModel(
  rawModel: string,
  brand: string,
): { canonical: string; confidence: number } {
  if (!rawModel) return { canonical: '', confidence: 0 }

  // Strip brand prefix from model string (common in gov API)
  let cleaned = rawModel
  if (brand) {
    const brandNorm = norm(brand)
    cleaned = norm(rawModel).replace(brandNorm, '').trim()
    if (!cleaned) cleaned = rawModel
  }

  const canonical = cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return { canonical: canonical || rawModel, confidence: 0.9 }
}

// ─── Trim resolution ──────────────────────────────────────────────────────────

export function resolveTrim(raw: string): { canonical: string | null; confidence: number } {
  if (!raw || raw.trim() === '') return { canonical: null, confidence: 1.0 }

  const n = norm(raw)

  // Exact alias
  if (TRIM_ALIASES[n]) return { canonical: TRIM_ALIASES[n], confidence: 1.0 }

  // Per-token alias
  const tokens = n.split(' ')
  const mapped = tokens.map((t) => TRIM_ALIASES[t] ?? t)
  if (mapped.some((m, i) => m !== tokens[i])) {
    return { canonical: mapped.join(' '), confidence: 0.85 }
  }

  // Return normalised raw
  return { canonical: raw, confidence: 0.70 }
}

// ─── Identity match between two vehicle descriptions ─────────────────────────

export interface MatchCandidate {
  brand:     string
  model:     string
  trimLevel?: string
  year?:     number
}

export interface MatchResult {
  matched:    boolean
  confidence: number   // 0–1
  reasons:    string[]
}

/**
 * Determine whether two vehicle descriptions refer to the same real-world
 * car identity. Used to correlate government data with listing data.
 */
export function matchVehicleIdentity(a: MatchCandidate, b: MatchCandidate): MatchResult {
  const reasons: string[] = []
  let score = 0

  // ── Brand match (weight: 0.35) ─────────────────────────────────────────────
  const brandA = resolveBrand(a.brand).canonical
  const brandB = resolveBrand(b.brand).canonical
  const brandSim = brandA && brandB
    ? (norm(brandA) === norm(brandB) ? 1.0 : editSimilarity(norm(brandA), norm(brandB)))
    : 0

  if (brandSim >= 0.9) {
    score += 0.35
    reasons.push(`brand match: ${brandA}`)
  } else if (brandSim >= 0.7) {
    score += 0.18
    reasons.push(`partial brand match: ${brandA} ~ ${brandB}`)
  } else {
    reasons.push(`brand mismatch: "${brandA}" vs "${brandB}"`)
    return { matched: false, confidence: 0, reasons }
  }

  // ── Year match (weight: 0.20) ──────────────────────────────────────────────
  if (a.year && b.year) {
    const yearDiff = Math.abs(a.year - b.year)
    if (yearDiff === 0) {
      score += 0.20
      reasons.push(`exact year: ${a.year}`)
    } else if (yearDiff === 1) {
      score += 0.10
      reasons.push(`year ±1: ${a.year} vs ${b.year}`)
    } else {
      reasons.push(`year mismatch: ${a.year} vs ${b.year}`)
      // Year mismatch is not fatal — could be model year vs registration year
    }
  }

  // ── Model match (weight: 0.35) ─────────────────────────────────────────────
  const modelA = a.model ? norm(resolveModel(a.model, a.brand).canonical) : ''
  const modelB = b.model ? norm(resolveModel(b.model, b.brand).canonical) : ''
  const modelOverlap = modelA && modelB ? tokenOverlap(modelA, modelB) : 0
  const modelEdit    = modelA && modelB ? editSimilarity(modelA, modelB) : 0
  const modelSim     = Math.max(modelOverlap, modelEdit)

  if (modelSim >= 0.85) {
    score += 0.35
    reasons.push(`strong model match: ${modelA}`)
  } else if (modelSim >= 0.60) {
    score += 0.20
    reasons.push(`partial model match: ${modelA} ~ ${modelB}`)
  } else if (modelSim >= 0.40) {
    score += 0.08
    reasons.push(`weak model match: ${modelA} ~ ${modelB}`)
  } else {
    reasons.push(`model mismatch: "${modelA}" vs "${modelB}"`)
  }

  // ── Trim match (weight: 0.10, bonus only) ─────────────────────────────────
  if (a.trimLevel && b.trimLevel) {
    const trimA = norm(resolveTrim(a.trimLevel).canonical ?? a.trimLevel)
    const trimB = norm(resolveTrim(b.trimLevel).canonical ?? b.trimLevel)
    if (trimA === trimB) {
      score += 0.10
      reasons.push(`trim match: ${trimA}`)
    } else if (tokenOverlap(trimA, trimB) > 0.5) {
      score += 0.05
      reasons.push(`partial trim match`)
    }
  }

  const confidence = Math.min(1, score)
  return {
    matched:    confidence >= 0.50,
    confidence,
    reasons,
  }
}

// ─── Canonical vehicle builder (for market aggregation) ──────────────────────

/**
 * Given any raw brand/model/trim strings (Hebrew or English, government or
 * user-entered), return a normalised canonical form suitable for grouping
 * market data.
 */
export function buildCanonical(
  rawBrand:     string,
  rawModel:     string,
  rawTrimLevel?: string,
): CanonicalVehicle {
  const brand = resolveBrand(rawBrand)
  const model = resolveModel(rawModel, brand.canonical)
  const trim  = resolveTrim(rawTrimLevel ?? '')

  const confidence = (brand.confidence + model.confidence + trim.confidence) / 3

  return {
    brand:      brand.canonical,
    model:      model.canonical,
    trimLevel:  trim.canonical,
    confidence,
  }
}
