import type { CarListing, CostBreakdown, FuelType } from '@/types'

// Israeli fuel prices (ILS per liter / kWh) — updated via env vars
const FUEL_PRICES: Record<FuelType, number> = {
  GASOLINE: parseFloat(process.env.NEXT_PUBLIC_FUEL_PRICE_GASOLINE ?? '7.20'),
  DIESEL: parseFloat(process.env.NEXT_PUBLIC_FUEL_PRICE_DIESEL ?? '6.80'),
  HYBRID: parseFloat(process.env.NEXT_PUBLIC_FUEL_PRICE_GASOLINE ?? '7.20') * 0.6, // hybrids use ~40% less fuel effectively
  ELECTRIC: parseFloat(process.env.NEXT_PUBLIC_FUEL_PRICE_ELECTRIC_KWH ?? '0.55'),
  PLUG_IN_HYBRID: parseFloat(process.env.NEXT_PUBLIC_FUEL_PRICE_GASOLINE ?? '7.20') * 0.4,
}

const AVG_MONTHLY_KM = parseFloat(process.env.NEXT_PUBLIC_AVG_MONTHLY_KM ?? '1500')

/**
 * Calculates Total Cost of Ownership (TCO) broken down monthly.
 *
 * Formula:
 *   monthly_cost =
 *     capital_cost_monthly       (price / ownershipYears / 12)
 *   + fuel_monthly               (consumption * km / 100 * fuel_price)
 *   + insurance_monthly          (insuranceEstimate / 12)
 *   + maintenance_monthly        (maintenanceEstimate / 12)
 *   + depreciation_monthly       (price * rate / 12)
 */
export function calculateCostBreakdown(
  listing: Pick<
    CarListing,
    | 'price'
    | 'fuelType'
    | 'fuelConsumption'
    | 'insuranceEstimate'
    | 'maintenanceEstimate'
    | 'depreciationRate'
  >,
  ownershipYears = 3,
  monthlyKm = AVG_MONTHLY_KM
): CostBreakdown {
  // Capital cost: amortize purchase price over ownership period
  const capitalCostMonthly = listing.price / (ownershipYears * 12)

  // Fuel cost: consumption (L/100km or kWh/100km) × km × price
  const fuelPrice = FUEL_PRICES[listing.fuelType]
  const fuelMonthly =
    listing.fuelType === 'ELECTRIC'
      ? (listing.fuelConsumption / 100) * monthlyKm * fuelPrice
      : (listing.fuelConsumption / 100) * monthlyKm * fuelPrice

  // Fixed annual costs → monthly
  const insuranceMonthly = listing.insuranceEstimate / 12
  const maintenanceMonthly = listing.maintenanceEstimate / 12

  // Depreciation: percentage of current value lost per year
  const depreciationMonthly = (listing.price * listing.depreciationRate) / 12

  const total =
    capitalCostMonthly +
    fuelMonthly +
    insuranceMonthly +
    maintenanceMonthly +
    depreciationMonthly

  return {
    monthly: Math.round(total),
    depreciation: Math.round(depreciationMonthly),
    fuel: Math.round(fuelMonthly),
    insurance: Math.round(insuranceMonthly),
    maintenance: Math.round(maintenanceMonthly),
    capitalCost: Math.round(capitalCostMonthly),
    total: Math.round(total),
    perYear: Math.round(total * 12),
  }
}

/**
 * Format number as Israeli shekel currency
 */
export function formatILS(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}

/**
 * Format mileage
 */
export function formatMileage(km: number): string {
  return `${km.toLocaleString('he-IL')} ק"מ`
}
