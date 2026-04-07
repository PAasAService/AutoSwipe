'use client'

import { ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'

interface VerifiedBadgeProps {
  /** sm = compact pill for swipe cards / tag rows
   *  md = full card with description for listing detail page */
  size?: 'sm' | 'md'
  className?: string
}

export function VerifiedBadge({ size = 'md', className }: VerifiedBadgeProps) {
  if (size === 'sm') {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400',
          'border border-emerald-500/30 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          className,
        )}
      >
        <ShieldCheck className="w-3 h-3 flex-shrink-0" />
        רכב מאומת
      </span>
    )
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-4 py-3',
        className,
      )}
    >
      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
      </div>
      <div className="text-right flex-1">
        <p className="text-sm font-bold text-emerald-400">רכב מאומת ✓</p>
        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
          הנתונים אומתו מול מאגר משרד הרישוי הרשמי
        </p>
      </div>
    </div>
  )
}
