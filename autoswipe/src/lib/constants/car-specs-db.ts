/**
 * Static vehicle specifications database for the Israeli market.
 * Covers all models listed in CAR_BRANDS_MODELS.
 * Costs (insurance, maintenance) are in ILS, based on Israeli market averages.
 * No external API needed — instant, free, offline.
 */

export type SpecEntry = {
  vehicleType: 'SEDAN' | 'SUV' | 'HATCHBACK' | 'COUPE' | 'CONVERTIBLE' | 'MINIVAN' | 'PICKUP' | 'WAGON' | 'CROSSOVER'
  fuelType: 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'PLUG_IN_HYBRID'
  fuelConsumption: number       // L/100km (or kWh/100km for electric)
  engineSize: number            // litres; 0 for electric
  transmission: 'AUTOMATIC' | 'MANUAL'
  doors: number
  seats: number
  horsepower: number
  insuranceEstimate: number     // annual ILS
  maintenanceEstimate: number   // annual ILS
  depreciationRate: number      // e.g. 0.10 = 10% per year
  popularColor: string          // in Hebrew
}

// ─────────────────────────────────────────────────────────────────────────────
// Full database  key: "Brand|Model"
// ─────────────────────────────────────────────────────────────────────────────
const DB: Record<string, SpecEntry> = {

  // ── Toyota ──────────────────────────────────────────────────────────────
  'Toyota|Corolla':       { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 122, insuranceEstimate: 4600, maintenanceEstimate: 3200, depreciationRate: 0.09, popularColor: 'לבן' },
  'Toyota|Camry':         { vehicleType: 'SEDAN',     fuelType: 'HYBRID',        fuelConsumption: 5.8,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 218, insuranceEstimate: 6200, maintenanceEstimate: 3800, depreciationRate: 0.11, popularColor: 'כסוף' },
  'Toyota|RAV4':          { vehicleType: 'SUV',       fuelType: 'HYBRID',        fuelConsumption: 6.2,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 222, insuranceEstimate: 5800, maintenanceEstimate: 4000, depreciationRate: 0.09, popularColor: 'לבן' },
  'Toyota|C-HR':          { vehicleType: 'CROSSOVER', fuelType: 'HYBRID',        fuelConsumption: 5.5,  engineSize: 1.8, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 122, insuranceEstimate: 5000, maintenanceEstimate: 3400, depreciationRate: 0.11, popularColor: 'שחור' },
  'Toyota|Yaris':         { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.8,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 100, insuranceEstimate: 3500, maintenanceEstimate: 2600, depreciationRate: 0.10, popularColor: 'לבן' },
  'Toyota|Hilux':         { vehicleType: 'PICKUP',    fuelType: 'DIESEL',        fuelConsumption: 9.0,  engineSize: 2.8, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 204, insuranceEstimate: 5500, maintenanceEstimate: 4500, depreciationRate: 0.08, popularColor: 'לבן' },
  'Toyota|Land Cruiser':  { vehicleType: 'SUV',       fuelType: 'DIESEL',        fuelConsumption: 11.0, engineSize: 3.3, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 309, insuranceEstimate: 11000,maintenanceEstimate: 7000, depreciationRate: 0.10, popularColor: 'לבן' },
  'Toyota|Prius':         { vehicleType: 'SEDAN',     fuelType: 'HYBRID',        fuelConsumption: 4.2,  engineSize: 1.8, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 122, insuranceEstimate: 4400, maintenanceEstimate: 2800, depreciationRate: 0.10, popularColor: 'כסוף' },
  'Toyota|Auris':         { vehicleType: 'HATCHBACK', fuelType: 'HYBRID',        fuelConsumption: 5.5,  engineSize: 1.8, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 136, insuranceEstimate: 4200, maintenanceEstimate: 3000, depreciationRate: 0.11, popularColor: 'לבן' },

  // ── Hyundai ─────────────────────────────────────────────────────────────
  'Hyundai|Tucson':       { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.8,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 5200, maintenanceEstimate: 3600, depreciationRate: 0.12, popularColor: 'לבן' },
  'Hyundai|i20':          { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.5,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 84,  insuranceEstimate: 3400, maintenanceEstimate: 2500, depreciationRate: 0.11, popularColor: 'אפור' },
  'Hyundai|i30':          { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 110, insuranceEstimate: 4200, maintenanceEstimate: 3000, depreciationRate: 0.12, popularColor: 'לבן' },
  'Hyundai|Kona':         { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 120, insuranceEstimate: 4800, maintenanceEstimate: 3200, depreciationRate: 0.12, popularColor: 'אדום' },
  'Hyundai|Santa Fe':     { vehicleType: 'SUV',       fuelType: 'DIESEL',        fuelConsumption: 8.0,  engineSize: 2.2, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 202, insuranceEstimate: 6500, maintenanceEstimate: 4800, depreciationRate: 0.12, popularColor: 'שחור' },
  'Hyundai|Elantra':      { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 123, insuranceEstimate: 4200, maintenanceEstimate: 3000, depreciationRate: 0.11, popularColor: 'לבן' },
  'Hyundai|Ioniq':        { vehicleType: 'SEDAN',     fuelType: 'HYBRID',        fuelConsumption: 4.0,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 141, insuranceEstimate: 4000, maintenanceEstimate: 2600, depreciationRate: 0.12, popularColor: 'כחול' },
  'Hyundai|Ioniq 5':      { vehicleType: 'CROSSOVER', fuelType: 'ELECTRIC',      fuelConsumption: 17.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 218, insuranceEstimate: 5000, maintenanceEstimate: 1800, depreciationRate: 0.15, popularColor: 'לבן' },
  'Hyundai|Ioniq 6':      { vehicleType: 'SEDAN',     fuelType: 'ELECTRIC',      fuelConsumption: 14.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 226, insuranceEstimate: 5200, maintenanceEstimate: 1800, depreciationRate: 0.15, popularColor: 'כחול' },
  'Hyundai|ix35':         { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 163, insuranceEstimate: 5000, maintenanceEstimate: 3500, depreciationRate: 0.13, popularColor: 'כסוף' },

  // ── Kia ─────────────────────────────────────────────────────────────────
  'Kia|Sportage':         { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.8,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 5200, maintenanceEstimate: 3500, depreciationRate: 0.12, popularColor: 'לבן' },
  'Kia|Niro':             { vehicleType: 'CROSSOVER', fuelType: 'HYBRID',        fuelConsumption: 5.0,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 141, insuranceEstimate: 4500, maintenanceEstimate: 2800, depreciationRate: 0.11, popularColor: 'ירוק' },
  'Kia|Stonic':           { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 84,  insuranceEstimate: 4000, maintenanceEstimate: 2800, depreciationRate: 0.12, popularColor: 'כסוף' },
  'Kia|Picanto':          { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.0,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 84,  insuranceEstimate: 3200, maintenanceEstimate: 2400, depreciationRate: 0.11, popularColor: 'אדום' },
  'Kia|Ceed':             { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.4, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 100, insuranceEstimate: 4200, maintenanceEstimate: 3000, depreciationRate: 0.12, popularColor: 'לבן' },
  'Kia|Soul':             { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 4500, maintenanceEstimate: 3200, depreciationRate: 0.12, popularColor: 'כתום' },
  'Kia|EV6':              { vehicleType: 'CROSSOVER', fuelType: 'ELECTRIC',      fuelConsumption: 16.5, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 228, insuranceEstimate: 5200, maintenanceEstimate: 1800, depreciationRate: 0.15, popularColor: 'לבן' },
  'Kia|Carnival':         { vehicleType: 'MINIVAN',   fuelType: 'DIESEL',        fuelConsumption: 9.5,  engineSize: 2.2, transmission: 'AUTOMATIC', doors: 5, seats: 8, horsepower: 202, insuranceEstimate: 7000, maintenanceEstimate: 5000, depreciationRate: 0.12, popularColor: 'שחור' },
  'Kia|Sorento':          { vehicleType: 'SUV',       fuelType: 'DIESEL',        fuelConsumption: 8.5,  engineSize: 2.2, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 202, insuranceEstimate: 6500, maintenanceEstimate: 4500, depreciationRate: 0.12, popularColor: 'לבן' },

  // ── Mazda ───────────────────────────────────────────────────────────────
  'Mazda|CX-5':           { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 165, insuranceEstimate: 5500, maintenanceEstimate: 3800, depreciationRate: 0.12, popularColor: 'אדום' },
  'Mazda|CX-3':           { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 121, insuranceEstimate: 4500, maintenanceEstimate: 3200, depreciationRate: 0.12, popularColor: 'כסוף' },
  'Mazda|CX-30':          { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 5000, maintenanceEstimate: 3500, depreciationRate: 0.12, popularColor: 'אדום' },
  'Mazda|Mazda3':         { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 150, insuranceEstimate: 4600, maintenanceEstimate: 3200, depreciationRate: 0.12, popularColor: 'כסוף' },
  'Mazda|Mazda6':         { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 7.2,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 192, insuranceEstimate: 5500, maintenanceEstimate: 3800, depreciationRate: 0.13, popularColor: 'שחור' },
  'Mazda|MX-5':           { vehicleType: 'CONVERTIBLE',fuelType: 'GASOLINE',     fuelConsumption: 7.0,  engineSize: 2.0, transmission: 'MANUAL',    doors: 2, seats: 2, horsepower: 184, insuranceEstimate: 6500, maintenanceEstimate: 4000, depreciationRate: 0.10, popularColor: 'אדום' },

  // ── Honda ───────────────────────────────────────────────────────────────
  'Honda|Civic':          { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 182, insuranceEstimate: 4800, maintenanceEstimate: 3400, depreciationRate: 0.11, popularColor: 'לבן' },
  'Honda|CR-V':           { vehicleType: 'SUV',       fuelType: 'HYBRID',        fuelConsumption: 6.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 184, insuranceEstimate: 5800, maintenanceEstimate: 3800, depreciationRate: 0.11, popularColor: 'לבן' },
  'Honda|HR-V':           { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 131, insuranceEstimate: 4800, maintenanceEstimate: 3200, depreciationRate: 0.12, popularColor: 'כחול' },
  'Honda|Jazz':           { vehicleType: 'HATCHBACK', fuelType: 'HYBRID',        fuelConsumption: 4.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 109, insuranceEstimate: 3800, maintenanceEstimate: 2600, depreciationRate: 0.10, popularColor: 'אדום' },
  'Honda|Accord':         { vehicleType: 'SEDAN',     fuelType: 'HYBRID',        fuelConsumption: 5.8,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 212, insuranceEstimate: 6000, maintenanceEstimate: 4000, depreciationRate: 0.12, popularColor: 'שחור' },
  'Honda|ZR-V':           { vehicleType: 'SUV',       fuelType: 'HYBRID',        fuelConsumption: 5.8,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 184, insuranceEstimate: 5500, maintenanceEstimate: 3500, depreciationRate: 0.12, popularColor: 'לבן' },

  // ── BMW ─────────────────────────────────────────────────────────────────
  'BMW|1 Series':         { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 136, insuranceEstimate: 7500, maintenanceEstimate: 6500, depreciationRate: 0.15, popularColor: 'שחור' },
  'BMW|2 Series':         { vehicleType: 'COUPE',     fuelType: 'GASOLINE',      fuelConsumption: 7.2,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 2, seats: 4, horsepower: 184, insuranceEstimate: 8500, maintenanceEstimate: 7000, depreciationRate: 0.15, popularColor: 'שחור' },
  'BMW|3 Series':         { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 7.8,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 184, insuranceEstimate: 9000, maintenanceEstimate: 7500, depreciationRate: 0.14, popularColor: 'שחור' },
  'BMW|4 Series':         { vehicleType: 'COUPE',     fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 2, seats: 4, horsepower: 184, insuranceEstimate: 9500, maintenanceEstimate: 7500, depreciationRate: 0.15, popularColor: 'שחור' },
  'BMW|5 Series':         { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 8.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 252, insuranceEstimate: 11000,maintenanceEstimate: 9000, depreciationRate: 0.14, popularColor: 'שחור' },
  'BMW|X1':               { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 136, insuranceEstimate: 8000, maintenanceEstimate: 7000, depreciationRate: 0.15, popularColor: 'לבן' },
  'BMW|X3':               { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 184, insuranceEstimate: 10000,maintenanceEstimate: 8000, depreciationRate: 0.15, popularColor: 'שחור' },
  'BMW|X5':               { vehicleType: 'SUV',       fuelType: 'DIESEL',        fuelConsumption: 8.5,  engineSize: 3.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 265, insuranceEstimate: 13000,maintenanceEstimate: 10000,depreciationRate: 0.15, popularColor: 'שחור' },
  'BMW|i3':               { vehicleType: 'HATCHBACK', fuelType: 'ELECTRIC',      fuelConsumption: 15.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 4, seats: 4, horsepower: 170, insuranceEstimate: 7000, maintenanceEstimate: 2500, depreciationRate: 0.18, popularColor: 'לבן' },
  'BMW|i4':               { vehicleType: 'SEDAN',     fuelType: 'ELECTRIC',      fuelConsumption: 18.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 340, insuranceEstimate: 10000,maintenanceEstimate: 2800, depreciationRate: 0.17, popularColor: 'כחול' },
  'BMW|iX':               { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 20.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 385, insuranceEstimate: 14000,maintenanceEstimate: 3000, depreciationRate: 0.18, popularColor: 'שחור' },

  // ── Mercedes ────────────────────────────────────────────────────────────
  'Mercedes|A-Class':     { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 136, insuranceEstimate: 8000, maintenanceEstimate: 7000, depreciationRate: 0.15, popularColor: 'לבן' },
  'Mercedes|B-Class':     { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 136, insuranceEstimate: 8000, maintenanceEstimate: 7000, depreciationRate: 0.15, popularColor: 'כסוף' },
  'Mercedes|C-Class':     { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 170, insuranceEstimate: 10000,maintenanceEstimate: 8500, depreciationRate: 0.14, popularColor: 'שחור' },
  'Mercedes|E-Class':     { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 8.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 258, insuranceEstimate: 13000,maintenanceEstimate: 10000,depreciationRate: 0.14, popularColor: 'שחור' },
  'Mercedes|GLA':         { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 136, insuranceEstimate: 9000, maintenanceEstimate: 7500, depreciationRate: 0.15, popularColor: 'לבן' },
  'Mercedes|GLC':         { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 258, insuranceEstimate: 11000,maintenanceEstimate: 9000, depreciationRate: 0.15, popularColor: 'שחור' },
  'Mercedes|GLE':         { vehicleType: 'SUV',       fuelType: 'DIESEL',        fuelConsumption: 8.5,  engineSize: 3.0, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 272, insuranceEstimate: 14000,maintenanceEstimate: 11000,depreciationRate: 0.15, popularColor: 'שחור' },
  'Mercedes|EQA':         { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 17.7, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 190, insuranceEstimate: 9000, maintenanceEstimate: 2500, depreciationRate: 0.17, popularColor: 'לבן' },
  'Mercedes|EQC':         { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 21.3, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 408, insuranceEstimate: 13000,maintenanceEstimate: 2800, depreciationRate: 0.18, popularColor: 'שחור' },

  // ── Audi ────────────────────────────────────────────────────────────────
  'Audi|A1':              { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 95,  insuranceEstimate: 7000, maintenanceEstimate: 6000, depreciationRate: 0.15, popularColor: 'לבן' },
  'Audi|A3':              { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 150, insuranceEstimate: 8500, maintenanceEstimate: 7000, depreciationRate: 0.15, popularColor: 'שחור' },
  'Audi|A4':              { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 190, insuranceEstimate: 10000,maintenanceEstimate: 8500, depreciationRate: 0.14, popularColor: 'שחור' },
  'Audi|A5':              { vehicleType: 'COUPE',     fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 2, seats: 4, horsepower: 190, insuranceEstimate: 11000,maintenanceEstimate: 9000, depreciationRate: 0.15, popularColor: 'אפור' },
  'Audi|Q2':              { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 116, insuranceEstimate: 8000, maintenanceEstimate: 6500, depreciationRate: 0.15, popularColor: 'לבן' },
  'Audi|Q3':              { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 9000, maintenanceEstimate: 7500, depreciationRate: 0.15, popularColor: 'כסוף' },
  'Audi|Q5':              { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 204, insuranceEstimate: 11000,maintenanceEstimate: 9000, depreciationRate: 0.14, popularColor: 'שחור' },
  'Audi|Q7':              { vehicleType: 'SUV',       fuelType: 'DIESEL',        fuelConsumption: 7.5,  engineSize: 3.0, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 231, insuranceEstimate: 14000,maintenanceEstimate: 11000,depreciationRate: 0.14, popularColor: 'שחור' },
  'Audi|e-tron':          { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 24.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 360, insuranceEstimate: 13000,maintenanceEstimate: 2800, depreciationRate: 0.18, popularColor: 'לבן' },

  // ── Volkswagen ──────────────────────────────────────────────────────────
  'Volkswagen|Golf':      { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 5500, maintenanceEstimate: 4500, depreciationRate: 0.13, popularColor: 'לבן' },
  'Volkswagen|Polo':      { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.8,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 95,  insuranceEstimate: 4000, maintenanceEstimate: 3200, depreciationRate: 0.13, popularColor: 'לבן' },
  'Volkswagen|Tiguan':    { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 6500, maintenanceEstimate: 5000, depreciationRate: 0.13, popularColor: 'לבן' },
  'Volkswagen|T-Cross':   { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 95,  insuranceEstimate: 5000, maintenanceEstimate: 3800, depreciationRate: 0.13, popularColor: 'כסוף' },
  'Volkswagen|T-Roc':     { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 7.2,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 5500, maintenanceEstimate: 4200, depreciationRate: 0.13, popularColor: 'כחול' },
  'Volkswagen|Passat':    { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 150, insuranceEstimate: 6000, maintenanceEstimate: 4800, depreciationRate: 0.14, popularColor: 'שחור' },
  'Volkswagen|ID.3':      { vehicleType: 'HATCHBACK', fuelType: 'ELECTRIC',      fuelConsumption: 15.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 204, insuranceEstimate: 5500, maintenanceEstimate: 1800, depreciationRate: 0.16, popularColor: 'לבן' },
  'Volkswagen|ID.4':      { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 17.5, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 204, insuranceEstimate: 6500, maintenanceEstimate: 2000, depreciationRate: 0.16, popularColor: 'לבן' },

  // ── Skoda ───────────────────────────────────────────────────────────────
  'Skoda|Octavia':        { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 150, insuranceEstimate: 5000, maintenanceEstimate: 4000, depreciationRate: 0.13, popularColor: 'לבן' },
  'Skoda|Fabia':          { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.5,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 95,  insuranceEstimate: 3800, maintenanceEstimate: 3000, depreciationRate: 0.13, popularColor: 'כחול' },
  'Skoda|Kamiq':          { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 95,  insuranceEstimate: 4500, maintenanceEstimate: 3500, depreciationRate: 0.13, popularColor: 'אפור' },
  'Skoda|Karoq':          { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 5500, maintenanceEstimate: 4200, depreciationRate: 0.13, popularColor: 'לבן' },
  'Skoda|Kodiaq':         { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 190, insuranceEstimate: 7000, maintenanceEstimate: 5000, depreciationRate: 0.13, popularColor: 'שחור' },
  'Skoda|Scala':          { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.2,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 95,  insuranceEstimate: 4200, maintenanceEstimate: 3200, depreciationRate: 0.13, popularColor: 'לבן' },

  // ── Seat ────────────────────────────────────────────────────────────────
  'Seat|Ibiza':           { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.8,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 95,  insuranceEstimate: 4000, maintenanceEstimate: 3200, depreciationRate: 0.14, popularColor: 'לבן' },
  'Seat|Leon':            { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 5000, maintenanceEstimate: 4000, depreciationRate: 0.14, popularColor: 'שחור' },
  'Seat|Arona':           { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 95,  insuranceEstimate: 4500, maintenanceEstimate: 3500, depreciationRate: 0.14, popularColor: 'כסוף' },
  'Seat|Ateca':           { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 5500, maintenanceEstimate: 4200, depreciationRate: 0.14, popularColor: 'לבן' },
  'Seat|Tarraco':         { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 190, insuranceEstimate: 7000, maintenanceEstimate: 5200, depreciationRate: 0.14, popularColor: 'שחור' },

  // ── Ford ────────────────────────────────────────────────────────────────
  'Ford|Focus':           { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 125, insuranceEstimate: 4500, maintenanceEstimate: 3800, depreciationRate: 0.14, popularColor: 'לבן' },
  'Ford|Kuga':            { vehicleType: 'SUV',       fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 3.5,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 225, insuranceEstimate: 6000, maintenanceEstimate: 4000, depreciationRate: 0.13, popularColor: 'כסוף' },
  'Ford|Puma':            { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.0,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 125, insuranceEstimate: 4800, maintenanceEstimate: 3500, depreciationRate: 0.14, popularColor: 'אפור' },
  'Ford|Fiesta':          { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.5,  engineSize: 1.0, transmission: 'MANUAL',    doors: 5, seats: 5, horsepower: 100, insuranceEstimate: 3800, maintenanceEstimate: 3000, depreciationRate: 0.14, popularColor: 'אדום' },
  'Ford|EcoSport':        { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 125, insuranceEstimate: 4800, maintenanceEstimate: 3600, depreciationRate: 0.15, popularColor: 'כסוף' },

  // ── Renault ─────────────────────────────────────────────────────────────
  'Renault|Clio':         { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.8,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 90,  insuranceEstimate: 3800, maintenanceEstimate: 3000, depreciationRate: 0.14, popularColor: 'לבן' },
  'Renault|Megane':       { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 140, insuranceEstimate: 4500, maintenanceEstimate: 3500, depreciationRate: 0.14, popularColor: 'כחול' },
  'Renault|Kadjar':       { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.8,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 140, insuranceEstimate: 5200, maintenanceEstimate: 4000, depreciationRate: 0.15, popularColor: 'לבן' },
  'Renault|Captur':       { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 130, insuranceEstimate: 4800, maintenanceEstimate: 3500, depreciationRate: 0.14, popularColor: 'כתום' },
  'Renault|Zoe':          { vehicleType: 'HATCHBACK', fuelType: 'ELECTRIC',      fuelConsumption: 17.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 136, insuranceEstimate: 3800, maintenanceEstimate: 1600, depreciationRate: 0.17, popularColor: 'לבן' },
  'Renault|Arkana':       { vehicleType: 'CROSSOVER', fuelType: 'HYBRID',        fuelConsumption: 5.5,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 145, insuranceEstimate: 5200, maintenanceEstimate: 3500, depreciationRate: 0.14, popularColor: 'כחול' },

  // ── Peugeot ─────────────────────────────────────────────────────────────
  'Peugeot|208':          { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.8,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 100, insuranceEstimate: 4000, maintenanceEstimate: 3200, depreciationRate: 0.14, popularColor: 'לבן' },
  'Peugeot|308':          { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 130, insuranceEstimate: 4800, maintenanceEstimate: 3800, depreciationRate: 0.15, popularColor: 'לבן' },
  'Peugeot|3008':         { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 180, insuranceEstimate: 6000, maintenanceEstimate: 4500, depreciationRate: 0.15, popularColor: 'אפור' },
  'Peugeot|2008':         { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 6.8,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 130, insuranceEstimate: 5000, maintenanceEstimate: 3800, depreciationRate: 0.14, popularColor: 'אדום' },
  'Peugeot|508':          { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 180, insuranceEstimate: 6500, maintenanceEstimate: 5000, depreciationRate: 0.15, popularColor: 'שחור' },
  'Peugeot|5008':         { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 180, insuranceEstimate: 7000, maintenanceEstimate: 5000, depreciationRate: 0.15, popularColor: 'שחור' },

  // ── Citroën ─────────────────────────────────────────────────────────────
  'Citroën|C3':           { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.8,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 83,  insuranceEstimate: 3800, maintenanceEstimate: 3000, depreciationRate: 0.14, popularColor: 'לבן' },
  'Citroën|C4':           { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 130, insuranceEstimate: 4500, maintenanceEstimate: 3500, depreciationRate: 0.15, popularColor: 'כחול' },
  'Citroën|C5 Aircross':  { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 180, insuranceEstimate: 6000, maintenanceEstimate: 4500, depreciationRate: 0.15, popularColor: 'לבן' },
  'Citroën|Berlingo':     { vehicleType: 'MINIVAN',   fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 110, insuranceEstimate: 4500, maintenanceEstimate: 3500, depreciationRate: 0.13, popularColor: 'לבן' },

  // ── Opel ────────────────────────────────────────────────────────────────
  'Opel|Astra':           { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 130, insuranceEstimate: 4500, maintenanceEstimate: 3500, depreciationRate: 0.15, popularColor: 'לבן' },
  'Opel|Corsa':           { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.8,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 100, insuranceEstimate: 4000, maintenanceEstimate: 3000, depreciationRate: 0.15, popularColor: 'אפור' },
  'Opel|Mokka':           { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 130, insuranceEstimate: 5000, maintenanceEstimate: 3800, depreciationRate: 0.15, popularColor: 'כחול' },
  'Opel|Crossland':       { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 110, insuranceEstimate: 4800, maintenanceEstimate: 3600, depreciationRate: 0.15, popularColor: 'כסוף' },
  'Opel|Grandland':       { vehicleType: 'SUV',       fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.5,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 300, insuranceEstimate: 6500, maintenanceEstimate: 4000, depreciationRate: 0.15, popularColor: 'לבן' },

  // ── Nissan ──────────────────────────────────────────────────────────────
  'Nissan|Qashqai':       { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 140, insuranceEstimate: 5500, maintenanceEstimate: 4000, depreciationRate: 0.13, popularColor: 'לבן' },
  'Nissan|Juke':          { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 114, insuranceEstimate: 4800, maintenanceEstimate: 3500, depreciationRate: 0.14, popularColor: 'כתום' },
  'Nissan|Leaf':          { vehicleType: 'HATCHBACK', fuelType: 'ELECTRIC',      fuelConsumption: 16.5, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 4000, maintenanceEstimate: 1600, depreciationRate: 0.18, popularColor: 'כחול' },
  'Nissan|X-Trail':       { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 163, insuranceEstimate: 6000, maintenanceEstimate: 4500, depreciationRate: 0.13, popularColor: 'לבן' },
  'Nissan|Micra':         { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.5,  engineSize: 1.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 90,  insuranceEstimate: 3500, maintenanceEstimate: 2800, depreciationRate: 0.15, popularColor: 'אדום' },

  // ── Mitsubishi ──────────────────────────────────────────────────────────
  'Mitsubishi|Outlander': { vehicleType: 'SUV',       fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.0,  engineSize: 2.4, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 224, insuranceEstimate: 6500, maintenanceEstimate: 4000, depreciationRate: 0.13, popularColor: 'לבן' },
  'Mitsubishi|Eclipse Cross':{ vehicleType: 'CROSSOVER',fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.5,engineSize: 2.4, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 188, insuranceEstimate: 6000, maintenanceEstimate: 3800, depreciationRate: 0.13, popularColor: 'שחור' },
  'Mitsubishi|ASX':       { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 150, insuranceEstimate: 5000, maintenanceEstimate: 3800, depreciationRate: 0.13, popularColor: 'לבן' },
  'Mitsubishi|L200':      { vehicleType: 'PICKUP',    fuelType: 'DIESEL',        fuelConsumption: 9.5,  engineSize: 2.4, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 181, insuranceEstimate: 5800, maintenanceEstimate: 4800, depreciationRate: 0.09, popularColor: 'לבן' },

  // ── Subaru ──────────────────────────────────────────────────────────────
  'Subaru|Forester':      { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.5,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 182, insuranceEstimate: 5800, maintenanceEstimate: 4500, depreciationRate: 0.11, popularColor: 'כסוף' },
  'Subaru|Outback':       { vehicleType: 'WAGON',     fuelType: 'GASOLINE',      fuelConsumption: 8.5,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 182, insuranceEstimate: 6000, maintenanceEstimate: 4500, depreciationRate: 0.11, popularColor: 'כסוף' },
  'Subaru|XV':            { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 156, insuranceEstimate: 5500, maintenanceEstimate: 4000, depreciationRate: 0.12, popularColor: 'כסוף' },
  'Subaru|Impreza':       { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 156, insuranceEstimate: 5200, maintenanceEstimate: 3800, depreciationRate: 0.12, popularColor: 'כחול' },
  'Subaru|Levorg':        { vehicleType: 'WAGON',     fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 170, insuranceEstimate: 6000, maintenanceEstimate: 4200, depreciationRate: 0.12, popularColor: 'כחול' },

  // ── Volvo ───────────────────────────────────────────────────────────────
  'Volvo|XC40':           { vehicleType: 'SUV',       fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 211, insuranceEstimate: 9000, maintenanceEstimate: 7000, depreciationRate: 0.14, popularColor: 'לבן' },
  'Volvo|XC60':           { vehicleType: 'SUV',       fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 340, insuranceEstimate: 12000,maintenanceEstimate: 9000, depreciationRate: 0.14, popularColor: 'לבן' },
  'Volvo|XC90':           { vehicleType: 'SUV',       fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 390, insuranceEstimate: 15000,maintenanceEstimate: 11000,depreciationRate: 0.14, popularColor: 'כסוף' },
  'Volvo|V60':            { vehicleType: 'WAGON',     fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 340, insuranceEstimate: 11000,maintenanceEstimate: 8500, depreciationRate: 0.14, popularColor: 'כחול' },
  'Volvo|S60':            { vehicleType: 'SEDAN',     fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 340, insuranceEstimate: 11000,maintenanceEstimate: 8500, depreciationRate: 0.14, popularColor: 'שחור' },
  'Volvo|C40':            { vehicleType: 'CROSSOVER', fuelType: 'ELECTRIC',      fuelConsumption: 19.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 408, insuranceEstimate: 11000,maintenanceEstimate: 2800, depreciationRate: 0.17, popularColor: 'לבן' },

  // ── Jeep ────────────────────────────────────────────────────────────────
  'Jeep|Compass':         { vehicleType: 'SUV',       fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.5,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 190, insuranceEstimate: 7500, maintenanceEstimate: 6000, depreciationRate: 0.14, popularColor: 'שחור' },
  'Jeep|Renegade':        { vehicleType: 'CROSSOVER', fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.5,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 190, insuranceEstimate: 7000, maintenanceEstimate: 5500, depreciationRate: 0.15, popularColor: 'ירוק' },
  'Jeep|Cherokee':        { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 9.5,  engineSize: 2.4, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 184, insuranceEstimate: 8000, maintenanceEstimate: 6500, depreciationRate: 0.14, popularColor: 'שחור' },
  'Jeep|Wrangler':        { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 11.0, engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 272, insuranceEstimate: 9000, maintenanceEstimate: 7000, depreciationRate: 0.10, popularColor: 'ירוק' },

  // ── Tesla ───────────────────────────────────────────────────────────────
  'Tesla|Model 3':        { vehicleType: 'SEDAN',     fuelType: 'ELECTRIC',      fuelConsumption: 14.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 351, insuranceEstimate: 7000, maintenanceEstimate: 2000, depreciationRate: 0.15, popularColor: 'לבן' },
  'Tesla|Model Y':        { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 15.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 358, insuranceEstimate: 7500, maintenanceEstimate: 2000, depreciationRate: 0.14, popularColor: 'לבן' },
  'Tesla|Model S':        { vehicleType: 'SEDAN',     fuelType: 'ELECTRIC',      fuelConsumption: 18.5, engineSize: 0,   transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 670, insuranceEstimate: 14000,maintenanceEstimate: 2500, depreciationRate: 0.18, popularColor: 'שחור' },
  'Tesla|Model X':        { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 20.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 670, insuranceEstimate: 16000,maintenanceEstimate: 2800, depreciationRate: 0.18, popularColor: 'שחור' },

  // ── Fiat ────────────────────────────────────────────────────────────────
  'Fiat|500':             { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.5,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 3, seats: 4, horsepower: 69,  insuranceEstimate: 3800, maintenanceEstimate: 3200, depreciationRate: 0.15, popularColor: 'לבן' },
  'Fiat|Tipo':            { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.4, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 95,  insuranceEstimate: 4200, maintenanceEstimate: 3500, depreciationRate: 0.15, popularColor: 'לבן' },
  'Fiat|Panda':           { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.8,  engineSize: 1.2, transmission: 'MANUAL',    doors: 5, seats: 5, horsepower: 69,  insuranceEstimate: 3500, maintenanceEstimate: 2800, depreciationRate: 0.15, popularColor: 'כסוף' },

  // ── Mini ────────────────────────────────────────────────────────────────
  'Mini|Cooper':          { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 3, seats: 4, horsepower: 136, insuranceEstimate: 7000, maintenanceEstimate: 6000, depreciationRate: 0.15, popularColor: 'לבן' },
  'Mini|Clubman':         { vehicleType: 'WAGON',     fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 192, insuranceEstimate: 8000, maintenanceEstimate: 6500, depreciationRate: 0.16, popularColor: 'אפור' },
  'Mini|Countryman':      { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 192, insuranceEstimate: 8500, maintenanceEstimate: 7000, depreciationRate: 0.15, popularColor: 'שחור' },
  'Mini|Paceman':         { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 3, seats: 4, horsepower: 122, insuranceEstimate: 7500, maintenanceEstimate: 6500, depreciationRate: 0.16, popularColor: 'כחול' },

  // ── Lexus ───────────────────────────────────────────────────────────────
  'Lexus|IS':             { vehicleType: 'SEDAN',     fuelType: 'HYBRID',        fuelConsumption: 6.0,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 218, insuranceEstimate: 9000, maintenanceEstimate: 6500, depreciationRate: 0.11, popularColor: 'שחור' },
  'Lexus|ES':             { vehicleType: 'SEDAN',     fuelType: 'HYBRID',        fuelConsumption: 5.5,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 218, insuranceEstimate: 10000,maintenanceEstimate: 7000, depreciationRate: 0.11, popularColor: 'שחור' },
  'Lexus|NX':             { vehicleType: 'SUV',       fuelType: 'HYBRID',        fuelConsumption: 6.5,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 245, insuranceEstimate: 10000,maintenanceEstimate: 7000, depreciationRate: 0.12, popularColor: 'שחור' },
  'Lexus|RX':             { vehicleType: 'SUV',       fuelType: 'HYBRID',        fuelConsumption: 7.0,  engineSize: 2.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 249, insuranceEstimate: 13000,maintenanceEstimate: 8500, depreciationRate: 0.12, popularColor: 'שחור' },
  'Lexus|UX':             { vehicleType: 'CROSSOVER', fuelType: 'HYBRID',        fuelConsumption: 5.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 184, insuranceEstimate: 9000, maintenanceEstimate: 6000, depreciationRate: 0.12, popularColor: 'כסוף' },

  // ── Infiniti ────────────────────────────────────────────────────────────
  'Infiniti|Q30':         { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 7.0,  engineSize: 1.6, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 122, insuranceEstimate: 7000, maintenanceEstimate: 5500, depreciationRate: 0.15, popularColor: 'שחור' },
  'Infiniti|Q50':         { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 9.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 211, insuranceEstimate: 9000, maintenanceEstimate: 7500, depreciationRate: 0.15, popularColor: 'שחור' },
  'Infiniti|QX30':        { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 8.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 211, insuranceEstimate: 8500, maintenanceEstimate: 7000, depreciationRate: 0.15, popularColor: 'שחור' },

  // ── Land Rover ──────────────────────────────────────────────────────────
  'Land_Rover|Range Rover':       { vehicleType: 'SUV', fuelType: 'DIESEL',      fuelConsumption: 10.0, engineSize: 3.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 300, insuranceEstimate: 18000,maintenanceEstimate: 14000,depreciationRate: 0.16, popularColor: 'שחור' },
  'Land_Rover|Range Rover Sport': { vehicleType: 'SUV', fuelType: 'DIESEL',      fuelConsumption: 9.5,  engineSize: 3.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 300, insuranceEstimate: 16000,maintenanceEstimate: 12000,depreciationRate: 0.16, popularColor: 'שחור' },
  'Land_Rover|Evoque':    { vehicleType: 'SUV',       fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 309, insuranceEstimate: 12000,maintenanceEstimate: 9500, depreciationRate: 0.16, popularColor: 'לבן' },
  'Land_Rover|Discovery': { vehicleType: 'SUV',       fuelType: 'DIESEL',        fuelConsumption: 9.5,  engineSize: 3.0, transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 300, insuranceEstimate: 16000,maintenanceEstimate: 12000,depreciationRate: 0.15, popularColor: 'שחור' },
  'Land_Rover|Defender':  { vehicleType: 'SUV',       fuelType: 'DIESEL',        fuelConsumption: 10.0, engineSize: 3.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 300, insuranceEstimate: 16000,maintenanceEstimate: 12000,depreciationRate: 0.12, popularColor: 'ירוק' },

  // ── Porsche ─────────────────────────────────────────────────────────────
  'Porsche|Macan':        { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 9.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 265, insuranceEstimate: 14000,maintenanceEstimate: 11000,depreciationRate: 0.14, popularColor: 'שחור' },
  'Porsche|Cayenne':      { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 10.5, engineSize: 3.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 340, insuranceEstimate: 18000,maintenanceEstimate: 14000,depreciationRate: 0.14, popularColor: 'שחור' },
  'Porsche|Taycan':       { vehicleType: 'SEDAN',     fuelType: 'ELECTRIC',      fuelConsumption: 22.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 571, insuranceEstimate: 18000,maintenanceEstimate: 4000, depreciationRate: 0.18, popularColor: 'שחור' },
  'Porsche|911':          { vehicleType: 'COUPE',     fuelType: 'GASOLINE',      fuelConsumption: 11.0, engineSize: 3.0, transmission: 'AUTOMATIC', doors: 2, seats: 4, horsepower: 450, insuranceEstimate: 20000,maintenanceEstimate: 15000,depreciationRate: 0.08, popularColor: 'אדום' },
  'Porsche|Panamera':     { vehicleType: 'SEDAN',     fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 3.0,  engineSize: 2.9, transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 462, insuranceEstimate: 18000,maintenanceEstimate: 14000,depreciationRate: 0.15, popularColor: 'שחור' },

  // ── Suzuki ──────────────────────────────────────────────────────────────
  'Suzuki|Swift':         { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.5,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 90,  insuranceEstimate: 3500, maintenanceEstimate: 2600, depreciationRate: 0.12, popularColor: 'לבן' },
  'Suzuki|Vitara':        { vehicleType: 'CROSSOVER', fuelType: 'HYBRID',        fuelConsumption: 5.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 140, insuranceEstimate: 4800, maintenanceEstimate: 3200, depreciationRate: 0.12, popularColor: 'כחול' },
  'Suzuki|S-Cross':       { vehicleType: 'CROSSOVER', fuelType: 'HYBRID',        fuelConsumption: 5.8,  engineSize: 1.4, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 129, insuranceEstimate: 5000, maintenanceEstimate: 3400, depreciationRate: 0.12, popularColor: 'לבן' },
  'Suzuki|Ignis':         { vehicleType: 'HATCHBACK', fuelType: 'HYBRID',        fuelConsumption: 5.0,  engineSize: 1.2, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 83,  insuranceEstimate: 3400, maintenanceEstimate: 2500, depreciationRate: 0.12, popularColor: 'כתום' },

  // ── Dacia ───────────────────────────────────────────────────────────────
  'Dacia|Sandero':        { vehicleType: 'HATCHBACK', fuelType: 'GASOLINE',      fuelConsumption: 5.8,  engineSize: 1.0, transmission: 'MANUAL',    doors: 5, seats: 5, horsepower: 90,  insuranceEstimate: 3400, maintenanceEstimate: 2500, depreciationRate: 0.13, popularColor: 'כסוף' },
  'Dacia|Duster':         { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 7.5,  engineSize: 1.3, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 130, insuranceEstimate: 4500, maintenanceEstimate: 3200, depreciationRate: 0.13, popularColor: 'כסוף' },
  'Dacia|Logan':          { vehicleType: 'SEDAN',     fuelType: 'GASOLINE',      fuelConsumption: 6.5,  engineSize: 1.0, transmission: 'MANUAL',    doors: 4, seats: 5, horsepower: 90,  insuranceEstimate: 3500, maintenanceEstimate: 2600, depreciationRate: 0.13, popularColor: 'לבן' },
  'Dacia|Spring':         { vehicleType: 'HATCHBACK', fuelType: 'ELECTRIC',      fuelConsumption: 14.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 4, horsepower: 65,  insuranceEstimate: 3000, maintenanceEstimate: 1200, depreciationRate: 0.17, popularColor: 'ירוק' },

  // ── Cupra ───────────────────────────────────────────────────────────────
  'Cupra|Formentor':      { vehicleType: 'CROSSOVER', fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.0,  engineSize: 1.4, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 245, insuranceEstimate: 8000, maintenanceEstimate: 5500, depreciationRate: 0.14, popularColor: 'אפור' },
  'Cupra|Born':           { vehicleType: 'HATCHBACK', fuelType: 'ELECTRIC',      fuelConsumption: 16.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 231, insuranceEstimate: 6500, maintenanceEstimate: 2000, depreciationRate: 0.16, popularColor: 'שחור' },
  'Cupra|Ateca':          { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.5,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 300, insuranceEstimate: 9000, maintenanceEstimate: 6500, depreciationRate: 0.14, popularColor: 'כחול' },

  // ── MG ──────────────────────────────────────────────────────────────────
  'MG|ZS':                { vehicleType: 'CROSSOVER', fuelType: 'ELECTRIC',      fuelConsumption: 16.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 177, insuranceEstimate: 4000, maintenanceEstimate: 1500, depreciationRate: 0.16, popularColor: 'לבן' },
  'MG|HS':                { vehicleType: 'SUV',       fuelType: 'GASOLINE',      fuelConsumption: 8.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 162, insuranceEstimate: 5000, maintenanceEstimate: 3500, depreciationRate: 0.16, popularColor: 'לבן' },
  'MG|Marvel R':          { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 18.5, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 288, insuranceEstimate: 5500, maintenanceEstimate: 1800, depreciationRate: 0.17, popularColor: 'כסוף' },
  'MG|5':                 { vehicleType: 'WAGON',     fuelType: 'ELECTRIC',      fuelConsumption: 17.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 177, insuranceEstimate: 4200, maintenanceEstimate: 1500, depreciationRate: 0.16, popularColor: 'לבן' },

  // ── BYD ─────────────────────────────────────────────────────────────────
  'BYD|Atto 3':           { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 16.5, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 204, insuranceEstimate: 4500, maintenanceEstimate: 1600, depreciationRate: 0.16, popularColor: 'לבן' },
  'BYD|Dolphin':          { vehicleType: 'HATCHBACK', fuelType: 'ELECTRIC',      fuelConsumption: 14.5, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 204, insuranceEstimate: 4000, maintenanceEstimate: 1400, depreciationRate: 0.17, popularColor: 'כחול' },
  'BYD|Seal':             { vehicleType: 'SEDAN',     fuelType: 'ELECTRIC',      fuelConsumption: 15.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 313, insuranceEstimate: 5000, maintenanceEstimate: 1600, depreciationRate: 0.17, popularColor: 'שחור' },
  'BYD|Han':              { vehicleType: 'SEDAN',     fuelType: 'ELECTRIC',      fuelConsumption: 16.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 4, seats: 5, horsepower: 517, insuranceEstimate: 7000, maintenanceEstimate: 2000, depreciationRate: 0.17, popularColor: 'שחור' },
  'BYD|Tang':             { vehicleType: 'SUV',       fuelType: 'ELECTRIC',      fuelConsumption: 20.0, engineSize: 0,   transmission: 'AUTOMATIC', doors: 5, seats: 7, horsepower: 517, insuranceEstimate: 8000, maintenanceEstimate: 2200, depreciationRate: 0.17, popularColor: 'שחור' },

  // ── Lynk & Co ───────────────────────────────────────────────────────────
  'Lynk_Co|01':           { vehicleType: 'SUV',       fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.5,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 262, insuranceEstimate: 7000, maintenanceEstimate: 4000, depreciationRate: 0.16, popularColor: 'כחול' },
  'Lynk_Co|02':           { vehicleType: 'CROSSOVER', fuelType: 'GASOLINE',      fuelConsumption: 8.0,  engineSize: 2.0, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 190, insuranceEstimate: 6500, maintenanceEstimate: 4500, depreciationRate: 0.16, popularColor: 'שחור' },
  'Lynk_Co|05':           { vehicleType: 'CROSSOVER', fuelType: 'PLUG_IN_HYBRID',fuelConsumption: 2.0,  engineSize: 1.5, transmission: 'AUTOMATIC', doors: 5, seats: 5, horsepower: 262, insuranceEstimate: 7000, maintenanceEstimate: 4000, depreciationRate: 0.16, popularColor: 'כחול' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Public lookup function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Look up specs for a brand + model combination.
 * Returns null if the pair isn't in the database.
 */
export function getCarSpecs(brand: string, model: string): SpecEntry | null {
  return DB[`${brand}|${model}`] ?? null
}

/**
 * Apply a year-based adjustment to insurance & maintenance estimates.
 * Older cars cost slightly less to insure but slightly more to maintain.
 */
export function adjustSpecsForYear(specs: SpecEntry, year: number): SpecEntry {
  const age = new Date().getFullYear() - year
  const insuranceFactor    = age <= 2 ? 1.0 : age <= 5 ? 0.95 : age <= 10 ? 0.85 : 0.75
  const maintenanceFactor  = age <= 2 ? 1.0 : age <= 5 ? 1.05 : age <= 10 ? 1.15 : 1.30

  return {
    ...specs,
    insuranceEstimate:   Math.round(specs.insuranceEstimate   * insuranceFactor   / 100) * 100,
    maintenanceEstimate: Math.round(specs.maintenanceEstimate * maintenanceFactor / 100) * 100,
  }
}
