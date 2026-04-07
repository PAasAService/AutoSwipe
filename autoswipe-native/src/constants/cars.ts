import { FuelType, VehicleType, DealTag, Transmission } from '../types'

export const CAR_BRANDS = [
  'טויוטה', 'יונדאי', 'קיה', 'מאזדה', 'הונדה', 'ניסאן', 'מיצובישי', 'סובארו',
  'פולקסווגן', 'סקודה', 'סיאט', 'אאודי', 'BMW', 'מרצדס', 'פורד', 'אופל',
  'פיג׳ו', 'סיטרואן', 'רנו', 'פיאט', 'אלפא רומיאו', 'וולוו', 'לנד רובר',
  'ג׳יפ', 'שברולט', 'דאצ׳יה', 'לקסוס', 'אינפיניטי', 'אקורה', 'MG', 'BYD',
  'טסלה', 'פולסטאר', 'גרייט וול', 'צ׳רי', 'JAC',
]

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE: 'בנזין',
  DIESEL: 'דיזל',
  HYBRID: 'היברידי',
  ELECTRIC: 'חשמלי',
  PLUG_IN_HYBRID: 'PHEV',
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  SEDAN: 'סדאן',
  SUV: 'SUV',
  HATCHBACK: 'האצ׳בק',
  COUPE: 'קופה',
  CONVERTIBLE: 'קבריולט',
  MINIVAN: 'מיניוואן',
  PICKUP: 'פיקאפ',
  WAGON: 'סטיישן',
  CROSSOVER: 'קרוסאובר',
}

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  AUTOMATIC: 'אוטומטי',
  MANUAL: 'ידני',
}

export const DEAL_TAG_LABELS: Record<DealTag, string> = {
  GREAT_DEAL: 'עסקה מצוינת',
  BELOW_MARKET: 'מתחת לשוק',
  FAIR_PRICE: 'מחיר הוגן',
  ABOVE_MARKET: 'מעל השוק',
  NEW_LISTING: 'חדש',
  PRICE_DROP: 'ירידת מחיר',
}

export const DEAL_TAG_COLORS: Record<DealTag, string> = {
  GREAT_DEAL: '#4CAF50',
  BELOW_MARKET: '#8BC34A',
  FAIR_PRICE: '#D4A843',
  ABOVE_MARKET: '#F44336',
  NEW_LISTING: '#2196F3',
  PRICE_DROP: '#FF9800',
}

export const VEHICLE_TYPES: VehicleType[] = [
  'SUV', 'SEDAN', 'HATCHBACK', 'CROSSOVER', 'WAGON', 'COUPE', 'MINIVAN', 'PICKUP', 'CONVERTIBLE',
]

export const FUEL_TYPES: FuelType[] = [
  'GASOLINE', 'HYBRID', 'ELECTRIC', 'DIESEL', 'PLUG_IN_HYBRID',
]
