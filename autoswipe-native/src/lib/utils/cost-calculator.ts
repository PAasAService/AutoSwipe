export interface CostBreakdown {
  monthly: number
  depreciation: number       // per month
  fuel: number               // per month
  insurance: number          // per month
  maintenance: number        // per month
  capital: number            // opportunity cost per month
  total: number              // = all of the above
}

const AVG_KM_PER_MONTH = 1500
const FUEL_PRICE_PER_LITER = 7.2  // ILS, approximate Israel average
const CAPITAL_RATE_ANNUAL = 0.04  // 4% opportunity cost

export function calculateCostBreakdown(
  price: number,
  insuranceEstimate: number,
  maintenanceEstimate: number,
  depreciationRate: number,
  fuelConsumption: number,        // liters per 100km
  ownershipYears: number = 3,
): CostBreakdown {
  const depreciationPerMonth = (price * depreciationRate) / 12
  const fuelPerMonth = (fuelConsumption / 100) * AVG_KM_PER_MONTH * FUEL_PRICE_PER_LITER
  const insurancePerMonth = insuranceEstimate / 12
  const maintenancePerMonth = maintenanceEstimate / 12
  const capitalPerMonth = (price * CAPITAL_RATE_ANNUAL) / 12

  const total =
    depreciationPerMonth +
    fuelPerMonth +
    insurancePerMonth +
    maintenancePerMonth +
    capitalPerMonth

  return {
    monthly: total,
    depreciation: depreciationPerMonth,
    fuel: fuelPerMonth,
    insurance: insurancePerMonth,
    maintenance: maintenancePerMonth,
    capital: capitalPerMonth,
    total,
  }
}
