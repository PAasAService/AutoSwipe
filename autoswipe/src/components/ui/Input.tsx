'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | false | null)[]) {
  return twMerge(clsx(inputs))
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-surface border border-surface-border rounded-2xl px-4 py-3 text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
              'transition-all duration-200',
              'text-right', // RTL
              !!icon && 'pr-10',
              error && 'border-status-error/50 focus:ring-status-error/30',
              className
            )}
            dir="rtl"
            {...props}
          />
        </div>
        {error && <p className="text-xs text-status-error text-right">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted text-right">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Select variant
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full bg-surface border border-surface-border rounded-2xl px-4 py-3 text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
            'transition-all duration-200 text-right appearance-none cursor-pointer',
            error && 'border-status-error/50',
            className
          )}
          dir="rtl"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-status-error text-right">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
