'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatILS } from '@/lib/utils/cost-calculator'
import type { CostBreakdown } from '@/types'

interface CostBreakdownProps {
  breakdown: CostBreakdown
}

const SEGMENTS = [
  { key: 'capitalCost', label: 'הון (פחת רכישה)', color: '#3B82F6' },
  { key: 'depreciation', label: 'פחת ערך', color: '#EF4444' },
  { key: 'fuel', label: 'דלק', color: '#F59E0B' },
  { key: 'insurance', label: 'ביטוח', color: '#8B5CF6' },
  { key: 'maintenance', label: 'תחזוקה', color: '#22C55E' },
]

export function CostBreakdownChart({ breakdown }: CostBreakdownProps) {
  const data = SEGMENTS.map((seg) => ({
    name: seg.label,
    value: breakdown[seg.key as keyof CostBreakdown] as number,
    color: seg.color,
  })).filter((d) => d.value > 0)

  return (
    <div className="bg-background-card rounded-3xl p-5 space-y-5">
      <div className="text-right">
        <p className="text-text-muted text-sm">עלות בעלות חודשית משוערת</p>
        <p className="text-accent font-black text-3xl mt-1">{formatILS(breakdown.monthly)}</p>
        <p className="text-text-muted text-xs mt-1">
          {formatILS(breakdown.perYear)} לשנה
        </p>
      </div>

      {/* Pie chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatILS(value), '']}
              contentStyle={{
                background: '#111827',
                border: '1px solid #222831',
                borderRadius: '12px',
                color: '#F8F9FA',
                direction: 'rtl',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown list */}
      <div className="space-y-2">
        {SEGMENTS.map((seg) => {
          const value = breakdown[seg.key as keyof CostBreakdown] as number
          if (!value) return null
          const pct = Math.round((value / breakdown.total) * 100)
          return (
            <div key={seg.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                <span className="text-text-secondary text-sm">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-xs">{pct}%</span>
                <span className="text-text-primary font-semibold text-sm">{formatILS(value)}</span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-text-muted text-xs text-right border-t border-surface-border pt-3">
        * מבוסס על {formatILS(1500)} ק"מ חודשי. מחיר דלק, ביטוח ותחזוקה — הערכות בלבד.
      </p>
    </div>
  )
}
