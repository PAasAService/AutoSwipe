import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DEAL_TAG_COLOR, DEAL_TAG_HE } from '@/lib/constants/cars'
import type { DealTag } from '@/types'

function cn(...inputs: (string | undefined | false | null)[]) {
  return twMerge(clsx(inputs))
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-surface text-text-secondary border border-surface-border',
    accent: 'bg-accent/15 text-accent border border-accent/25',
    success: 'bg-status-success/15 text-status-success border border-status-success/25',
    error: 'bg-status-error/15 text-status-error border border-status-error/25',
    warning: 'bg-status-warning/15 text-status-warning border border-status-warning/25',
    info: 'bg-status-info/15 text-status-info border border-status-info/25',
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  }

  return (
    <span className={cn('inline-flex items-center rounded-full font-medium', variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}

// Deal-specific badge
interface DealBadgeProps {
  tag: DealTag
  size?: 'sm' | 'md'
}

export function DealBadge({ tag, size = 'sm' }: DealBadgeProps) {
  const colorClass = DEAL_TAG_COLOR[tag] ?? 'bg-surface text-text-secondary border border-surface-border/50'
  const label = DEAL_TAG_HE[tag] ?? tag

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg gap-1',
        colorClass,
        size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'
      )}
    >
      {label}
    </span>
  )
}

// Match score indicator
interface MatchScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function MatchScoreBadge({ score, size = 'md' }: MatchScoreProps) {
  const color =
    score >= 80 ? 'text-status-success border-status-success/35 bg-status-success/12 font-bold' :
    score >= 60 ? 'text-accent border-accent/35 bg-accent/12 font-bold' :
    score >= 40 ? 'text-status-warning border-status-warning/35 bg-status-warning/12 font-semibold' :
    'text-text-muted border-surface-border/50 bg-surface font-medium'

  const sizes = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-lg border', color, sizes[size])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}% התאמה
    </span>
  )
}
