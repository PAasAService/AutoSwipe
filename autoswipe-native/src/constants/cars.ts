import { FuelType, VehicleType, DealTag, Transmission } from '../types'

export const CAR_BRANDS = [
  'Toyota', 'Hyundai', 'Kia', 'Mazda', 'Honda', 'Nissan', 'Mitsubishi', 'Subaru',
  'Volkswagen', 'Skoda', 'Seat', 'Audi', 'BMW', 'Mercedes', 'Ford', 'Opel',
  'Peugeot', 'Citroen', 'Renault', 'Fiat', 'Alfa Romeo', 'Volvo', 'Land Rover',
  'Jeep', 'Chevrolet', 'Dacia', 'Lexus', 'Infiniti', 'Acura', 'MG', 'BYD',
  'Tesla', 'Polestar', 'Great Wall', 'Chery', 'JAC',
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
  GREAT_DEAL: '#10B981',
  BELOW_MARKET: '#06B6D4',
  FAIR_PRICE: '#FFB81C',
  ABOVE_MARKET: '#EF4444',
  NEW_LISTING: '#3B82F6',
  PRICE_DROP: '#F97316',
}

export const CAR_MODELS: Record<string, string[]> = {
  'Toyota':      ['Yaris', 'Aygo', 'Corolla', 'Auris', 'C-HR', 'RAV4', 'Camry', 'Prius', 'Land Cruiser', 'Hilux'],
  'Hyundai':     ['i10', 'i20', 'i30', 'Elantra', 'Kona', 'Tucson', 'ix35', 'Santa Fe', 'Ioniq 5', 'Ioniq 6'],
  'Kia':         ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Niro', 'Sportage', 'Soul', 'Sorento', 'EV6'],
  'Mazda':       ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'MX-5'],
  'Honda':       ['Jazz', 'Civic', 'HR-V', 'CR-V', 'Accord', 'e:Ny1'],
  'Nissan':      ['Micra', 'Note', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Navara'],
  'Mitsubishi':  ['Space Star', 'ASX', 'Eclipse Cross', 'Outlander', 'L200'],
  'Subaru':      ['Impreza', 'XV', 'Forester', 'Outback', 'WRX', 'BRZ'],
  'Volkswagen':  ['Polo', 'Golf', 'T-Cross', 'T-Roc', 'Tiguan', 'Passat', 'Touareg', 'ID.3', 'ID.4'],
  'Skoda':       ['Fabia', 'Scala', 'Octavia', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq'],
  'Seat':        ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  'Audi':        ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  'BMW':         ['116', '118', '120', '218', '316', '318', '320', '330', '520', '530', 'X1', 'X3', 'X5', 'iX'],
  'Mercedes':    ['A180', 'A200', 'C200', 'C300', 'E200', 'E300', 'GLA', 'GLB', 'GLC', 'GLE', 'EQA'],
  'Ford':        ['Fiesta', 'Focus', 'EcoSport', 'Kuga', 'Mustang Mach-E', 'Explorer'],
  'Opel':        ['Corsa', 'Astra', 'Crossland', 'Grandland', 'Mokka'],
  'Peugeot':     ['108', '208', '308', '2008', '3008', '5008', 'e-208'],
  'Citroen':     ['C1', 'C3', 'C4', 'C5 X', 'C5 Aircross', 'ë-C3'],
  'Renault':     ['Clio', 'Megane', 'Captur', 'Kadjar', 'Duster', 'Zoe', 'Arkana'],
  'Fiat':        ['500', '500X', 'Panda', 'Tipo', '500e'],
  'Alfa Romeo':  ['Giulietta', 'Giulia', 'Stelvio', 'Tonale'],
  'Volvo':       ['V40', 'V60', 'S60', 'XC40', 'XC60', 'XC90', 'C40'],
  'Land Rover':  ['Defender', 'Discovery Sport', 'Discovery', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover'],
  'Jeep':        ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler'],
  'Chevrolet':   ['Spark', 'Cruze', 'Trax', 'Malibu', 'Equinox'],
  'Dacia':       ['Sandero', 'Logan', 'Duster', 'Spring', 'Jogger'],
  'Lexus':       ['CT 200h', 'UX', 'IS', 'ES', 'NX', 'RX', 'LX'],
  'Infiniti':    ['Q30', 'Q50', 'QX30', 'QX50', 'QX70'],
  'Acura':       ['MDX', 'RDX', 'TLX'],
  'MG':          ['MG3', 'MG5', 'ZS', 'ZS EV', 'HS', 'Marvel R'],
  'BYD':         ['Atto 3', 'Seal', 'Dolphin', 'Han', 'Tang', 'Sealion 6'],
  'Tesla':       ['Model 3', 'Model Y', 'Model S', 'Model X'],
  'Polestar':    ['Polestar 2', 'Polestar 3'],
  'Great Wall':  ['Haval H6', 'Ora Good Cat', 'Wey Coffee 01'],
  'Chery':       ['Tiggo 4 Pro', 'Tiggo 7 Pro', 'Tiggo 8 Pro'],
  'JAC':         ['J7', 'S3', 'S4', 'E10X'],
}

export const VEHICLE_TYPES: VehicleType[] = [
  'SUV', 'SEDAN', 'HATCHBACK', 'CROSSOVER', 'WAGON', 'COUPE', 'MINIVAN', 'PICKUP', 'CONVERTIBLE',
]

export const FUEL_TYPES: FuelType[] = [
  'GASOLINE', 'HYBRID', 'ELECTRIC', 'DIESEL', 'PLUG_IN_HYBRID',
]

export const TRANSMISSIONS: Transmission[] = [
  'AUTOMATIC', 'MANUAL',
]
