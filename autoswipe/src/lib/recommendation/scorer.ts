/**
 * AutoSwipe Recommendation Scorer
 *
 * Scores each listing against a user's preferences and learned signals.
 * Returns a 0–100 match score with breakdown.
 *
 * Weights:
 *   Budget fit      40%
 *   Model match     30%
 *   Location prox   20%
 *   Brand match     10%
 *
 * Behavioral boost: up to +20 points on top (uncapped at 100)
 */

import { distanceBetweenCities } from '@/lib/constants/cities'
import type { CarListing, BuyerPreferences, MatchScore } from '@/types'

// Weight constants
const W_BUDGET = 0.40
const W_MODEL = 0.30
const W_LOCATION = 0.20
const W_BRAND = 0.10

// Maximum distance considered "reachable" (km)
const MAX_RADIUS = 200

interface LearnedDimension {
  dimension: string // e.g. "brand:BMW"
  score: number     // affinity score
}

/**
 * Score a single listing for a given user
 */
export function scoreListing(
  listing: CarListing,
  prefs: BuyerPreferences,
  learnedSignals: LearnedDimension[] = []
): MatchScore {
  const budgetFit = scoreBudget(listing.price, prefs.budgetMin, prefs.budgetMax)
  const modelMatch = scoreModel(listing.model, prefs.preferredModels, listing.brand, prefs.preferredBrands)
  const locationProx = scoreLocation(listing.location, prefs.location, prefs.searchRadius)
  const brandMatch = scoreBrand(listing.brand, prefs.preferredBrands)
  const behaviorBoost = scoreLearnedSignals(listing, learnedSignals)

  const total = Math.min(
    100,
    Math.round(
      budgetFit * W_BUDGET * 100 +
      modelMatch * W_MODEL * 100 +
      locationProx * W_LOCATION * 100 +
      brandMatch * W_BRAND * 100 +
      behaviorBoost
    )
  )

  return {
    total,
    budgetFit: Math.round(budgetFit * 100),
    modelMatch: Math.round(modelMatch * 100),
    locationProx: Math.round(locationProx * 100),
    brandMatch: Math.round(brandMatch * 100),
    behaviorBoost: Math.round(behaviorBoost),
  }
}

/**
 * Budget fit: 1.0 if within budget, decays for 0–20% over budget, 0 if >20% over
 * Under-budget is always 1.0 — a good deal.
 */
function scoreBudget(price: number, budgetMin?: number, budgetMax?: number): number {
  if (!budgetMax) return 0.5

  if (budgetMin && price < budgetMin) {
    // If under minimum budget — maybe too cheap/suspicious, slight penalty
    const underRatio = (budgetMin - price) / budgetMin
    return Math.max(0.6, 1 - underRatio * 0.5)
  }

  if (price <= budgetMax) return 1.0

  // Over budget — linear decay from 1.0 at budgetMax to 0 at 1.2×budgetMax
  const overRatio = (price - budgetMax) / budgetMax
  return Math.max(0, 1 - overRatio * 5)
}

/**
 * Model match: exact model = 1.0, same brand different model = 0.3, no match = 0
 */
function scoreModel(
  listingModel: string,
  preferredModels: string[],
  listingBrand: string,
  preferredBrands: string[]
): number {
  if (!preferredModels || preferredModels.length === 0) {
    // No preference → rely on brand
    return preferredBrands.includes(listingBrand) ? 0.5 : 0.2
  }

  const modelNorm = listingModel.toLowerCase()
  for (const m of preferredModels) {
    if (m.toLowerCase() === modelNorm) return 1.0
    if (modelNorm.includes(m.toLowerCase()) || m.toLowerCase().includes(modelNorm)) return 0.8
  }

  // Same brand but different model
  if (preferredBrands.includes(listingBrand)) return 0.4
  return 0.1
}

/**
 * Location proximity: 1.0 within 10km, decays to 0 at searchRadius, small penalty beyond
 */
function scoreLocation(listingCity: string, userCity: string, searchRadius: number): number {
  if (!userCity || !listingCity) return 0.5
  if (listingCity === userCity) return 1.0

  const distKm = distanceBetweenCities(userCity, listingCity)
  const radius = searchRadius || 50

  if (distKm <= radius) {
    return Math.max(0.2, 1 - (distKm / radius) * 0.8)
  }

  // Beyond radius — still show but with low score
  const extraRatio = (distKm - radius) / MAX_RADIUS
  return Math.max(0, 0.2 - extraRatio * 0.2)
}

/**
 * Brand match: preferred brand = 1.0, otherwise 0
 */
function scoreBrand(listingBrand: string, preferredBrands: string[]): number {
  if (!preferredBrands || preferredBrands.length === 0) return 0.5
  return preferredBrands.includes(listingBrand) ? 1.0 : 0.0
}

/**
 * Behavioral learning boost: adds up to +20 points based on learned affinity
 */
function scoreLearnedSignals(
  listing: CarListing,
  signals: LearnedDimension[]
): number {
  if (!signals || signals.length === 0) return 0

  let boost = 0
  const signalMap = new Map(signals.map((s) => [s.dimension, s.score]))

  // Brand signal
  const brandSignal = signalMap.get(`brand:${listing.brand}`) ?? 0
  boost += brandSignal * 8

  // Model signal
  const modelSignal = signalMap.get(`model:${listing.model}`) ?? 0
  boost += modelSignal * 10

  // Vehicle type signal
  const typeSignal = signalMap.get(`vehicleType:${listing.vehicleType}`) ?? 0
  boost += typeSignal * 4

  // Fuel type signal
  const fuelSignal = signalMap.get(`fuelType:${listing.fuelType}`) ?? 0
  boost += fuelSignal * 2

  // Clamp boost to [-10, +20]
  return Math.max(-10, Math.min(20, boost))
}
