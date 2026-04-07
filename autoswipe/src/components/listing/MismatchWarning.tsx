'use client'

import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { MismatchField } from '@/lib/utils/vehicle-validation'

interface Props {
  mismatches: MismatchField[]
  /** User chooses to overwrite form with official API data */
  onAccept: () => void
  /** User keeps their own values; non-conflicting fields are still filled */
  onKeep: () => void
}

export function MismatchWarning({ mismatches, onAccept, onKeep }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-right flex-1">
          <p className="text-sm font-semibold text-amber-400">
            ייתכן חוסר התאמה בין הנתונים שהוזנו למידע הרשמי
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            מצאנו הבדלים בין מה שהזנת לבין מאגר משרד הרישוי:
          </p>
        </div>
      </div>

      {/* Mismatch rows */}
      <div className="bg-surface-container/60 rounded-xl px-3 py-2.5 space-y-2">
        {mismatches.map((m) => (
          <div key={m.field} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center text-xs">
            <span className="text-on-surface-variant font-medium w-10 text-right">
              {m.labelHe}
            </span>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant/60">הזנת:</span>
              <span className="mr-1 font-medium text-amber-300">{m.formValue}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant/60">רשמי:</span>
              <span className="mr-1 font-medium text-emerald-300">{m.apiValue}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onKeep}
          className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface-variant text-sm font-medium border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
        >
          השאר ערכים שלי
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
        >
          קבל נתונים רשמיים
        </button>
      </div>
    </motion.div>
  )
}
