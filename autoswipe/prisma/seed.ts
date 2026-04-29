/**
 * AutoSwipe Database Seed (SQLite)
 */

import path from 'path'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

/** Download remote demo images once into public/uploads/seed for local paths. */
async function cacheSeedImage(remoteUrl: string, seedKey: string): Promise<string> {
  const rel = `/uploads/seed/${seedKey}`
  const diskPath = path.join(process.cwd(), 'public', rel.replace(/^\//, ''))
  await fs.mkdir(path.dirname(diskPath), { recursive: true })
  if (!existsSync(diskPath)) {
    try {
      const res = await fetch(remoteUrl)
      if (!res.ok) throw new Error(`Seed fetch failed: ${remoteUrl}`)
      await fs.writeFile(diskPath, Buffer.from(await res.arrayBuffer()))
    } catch (err) {
      console.warn(`⚠️  Skipping seed image: ${remoteUrl}`, err)
      return ''
    }
  }
  return rel
}

const prisma = new PrismaClient()

const CAR_IMAGES: Record<string, string[]> = {
  BMW: [
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800',
    'https://images.unsplash.com/photo-1617531653332-bd46c16f4d68?w=800',
  ],
  Toyota: [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
  ],
  Mazda: [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800',
  ],
  Hyundai: [
    'https://images.unsplash.com/photo-1609752679890-619678c65536?w=800',
    'https://images.unsplash.com/photo-1635273051774-c8d0c321ee3c?w=800',
  ],
  Tesla: [
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
  ],
  Mercedes: [
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800',
  ],
  Audi: [
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
  ],
  Volkswagen: [
    'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
  ],
  Kia: [
    'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800',
  ],
  Honda: [
    'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=800',
    'https://images.unsplash.com/photo-1619976215249-f32d15d55bac?w=800',
  ],
  Volvo: [
    'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800',
  ],
  Nissan: [
    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800',
  ],
  Renault: [
    'https://images.unsplash.com/photo-1580414057403-c5f451f30e1c?w=800',
  ],
  Skoda: [
    'https://images.unsplash.com/photo-1625259466649-4c22571ea2fe?w=800',
  ],
  Ford: [
    'https://images.unsplash.com/photo-1551830820-330a71b99659?w=800',
  ],
  Peugeot: [
    'https://images.unsplash.com/photo-1609521126297-c68b9f246e64?w=800',
  ],
  default: [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
  ],
}

const SEED_LISTINGS = [
  // ── Batch 1 – originals ──────────────────────────────────────────────────
  { brand: 'BMW', model: '3 Series', year: 2021, mileage: 42000, price: 148000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 7.2, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 2000, color: 'לבן', doors: 4, seats: 5, insuranceEstimate: 6500, maintenanceEstimate: 4200, depreciationRate: 0.15, description: 'רכב במצב מצוין, שמורה, היסטוריה מלאה, צמיגים חדשים.', dealTag: 'BELOW_MARKET', monthlyCost: 4800, marketAvgPrice: 160000, priceVsMarket: -0.075 },
  { brand: 'Toyota', model: 'Corolla', year: 2020, mileage: 68000, price: 82000, location: 'חיפה', fuelType: 'HYBRID', fuelConsumption: 4.5, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 1800, color: 'כסוף', doors: 4, seats: 5, insuranceEstimate: 3800, maintenanceEstimate: 2400, depreciationRate: 0.10, description: 'קורולה היברידית חסכונית. בעלים ראשון. ספר שירות מלא.', dealTag: 'FAIR_PRICE', monthlyCost: 2800, marketAvgPrice: 85000, priceVsMarket: -0.035 },
  { brand: 'Mazda', model: 'CX-5', year: 2022, mileage: 28000, price: 135000, location: 'ראשון לציון', fuelType: 'GASOLINE', fuelConsumption: 7.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2500, color: 'אדום', doors: 5, seats: 5, insuranceEstimate: 5800, maintenanceEstimate: 3600, depreciationRate: 0.13, description: 'CX-5 GT במצב מושלם. פנורמה, עור, נגן.', dealTag: 'GREAT_DEAL', monthlyCost: 4200, marketAvgPrice: 160000, priceVsMarket: -0.156 },
  { brand: 'Tesla', model: 'Model 3', year: 2023, mileage: 15000, price: 185000, location: 'תל אביב-יפו', fuelType: 'ELECTRIC', fuelConsumption: 15, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', color: 'שחור', doors: 4, seats: 5, insuranceEstimate: 7200, maintenanceEstimate: 1200, depreciationRate: 0.18, description: 'מודל 3 Long Range, טעינה ביתית כלולה, פילוט אוטומטי.', dealTag: 'NEW_LISTING', monthlyCost: 5900, marketAvgPrice: 190000, priceVsMarket: -0.026 },
  { brand: 'Hyundai', model: 'Tucson', year: 2021, mileage: 51000, price: 108000, location: 'באר שבע', fuelType: 'GASOLINE', fuelConsumption: 8.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1600, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 5200, maintenanceEstimate: 3200, depreciationRate: 0.12, description: 'טוסון טאופ ליין. מצלמה 360. שמרה מאוד.', dealTag: 'FAIR_PRICE', monthlyCost: 3600, marketAvgPrice: 110000, priceVsMarket: -0.018 },
  { brand: 'BMW', model: '1 Series', year: 2020, mileage: 55000, price: 112000, location: 'נתניה', fuelType: 'GASOLINE', fuelConsumption: 6.8, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1500, color: 'שחור', doors: 5, seats: 5, insuranceEstimate: 6000, maintenanceEstimate: 4000, depreciationRate: 0.14, description: 'BMW 116i. אל-נגיעה, מלא ספר שירות.', dealTag: 'BELOW_MARKET', monthlyCost: 3800, marketAvgPrice: 125000, priceVsMarket: -0.104 },
  { brand: 'Volkswagen', model: 'Golf', year: 2019, mileage: 72000, price: 74000, location: 'רמת גן', fuelType: 'GASOLINE', fuelConsumption: 6.5, vehicleType: 'HATCHBACK', transmission: 'MANUAL', engineSize: 1400, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 3600, maintenanceEstimate: 2800, depreciationRate: 0.12, description: 'גולף Highline. בעל ראשון. מצב מצוין.', dealTag: 'FAIR_PRICE', monthlyCost: 2600, marketAvgPrice: 76000, priceVsMarket: -0.026 },
  { brand: 'Kia', model: 'Sportage', year: 2022, mileage: 32000, price: 118000, location: 'פתח תקווה', fuelType: 'HYBRID', fuelConsumption: 5.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1600, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 5500, maintenanceEstimate: 2800, depreciationRate: 0.12, description: 'ספורטאג\' MHEV. ציוד מלא, מסך גדול.', dealTag: 'NEW_LISTING', monthlyCost: 3900, marketAvgPrice: 120000, priceVsMarket: -0.017 },
  { brand: 'Audi', model: 'A3', year: 2021, mileage: 38000, price: 138000, location: 'הרצליה', fuelType: 'GASOLINE', fuelConsumption: 7.0, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1400, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 6800, maintenanceEstimate: 4500, depreciationRate: 0.15, description: 'A3 Sportback S-line. תמונות מלאות. רק בפגישה.', dealTag: 'FAIR_PRICE', monthlyCost: 4600, marketAvgPrice: 140000, priceVsMarket: -0.014 },
  { brand: 'Toyota', model: 'RAV4', year: 2022, mileage: 24000, price: 152000, location: 'ירושלים', fuelType: 'HYBRID', fuelConsumption: 5.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2500, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 6000, maintenanceEstimate: 2400, depreciationRate: 0.11, description: 'RAV4 Hybrid. בעל ראשון, מצב מושלם.', dealTag: 'BELOW_MARKET', monthlyCost: 4900, marketAvgPrice: 170000, priceVsMarket: -0.106 },

  // ── Batch 2 – new listings ───────────────────────────────────────────────
  { brand: 'Mercedes', model: 'C-Class', year: 2021, mileage: 38000, price: 195000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 7.8, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 1500, color: 'שחור', doors: 4, seats: 5, insuranceEstimate: 8500, maintenanceEstimate: 5500, depreciationRate: 0.16, description: 'C200 AMG Line. סאונד Burmester, מושבי עור, מצב חדש.', dealTag: 'FAIR_PRICE', monthlyCost: 6200, marketAvgPrice: 200000, priceVsMarket: -0.025 },
  { brand: 'Mercedes', model: 'GLC', year: 2020, mileage: 62000, price: 218000, location: 'הרצליה', fuelType: 'GASOLINE', fuelConsumption: 8.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 9200, maintenanceEstimate: 6000, depreciationRate: 0.15, description: 'GLC 300 4MATIC. פנורמה, ניווט, גג. אופציונלי AMG.', dealTag: 'BELOW_MARKET', monthlyCost: 7100, marketAvgPrice: 240000, priceVsMarket: -0.092 },
  { brand: 'Audi', model: 'Q5', year: 2022, mileage: 22000, price: 228000, location: 'רמת גן', fuelType: 'GASOLINE', fuelConsumption: 8.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 9500, maintenanceEstimate: 5800, depreciationRate: 0.15, description: 'Q5 45 TFSI Quattro. ציוד S-line מלא. ריצה נמוכה.', dealTag: 'NEW_LISTING', monthlyCost: 7400, marketAvgPrice: 235000, priceVsMarket: -0.030 },
  { brand: 'Hyundai', model: 'Ioniq 5', year: 2023, mileage: 18000, price: 195000, location: 'תל אביב-יפו', fuelType: 'ELECTRIC', fuelConsumption: 17, vehicleType: 'SUV', transmission: 'AUTOMATIC', color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 7800, maintenanceEstimate: 1500, depreciationRate: 0.17, description: 'Ioniq 5 AWD 77kWh. טעינה 800V, מרחק 480 ק"מ, אחריות יצרן.', dealTag: 'FAIR_PRICE', monthlyCost: 6300, marketAvgPrice: 200000, priceVsMarket: -0.025 },
  { brand: 'Kia', model: 'EV6', year: 2022, mileage: 31000, price: 178000, location: 'פתח תקווה', fuelType: 'ELECTRIC', fuelConsumption: 16, vehicleType: 'CROSSOVER', transmission: 'AUTOMATIC', color: 'ירוק', doors: 5, seats: 5, insuranceEstimate: 7500, maintenanceEstimate: 1400, depreciationRate: 0.17, description: 'EV6 GT-Line RWD. עיצוב חדשני, טעינה מהירה, טכנולוגיה מלאה.', dealTag: 'BELOW_MARKET', monthlyCost: 5800, marketAvgPrice: 195000, priceVsMarket: -0.087 },
  { brand: 'Tesla', model: 'Model Y', year: 2023, mileage: 12000, price: 215000, location: 'חיפה', fuelType: 'ELECTRIC', fuelConsumption: 16.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 8200, maintenanceEstimate: 1200, depreciationRate: 0.18, description: 'Model Y Long Range AWD. מרחק 533 ק"מ, פנורמה, אוטופיילוט.', dealTag: 'FAIR_PRICE', monthlyCost: 6900, marketAvgPrice: 218000, priceVsMarket: -0.014 },
  { brand: 'Honda', model: 'Civic', year: 2021, mileage: 44000, price: 88000, location: 'רחובות', fuelType: 'GASOLINE', fuelConsumption: 6.8, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 1500, color: 'כחול', doors: 4, seats: 5, insuranceEstimate: 4200, maintenanceEstimate: 2800, depreciationRate: 0.11, description: 'Civic Sport. שמורה מאוד, מסך מגע, קאמרה אחורית.', dealTag: 'FAIR_PRICE', monthlyCost: 3100, marketAvgPrice: 90000, priceVsMarket: -0.022 },
  { brand: 'Honda', model: 'CR-V', year: 2020, mileage: 78000, price: 118000, location: 'אשדוד', fuelType: 'HYBRID', fuelConsumption: 6.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'כסוף', doors: 5, seats: 5, insuranceEstimate: 5800, maintenanceEstimate: 3200, depreciationRate: 0.12, description: 'CR-V Hybrid Sport. 4WD, רב-שימושי, משפחתי מושלם.', dealTag: 'BELOW_MARKET', monthlyCost: 3800, marketAvgPrice: 132000, priceVsMarket: -0.106 },
  { brand: 'Volvo', model: 'XC60', year: 2021, mileage: 45000, price: 198000, location: 'ירושלים', fuelType: 'HYBRID', fuelConsumption: 5.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 8800, maintenanceEstimate: 5200, depreciationRate: 0.14, description: 'XC60 T6 Inscription. הגנת הולכי רגל, מושבי עור, פנורמה.', dealTag: 'FAIR_PRICE', monthlyCost: 6500, marketAvgPrice: 205000, priceVsMarket: -0.034 },
  { brand: 'Volvo', model: 'XC40', year: 2022, mileage: 26000, price: 172000, location: 'תל אביב-יפו', fuelType: 'ELECTRIC', fuelConsumption: 18, vehicleType: 'SUV', transmission: 'AUTOMATIC', color: 'אדום', doors: 5, seats: 5, insuranceEstimate: 8000, maintenanceEstimate: 1600, depreciationRate: 0.16, description: 'XC40 Recharge Pure Electric. 418 כ"ס, מרחק 418 ק"מ, בטיחות 5 כוכבים.', dealTag: 'NEW_LISTING', monthlyCost: 5600, marketAvgPrice: 178000, priceVsMarket: -0.034 },
  { brand: 'Skoda', model: 'Octavia', year: 2021, mileage: 52000, price: 92000, location: 'נתניה', fuelType: 'GASOLINE', fuelConsumption: 6.4, vehicleType: 'WAGON', transmission: 'AUTOMATIC', engineSize: 1400, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 4200, maintenanceEstimate: 2600, depreciationRate: 0.11, description: 'Octavia Combi Style. מגרז ענק, חיישנים, מסך 10 אינץ\'.', dealTag: 'GREAT_DEAL', monthlyCost: 3100, marketAvgPrice: 108000, priceVsMarket: -0.148 },
  { brand: 'Skoda', model: 'Karoq', year: 2020, mileage: 61000, price: 86000, location: 'חדרה', fuelType: 'GASOLINE', fuelConsumption: 7.0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1500, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 4500, maintenanceEstimate: 2900, depreciationRate: 0.12, description: 'Karoq Style. חיישני פארקינג, מצלמה אחורית, ציוד מלא.', dealTag: 'BELOW_MARKET', monthlyCost: 2900, marketAvgPrice: 96000, priceVsMarket: -0.104 },
  { brand: 'Nissan', model: 'Qashqai', year: 2021, mileage: 48000, price: 98000, location: 'אשקלון', fuelType: 'GASOLINE', fuelConsumption: 7.4, vehicleType: 'CROSSOVER', transmission: 'AUTOMATIC', engineSize: 1300, color: 'שחור', doors: 5, seats: 5, insuranceEstimate: 4800, maintenanceEstimate: 3000, depreciationRate: 0.12, description: 'Qashqai N-Connecta. ProPilot, מסך מגע, בקרת שיוט.', dealTag: 'FAIR_PRICE', monthlyCost: 3300, marketAvgPrice: 100000, priceVsMarket: -0.020 },
  { brand: 'Nissan', model: 'Leaf', year: 2022, mileage: 29000, price: 112000, location: 'ראשון לציון', fuelType: 'ELECTRIC', fuelConsumption: 15, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 5200, maintenanceEstimate: 1200, depreciationRate: 0.15, description: 'Leaf 40kWh. מרחק 270 ק"מ, ProPilot, e-Pedal. מושלם לעיר.', dealTag: 'FAIR_PRICE', monthlyCost: 3600, marketAvgPrice: 115000, priceVsMarket: -0.026 },
  { brand: 'Ford', model: 'Kuga', year: 2021, mileage: 43000, price: 105000, location: 'פתח תקווה', fuelType: 'HYBRID', fuelConsumption: 5.6, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2500, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 5000, maintenanceEstimate: 3100, depreciationRate: 0.12, description: 'Kuga PHEV Titanium. חשמלי + בנזין, מגרז 520L, מושבי חימום.', dealTag: 'BELOW_MARKET', monthlyCost: 3500, marketAvgPrice: 118000, priceVsMarket: -0.110 },
  { brand: 'Renault', model: 'Arkana', year: 2022, mileage: 21000, price: 108000, location: 'תל אביב-יפו', fuelType: 'HYBRID', fuelConsumption: 4.8, vehicleType: 'CROSSOVER', transmission: 'AUTOMATIC', engineSize: 1600, color: 'כסוף', doors: 5, seats: 5, insuranceEstimate: 4900, maintenanceEstimate: 2700, depreciationRate: 0.12, description: 'Arkana R.S. Line E-TECH. עיצוב קופה, חסכוני, ריצה נמוכה.', dealTag: 'NEW_LISTING', monthlyCost: 3500, marketAvgPrice: 112000, priceVsMarket: -0.036 },
  { brand: 'Peugeot', model: '3008', year: 2020, mileage: 66000, price: 95000, location: 'חיפה', fuelType: 'GASOLINE', fuelConsumption: 7.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1200, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 4600, maintenanceEstimate: 3000, depreciationRate: 0.13, description: '3008 Allure. i-Cockpit, בקרת שיוט אדפטיבית, מצלמה 360.', dealTag: 'FAIR_PRICE', monthlyCost: 3200, marketAvgPrice: 98000, priceVsMarket: -0.031 },
  { brand: 'Volkswagen', model: 'Tiguan', year: 2021, mileage: 47000, price: 128000, location: 'רמת גן', fuelType: 'GASOLINE', fuelConsumption: 7.6, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1400, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 5600, maintenanceEstimate: 3400, depreciationRate: 0.13, description: 'Tiguan R-Line 4Motion. Digital Cockpit, רדיו 9.2 אינץ\'.', dealTag: 'FAIR_PRICE', monthlyCost: 4200, marketAvgPrice: 132000, priceVsMarket: -0.030 },
  { brand: 'Volkswagen', model: 'ID.4', year: 2023, mileage: 14000, price: 188000, location: 'תל אביב-יפו', fuelType: 'ELECTRIC', fuelConsumption: 17.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 7600, maintenanceEstimate: 1500, depreciationRate: 0.17, description: 'ID.4 Pro. מרחק 520 ק"מ, Travel Assist, גג פנורמי.', dealTag: 'NEW_LISTING', monthlyCost: 6100, marketAvgPrice: 193000, priceVsMarket: -0.026 },
  { brand: 'Mazda', model: 'Mazda3', year: 2022, mileage: 19000, price: 105000, location: 'הרצליה', fuelType: 'GASOLINE', fuelConsumption: 6.9, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 2000, color: 'אדום', doors: 4, seats: 5, insuranceEstimate: 4800, maintenanceEstimate: 2900, depreciationRate: 0.12, description: 'Mazda3 Skyactiv-G Premium. עיצוב יוקרתי, מסך HUD, i-Activsense.', dealTag: 'FAIR_PRICE', monthlyCost: 3500, marketAvgPrice: 108000, priceVsMarket: -0.028 },
  { brand: 'Mazda', model: 'CX-30', year: 2021, mileage: 35000, price: 98000, location: 'ראשון לציון', fuelType: 'GASOLINE', fuelConsumption: 6.5, vehicleType: 'CROSSOVER', transmission: 'AUTOMATIC', engineSize: 2000, color: 'כסוף', doors: 5, seats: 5, insuranceEstimate: 4700, maintenanceEstimate: 2800, depreciationRate: 0.12, description: 'CX-30 GT. בקרת שיוט אדפטיבית, מערכת שמע Bose, פנורמה.', dealTag: 'BELOW_MARKET', monthlyCost: 3300, marketAvgPrice: 108000, priceVsMarket: -0.093 },
  { brand: 'BMW', model: '5 Series', year: 2020, mileage: 74000, price: 195000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 8.1, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 2000, color: 'שחור', doors: 4, seats: 5, insuranceEstimate: 9000, maintenanceEstimate: 5500, depreciationRate: 0.16, description: '530i M-Sport. מסך 12.3", קרלינג הגה, אחורי חשמלי.', dealTag: 'BELOW_MARKET', monthlyCost: 6300, marketAvgPrice: 220000, priceVsMarket: -0.114 },
  { brand: 'BMW', model: 'X3', year: 2022, mileage: 27000, price: 235000, location: 'הרצליה', fuelType: 'GASOLINE', fuelConsumption: 8.4, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 9800, maintenanceEstimate: 5800, depreciationRate: 0.15, description: 'X3 30i xDrive M Sport. מרוב ציוד. ריצה נמוכה, כמו חדש.', dealTag: 'FAIR_PRICE', monthlyCost: 7600, marketAvgPrice: 240000, priceVsMarket: -0.021 },
  { brand: 'Audi', model: 'A4', year: 2020, mileage: 61000, price: 152000, location: 'נתניה', fuelType: 'GASOLINE', fuelConsumption: 7.5, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 2000, color: 'לבן', doors: 4, seats: 5, insuranceEstimate: 7500, maintenanceEstimate: 4800, depreciationRate: 0.15, description: 'A4 45 TFSI S-line Quattro. Virtual Cockpit, בנזין חסכוני.', dealTag: 'BELOW_MARKET', monthlyCost: 4900, marketAvgPrice: 168000, priceVsMarket: -0.095 },
  { brand: 'Toyota', model: 'C-HR', year: 2021, mileage: 40000, price: 94000, location: 'ירושלים', fuelType: 'HYBRID', fuelConsumption: 5.0, vehicleType: 'CROSSOVER', transmission: 'AUTOMATIC', engineSize: 1800, color: 'שחור', doors: 5, seats: 5, insuranceEstimate: 4400, maintenanceEstimate: 2200, depreciationRate: 0.11, description: 'C-HR GR Sport Hybrid. עיצוב ייחודי, חסכוני, שמורה.', dealTag: 'FAIR_PRICE', monthlyCost: 3100, marketAvgPrice: 97000, priceVsMarket: -0.031 },
  { brand: 'Toyota', model: 'Prius', year: 2022, mileage: 23000, price: 118000, location: 'תל אביב-יפו', fuelType: 'HYBRID', fuelConsumption: 4.2, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 1800, color: 'כסוף', doors: 4, seats: 5, insuranceEstimate: 5200, maintenanceEstimate: 2000, depreciationRate: 0.10, description: 'Prius Hybrid Executive. 4.2L/100km, מושלם להורדה ולעסקים.', dealTag: 'GREAT_DEAL', monthlyCost: 3600, marketAvgPrice: 135000, priceVsMarket: -0.126 },
  { brand: 'Hyundai', model: 'Kona', year: 2022, mileage: 28000, price: 112000, location: 'חדרה', fuelType: 'ELECTRIC', fuelConsumption: 14.5, vehicleType: 'CROSSOVER', transmission: 'AUTOMATIC', color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 5400, maintenanceEstimate: 1300, depreciationRate: 0.15, description: 'Kona Electric 64kWh. מרחק 484 ק"מ, ציוד Prime, אחריות יצרן.', dealTag: 'FAIR_PRICE', monthlyCost: 3600, marketAvgPrice: 115000, priceVsMarket: -0.026 },
  { brand: 'Hyundai', model: 'Santa Fe', year: 2021, mileage: 55000, price: 158000, location: 'ראשון לציון', fuelType: 'HYBRID', fuelConsumption: 6.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'לבן', doors: 5, seats: 7, insuranceEstimate: 7200, maintenanceEstimate: 3800, depreciationRate: 0.13, description: 'Santa Fe HTRAC 7-מושבים. מסך 10.25", מצלמת 360, טכנולוגיה מלאה.', dealTag: 'BELOW_MARKET', monthlyCost: 5100, marketAvgPrice: 175000, priceVsMarket: -0.097 },
  { brand: 'Kia', model: 'Niro', year: 2021, mileage: 42000, price: 105000, location: 'אשדוד', fuelType: 'HYBRID', fuelConsumption: 4.8, vehicleType: 'CROSSOVER', transmission: 'AUTOMATIC', engineSize: 1600, color: 'ירוק', doors: 5, seats: 5, insuranceEstimate: 4800, maintenanceEstimate: 2400, depreciationRate: 0.11, description: 'Niro HEV Inspiration. חסכוני מאוד, ציוד מלא, בעל ראשון.', dealTag: 'FAIR_PRICE', monthlyCost: 3400, marketAvgPrice: 108000, priceVsMarket: -0.028 },
  { brand: 'Kia', model: 'Sorento', year: 2022, mileage: 33000, price: 175000, location: 'תל אביב-יפו', fuelType: 'HYBRID', fuelConsumption: 6.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1600, color: 'שחור', doors: 5, seats: 7, insuranceEstimate: 7800, maintenanceEstimate: 3600, depreciationRate: 0.13, description: 'Sorento PHEV 7-מקומות. 265 כ"ס, 4WD, ציוד PLATINUM.', dealTag: 'FAIR_PRICE', monthlyCost: 5700, marketAvgPrice: 180000, priceVsMarket: -0.028 },
  { brand: 'Volkswagen', model: 'Polo', year: 2021, mileage: 38000, price: 72000, location: 'באר שבע', fuelType: 'GASOLINE', fuelConsumption: 5.8, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1000, color: 'אדום', doors: 5, seats: 5, insuranceEstimate: 3400, maintenanceEstimate: 2200, depreciationRate: 0.11, description: 'Polo Highline. Active Info Display, מסך 8 אינץ\', חיישנים.', dealTag: 'FAIR_PRICE', monthlyCost: 2400, marketAvgPrice: 74000, priceVsMarket: -0.027 },
  { brand: 'Mercedes', model: 'A-Class', year: 2021, mileage: 41000, price: 148000, location: 'חיפה', fuelType: 'GASOLINE', fuelConsumption: 6.5, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1300, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 7200, maintenanceEstimate: 4500, depreciationRate: 0.15, description: 'A200 AMG Line. MBUX, AR-ניווט, מערכת שמע Burmester.', dealTag: 'BELOW_MARKET', monthlyCost: 4800, marketAvgPrice: 162000, priceVsMarket: -0.086 },
  { brand: 'Renault', model: 'Captur', year: 2022, mileage: 24000, price: 88000, location: 'נתניה', fuelType: 'HYBRID', fuelConsumption: 5.0, vehicleType: 'CROSSOVER', transmission: 'AUTOMATIC', engineSize: 1600, color: 'כתום', doors: 5, seats: 5, insuranceEstimate: 4200, maintenanceEstimate: 2500, depreciationRate: 0.12, description: 'Captur E-TECH Hybrid 145. חסכוני, ריצה נמוכה, ציוד Techno.', dealTag: 'NEW_LISTING', monthlyCost: 2900, marketAvgPrice: 91000, priceVsMarket: -0.033 },
  { brand: 'Ford', model: 'Puma', year: 2022, mileage: 19000, price: 98000, location: 'רחובות', fuelType: 'HYBRID', fuelConsumption: 5.2, vehicleType: 'CROSSOVER', transmission: 'AUTOMATIC', engineSize: 1000, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 4500, maintenanceEstimate: 2600, depreciationRate: 0.12, description: 'Puma ST-Line EcoBoost MHEV. מגרז MegaBox, ריצה נמוכה.', dealTag: 'FAIR_PRICE', monthlyCost: 3200, marketAvgPrice: 101000, priceVsMarket: -0.030 },
  { brand: 'Toyota', model: 'Camry', year: 2021, mileage: 44000, price: 128000, location: 'ירושלים', fuelType: 'HYBRID', fuelConsumption: 5.8, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 2500, color: 'שחור', doors: 4, seats: 5, insuranceEstimate: 5800, maintenanceEstimate: 2800, depreciationRate: 0.11, description: 'Camry Hybrid Lounge. מנוע 218 כ"ס, נוח ומרווח, ציוד מלא.', dealTag: 'FAIR_PRICE', monthlyCost: 4100, marketAvgPrice: 132000, priceVsMarket: -0.030 },
  { brand: 'Peugeot', model: '208', year: 2022, mileage: 22000, price: 74000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 5.5, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1200, color: 'צהוב', doors: 5, seats: 5, insuranceEstimate: 3600, maintenanceEstimate: 2200, depreciationRate: 0.12, description: '208 Allure. i-Cockpit, מסך 7 אינץ\', ריצה נמוכה, כמו חדשה.', dealTag: 'NEW_LISTING', monthlyCost: 2500, marketAvgPrice: 76000, priceVsMarket: -0.026 },
  { brand: 'Hyundai', model: 'i30', year: 2020, mileage: 58000, price: 78000, location: 'פתח תקווה', fuelType: 'GASOLINE', fuelConsumption: 6.8, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1400, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 3800, maintenanceEstimate: 2500, depreciationRate: 0.11, description: 'i30 Elite. בקרת שיוט, מצלמה אחורית, מסך מגע, חיישנים.', dealTag: 'BELOW_MARKET', monthlyCost: 2700, marketAvgPrice: 87000, priceVsMarket: -0.103 },
  { brand: 'BMW', model: 'X1', year: 2022, mileage: 24000, price: 195000, location: 'הרצליה', fuelType: 'GASOLINE', fuelConsumption: 7.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1500, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 8500, maintenanceEstimate: 4800, depreciationRate: 0.15, description: 'X1 xDrive 23i M-Sport. Live Cockpit Pro, ריצה נמוכה, טכנולוגיה מלאה.', dealTag: 'FAIR_PRICE', monthlyCost: 6300, marketAvgPrice: 200000, priceVsMarket: -0.025 },
  { brand: 'Audi', model: 'Q3', year: 2021, mileage: 36000, price: 162000, location: 'רמת גן', fuelType: 'GASOLINE', fuelConsumption: 7.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1500, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 8000, maintenanceEstimate: 4800, depreciationRate: 0.14, description: 'Q3 35 TFSI S-line. ווירטואל קוקפיט, פנורמה, מגע.', dealTag: 'FAIR_PRICE', monthlyCost: 5300, marketAvgPrice: 168000, priceVsMarket: -0.036 },
  { brand: 'Kia', model: 'Ceed', year: 2021, mileage: 49000, price: 82000, location: 'אשקלון', fuelType: 'GASOLINE', fuelConsumption: 6.4, vehicleType: 'HATCHBACK', transmission: 'MANUAL', engineSize: 1400, color: 'אדום', doors: 5, seats: 5, insuranceEstimate: 3900, maintenanceEstimate: 2600, depreciationRate: 0.11, description: 'Ceed GT-Line. ספורטיבי, כיסאות ספורט, ריצה בינונית.', dealTag: 'FAIR_PRICE', monthlyCost: 2800, marketAvgPrice: 84000, priceVsMarket: -0.024 },
  { brand: 'Volvo', model: 'V60', year: 2020, mileage: 68000, price: 168000, location: 'חיפה', fuelType: 'HYBRID', fuelConsumption: 5.5, vehicleType: 'WAGON', transmission: 'AUTOMATIC', engineSize: 2000, color: 'שחור', doors: 5, seats: 5, insuranceEstimate: 8500, maintenanceEstimate: 4800, depreciationRate: 0.14, description: 'V60 T6 AWD Inscription. מגרז 529L, בטיחות מלאה, מרווח לטיולים.', dealTag: 'BELOW_MARKET', monthlyCost: 5400, marketAvgPrice: 188000, priceVsMarket: -0.106 },
  { brand: 'Mazda', model: 'MX-5', year: 2021, mileage: 26000, price: 142000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 7.4, vehicleType: 'CONVERTIBLE', transmission: 'MANUAL', engineSize: 2000, color: 'אדום', doors: 2, seats: 2, insuranceEstimate: 6800, maintenanceEstimate: 3200, depreciationRate: 0.13, description: 'MX-5 RF GT. קופה רודסטר, כיף לנהוג, גג נשלף חשמלי.', dealTag: 'NEW_LISTING', monthlyCost: 4600, marketAvgPrice: 148000, priceVsMarket: -0.041 },
  { brand: 'Toyota', model: 'Land Cruiser', year: 2021, mileage: 48000, price: 298000, location: 'ירושלים', fuelType: 'DIESEL', fuelConsumption: 11.0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 3000, color: 'לבן', doors: 5, seats: 7, insuranceEstimate: 11000, maintenanceEstimate: 6500, depreciationRate: 0.12, description: 'Land Cruiser 300 VX-R. 4WD, מקצועי לשטח, 7 מקומות, ציוד VIP.', dealTag: 'FAIR_PRICE', monthlyCost: 9800, marketAvgPrice: 305000, priceVsMarket: -0.023 },

  // ── Budget segment (under ₪70K) ──
  { brand: 'Suzuki', model: 'Swift', year: 2020, mileage: 62000, price: 48000, location: 'באר שבע', fuelType: 'GASOLINE', fuelConsumption: 5.2, vehicleType: 'HATCHBACK', transmission: 'MANUAL', engineSize: 1200, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 2600, maintenanceEstimate: 1800, depreciationRate: 0.10, description: 'Swift GL. חסכוני מאוד, קטן ונוח לעיר, חניה קלה.', dealTag: 'FAIR_PRICE', monthlyCost: 1700, marketAvgPrice: 50000, priceVsMarket: -0.040 },
  { brand: 'Dacia', model: 'Duster', year: 2021, mileage: 55000, price: 52000, location: 'אשדוד', fuelType: 'GASOLINE', fuelConsumption: 7.5, vehicleType: 'SUV', transmission: 'MANUAL', engineSize: 1600, color: 'כתום', doors: 5, seats: 5, insuranceEstimate: 2800, maintenanceEstimate: 2000, depreciationRate: 0.10, description: 'Duster 4x4. שטחי מוסמך, עמיד, מחיר נגיש לשטח.', dealTag: 'GREAT_DEAL', monthlyCost: 1800, marketAvgPrice: 62000, priceVsMarket: -0.161 },
  { brand: 'Hyundai', model: 'i20', year: 2021, mileage: 41000, price: 58000, location: 'נצרת', fuelType: 'GASOLINE', fuelConsumption: 5.8, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1200, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 3000, maintenanceEstimate: 1900, depreciationRate: 0.11, description: 'i20 Select. N-line חיצוני, ציוד טכנולוגי, ריצה נמוכה לשנה.', dealTag: 'FAIR_PRICE', monthlyCost: 2000, marketAvgPrice: 60000, priceVsMarket: -0.033 },
  { brand: 'Kia', model: 'Picanto', year: 2022, mileage: 22000, price: 54000, location: 'חולון', fuelType: 'GASOLINE', fuelConsumption: 4.9, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1000, color: 'אדום', doors: 5, seats: 5, insuranceEstimate: 2700, maintenanceEstimate: 1700, depreciationRate: 0.11, description: 'Picanto GT-Line. כי פקוק בעיר מה שנשאר, מאוד חסכוני.', dealTag: 'NEW_LISTING', monthlyCost: 1900, marketAvgPrice: 56000, priceVsMarket: -0.036 },
  { brand: 'Renault', model: 'Clio', year: 2020, mileage: 68000, price: 46000, location: 'טבריה', fuelType: 'GASOLINE', fuelConsumption: 5.6, vehicleType: 'HATCHBACK', transmission: 'MANUAL', engineSize: 900, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 2500, maintenanceEstimate: 1800, depreciationRate: 0.10, description: 'Clio Zen. מנוע טורבו חסכוני, ריצה סבירה, מחיר נגיש.', dealTag: 'BELOW_MARKET', monthlyCost: 1600, marketAvgPrice: 52000, priceVsMarket: -0.115 },
  { brand: 'Toyota', model: 'Yaris', year: 2021, mileage: 38000, price: 62000, location: 'עפולה', fuelType: 'HYBRID', fuelConsumption: 3.8, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1500, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 3000, maintenanceEstimate: 1600, depreciationRate: 0.10, description: 'Yaris Hybrid. 3.8L/100km! הכי חסכוני בסגמנט, אחריות יצרן.', dealTag: 'GREAT_DEAL', monthlyCost: 2100, marketAvgPrice: 72000, priceVsMarket: -0.139 },

  // ── Premium / Luxury segment ──
  { brand: 'BMW', model: '7 Series', year: 2021, mileage: 42000, price: 385000, location: 'הרצליה פיתוח', fuelType: 'GASOLINE', fuelConsumption: 9.5, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 3000, color: 'שחור', doors: 4, seats: 5, insuranceEstimate: 15000, maintenanceEstimate: 8000, depreciationRate: 0.17, description: '740i M-Sport. מושבים מסאז׳, סאונד Harman Kardon, ניווט AR.', dealTag: 'FAIR_PRICE', monthlyCost: 12500, marketAvgPrice: 395000, priceVsMarket: -0.025 },
  { brand: 'Mercedes', model: 'S-Class', year: 2022, mileage: 28000, price: 520000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 10.2, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 2999, color: 'שחור', doors: 4, seats: 5, insuranceEstimate: 18000, maintenanceEstimate: 10000, depreciationRate: 0.16, description: 'S500 4MATIC AMG Line. הרכב היוקרתי ביותר. מושבי Business Class.', dealTag: 'FAIR_PRICE', monthlyCost: 17000, marketAvgPrice: 535000, priceVsMarket: -0.028 },
  { brand: 'Porsche', model: 'Cayenne', year: 2021, mileage: 38000, price: 465000, location: 'רמת השרון', fuelType: 'GASOLINE', fuelConsumption: 11.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 3000, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 16500, maintenanceEstimate: 9500, depreciationRate: 0.15, description: 'Cayenne S. ביצועי ספורט + יוקרה. PASM, Bose, פנורמה.', dealTag: 'BELOW_MARKET', monthlyCost: 15200, marketAvgPrice: 510000, priceVsMarket: -0.088 },
  { brand: 'Lexus', model: 'RX', year: 2022, mileage: 24000, price: 285000, location: 'ירושלים', fuelType: 'HYBRID', fuelConsumption: 6.0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2500, color: 'כסוף', doors: 5, seats: 5, insuranceEstimate: 11000, maintenanceEstimate: 4500, depreciationRate: 0.13, description: 'RX 450h F-Sport. היברידי יוקרתי. שקט, חסכוני, אמין.', dealTag: 'FAIR_PRICE', monthlyCost: 9200, marketAvgPrice: 292000, priceVsMarket: -0.024 },
  { brand: 'Audi', model: 'Q7', year: 2021, mileage: 41000, price: 298000, location: 'נתניה', fuelType: 'GASOLINE', fuelConsumption: 9.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 3000, color: 'לבן', doors: 5, seats: 7, insuranceEstimate: 12000, maintenanceEstimate: 7000, depreciationRate: 0.15, description: 'Q7 55 TFSI Quattro S-line. 7 מקומות, Virtual Cockpit, אייר ספנשן.', dealTag: 'FAIR_PRICE', monthlyCost: 9800, marketAvgPrice: 308000, priceVsMarket: -0.032 },
  { brand: 'Range Rover', model: 'Sport', year: 2020, mileage: 65000, price: 348000, location: 'תל אביב-יפו', fuelType: 'DIESEL', fuelConsumption: 8.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 3000, color: 'שחור', doors: 5, seats: 5, insuranceEstimate: 14500, maintenanceEstimate: 9000, depreciationRate: 0.16, description: 'Range Rover Sport SE. מקצועי לשטח ולכביש. Meridian, פנורמה, 4WD.', dealTag: 'BELOW_MARKET', monthlyCost: 11400, marketAvgPrice: 390000, priceVsMarket: -0.108 },

  // ── Sports cars ──
  { brand: 'BMW', model: 'M3', year: 2022, mileage: 18000, price: 425000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 11.0, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 2993, color: 'כחול', doors: 4, seats: 4, insuranceEstimate: 16000, maintenanceEstimate: 7500, depreciationRate: 0.16, description: 'M3 Competition xDrive. 510 כ"ס, 0-100 ב-3.5 שניות. חוויה מדהימה.', dealTag: 'NEW_LISTING', monthlyCost: 13800, marketAvgPrice: 438000, priceVsMarket: -0.030 },
  { brand: 'Toyota', model: 'GR86', year: 2023, mileage: 8000, price: 182000, location: 'חיפה', fuelType: 'GASOLINE', fuelConsumption: 8.8, vehicleType: 'COUPE', transmission: 'MANUAL', engineSize: 2400, color: 'אדום', doors: 2, seats: 4, insuranceEstimate: 8500, maintenanceEstimate: 3500, depreciationRate: 0.13, description: 'GR86 Premium. קופה ספורטיבית זולה לתחזוקה. מנוע שאיפה טבעית.', dealTag: 'FAIR_PRICE', monthlyCost: 5900, marketAvgPrice: 187000, priceVsMarket: -0.027 },
  { brand: 'Honda', model: 'Civic Type R', year: 2023, mileage: 6000, price: 245000, location: 'ראשון לציון', fuelType: 'GASOLINE', fuelConsumption: 9.5, vehicleType: 'HATCHBACK', transmission: 'MANUAL', engineSize: 1996, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 10500, maintenanceEstimate: 4000, depreciationRate: 0.14, description: 'Civic Type R FL5. 329 כ"ס, מנבז לוגס, חגורות ספורט. כמו חדש.', dealTag: 'BELOW_MARKET', monthlyCost: 8000, marketAvgPrice: 265000, priceVsMarket: -0.075 },
  { brand: 'Ford', model: 'Mustang', year: 2021, mileage: 32000, price: 268000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 12.5, vehicleType: 'COUPE', transmission: 'MANUAL', engineSize: 5000, color: 'כחול', doors: 2, seats: 4, insuranceEstimate: 12000, maintenanceEstimate: 5500, depreciationRate: 0.14, description: 'Mustang GT 5.0 V8. 450 כ"ס, קול V8 מרהיב, לפי מינהרה.', dealTag: 'BELOW_MARKET', monthlyCost: 8700, marketAvgPrice: 298000, priceVsMarket: -0.101 },

  // ── Electric / Eco segment ──
  { brand: 'BYD', model: 'Atto 3', year: 2023, mileage: 11000, price: 158000, location: 'תל אביב-יפו', fuelType: 'ELECTRIC', fuelConsumption: 15.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 6800, maintenanceEstimate: 1200, depreciationRate: 0.17, description: 'Atto 3 Long Range. 420 ק"מ טווח, ערכת נוחות, אחריות 6 שנים.', dealTag: 'BELOW_MARKET', monthlyCost: 5100, marketAvgPrice: 172000, priceVsMarket: -0.081 },
  { brand: 'Tesla', model: 'Model S', year: 2022, mileage: 22000, price: 385000, location: 'הרצליה', fuelType: 'ELECTRIC', fuelConsumption: 18.0, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', color: 'אדום', doors: 4, seats: 5, insuranceEstimate: 14000, maintenanceEstimate: 1500, depreciationRate: 0.18, description: 'Model S Long Range. 637 ק"מ, Autopilot, צג ענק 17 אינץ\', כמו חדשה.', dealTag: 'FAIR_PRICE', monthlyCost: 12500, marketAvgPrice: 395000, priceVsMarket: -0.025 },
  { brand: 'Hyundai', model: 'Ioniq 6', year: 2023, mileage: 9000, price: 198000, location: 'תל אביב-יפו', fuelType: 'ELECTRIC', fuelConsumption: 14.0, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', color: 'כחול', doors: 4, seats: 5, insuranceEstimate: 7500, maintenanceEstimate: 1300, depreciationRate: 0.17, description: 'Ioniq 6 AWD 77kWh. 583 ק"מ טווח! הטווח הארוך ביותר בסגמנט.', dealTag: 'GREAT_DEAL', monthlyCost: 6400, marketAvgPrice: 225000, priceVsMarket: -0.120 },
  { brand: 'Peugeot', model: 'e-208', year: 2022, mileage: 28000, price: 118000, location: 'חיפה', fuelType: 'ELECTRIC', fuelConsumption: 15.0, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', color: 'צהוב', doors: 5, seats: 5, insuranceEstimate: 5400, maintenanceEstimate: 1100, depreciationRate: 0.15, description: 'e-208 GT. 340 ק"מ, i-Cockpit, מושבי עור, עיצוב קופה.', dealTag: 'FAIR_PRICE', monthlyCost: 3800, marketAvgPrice: 122000, priceVsMarket: -0.033 },

  // ── Family MPV / Minivan ──
  { brand: 'Volkswagen', model: 'Touran', year: 2021, mileage: 47000, price: 128000, location: 'פתח תקווה', fuelType: 'GASOLINE', fuelConsumption: 7.2, vehicleType: 'MINIVAN', transmission: 'AUTOMATIC', engineSize: 1500, color: 'לבן', doors: 5, seats: 7, insuranceEstimate: 5800, maintenanceEstimate: 3500, depreciationRate: 0.12, description: 'Touran Highline 7-מקומות. מגרז 1857L, מושב שלישי קיים, משפחתי אידיאלי.', dealTag: 'FAIR_PRICE', monthlyCost: 4200, marketAvgPrice: 132000, priceVsMarket: -0.030 },
  { brand: 'Kia', model: 'Carnival', year: 2022, mileage: 32000, price: 198000, location: 'ירושלים', fuelType: 'GASOLINE', fuelConsumption: 10.5, vehicleType: 'MINIVAN', transmission: 'AUTOMATIC', engineSize: 2200, color: 'שחור', doors: 5, seats: 8, insuranceEstimate: 8500, maintenanceEstimate: 4500, depreciationRate: 0.12, description: 'Carnival SX. 8 מקומות, מסך 12.3", מושבי VIP שורה 2, קפיטן.', dealTag: 'FAIR_PRICE', monthlyCost: 6500, marketAvgPrice: 205000, priceVsMarket: -0.034 },
  { brand: 'Toyota', model: 'Sienna', year: 2022, mileage: 26000, price: 225000, location: 'תל אביב-יפו', fuelType: 'HYBRID', fuelConsumption: 7.0, vehicleType: 'MINIVAN', transmission: 'AUTOMATIC', engineSize: 2500, color: 'כסוף', doors: 5, seats: 8, insuranceEstimate: 9000, maintenanceEstimate: 3800, depreciationRate: 0.12, description: 'Sienna XLE Hybrid 8-מקומות. AWD, ציוד מלא, דלתות הזזה חשמליות.', dealTag: 'BELOW_MARKET', monthlyCost: 7300, marketAvgPrice: 248000, priceVsMarket: -0.093 },

  // ── Pickup trucks ──
  { brand: 'Mitsubishi', model: 'L200', year: 2021, mileage: 58000, price: 138000, location: 'באר שבע', fuelType: 'DIESEL', fuelConsumption: 9.2, vehicleType: 'PICKUP', transmission: 'AUTOMATIC', engineSize: 2400, color: 'לבן', doors: 4, seats: 5, insuranceEstimate: 6200, maintenanceEstimate: 3800, depreciationRate: 0.12, description: 'L200 Triton 4WD. עבודה + פנאי. מגרז אחורי, 4WD, גרירה 3.1 טון.', dealTag: 'FAIR_PRICE', monthlyCost: 4500, marketAvgPrice: 142000, priceVsMarket: -0.028 },
  { brand: 'Ford', model: 'Ranger', year: 2022, mileage: 35000, price: 168000, location: 'אשדוד', fuelType: 'DIESEL', fuelConsumption: 8.8, vehicleType: 'PICKUP', transmission: 'AUTOMATIC', engineSize: 2000, color: 'אפור', doors: 4, seats: 5, insuranceEstimate: 7200, maintenanceEstimate: 4200, depreciationRate: 0.12, description: 'Ranger Wildtrak 4WD. בלוקינג, צמיגי שטח, ספרי סיריוס.', dealTag: 'BELOW_MARKET', monthlyCost: 5500, marketAvgPrice: 185000, priceVsMarket: -0.092 },

  // ── Various locations ──
  { brand: 'Nissan', model: 'X-Trail', year: 2021, mileage: 52000, price: 115000, location: 'מודיעין', fuelType: 'GASOLINE', fuelConsumption: 7.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1600, color: 'לבן', doors: 5, seats: 7, insuranceEstimate: 5600, maintenanceEstimate: 3200, depreciationRate: 0.12, description: 'X-Trail N-Connecta 4WD. 7 מקומות, ProPilot, ניווט.', dealTag: 'FAIR_PRICE', monthlyCost: 3800, marketAvgPrice: 118000, priceVsMarket: -0.025 },
  { brand: 'Honda', model: 'Jazz', year: 2022, mileage: 18000, price: 88000, location: 'רעננה', fuelType: 'HYBRID', fuelConsumption: 4.5, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1500, color: 'כסוף', doors: 5, seats: 5, insuranceEstimate: 4200, maintenanceEstimate: 1900, depreciationRate: 0.11, description: 'Jazz e:HEV Advance. מנוע היברידי חסכוני, גמיש ויחודי, שמורה.', dealTag: 'GREAT_DEAL', monthlyCost: 2900, marketAvgPrice: 100000, priceVsMarket: -0.120 },
  { brand: 'Subaru', model: 'Forester', year: 2021, mileage: 44000, price: 145000, location: 'כפר סבא', fuelType: 'GASOLINE', fuelConsumption: 8.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2500, color: 'ירוק', doors: 5, seats: 5, insuranceEstimate: 6500, maintenanceEstimate: 3900, depreciationRate: 0.12, description: 'Forester AWD. Symmetrical AWD, EyeSight, פנורמה. אמין לשטח.', dealTag: 'FAIR_PRICE', monthlyCost: 4700, marketAvgPrice: 150000, priceVsMarket: -0.033 },
  { brand: 'Subaru', model: 'Outback', year: 2022, mileage: 29000, price: 168000, location: 'הוד השרון', fuelType: 'GASOLINE', fuelConsumption: 8.5, vehicleType: 'WAGON', transmission: 'AUTOMATIC', engineSize: 2500, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 7200, maintenanceEstimate: 4200, depreciationRate: 0.12, description: 'Outback Onyx Edition. AWD, גובה פינוי 213מ"מ, EyeSight Pro.', dealTag: 'BELOW_MARKET', monthlyCost: 5500, marketAvgPrice: 185000, priceVsMarket: -0.092 },
  { brand: 'Seat', model: 'Leon', year: 2022, mileage: 21000, price: 92000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 6.2, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1500, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 4300, maintenanceEstimate: 2700, depreciationRate: 0.12, description: 'Leon FR 1.5 TSI. ספורטיבי, מגע 10 אינץ\', בקרת שיוט אדפטיבית.', dealTag: 'FAIR_PRICE', monthlyCost: 3100, marketAvgPrice: 95000, priceVsMarket: -0.032 },
  { brand: 'Citroen', model: 'C5 Aircross', year: 2021, mileage: 48000, price: 98000, location: 'חיפה', fuelType: 'HYBRID', fuelConsumption: 5.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1600, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 4800, maintenanceEstimate: 3000, depreciationRate: 0.12, description: 'C5 Aircross PHEV. מושבים Advanced Comfort, הגנות נוספות, חסכוני.', dealTag: 'BELOW_MARKET', monthlyCost: 3200, marketAvgPrice: 110000, priceVsMarket: -0.109 },
  { brand: 'Volkswagen', model: 'Passat', year: 2020, mileage: 82000, price: 88000, location: 'רחובות', fuelType: 'DIESEL', fuelConsumption: 5.5, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 2000, color: 'שחור', doors: 4, seats: 5, insuranceEstimate: 4500, maintenanceEstimate: 3200, depreciationRate: 0.12, description: 'Passat 2.0 TDI R-Line. כלכלי מאוד לדיזל, מרווח, ריצה גבוהה אבל מצב מצוין.', dealTag: 'GREAT_DEAL', monthlyCost: 2900, marketAvgPrice: 108000, priceVsMarket: -0.185 },

  // ── Batch 4 – expanded inventory ──────────────────────────────────────────
  // Budget / City cars
  { brand: 'Renault', model: 'Clio', year: 2023, mileage: 12000, price: 72000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 5.8, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1000, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 3200, maintenanceEstimate: 1600, depreciationRate: 0.13, description: 'קליו 2023 כמעט חדשה. מסך 9.3 אינץ\', קאמרה אחורית, נוחה לעיר.', dealTag: 'FAIR_PRICE', monthlyCost: 2400, marketAvgPrice: 75000, priceVsMarket: -0.04 },
  { brand: 'Toyota', model: 'Yaris', year: 2022, mileage: 24000, price: 68000, location: 'פתח תקווה', fuelType: 'HYBRID', fuelConsumption: 3.8, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1500, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 3000, maintenanceEstimate: 1500, depreciationRate: 0.11, description: 'יאריס היברידי. חסכוני להפליא, ביטוח נמוך, מושלם לעיר ולפרברים.', dealTag: 'GREAT_DEAL', monthlyCost: 2200, marketAvgPrice: 78000, priceVsMarket: -0.128 },
  { brand: 'Kia', model: 'Picanto', year: 2023, mileage: 8000, price: 62000, location: 'ירושלים', fuelType: 'GASOLINE', fuelConsumption: 5.2, vehicleType: 'HATCHBACK', transmission: 'MANUAL', engineSize: 1200, color: 'אדום', doors: 5, seats: 5, insuranceEstimate: 2800, maintenanceEstimate: 1400, depreciationRate: 0.13, description: 'פיקנטו 2023 חדשה מחושמל. החיסכון הגדול ביותר לנסיעות עיר. מקום לחניה בכל מקום.', dealTag: 'FAIR_PRICE', monthlyCost: 2000, marketAvgPrice: 64000, priceVsMarket: -0.031 },
  { brand: 'Peugeot', model: '208', year: 2022, mileage: 31000, price: 74000, location: 'נתניה', fuelType: 'GASOLINE', fuelConsumption: 5.5, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1200, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 3400, maintenanceEstimate: 1800, depreciationRate: 0.12, description: 'פז\'ו 208 GT. עיצוב מרשים, לוח מחוונים i-Cockpit, מגע 10 אינץ\'.', dealTag: 'BELOW_MARKET', monthlyCost: 2500, marketAvgPrice: 82000, priceVsMarket: -0.098 },
  { brand: 'Fiat', model: '500', year: 2022, mileage: 19000, price: 78000, location: 'תל אביב-יפו', fuelType: 'ELECTRIC', fuelConsumption: 0, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 0, color: 'ירוק', doors: 3, seats: 4, insuranceEstimate: 3100, maintenanceEstimate: 1200, depreciationRate: 0.11, description: 'פיאט 500e חשמלי 118 כ"ס. 321 ק"מ טווח. קוקטייל עיצוב איטלקי וטכנולוגיה ירוקה.', dealTag: 'FAIR_PRICE', monthlyCost: 2600, marketAvgPrice: 80000, priceVsMarket: -0.025 },

  // Mid-range Sedans & Hatchbacks
  { brand: 'Volkswagen', model: 'Golf', year: 2022, mileage: 22000, price: 108000, location: 'חיפה', fuelType: 'GASOLINE', fuelConsumption: 6.2, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1500, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 4800, maintenanceEstimate: 2800, depreciationRate: 0.12, description: 'גולף 8 GTE. IQ.DRIVE, מסך 10 אינץ\', LED Matrix. הרכב הנמכר ביותר באירופה.', dealTag: 'FAIR_PRICE', monthlyCost: 3500, marketAvgPrice: 112000, priceVsMarket: -0.036 },
  { brand: 'Hyundai', model: 'Elantra', year: 2023, mileage: 14000, price: 95000, location: 'ראשון לציון', fuelType: 'HYBRID', fuelConsumption: 4.8, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 1600, color: 'כחול', doors: 4, seats: 5, insuranceEstimate: 4200, maintenanceEstimate: 2200, depreciationRate: 0.11, description: 'אלנטרה 2023 היברידית. עיצוב אגרסיבי, SmartSense, הספק 141 כ"ס.', dealTag: 'GREAT_DEAL', monthlyCost: 3100, marketAvgPrice: 108000, priceVsMarket: -0.12 },
  { brand: 'Skoda', model: 'Octavia', year: 2021, mileage: 55000, price: 89000, location: 'באר שבע', fuelType: 'GASOLINE', fuelConsumption: 6.5, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 1500, color: 'כסוף', doors: 4, seats: 5, insuranceEstimate: 4100, maintenanceEstimate: 2600, depreciationRate: 0.11, description: 'אוקטביה Style 1.5 TSI. מרווחת, אמינה, מחיר/ביצועים מנצחים.', dealTag: 'BELOW_MARKET', monthlyCost: 2900, marketAvgPrice: 102000, priceVsMarket: -0.128 },
  { brand: 'Ford', model: 'Focus', year: 2020, mileage: 71000, price: 69000, location: 'אשדוד', fuelType: 'GASOLINE', fuelConsumption: 6.8, vehicleType: 'HATCHBACK', transmission: 'MANUAL', engineSize: 1000, color: 'אדום', doors: 5, seats: 5, insuranceEstimate: 3600, maintenanceEstimate: 2200, depreciationRate: 0.12, description: 'פוקוס ST-Line. חוויית נהיגה ספורטיבית, SYNC 3. מחיר מציאה.', dealTag: 'GREAT_DEAL', monthlyCost: 2300, marketAvgPrice: 88000, priceVsMarket: -0.216 },
  { brand: 'Opel', model: 'Astra', year: 2022, mileage: 27000, price: 82000, location: 'הרצליה', fuelType: 'GASOLINE', fuelConsumption: 6.0, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1200, color: 'שחור', doors: 5, seats: 5, insuranceEstimate: 3800, maintenanceEstimate: 2100, depreciationRate: 0.12, description: 'אופל אסטרה GS Line. עיצוב 2022 מהפכני, Pure Panel, IntelliSafe.', dealTag: 'FAIR_PRICE', monthlyCost: 2700, marketAvgPrice: 85000, priceVsMarket: -0.035 },

  // SUVs
  { brand: 'Toyota', model: 'RAV4', year: 2022, mileage: 38000, price: 158000, location: 'כפר סבא', fuelType: 'HYBRID', fuelConsumption: 5.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2500, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 6200, maintenanceEstimate: 3200, depreciationRate: 0.11, description: 'ראב 4 PHEV. 306 כ"ס, AWDi, אוטומטית CVT. מהיר, חסכוני, שטחי.', dealTag: 'FAIR_PRICE', monthlyCost: 5100, marketAvgPrice: 165000, priceVsMarket: -0.042 },
  { brand: 'Kia', model: 'Sportage', year: 2023, mileage: 11000, price: 142000, location: 'תל אביב-יפו', fuelType: 'HYBRID', fuelConsumption: 6.0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1600, color: 'ירוק', doors: 5, seats: 5, insuranceEstimate: 5800, maintenanceEstimate: 2900, depreciationRate: 0.12, description: 'ספורטאז\' 2023 GT-Line. עיצוב פנים מהמם, קונסול פנורמי כפול, לוח מחוונים דיגיטלי.', dealTag: 'BELOW_MARKET', monthlyCost: 4600, marketAvgPrice: 158000, priceVsMarket: -0.101 },
  { brand: 'Honda', model: 'CR-V', year: 2022, mileage: 32000, price: 148000, location: 'רמת גן', fuelType: 'HYBRID', fuelConsumption: 5.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'כסוף', doors: 5, seats: 5, insuranceEstimate: 5900, maintenanceEstimate: 2800, depreciationRate: 0.11, description: 'CR-V e:HEV Advance. הכל כלול, EyeSight, AWD לפי דרישה, 7 שנות אחריות.', dealTag: 'FAIR_PRICE', monthlyCost: 4800, marketAvgPrice: 155000, priceVsMarket: -0.045 },
  { brand: 'Ford', model: 'Kuga', year: 2021, mileage: 49000, price: 112000, location: 'פתח תקווה', fuelType: 'HYBRID', fuelConsumption: 6.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1500, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 5200, maintenanceEstimate: 3100, depreciationRate: 0.12, description: 'קוגה PHEV ST-Line X. 225 כ"ס, טעינה חיצונית, SYNC 4 עם Apple CarPlay.', dealTag: 'BELOW_MARKET', monthlyCost: 3600, marketAvgPrice: 128000, priceVsMarket: -0.125 },
  { brand: 'Renault', model: 'Kadjar', year: 2020, mileage: 63000, price: 79000, location: 'נצרת', fuelType: 'GASOLINE', fuelConsumption: 7.0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1300, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 4100, maintenanceEstimate: 2500, depreciationRate: 0.12, description: 'קאדג\'ר Intens 1.3 TCe. ניווט, מצלמת 360, גג פנורמי. מציאה אמיתית.', dealTag: 'GREAT_DEAL', monthlyCost: 2600, marketAvgPrice: 96000, priceVsMarket: -0.177 },
  { brand: 'Peugeot', model: '3008', year: 2021, mileage: 44000, price: 118000, location: 'ירושלים', fuelType: 'HYBRID', fuelConsumption: 5.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1600, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 5400, maintenanceEstimate: 3000, depreciationRate: 0.12, description: '3008 GT PHEV 225. לוח i-Cockpit, גג פנורמי, מערכת Night Vision.', dealTag: 'FAIR_PRICE', monthlyCost: 3800, marketAvgPrice: 122000, priceVsMarket: -0.033 },

  // Premium & Luxury
  { brand: 'BMW', model: 'X3', year: 2022, mileage: 26000, price: 218000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 8.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'שחור', doors: 5, seats: 5, insuranceEstimate: 9800, maintenanceEstimate: 5200, depreciationRate: 0.15, description: 'X3 xDrive30i M Sport. 252 כ"ס, xDrive, ריפוד עור, חבילת טכנולוגיה מלאה.', dealTag: 'BELOW_MARKET', monthlyCost: 7100, marketAvgPrice: 248000, priceVsMarket: -0.121 },
  { brand: 'Mercedes', model: 'GLC', year: 2021, mileage: 35000, price: 238000, location: 'הרצליה', fuelType: 'HYBRID', fuelConsumption: 7.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 10500, maintenanceEstimate: 6000, depreciationRate: 0.16, description: 'GLC 300e 4MATIC. PHEV 315 כ"ס, MBUX, LED אינטליג\'נט, Drive Pilot.', dealTag: 'FAIR_PRICE', monthlyCost: 7800, marketAvgPrice: 245000, priceVsMarket: -0.029 },
  { brand: 'Audi', model: 'Q5', year: 2022, mileage: 24000, price: 228000, location: 'רמת השרון', fuelType: 'HYBRID', fuelConsumption: 7.0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'כסוף', doors: 5, seats: 5, insuranceEstimate: 9500, maintenanceEstimate: 5400, depreciationRate: 0.15, description: 'Q5 55 TFSI e quattro. PHEV 367 כ"ס, Virtual Cockpit Plus, Bang & Olufsen.', dealTag: 'FAIR_PRICE', monthlyCost: 7400, marketAvgPrice: 235000, priceVsMarket: -0.03 },
  { brand: 'Volvo', model: 'XC60', year: 2022, mileage: 29000, price: 215000, location: 'כפר שמריהו', fuelType: 'HYBRID', fuelConsumption: 6.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'פלדה', doors: 5, seats: 5, insuranceEstimate: 9200, maintenanceEstimate: 5100, depreciationRate: 0.14, description: 'XC60 T8 Recharge Inscription. 390 כ"ס, Bowers & Wilkins, Pilot Assist, שחרור ידיים.', dealTag: 'BELOW_MARKET', monthlyCost: 7000, marketAvgPrice: 240000, priceVsMarket: -0.104 },
  { brand: 'Lexus', model: 'RX', year: 2022, mileage: 21000, price: 265000, location: 'נתניה', fuelType: 'HYBRID', fuelConsumption: 6.5, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 3500, color: 'לבן אפנתי', doors: 5, seats: 5, insuranceEstimate: 10800, maintenanceEstimate: 5500, depreciationRate: 0.13, description: 'RX 450h F Sport. 308 כ"ס, Mark Levinson, אחריות 5 שנה, אמינות יפנית.', dealTag: 'FAIR_PRICE', monthlyCost: 8600, marketAvgPrice: 272000, priceVsMarket: -0.026 },

  // Electric
  { brand: 'Tesla', model: 'Model Y', year: 2023, mileage: 8000, price: 189000, location: 'תל אביב-יפו', fuelType: 'ELECTRIC', fuelConsumption: 0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 0, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 7200, maintenanceEstimate: 1800, depreciationRate: 0.14, description: 'Model Y Long Range AWD. 533 ק"מ טווח, 0-100 ב-5 שניות, Autopilot מלא.', dealTag: 'FAIR_PRICE', monthlyCost: 6200, marketAvgPrice: 195000, priceVsMarket: -0.031 },
  { brand: 'Hyundai', model: 'IONIQ 6', year: 2023, mileage: 6000, price: 168000, location: 'תל אביב-יפו', fuelType: 'ELECTRIC', fuelConsumption: 0, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 0, color: 'אפור', doors: 4, seats: 5, insuranceEstimate: 6500, maintenanceEstimate: 1600, depreciationRate: 0.13, description: 'IONIQ 6 RWD 77.4 kWh. 614 ק"מ טווח! טעינה 800V, עיצוב אווירודינמי פורץ דרך.', dealTag: 'BELOW_MARKET', monthlyCost: 5500, marketAvgPrice: 182000, priceVsMarket: -0.077 },
  { brand: 'Kia', model: 'EV6', year: 2023, mileage: 9000, price: 172000, location: 'חיפה', fuelType: 'ELECTRIC', fuelConsumption: 0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 0, color: 'ירוק', doors: 5, seats: 5, insuranceEstimate: 6800, maintenanceEstimate: 1700, depreciationRate: 0.13, description: 'EV6 GT-Line AWD. 577 ק"מ טווח, 325 כ"ס, Ultra-Fast 800V, World Car of the Year 2022.', dealTag: 'GREAT_DEAL', monthlyCost: 5600, marketAvgPrice: 195000, priceVsMarket: -0.118 },
  { brand: 'Volkswagen', model: 'ID.4', year: 2022, mileage: 18000, price: 155000, location: 'ראשון לציון', fuelType: 'ELECTRIC', fuelConsumption: 0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 0, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 6000, maintenanceEstimate: 1600, depreciationRate: 0.13, description: 'ID.4 Pro 77 kWh. 527 ק"מ טווח, AR HUD, Travel Assist, חיבור 135 kW.', dealTag: 'FAIR_PRICE', monthlyCost: 5000, marketAvgPrice: 160000, priceVsMarket: -0.031 },
  { brand: 'BMW', model: 'iX', year: 2022, mileage: 14000, price: 298000, location: 'רמת גן', fuelType: 'ELECTRIC', fuelConsumption: 0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 0, color: 'שחור', doors: 5, seats: 5, insuranceEstimate: 11500, maintenanceEstimate: 2200, depreciationRate: 0.15, description: 'iX xDrive50. 523 כ"ס, 630 ק"מ טווח, iDrive 8, אנטנת כריסטל BMW. הDNA של הסדרה X.', dealTag: 'BELOW_MARKET', monthlyCost: 9700, marketAvgPrice: 328000, priceVsMarket: -0.091 },

  // Vans & Family
  { brand: 'Toyota', model: 'Proace City Verso', year: 2022, mileage: 34000, price: 112000, location: 'ירושלים', fuelType: 'HYBRID', fuelConsumption: 5.5, vehicleType: 'MINIVAN', transmission: 'AUTOMATIC', engineSize: 1200, color: 'לבן', doors: 5, seats: 7, insuranceEstimate: 5200, maintenanceEstimate: 2800, depreciationRate: 0.12, description: 'Proace City Verso Family. 7 מקומות, מחולקת נוחה, מושבים מתקפלים, מושלם למשפחות גדולות.', dealTag: 'FAIR_PRICE', monthlyCost: 3600, marketAvgPrice: 116000, priceVsMarket: -0.034 },
  { brand: 'Volkswagen', model: 'Touran', year: 2021, mileage: 56000, price: 118000, location: 'רעננה', fuelType: 'GASOLINE', fuelConsumption: 7.0, vehicleType: 'MINIVAN', transmission: 'AUTOMATIC', engineSize: 1500, color: 'כסוף', doors: 5, seats: 7, insuranceEstimate: 5400, maintenanceEstimate: 3000, depreciationRate: 0.12, description: 'Touran Highline 7 מקומות. IQ.DRIVE, מסך 8 אינץ\', מצלמת 360. פרקטי ונוח לכל המשפחה.', dealTag: 'BELOW_MARKET', monthlyCost: 3800, marketAvgPrice: 135000, priceVsMarket: -0.126 },
  { brand: 'Kia', model: 'Carnival', year: 2022, mileage: 31000, price: 168000, location: 'הוד השרון', fuelType: 'GASOLINE', fuelConsumption: 9.0, vehicleType: 'MINIVAN', transmission: 'AUTOMATIC', engineSize: 2200, color: 'שחור', doors: 5, seats: 8, insuranceEstimate: 7200, maintenanceEstimate: 3800, depreciationRate: 0.12, description: 'Carnival Premium 8 מקומות. מסכי VIP לנוסעים, מושבי קפטן ממוטרים, CarPlay ו-Android Auto.', dealTag: 'FAIR_PRICE', monthlyCost: 5400, marketAvgPrice: 172000, priceVsMarket: -0.023 },

  // Various Israeli cities and more unique models
  { brand: 'Mazda', model: 'MX-30', year: 2022, mileage: 22000, price: 115000, location: 'חיפה', fuelType: 'ELECTRIC', fuelConsumption: 0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 0, color: 'ירוק', doors: 5, seats: 4, insuranceEstimate: 4800, maintenanceEstimate: 1500, depreciationRate: 0.14, description: 'MX-30 EV. עיצוב ייחודי, דלתות Freestyle, 200 ק"מ טווח לנסיעות עיר, חומרים מחזוריים.', dealTag: 'BELOW_MARKET', monthlyCost: 3700, marketAvgPrice: 128000, priceVsMarket: -0.102 },
  { brand: 'Hyundai', model: 'Tucson', year: 2023, mileage: 12000, price: 148000, location: 'אשקלון', fuelType: 'HYBRID', fuelConsumption: 6.2, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1600, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 5700, maintenanceEstimate: 2800, depreciationRate: 0.12, description: 'טוסון 2023 Luxury. SmartSense Pro, מסך 10.25 אינץ\', מושבי עור מחוממים, 230 כ"ס.', dealTag: 'FAIR_PRICE', monthlyCost: 4800, marketAvgPrice: 152000, priceVsMarket: -0.026 },
  { brand: 'Skoda', model: 'Kodiaq', year: 2021, mileage: 51000, price: 128000, location: 'מודיעין', fuelType: 'GASOLINE', fuelConsumption: 8.0, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'כחול', doors: 5, seats: 7, insuranceEstimate: 5800, maintenanceEstimate: 3400, depreciationRate: 0.12, description: 'קודיאק Style 7DSG 4x4. 7 מקומות, Canton 625W, גג פנורמי, Simply Clever.', dealTag: 'BELOW_MARKET', monthlyCost: 4100, marketAvgPrice: 148000, priceVsMarket: -0.135 },
  { brand: 'Nissan', model: 'Leaf', year: 2022, mileage: 26000, price: 88000, location: 'רחובות', fuelType: 'ELECTRIC', fuelConsumption: 0, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 0, color: 'לבן', doors: 5, seats: 5, insuranceEstimate: 3800, maintenanceEstimate: 1300, depreciationRate: 0.13, description: 'ניסאן ליף 62 kWh. 385 ק"מ טווח, ProPilot, e-Pedal. הרכב החשמלי הנמכר ביותר בישראל.', dealTag: 'GREAT_DEAL', monthlyCost: 2900, marketAvgPrice: 105000, priceVsMarket: -0.162 },
  { brand: 'Toyota', model: 'C-HR', year: 2022, mileage: 23000, price: 118000, location: 'נתניה', fuelType: 'HYBRID', fuelConsumption: 4.9, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 1800, color: 'כסוף-שחור', doors: 5, seats: 5, insuranceEstimate: 5000, maintenanceEstimate: 2400, depreciationRate: 0.12, description: 'CHR GR Sport. עיצוב ספורטיבי מהפכני, GR אלמנטים, תאאוטומטי e-CVT חסכוני במיוחד.', dealTag: 'FAIR_PRICE', monthlyCost: 3800, marketAvgPrice: 122000, priceVsMarket: -0.033 },
  { brand: 'BMW', model: '118i', year: 2022, mileage: 18000, price: 138000, location: 'גבעתיים', fuelType: 'GASOLINE', fuelConsumption: 6.8, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1500, color: 'אפור', doors: 5, seats: 5, insuranceEstimate: 6200, maintenanceEstimate: 3800, depreciationRate: 0.15, description: 'BMW 118i M Sport 2022. 140 כ"ס, iDrive 7, Live Cockpit Professional, LED.', dealTag: 'FAIR_PRICE', monthlyCost: 4500, marketAvgPrice: 142000, priceVsMarket: -0.028 },
  { brand: 'Mercedes', model: 'A 180', year: 2021, mileage: 34000, price: 132000, location: 'תל אביב-יפו', fuelType: 'GASOLINE', fuelConsumption: 6.5, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1300, color: 'שחור', doors: 5, seats: 5, insuranceEstimate: 6800, maintenanceEstimate: 4200, depreciationRate: 0.15, description: 'A 180 AMG Line. MBUX עם AR ניווט, מסך 7+10.25 אינץ\', עיצוב חצוצרות, Night Package.', dealTag: 'BELOW_MARKET', monthlyCost: 4300, marketAvgPrice: 152000, priceVsMarket: -0.132 },
  { brand: 'Audi', model: 'A1', year: 2022, mileage: 16000, price: 126000, location: 'רמת גן', fuelType: 'GASOLINE', fuelConsumption: 6.2, vehicleType: 'HATCHBACK', transmission: 'AUTOMATIC', engineSize: 1000, color: 'כחול', doors: 5, seats: 5, insuranceEstimate: 5900, maintenanceEstimate: 3600, depreciationRate: 0.14, description: 'A1 Sportback 25 TFSI. Virtual Cockpit, Matrix LED, S line Sport. קומפקטי פרמיום.', dealTag: 'FAIR_PRICE', monthlyCost: 4100, marketAvgPrice: 130000, priceVsMarket: -0.031 },
  { brand: 'Mazda', model: 'CX-30', year: 2022, mileage: 28000, price: 118000, location: 'פתח תקווה', fuelType: 'GASOLINE', fuelConsumption: 6.8, vehicleType: 'SUV', transmission: 'AUTOMATIC', engineSize: 2000, color: 'אדום', doors: 5, seats: 5, insuranceEstimate: 5200, maintenanceEstimate: 2800, depreciationRate: 0.12, description: 'CX-30 Carbon Turbo 265 כ"ס. AWD, Bose 12 רמקולים, HUD, טעינה אינדוקציה. מרשים מאוד.', dealTag: 'BELOW_MARKET', monthlyCost: 3800, marketAvgPrice: 135000, priceVsMarket: -0.126 },
  { brand: 'Genesis', model: 'G80', year: 2022, mileage: 19000, price: 218000, location: 'רמת השרון', fuelType: 'GASOLINE', fuelConsumption: 9.5, vehicleType: 'SEDAN', transmission: 'AUTOMATIC', engineSize: 2500, color: 'לבן', doors: 4, seats: 5, insuranceEstimate: 9200, maintenanceEstimate: 4800, depreciationRate: 0.14, description: 'ג\'נסיס G80 3.5T Sport. 380 כ"ס, Ergo Motion מושבים, Lexicon Hi-Fi, 5 שנות אחריות מלאה.', dealTag: 'GREAT_DEAL', monthlyCost: 7100, marketAvgPrice: 268000, priceVsMarket: -0.187 },
]

async function main() {
  console.log('🌱 Seeding AutoSwipe database...')

  // Clear swipe history for the demo buyer so they see fresh listings
  const buyerExists = await prisma.user.findUnique({ where: { email: 'demo.buyer@autoswipe.il' } })
  if (buyerExists) {
    await prisma.swipeAction.deleteMany({ where: { userId: buyerExists.id } })
    console.log('🔄 Cleared demo buyer swipe history')
  }

  const sellers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'demo.seller@autoswipe.il' },
      create: {
        email: 'demo.seller@autoswipe.il',
        name: 'ישראל כהן',
        passwordHash: await bcrypt.hash('demo123', 10),
        roles: JSON.stringify(['SELLER', 'BUYER']),
        isVerified: true,
        isOnboarded: true,
        phone: '050-1234567',
      },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: 'demo.seller2@autoswipe.il' },
      create: {
        email: 'demo.seller2@autoswipe.il',
        name: 'שרה לוי',
        passwordHash: await bcrypt.hash('demo123', 10),
        roles: JSON.stringify(['SELLER']),
        isVerified: true,
        isOnboarded: true,
        phone: '052-9876543',
      },
      update: {},
    }),
  ])

  // Create demo buyer with preferences
  const buyer = await prisma.user.upsert({
    where: { email: 'demo.buyer@autoswipe.il' },
    create: {
      email: 'demo.buyer@autoswipe.il',
      name: 'דוד ישראלי',
      passwordHash: await bcrypt.hash('demo123', 10),
      roles: JSON.stringify(['BUYER']),
      isVerified: true,
      isOnboarded: true,
    },
    update: {},
  })

  await prisma.buyerPreferences.upsert({
    where: { userId: buyer.id },
    create: {
      userId: buyer.id,
      budgetMax: 160000,
      budgetMin: 80000,
      preferredBrands: JSON.stringify(['BMW', 'Audi', 'Mazda']),
      preferredModels: JSON.stringify(['3 Series', 'A3', 'CX-5']),
      fuelPreferences: JSON.stringify(['GASOLINE', 'HYBRID']),
      vehicleTypes: JSON.stringify(['SEDAN', 'SUV', 'HATCHBACK']),
      location: 'תל אביב-יפו',
      searchRadius: 80,
      ownershipYears: 3,
    },
    update: {},
  })

  // Seed listings
  for (let i = 0; i < SEED_LISTINGS.length; i++) {
    const data = SEED_LISTINGS[i]
    const seller = sellers[i % sellers.length]
    const existing = await prisma.carListing.findFirst({
      where: { sellerId: seller.id, brand: data.brand, model: data.model, year: data.year },
    })
    if (existing) continue

    const remoteImages = CAR_IMAGES[data.brand] ?? CAR_IMAGES.default
    const localPaths: string[] = []
    for (let j = 0; j < remoteImages.length; j++) {
      const path = await cacheSeedImage(remoteImages[j], `l${i}-${j}.jpg`)
      if (path) localPaths.push(path)
    }

    await prisma.carListing.create({
      data: {
        sellerId: seller.id,
        brand: data.brand,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        price: data.price,
        location: data.location,
        fuelType: data.fuelType,
        fuelConsumption: data.fuelConsumption,
        vehicleType: data.vehicleType,
        transmission: data.transmission,
        engineSize: data.engineSize ?? null,
        color: data.color,
        doors: data.doors,
        seats: data.seats,
        hand: 1,
        insuranceEstimate: data.insuranceEstimate,
        maintenanceEstimate: data.maintenanceEstimate,
        depreciationRate: data.depreciationRate,
        description: data.description,
        dealTag: data.dealTag,
        monthlyCost: data.monthlyCost,
        marketAvgPrice: data.marketAvgPrice,
        priceVsMarket: data.priceVsMarket,
        viewCount: Math.floor(Math.random() * 200),
        likeCount: Math.floor(Math.random() * 30),
        publishedAt: new Date(),
        images: {
          create: localPaths.map((p, idx) => ({
            path: p,
            order: idx,
            isPrimary: idx === 0,
          })),
        },
      },
    })
  }

  console.log(`✅ Seeded ${SEED_LISTINGS.length} listings (${SEED_LISTINGS.length - 10} new)`)
  console.log('👤 Demo accounts:')
  console.log('   Buyer:  demo.buyer@autoswipe.il / demo123')
  console.log('   Seller: demo.seller@autoswipe.il / demo123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
