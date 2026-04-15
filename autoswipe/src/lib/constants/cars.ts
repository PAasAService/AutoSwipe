// Car brands and models popular in Israel

export const CAR_BRANDS_MODELS: Record<string, string[]> = {
  Toyota: ['Corolla', 'Camry', 'RAV4', 'C-HR', 'Yaris', 'Hilux', 'Land Cruiser', 'Prius', 'Auris'],
  Hyundai: ['Tucson', 'i20', 'i30', 'Kona', 'Santa Fe', 'Elantra', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'ix35'],
  Kia: ['Sportage', 'Niro', 'Stonic', 'Picanto', 'Ceed', 'Soul', 'EV6', 'Carnival', 'Sorento'],
  Mazda: ['CX-5', 'CX-3', 'CX-30', 'Mazda3', 'Mazda6', 'MX-5'],
  Honda: ['Civic', 'CR-V', 'HR-V', 'Jazz', 'Accord', 'ZR-V'],
  BMW: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', 'X1', 'X3', 'X5', 'i3', 'i4', 'iX'],
  Mercedes: ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'GLE', 'EQA', 'EQC'],
  Audi: ['A1', 'A3', 'A4', 'A5', 'Q2', 'Q3', 'Q5', 'Q7', 'e-tron'],
  Volkswagen: ['Golf', 'Polo', 'Tiguan', 'T-Cross', 'T-Roc', 'Passat', 'ID.3', 'ID.4'],
  Skoda: ['Octavia', 'Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Scala'],
  Seat: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  Ford: ['Focus', 'Kuga', 'Puma', 'Fiesta', 'EcoSport'],
  Renault: ['Clio', 'Megane', 'Kadjar', 'Captur', 'Zoe', 'Arkana'],
  Peugeot: ['208', '308', '3008', '2008', '508', '5008'],
  Citroën: ['C3', 'C4', 'C5 Aircross', 'Berlingo'],
  Opel: ['Astra', 'Corsa', 'Mokka', 'Crossland', 'Grandland'],
  Nissan: ['Qashqai', 'Juke', 'Leaf', 'X-Trail', 'Micra'],
  Mitsubishi: ['Outlander', 'Eclipse Cross', 'ASX', 'L200'],
  Subaru: ['Forester', 'Outback', 'XV', 'Impreza', 'Levorg'],
  Volvo: ['XC40', 'XC60', 'XC90', 'V60', 'S60', 'C40'],
  Jeep: ['Compass', 'Renegade', 'Cherokee', 'Wrangler'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  Fiat: ['500', 'Tipo', 'Panda'],
  Mini: ['Cooper', 'Clubman', 'Countryman', 'Paceman'],
  Lexus: ['IS', 'ES', 'NX', 'RX', 'UX'],
  Infiniti: ['Q30', 'Q50', 'QX30'],
  Land_Rover: ['Range Rover', 'Range Rover Sport', 'Evoque', 'Discovery', 'Defender'],
  Porsche: ['Macan', 'Cayenne', 'Taycan', '911', 'Panamera'],
  Suzuki: ['Swift', 'Vitara', 'S-Cross', 'Ignis'],
  Dacia: ['Sandero', 'Duster', 'Logan', 'Spring'],
  Cupra: ['Formentor', 'Born', 'Ateca'],
  MG: ['ZS', 'HS', 'Marvel R', '5'],
  BYD: ['Atto 3', 'Dolphin', 'Seal', 'Han', 'Tang'],
  Lynk_Co: ['01', '02', '05'],
}

export const CAR_BRANDS = Object.keys(CAR_BRANDS_MODELS)

export function getModelsForBrand(brand: string): string[] {
  return CAR_BRANDS_MODELS[brand] ?? []
}

// Year range for listings
export const MIN_LISTING_YEAR = 2000
export const MAX_LISTING_YEAR = new Date().getFullYear() + 1

export function getYearRange(): number[] {
  const years: number[] = []
  for (let y = MAX_LISTING_YEAR; y >= MIN_LISTING_YEAR; y--) {
    years.push(y)
  }
  return years
}

// Hebrew translations
export const FUEL_TYPE_HE: Record<string, string> = {
  GASOLINE: 'בנזין',
  DIESEL: 'דיזל',
  HYBRID: 'היברידי',
  ELECTRIC: 'חשמלי',
  PLUG_IN_HYBRID: 'פלאג-אין היברידי',
}

export const VEHICLE_TYPE_HE: Record<string, string> = {
  SEDAN: 'סדאן',
  SUV: 'ג׳יפ / SUV',
  HATCHBACK: 'האצ׳בק',
  COUPE: 'קופה',
  CONVERTIBLE: 'קבריולה',
  MINIVAN: 'מיניוואן',
  PICKUP: 'פיקאפ',
  WAGON: 'סטיישן',
  CROSSOVER: 'קרוסאובר',
}

export const TRANSMISSION_HE: Record<string, string> = {
  AUTOMATIC: 'אוטומטי',
  MANUAL: 'ידני',
}

export const DEAL_TAG_HE: Record<string, string> = {
  GREAT_DEAL: '🔥 עסקה מצוינת',
  BELOW_MARKET: '✅ מתחת למחיר שוק',
  FAIR_PRICE: 'מחיר הוגן',
  ABOVE_MARKET: 'מעל מחיר שוק',
  NEW_LISTING: '✨ מודעה חדשה',
  PRICE_DROP: '📉 ירידת מחיר',
}

export const DEAL_TAG_COLOR: Record<string, string> = {
  GREAT_DEAL: 'bg-accent text-black border border-accent font-semibold',
  BELOW_MARKET: 'bg-status-success/20 text-status-success border border-status-success/30 font-semibold',
  FAIR_PRICE: 'bg-surface text-text-secondary border border-surface-border/50',
  ABOVE_MARKET: 'bg-status-error/15 text-status-error border border-status-error/25 font-medium',
  NEW_LISTING: 'bg-accent/15 text-accent border border-accent/25 font-semibold',
  PRICE_DROP: 'bg-status-warning/15 text-status-warning border border-status-warning/25 font-semibold',
}
