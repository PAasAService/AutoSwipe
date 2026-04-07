import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCarSpecs } from '@/lib/constants/car-specs-db'

export type PricingAnalysis = {
  suggestedMin: number
  suggestedMax: number
  verdict: 'excellent' | 'fair' | 'high' | 'very_high'
  verdictHe: string
  verdictColor: 'green' | 'yellow' | 'orange' | 'red'
  explanation: string
  tipHe: string
  comparableCount: number
}

/**
 * Estimate market value using depreciation from a rough "new car" base price.
 * Base prices are average Israeli on-road prices for a mid-trim model.
 */
const BASE_PRICES: Record<string, number> = {
  // Economy
  'Dacia|Sandero': 75000,  'Dacia|Duster': 110000, 'Dacia|Logan': 70000,  'Dacia|Spring': 90000,
  'Fiat|Panda': 75000,     'Fiat|500': 85000,       'Fiat|Tipo': 90000,
  'Suzuki|Swift': 85000,   'Suzuki|Ignis': 88000,
  'Kia|Picanto': 82000,    'Renault|Clio': 90000,   'Peugeot|208': 95000,
  'Citroën|C3': 92000,     'Opel|Corsa': 95000,     'Volkswagen|Polo': 105000,
  'Skoda|Fabia': 100000,   'Seat|Ibiza': 105000,    'Hyundai|i20': 98000,
  'Ford|Fiesta': 95000,    'Nissan|Micra': 95000,
  // Compact
  'Toyota|Yaris': 115000,  'Toyota|Corolla': 135000,'Toyota|Auris': 120000,
  'Hyundai|i30': 120000,   'Hyundai|Elantra': 130000,
  'Kia|Ceed': 120000,      'Kia|Stonic': 118000,
  'Mazda|Mazda3': 140000,  'Honda|Jazz': 125000,    'Honda|Civic': 155000,
  'Volkswagen|Golf': 155000,'Skoda|Octavia': 150000, 'Skoda|Scala': 130000,
  'Skoda|Kamiq': 135000,   'Seat|Leon': 145000,     'Seat|Arona': 130000,
  'Ford|Focus': 145000,    'Renault|Megane': 130000, 'Peugeot|308': 140000,
  'Citroën|C4': 140000,    'Opel|Astra': 140000,    'Opel|Mokka': 145000,
  'Opel|Crossland': 135000,'Nissan|Juke': 140000,   'Mini|Cooper': 185000,
  'Suzuki|Vitara': 140000, 'Suzuki|S-Cross': 145000,
  'BYD|Dolphin': 145000,   'MG|ZS': 140000,
  // Mid-size
  'Toyota|C-HR': 175000,   'Toyota|Camry': 210000,  'Toyota|Prius': 185000,
  'Hyundai|Kona': 165000,  'Hyundai|Ioniq': 175000, 'Hyundai|Tucson': 195000,
  'Kia|Niro': 185000,      'Kia|Sportage': 200000,  'Kia|Soul': 175000,
  'Mazda|CX-3': 160000,    'Mazda|CX-30': 175000,   'Mazda|CX-5': 200000,
  'Mazda|Mazda6': 200000,  'Honda|HR-V': 185000,    'Honda|CR-V': 225000,
  'Honda|Accord': 235000,  'Honda|ZR-V': 220000,
  'Volkswagen|T-Cross': 165000,'Volkswagen|T-Roc': 185000,'Volkswagen|Tiguan': 220000,
  'Volkswagen|Passat': 215000,
  'Skoda|Karoq': 205000,   'Skoda|Kodiaq': 250000,
  'Seat|Ateca': 210000,    'Seat|Tarraco': 255000,
  'Cupra|Formentor': 230000,'Cupra|Born': 210000,    'Cupra|Ateca': 255000,
  'Ford|Puma': 175000,     'Ford|Kuga': 220000,     'Ford|EcoSport': 155000,
  'Renault|Captur': 175000,'Renault|Kadjar': 190000,'Renault|Arkana': 195000,
  'Renault|Zoe': 185000,
  'Peugeot|2008': 175000,  'Peugeot|3008': 225000,
  'Peugeot|508': 220000,   'Peugeot|5008': 255000,
  'Citroën|C5 Aircross': 220000,'Citroën|Berlingo': 160000,
  'Opel|Grandland': 230000,
  'Nissan|Qashqai': 205000,'Nissan|X-Trail': 220000,'Nissan|Leaf': 195000,
  'Mitsubishi|ASX': 175000,'Mitsubishi|Eclipse Cross': 225000,'Mitsubishi|Outlander': 240000,
  'Subaru|Impreza': 175000,'Subaru|XV': 195000,     'Subaru|Forester': 225000,
  'Subaru|Outback': 240000,'Subaru|Levorg': 235000,
  'Mini|Clubman': 225000,  'Mini|Countryman': 240000,'Mini|Paceman': 215000,
  'Toyota|RAV4': 245000,   'MG|HS': 175000,         'MG|5': 185000,
  'MG|Marvel R': 225000,
  'BYD|Atto 3': 195000,    'BYD|Seal': 220000,      'BYD|Han': 280000,
  'BYD|Tang': 310000,
  'Lynk_Co|01': 230000,    'Lynk_Co|02': 220000,    'Lynk_Co|05': 235000,
  // Large / Premium
  'Toyota|Land Cruiser': 520000,'Toyota|Hilux': 255000,
  'Hyundai|Santa Fe': 285000,'Hyundai|Ioniq 5': 270000,'Hyundai|Ioniq 6': 265000,
  'Hyundai|ix35': 190000,
  'Kia|Sorento': 290000,   'Kia|Carnival': 300000,  'Kia|EV6': 275000,
  'Mazda|MX-5': 215000,
  'BMW|1 Series': 225000,  'BMW|2 Series': 265000,  'BMW|3 Series': 295000,
  'BMW|4 Series': 330000,  'BMW|5 Series': 420000,  'BMW|X1': 265000,
  'BMW|X3': 350000,        'BMW|X5': 520000,        'BMW|i3': 195000,
  'BMW|i4': 385000,        'BMW|iX': 520000,
  'Mercedes|A-Class': 245000,'Mercedes|B-Class': 250000,'Mercedes|C-Class': 320000,
  'Mercedes|E-Class': 450000,'Mercedes|GLA': 285000, 'Mercedes|GLC': 380000,
  'Mercedes|GLE': 540000,  'Mercedes|EQA': 310000,  'Mercedes|EQC': 430000,
  'Audi|A1': 215000,       'Audi|A3': 255000,       'Audi|A4': 315000,
  'Audi|A5': 355000,       'Audi|Q2': 240000,       'Audi|Q3': 290000,
  'Audi|Q5': 390000,       'Audi|Q7': 530000,       'Audi|e-tron': 490000,
  'Volvo|XC40': 310000,    'Volvo|XC60': 430000,    'Volvo|XC90': 570000,
  'Volvo|V60': 380000,     'Volvo|S60': 370000,     'Volvo|C40': 360000,
  'Jeep|Renegade': 215000, 'Jeep|Compass': 230000,  'Jeep|Cherokee': 270000,
  'Jeep|Wrangler': 310000,
  'Tesla|Model 3': 220000, 'Tesla|Model Y': 250000, 'Tesla|Model S': 480000,
  'Tesla|Model X': 530000,
  'Lexus|UX': 275000,      'Lexus|IS': 310000,      'Lexus|ES': 365000,
  'Lexus|NX': 380000,      'Lexus|RX': 490000,
  'Infiniti|Q30': 210000,  'Infiniti|Q50': 285000,  'Infiniti|QX30': 245000,
  'Land_Rover|Evoque': 380000,'Land_Rover|Discovery': 490000,
  'Land_Rover|Range Rover Sport': 650000,'Land_Rover|Range Rover': 800000,
  'Land_Rover|Defender': 560000,
  'Porsche|Macan': 450000, 'Porsche|Cayenne': 650000,'Porsche|Taycan': 680000,
  'Porsche|911': 680000,   'Porsche|Panamera': 660000,
  'Mitsubishi|L200': 260000,
}

function estimateMarketValue(
  brand: string,
  model: string,
  year: number,
  mileage: number,
): { min: number; max: number } | null {
  const key = `${brand}|${model}`
  const basePrice = BASE_PRICES[key]
  if (!basePrice) return null

  const specs = getCarSpecs(brand, model)
  const deprecRate = specs?.depreciationRate ?? 0.12

  const age = new Date().getFullYear() - year
  // Compound depreciation, floored at 20% of base
  const depreciatedValue = Math.max(
    basePrice * Math.pow(1 - deprecRate, age),
    basePrice * 0.20
  )

  // Mileage adjustment: ±2% per 20,000 km vs 15,000 avg/year baseline
  const expectedKm = Math.max(age * 15000, 1)
  const kmRatio    = mileage / expectedKm
  const kmAdj      = kmRatio < 0.5 ? 1.06 :
                     kmRatio < 0.8 ? 1.03 :
                     kmRatio < 1.2 ? 1.00 :
                     kmRatio < 1.6 ? 0.95 :
                                     0.88

  const adjusted = depreciatedValue * kmAdj
  const roundTo = 1000

  return {
    min: Math.round((adjusted * 0.92) / roundTo) * roundTo,
    max: Math.round((adjusted * 1.08) / roundTo) * roundTo,
  }
}

function deriveVerdict(
  askedPrice: number,
  min: number,
  max: number,
  comparableMedian: number | null,
): Pick<PricingAnalysis, 'verdict' | 'verdictHe' | 'verdictColor' | 'explanation' | 'tipHe'> {
  const mid    = (min + max) / 2
  const ref    = comparableMedian ?? mid
  const ratio  = askedPrice / ref

  if (ratio <= 0.90) return {
    verdict: 'excellent',
    verdictHe: '🔥 מחיר נמוך מהשוק',
    verdictColor: 'green',
    explanation: `המחיר המבוקש נמוך ב-${Math.round((1 - ratio) * 100)}% ממחיר השוק הממוצע — עסקה אטרקטיבית לקונים.`,
    tipHe: 'מחיר תחרותי מאוד — צפוי עניין רב. אין צורך להוריד.',
  }
  if (ratio <= 1.05) return {
    verdict: 'fair',
    verdictHe: '✅ מחיר הוגן',
    verdictColor: 'yellow',
    explanation: `המחיר תואם את מחיר השוק הממוצע עבור ${Math.round(ref).toLocaleString('he-IL')} ₪. תמחור ריאלי ונכון.`,
    tipHe: 'מחיר שוק מדויק — הוסף תמונות איכותיות לסגור מהר.',
  }
  if (ratio <= 1.20) return {
    verdict: 'high',
    verdictHe: '⚠️ גבוה במעט מהשוק',
    verdictColor: 'orange',
    explanation: `המחיר גבוה ב-${Math.round((ratio - 1) * 100)}% מעל הממוצע. ייתכן ויש צורך בהתאמה.`,
    tipHe: `הורד ל-₪${Math.round(ref / 1000)}K לפניות מהירות יותר.`,
  }
  return {
    verdict: 'very_high',
    verdictHe: '🔴 גבוה משמעותית מהשוק',
    verdictColor: 'red',
    explanation: `המחיר גבוה ב-${Math.round((ratio - 1) * 100)}% מעל השוק. קשה יהיה לסגור עסקה במחיר זה.`,
    tipHe: `מומלץ לשקול הורדה משמעותית לטווח ₪${min.toLocaleString('he-IL')}–₪${max.toLocaleString('he-IL')}.`,
  }
}

export async function GET(req: NextRequest) {
  const p       = new URL(req.url).searchParams
  const brand   = p.get('brand') ?? ''
  const model   = p.get('model') ?? ''
  const year    = p.get('year') ?? ''
  const mileage = parseInt(p.get('mileage') ?? '0') || 0
  const price   = parseInt(p.get('price') ?? '0') || 0

  if (!brand || !model || !year || price <= 0) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const yr = parseInt(year)

  // ── Pull comparable listings from DB ──
  let comparableCount = 0
  let comparableMedian: number | null = null

  try {
    const comparables = await prisma.carListing.findMany({
      where: {
        brand, model,
        year: { gte: yr - 2, lte: yr + 2 },
        status: 'ACTIVE',
      },
      select: { price: true },
      take: 30,
    })

    comparableCount = comparables.length
    if (comparableCount > 0) {
      const prices = comparables.map((c) => c.price).sort((a, b) => a - b)
      const mid    = Math.floor(prices.length / 2)
      comparableMedian =
        prices.length % 2 === 0
          ? (prices[mid - 1] + prices[mid]) / 2
          : prices[mid]
    }
  } catch {
    // DB error — fall back to formula only
  }

  // ── Formula-based market estimate ──
  const estimate = estimateMarketValue(brand, model, yr, mileage)

  // If no data at all, return a basic range
  if (!estimate && !comparableMedian) {
    const midGuess = price
    return NextResponse.json<{ data: PricingAnalysis }>({
      data: {
        suggestedMin: Math.round(midGuess * 0.90 / 1000) * 1000,
        suggestedMax: Math.round(midGuess * 1.10 / 1000) * 1000,
        verdict: 'fair',
        verdictHe: '✅ אין מספיק נתונים',
        verdictColor: 'yellow',
        explanation: 'לא נמצאו מספיק נתוני השוואה. בדוק מחירים ביד2 ו-AutoPlus לאימות.',
        tipHe: 'פרסם ועקוב אחרי פניות — ההיענות תעיד על הנכונות.',
        comparableCount: 0,
      },
    })
  }

  const finalMin = estimate?.min ?? Math.round((comparableMedian! * 0.92) / 1000) * 1000
  const finalMax = estimate?.max ?? Math.round((comparableMedian! * 1.08) / 1000) * 1000

  const refPrice = comparableMedian ?? (estimate ? (estimate.min + estimate.max) / 2 : price)
  const verdict  = deriveVerdict(price, finalMin, finalMax, comparableMedian)

  return NextResponse.json<{ data: PricingAnalysis }>({
    data: {
      suggestedMin: finalMin,
      suggestedMax: finalMax,
      comparableCount,
      ...verdict,
    },
  })
}
