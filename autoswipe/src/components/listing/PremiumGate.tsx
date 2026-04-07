'use client'

import { Lock } from 'lucide-react'

interface PremiumGateProps {
  children: React.ReactNode
  locked: boolean
  featureName?: string
}

/**
 * Wraps premium-only content.
 * When `locked=true`, blurs the content and shows an upgrade prompt.
 * When `locked=false` (or feature is 'open'), renders children normally.
 */
export function PremiumGate({ children, locked, featureName = 'תכונה זו' }: PremiumGateProps) {
  if (!locked) return <>{children}</>

  return (
    <div className="relative rounded-3xl overflow-hidden">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-container/60 backdrop-blur-[2px] rounded-3xl px-6">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-on-surface font-bold text-sm">{featureName} זמינה בתוכנית פרמיום</p>
          <p className="text-on-surface-variant text-xs mt-1">שדרג את החשבון שלך כדי לראות את הניתוח המלא</p>
        </div>
        <button className="bg-primary text-on-primary font-bold text-sm px-6 py-2.5 rounded-full mt-1">
          שדרג לפרמיום
        </button>
      </div>
    </div>
  )
}
