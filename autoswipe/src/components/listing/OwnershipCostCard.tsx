import { formatILS } from '@/lib/utils/cost-calculator'
import { PremiumGate } from './PremiumGate'

interface OwnershipCostCardProps {
  fuelConsumption: number | null
  fuelType: string
  insuranceEstimate: number | null
  depreciationRate: number | null
  price: number
  locked?: boolean
}

/**
 * Shows the three key ownership cost metrics: fuel/month, insurance/year, depreciation/year.
 * Wraps in PremiumGate — pass `locked={true}` to show the upgrade prompt.
 */
export function OwnershipCostCard({
  fuelConsumption,
  fuelType,
  insuranceEstimate,
  depreciationRate,
  price,
  locked = false,
}: OwnershipCostCardProps) {
  const fuelPerMonth = fuelConsumption
    ? Math.round(fuelConsumption * 1500 * (fuelType === 'ELECTRIC' ? 0.55 : 7.2) / 100)
    : null

  const cells = [
    {
      label: 'דלק / חודש',
      value: fuelPerMonth ? formatILS(fuelPerMonth) : '—',
      highlight: true,
    },
    {
      label: 'ביטוח / שנה',
      value: insuranceEstimate ? formatILS(insuranceEstimate) : '—',
      highlight: false,
    },
    {
      label: 'פחת / שנה',
      value: depreciationRate ? formatILS(Math.round(price * depreciationRate)) : '—',
      highlight: false,
    },
  ]

  const card = (
    <div className="bg-surface-container rounded-3xl p-5">
      <h2 className="text-on-surface font-bold text-base text-right mb-4">עלויות בעלות משוערות</h2>
      <div className="grid grid-cols-3 gap-3">
        {cells.map(({ label, value, highlight }) => (
          <div key={label} className="bg-surface-container-high rounded-2xl p-3.5 text-center">
            <p className="text-on-surface-variant text-xs mb-1">{label}</p>
            <p className={`font-bold text-base ${highlight ? 'text-primary' : 'text-on-surface'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="text-on-surface-variant text-xs text-center mt-3 opacity-60">
        * הערכות בלבד — בהתאם לממוצעי שוק ישראלי
      </p>
    </div>
  )

  return (
    <PremiumGate locked={locked} featureName="עלויות בעלות">
      {card}
    </PremiumGate>
  )
}
