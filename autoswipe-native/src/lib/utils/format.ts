/**
 * Format a number as Israeli Shekel (₪)
 * Example: 150000 → "₪150,000"
 */
export function formatILS(amount: number): string {
  return `₪${Math.round(amount).toLocaleString('he-IL')}`
}

/**
 * Format a number with commas
 */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('he-IL')
}

/**
 * Format mileage in km
 */
export function formatMileage(km: number): string {
  return `${formatNumber(km)} ק"מ`
}

/**
 * Format a date string to Hebrew-friendly display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format relative time (e.g. "לפני 3 דקות")
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'עכשיו'
  if (diffMins < 60) return `לפני ${diffMins} דקות`
  if (diffHours < 24) return `לפני ${diffHours} שעות`
  if (diffDays < 7) return `לפני ${diffDays} ימים`
  return formatDate(dateStr)
}

/**
 * Format Israeli phone number
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}
