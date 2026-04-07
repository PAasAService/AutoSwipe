/**
 * Feature availability config.
 * Flip any value from 'open' → 'premium' to lock it behind a subscription.
 * No code changes needed beyond this file.
 */

export const FEATURES = {
  OWNERSHIP_COST: 'ownership_cost',
  PRICE_ANALYTICS: 'price_analytics',
  FULL_COST_BREAKDOWN: 'full_cost_breakdown',
} as const

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES]

export const FEATURE_AVAILABILITY: Record<FeatureKey, 'open' | 'premium'> = {
  [FEATURES.OWNERSHIP_COST]: 'open',        // flip to 'premium' to lock
  [FEATURES.PRICE_ANALYTICS]: 'open',       // flip to 'premium' to lock
  [FEATURES.FULL_COST_BREAKDOWN]: 'open',   // flip to 'premium' to lock
}

export type UserPlan = 'FREE' | 'PREMIUM'

export function canAccess(feature: FeatureKey, userPlan: UserPlan = 'FREE'): boolean {
  const avail = FEATURE_AVAILABILITY[feature]
  return avail === 'open' || userPlan === 'PREMIUM'
}
