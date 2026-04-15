import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { goBackSafeWithReturn } from '../../src/lib/go-back-safe'
import { useReturnTo } from '../../src/hooks/useReturnTo'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { api } from '../../src/lib/api'
import { listingImageUri } from '../../src/lib/listing-image-uri'
import { CarListing, BuyerPreferences } from '../../src/types'
import { formatILS, formatMileage } from '../../src/lib/utils/format'
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from '../../src/constants/cars'
import { calculateCostBreakdown } from '../../src/lib/utils/cost-calculator'
import { SCREEN_EDGE } from '../../src/constants/layout'
import { queryKeys } from '../../src/lib/query-keys'
import { BACK_ICON_ONLY, BACK_ICON_ONLY_SIZE } from '../../src/constants/ui'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ── Haversine distance calculation ──────────────────────────────────────────
function calculateDistance(
  lat1: number | undefined, lon1: number | undefined,
  lat2: number | undefined, lon2: number | undefined,
): number | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ── Geocoding mock (simple major cities) ────────────────────────────────────
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'תל אביב': { lat: 32.0853, lon: 34.7818 },
  'ירושלים': { lat: 31.7683, lon: 35.2137 },
  'חיפה': { lat: 32.8193, lon: 34.9896 },
  'בנימין': { lat: 32.1739, lon: 35.2043 },
  'תל אביב-יפו': { lat: 32.0853, lon: 34.7818 },
  'תל אביב יפו': { lat: 32.0853, lon: 34.7818 },
  'גן רמות': { lat: 32.0731, lon: 34.8212 },
  'רמת גן': { lat: 32.0731, lon: 34.8212 },
  'גבעתיים': { lat: 32.0588, lon: 34.8119 },
  'הוד השרון': { lat: 32.1614, lon: 34.8875 },
  'אור יהודה': { lat: 32.0012, lon: 34.8569 },
  'כפר סבא': { lat: 32.1674, lon: 34.9246 },
  'רעננה': { lat: 32.1943, lon: 34.8719 },
  'הרצליה': { lat: 32.1693, lon: 34.7832 },
  'יבנה': { lat: 31.8856, lon: 34.7434 },
  'אשדוד': { lat: 31.8067, lon: 34.6452 },
  'אשקלון': { lat: 31.6645, lon: 34.5704 },
  'בת ים': { lat: 32.0036, lon: 34.7592 },
  'בית שמש': { lat: 31.8353, lon: 35.1926 },
  'מודיעין': { lat: 31.8977, lon: 35.2033 },
  'רוש פינה': { lat: 32.9653, lon: 35.4823 },
  'צפת': { lat: 32.9675, lon: 35.4865 },
  'טבריה': { lat: 32.7940, lon: 35.5303 },
  'נצרת': { lat: 32.7002, lon: 35.2975 },
  'עפולה': { lat: 32.6085, lon: 35.2844 },
  'חדרה': { lat: 32.4343, lon: 34.9191 },
  'ראש פינה': { lat: 32.9653, lon: 35.4823 },
  'קיסריה': { lat: 32.4468, lon: 34.9097 },
  'בית שאן': { lat: 32.5049, lon: 35.5029 },
  'רמת השרון': { lat: 32.2154, lon: 34.8542 },
}

function getCityCoords(city: string): { lat: number; lon: number } | null {
  if (!city) return null
  const normalized = city.trim().toLowerCase()
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (key.toLowerCase() === normalized || key.toLowerCase().includes(normalized)) {
      return coords
    }
  }
  return null
}

// ── Deal tag ranking for market value comparison ────────────────────────────
function getDealTagRank(tag: string | undefined): number {
  switch (tag) {
    case 'GREAT_DEAL': return 5
    case 'BELOW_MARKET': return 4
    case 'FAIR_PRICE': return 3
    case 'ABOVE_MARKET': return 1
    default: return 2 // No tag = neutral
  }
}

// ── Category winners computation ────────────────────────────────────────────
function computeCategoryWinners(
  listings: CarListing[],
  costs: Array<{ total: number }>,
  userPrefs: BuyerPreferences | undefined,
) {
  const n = listings.length

  // Helper: get winners (supports ties — returns array of indices)
  function getWinners(values: (number | null)[], lowerIsBetter: boolean): number[] {
    const valids = values
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v !== null) as { v: number; i: number }[]
    if (!valids.length) return []

    const bestVal = lowerIsBetter
      ? Math.min(...valids.map((x) => x.v))
      : Math.max(...valids.map((x) => x.v))

    return valids.filter(({ v }) => v === bestVal).map(({ i }) => i)
  }

  const winners = {
    price: getWinners(listings.map((l) => l.price), true),
    monthlyCost: getWinners(costs.map((c) => c.total), true),
    kilometers: getWinners(listings.map((l) => l.mileage), true),
    year: getWinners(listings.map((l) => l.year), false),
    fuelConsumption: getWinners(listings.map((l) => l.fuelConsumption), true),
    insurance: getWinners(listings.map((l) => l.insuranceEstimate), true),
    maintenance: getWinners(listings.map((l) => l.maintenanceEstimate), true),

    // Market value: use dealTag ranking, fallback to priceVsMarket
    marketValue: (() => {
      const ranks = listings.map((l, i) => ({
        rank: getDealTagRank(l.dealTag),
        i,
      }))
      const maxRank = Math.max(...ranks.map((x) => x.rank))
      return ranks.filter(({ rank }) => rank === maxRank).map(({ i }) => i)
    })(),

    // Location: closest to user's preferred location
    location: (() => {
      if (!userPrefs?.location) return []
      const userCoords = getCityCoords(userPrefs.location)
      if (!userCoords) {
        // Fallback: if user's preferred city not found, no location winner
        // (don't force a winner based on incomplete data)
        return []
      }

      const distances = listings.map((l, i) => {
        const carCoords = getCityCoords(l.location)
        if (!carCoords) {
          // If car's location not in table, approximate by string matching
          const locationLower = l.location.toLowerCase()
          const userPrefLower = userPrefs.location.toLowerCase()
          // Return very high distance if no match, 0 if matches
          return {
            dist: locationLower.includes(userPrefLower) ? 0 : 999999,
            i,
          }
        }
        const dist = calculateDistance(userCoords.lat, userCoords.lon, carCoords.lat, carCoords.lon)
        return { dist: dist ?? 999999, i }
      })

      const minDist = Math.min(...distances.map((x) => x.dist))
      if (minDist === 999999) return [] // All locations unknown, no winner
      return distances.filter(({ dist }) => dist === minDist).map(({ i }) => i)
    })(),

    // Fuel type: match user's fuel preferences
    fuelType: (() => {
      if (!userPrefs?.fuelPreferences || userPrefs.fuelPreferences.length === 0) return []
      const matches = listings
        .map((l, i) => ({ matches: userPrefs.fuelPreferences.includes(l.fuelType), i }))
        .filter(({ matches }) => matches)
        .map(({ i }) => i)
      return matches.length > 0 ? matches : []
    })(),

    // Transmission: match user's transmission preferences
    transmission: (() => {
      if (!userPrefs?.transmissionPreferences || userPrefs.transmissionPreferences.length === 0) return []
      const matches = listings
        .map((l, i) => ({ matches: userPrefs.transmissionPreferences.includes(l.transmission), i }))
        .filter(({ matches }) => matches)
        .map(({ i }) => i)
      return matches.length > 0 ? matches : []
    })(),
  }

  return winners
}

// ── Summary generation ──────────────────────────────────────────────────────
function generateSummary(
  winnerIdx: number,
  categoryWinners: Record<string, number[]>,
  runners: number[],
  listings: CarListing[],
  costs: Array<{ total: number }>,
): string[] {
  const winner = listings[winnerIdx]
  const runnerIdx = runners.length > 0 ? runners[0] : -1
  const runner = runnerIdx >= 0 ? listings[runnerIdx] : null
  const summary: string[] = []

  // Build list of real advantages from category wins
  const advantages: Array<{ text: string; priority: number }> = []

  // Helper: find the second-best value in a category (for 3+ car comparison)
  function getSecondBestComparison<T extends number>(
    values: T[],
    winnerValue: T,
  ): T | null {
    const sorted = [...values].sort((a, b) => a - b)
    // Return the second-lowest value (index 1)
    return sorted.length > 1 ? sorted[1] : null
  }

  // 1. Price advantage
  if (categoryWinners.price.includes(winnerIdx)) {
    // For 3+ cars, compare against second-lowest price
    // For 2 cars, this naturally picks the other car
    const secondBestPrice = getSecondBestComparison(
      listings.map((l) => l.price),
      winner.price,
    )
    if (secondBestPrice !== null && secondBestPrice > winner.price) {
      const priceDiff = secondBestPrice - winner.price
      advantages.push({
        text: `זול יותר מהמתחרה (${formatILS(priceDiff)})`,
        priority: 1,
      })
    } else {
      advantages.push({
        text: 'המחיר הזול ביותר',
        priority: 1,
      })
    }
  }

  // 2. Mileage advantage
  if (categoryWinners.kilometers.includes(winnerIdx)) {
    // For 3+ cars, compare against second-lowest mileage
    // For 2 cars, this naturally picks the other car
    const secondBestMileage = getSecondBestComparison(
      listings.map((l) => l.mileage),
      winner.mileage,
    )
    if (secondBestMileage !== null && secondBestMileage > winner.mileage) {
      const mileageDiff = secondBestMileage - winner.mileage
      advantages.push({
        text: `עם פחות קילומטרים (${formatMileage(mileageDiff)})`,
        priority: 2,
      })
    } else {
      advantages.push({
        text: 'עם פחות קילומטרים',
        priority: 2,
      })
    }
  }

  // 3. Monthly cost advantage
  if (categoryWinners.monthlyCost.includes(winnerIdx)) {
    // For 3+ cars, compare against second-lowest monthly cost
    // For 2 cars, this naturally picks the other car
    const secondBestMonthlyCost = getSecondBestComparison(
      costs.map((c) => c.total),
      costs[winnerIdx].total,
    )
    if (secondBestMonthlyCost !== null && secondBestMonthlyCost > costs[winnerIdx].total) {
      const monthlyCostDiff = secondBestMonthlyCost - costs[winnerIdx].total
      advantages.push({
        text: `עלות חודשית נמוכה יותר (${formatILS(monthlyCostDiff)}/חודש)`,
        priority: 3,
      })
    } else {
      advantages.push({
        text: 'עלות חודשית הנמוכה ביותר',
        priority: 3,
      })
    }
  }

  // 4. Year advantage
  if (categoryWinners.year.includes(winnerIdx)) {
    if (runner && winner.year > runner.year) {
      advantages.push({
        text: `שנתון גבוה יותר (${winner.year})`,
        priority: 4,
      })
    } else {
      advantages.push({
        text: `רכב חדיש יותר (${winner.year})`,
        priority: 4,
      })
    }
  }

  // 5. Fuel consumption advantage
  if (categoryWinners.fuelConsumption.includes(winnerIdx)) {
    advantages.push({
      text: `צריכת דלק נמוכה יותר`,
      priority: 5,
    })
  }

  // 6. Insurance advantage
  if (categoryWinners.insurance.includes(winnerIdx)) {
    advantages.push({
      text: `ביטוח זול יותר`,
      priority: 6,
    })
  }

  // 7. Maintenance advantage
  if (categoryWinners.maintenance.includes(winnerIdx)) {
    advantages.push({
      text: `תחזוקה זולה יותר`,
      priority: 7,
    })
  }

  // 8. Market value advantage
  if (categoryWinners.marketValue.includes(winnerIdx)) {
    const winnerTag = winner.dealTag
    const runnerTag = runner?.dealTag
    if (winnerTag && runnerTag && winnerTag !== runnerTag) {
      advantages.push({
        text: `יותר עסקה טובה בשוק`,
        priority: 8,
      })
    } else if (winnerTag) {
      advantages.push({
        text: `עסקה טובה בשוק`,
        priority: 8,
      })
    }
  }

  // 9. Location advantage
  if (categoryWinners.location.includes(winnerIdx)) {
    advantages.push({
      text: `קרוב יותר לאזור החיפוש שלך`,
      priority: 9,
    })
  }

  // 10. Fuel type advantage
  if (categoryWinners.fuelType.includes(winnerIdx)) {
    advantages.push({
      text: `מתאים להעדפות הדלק שלך`,
      priority: 10,
    })
  }

  // 11. Transmission advantage
  if (categoryWinners.transmission.includes(winnerIdx)) {
    advantages.push({
      text: `מתאים להעדפות תיבת ההילוכים שלך`,
      priority: 11,
    })
  }

  // Sort by priority and take top 3
  const topAdvantages = advantages.sort((a, b) => a.priority - b.priority).slice(0, 3)

  if (topAdvantages.length > 0) {
    return topAdvantages.map((a) => a.text)
  }

  // Fallback if no specific advantage found
  return ['הרכב המומלץ ביותר בהשוואה']
}

function parseCompareIds(
  params: Record<string, string | string[] | undefined>,
): string[] {
  const raw = params.ids
  const str = Array.isArray(raw) ? raw[0] : raw
  if (!str || typeof str !== 'string') return []
  try {
    return decodeURIComponent(str)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return str.split(',').map((s) => s.trim()).filter(Boolean)
  }
}

export default function CompareScreen() {
  const router = useRouter()
  const returnTo = useReturnTo()
  const idList = parseCompareIds(
    useLocalSearchParams() as Record<string, string | string[] | undefined>,
  )

  const results = useQueries({
    queries: idList.map((id) => ({
      queryKey: ['listing', id],
      queryFn: () => api.get<{ data: CarListing }>(`/api/listings/${id}`).then((r) => r.data ?? r as any),
    })),
  })

  const { data: userPrefs } = useQuery({
    queryKey: queryKeys.preferences(),
    queryFn: () => api.get<{ data: BuyerPreferences }>('/api/users/preferences').then((r) => r.data),
  })

  const isLoading = results.some((r) => r.isLoading)
  const listings = results.map((r) => r.data).filter(Boolean) as CarListing[]

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['top', 'bottom', 'left', 'right']}>
        {/* Custom header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: '#0F0F0F',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
          position: 'relative',
        }}>
          <Text style={{
            color: '#F5F5F5',
            fontSize: 18,
            fontWeight: '700',
            textAlign: 'center',
            flex: 1,
          }}>
            השוואת רכבים
          </Text>
          <TouchableOpacity
            onPress={() => goBackSafeWithReturn(returnTo, '/(tabs)/favorites')}
            style={{
              position: 'absolute',
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#4A4A4A',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24, color: '#FFFFFF', fontWeight: '600' }}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D4A843" />
        </View>
      </SafeAreaView>
    )
  }

  if (idList.length < 2) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['top', 'bottom', 'left', 'right']}>
        {/* Custom header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: '#0F0F0F',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
          position: 'relative',
        }}>
          <Text style={{
            color: '#F5F5F5',
            fontSize: 18,
            fontWeight: '700',
            textAlign: 'center',
            flex: 1,
          }}>
            השוואת מחירים
          </Text>
          <TouchableOpacity
            onPress={() => goBackSafeWithReturn(returnTo, '/(tabs)/favorites')}
            style={{
              position: 'absolute',
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#4A4A4A',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24, color: '#FFFFFF', fontWeight: '600' }}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#888888', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22, writingDirection: 'rtl' }}>
            בחר לפחות שני רכבים במסך המועדפים, סמן אותם עם ״השווה״ ולחץ על ״השווה X רכבים״ בתחתית.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/favorites')}
            style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginBottom: 10 }}
          >
            <Text style={{ color: '#0F0F0F', fontWeight: '700' }}>למועדפים</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (listings.length < 2) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['top', 'bottom', 'left', 'right']}>
        {/* Custom header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: '#0F0F0F',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
          position: 'relative',
        }}>
          <Text style={{
            color: '#F5F5F5',
            fontSize: 18,
            fontWeight: '700',
            textAlign: 'center',
            flex: 1,
          }}>
            לא ניתן להשוות
          </Text>
          <TouchableOpacity
            onPress={() => goBackSafeWithReturn(returnTo, '/(tabs)/favorites')}
            style={{
              position: 'absolute',
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#4A4A4A',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24, color: '#FFFFFF', fontWeight: '600' }}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#888888', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22, writingDirection: 'rtl' }}>
            לא הצלחנו לטעון את כל הרכבים מהמודעות שבחרת. ייתכן שהמודעה הוסרה או שאין חיבור לשרת.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/favorites')}
            style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginBottom: 10 }}
          >
            <Text style={{ color: '#0F0F0F', fontWeight: '700' }}>למועדפים</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Calculate costs for each listing
  const costs = listings.map((l) => calculateCostBreakdown(
    l.price, l.insuranceEstimate, l.maintenanceEstimate, l.depreciationRate, l.fuelConsumption,
  ))

  // Compute all 11 category winners (with tie support)
  const categoryWinners = computeCategoryWinners(listings, costs, userPrefs)

  // Count wins per car (each car can win multiple times if tied)
  const categoryWinCounts = listings.map((_, i) => {
    let count = 0
    for (const winners of Object.values(categoryWinners)) {
      if (winners.includes(i)) count++
    }
    return count
  })

  // Determine overall winner: most category wins
  let overallWinner = 0
  let maxWins = categoryWinCounts[0]
  for (let i = 1; i < listings.length; i++) {
    if (categoryWinCounts[i] > maxWins) {
      maxWins = categoryWinCounts[i]
      overallWinner = i
    }
  }

  // If tie in overall wins, break using: Price → Kilometers → Monthly Cost → Year
  const tieCandidates = categoryWinCounts
    .map((count, i) => ({ count, i }))
    .filter(({ count }) => count === maxWins)
    .map(({ i }) => i)

  if (tieCandidates.length > 1) {
    // Tie-breaker: Price (lower is better)
    const bestPrice = Math.min(...tieCandidates.map((i) => listings[i].price))
    let tieWinners = tieCandidates.filter((i) => listings[i].price === bestPrice)

    if (tieWinners.length > 1) {
      // Tie-breaker 2: Kilometers (lower is better)
      const bestMileage = Math.min(...tieWinners.map((i) => listings[i].mileage))
      tieWinners = tieWinners.filter((i) => listings[i].mileage === bestMileage)
    }

    if (tieWinners.length > 1) {
      // Tie-breaker 3: Monthly Cost (lower is better)
      const bestMonthlyCost = Math.min(...tieWinners.map((i) => costs[i].total))
      tieWinners = tieWinners.filter((i) => costs[i].total === bestMonthlyCost)
    }

    if (tieWinners.length > 1) {
      // Tie-breaker 4: Year (higher is better)
      const bestYear = Math.max(...tieWinners.map((i) => listings[i].year))
      tieWinners = tieWinners.filter((i) => listings[i].year === bestYear)
    }

    overallWinner = tieWinners[0]
  }

  // Find runner-up (second highest win count or different car if same win count)
  const runnerUp = listings
    .map((_, i) => ({ i, count: categoryWinCounts[i] }))
    .filter(({ i }) => i !== overallWinner)
    .sort((a, b) => b.count - a.count)[0]?.i ?? 0

  // Generate summary based on actual category wins
  const summaryLines = generateSummary(overallWinner, categoryWinners, [runnerUp], listings, costs)

  const colWidth = (SCREEN_WIDTH - 48) / (listings.length + 1)

  const rows: Array<{
    label: string
    values: string[]
    winnerIs: number[]
  }> = [
    {
      label: 'מחיר',
      values: listings.map((l) => formatILS(l.price)),
      winnerIs: categoryWinners.price,
    },
    {
      label: 'עלות חודשית',
      values: costs.map((c) => formatILS(c.total)),
      winnerIs: categoryWinners.monthlyCost,
    },
    {
      label: 'קילומטרים',
      values: listings.map((l) => formatMileage(l.mileage)),
      winnerIs: categoryWinners.kilometers,
    },
    {
      label: 'שנה',
      values: listings.map((l) => String(l.year)),
      winnerIs: categoryWinners.year,
    },
    {
      label: 'דלק',
      values: listings.map((l) => FUEL_TYPE_LABELS[l.fuelType]),
      winnerIs: categoryWinners.fuelType,
    },
    {
      label: 'תיבת הילוכים',
      values: listings.map((l) => TRANSMISSION_LABELS[l.transmission]),
      winnerIs: categoryWinners.transmission,
    },
    {
      label: 'צריכת דלק',
      values: listings.map((l) => `${l.fuelConsumption} ל/100`),
      winnerIs: categoryWinners.fuelConsumption,
    },
    {
      label: 'ביטוח/שנה',
      values: listings.map((l) => formatILS(l.insuranceEstimate)),
      winnerIs: categoryWinners.insurance,
    },
    {
      label: 'תחזוקה/שנה',
      values: listings.map((l) => formatILS(l.maintenanceEstimate)),
      winnerIs: categoryWinners.maintenance,
    },
    {
      label: 'מיקום',
      values: listings.map((l) => l.location),
      winnerIs: categoryWinners.location,
    },
    ...(listings.some((l) => l.marketAvgPrice) ? [{
      label: 'שווי שוק',
      values: listings.map((l) => l.marketAvgPrice ? formatILS(l.marketAvgPrice) : '—'),
      winnerIs: categoryWinners.marketValue,
    }] : []),
  ]

  const winner = listings[overallWinner]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['top', 'bottom', 'left', 'right']}>
      {/* Custom header with explicit layout control for Compare screen */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#0F0F0F',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        position: 'relative',
      }}>
        {/* Title - centered */}
        <Text style={{
          color: '#F5F5F5',
          fontSize: 21,
          fontWeight: '700',
          textAlign: 'center',
          flex: 1,
        }}>
          השוואת רכבים
        </Text>

        {/* Back button - positioned on the visual right */}
        <TouchableOpacity
          onPress={() => goBackSafeWithReturn(returnTo, '/(tabs)/favorites')}
          style={{
            position: 'absolute',
            right: 16,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 22,
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="חזור"
        >
          <Text style={{ color: '#F5F5F5', fontSize: BACK_ICON_ONLY_SIZE }}>{BACK_ICON_ONLY}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Car headers */}
        <View style={{ flexDirection: 'row', paddingHorizontal: SCREEN_EDGE, gap: 4, paddingVertical: 16, marginBottom: 8 }}>
          <View style={{ width: colWidth }} />
          {listings.map((car, i) => (
            <View key={car.id} style={{ width: colWidth, alignItems: 'center', gap: 6 }}>
              <View style={{ position: 'relative' }}>
                {car.images[0] && (
                  <Image
                    source={{ uri: listingImageUri(car.images[0].path) }}
                    style={{ width: colWidth - 6, height: 90, borderRadius: 10, borderWidth: i === overallWinner ? 2 : 0, borderColor: '#D4A843' }}
                    contentFit="cover"
                  />
                )}
                {i === overallWinner && (
                  <View style={{ position: 'absolute', top: -8, right: -4, backgroundColor: '#D4A843', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ color: '#0F0F0F', fontSize: 10, fontWeight: '800' }}>🏆</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 13, textAlign: 'center' }} numberOfLines={2}>
                {car.brand} {car.model}
              </Text>
              <Text style={{ color: '#D4A843', fontWeight: '700', fontSize: 13 }}>{formatILS(car.price)}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {rows.map((row, i) => (
          <View key={row.label} style={{
            flexDirection: 'row',
            paddingHorizontal: SCREEN_EDGE, paddingVertical: 10, gap: 4,
            backgroundColor: i % 2 === 0 ? '#1A1A1A' : '#0F0F0F',
          }}>
            <View style={{ width: colWidth, justifyContent: 'center' }}>
              <Text style={{ color: '#888888', fontSize: 12, textAlign: 'right' }}>{row.label}</Text>
            </View>
            {listings.map((car, j) => (
              <View
                key={car.id}
                style={{
                  width: colWidth, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: row.winnerIs.includes(j) ? 'rgba(212,168,67,0.1)' : 'transparent',
                  borderRadius: 6,
                }}
              >
                <Text style={{
                  color: row.winnerIs.includes(j) ? '#D4A843' : '#F5F5F5',
                  fontSize: 12, fontWeight: row.winnerIs.includes(j) ? '700' : '400',
                  textAlign: 'center',
                }}>
                  {row.values[j]}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Verdict card */}
        <View style={{
          marginHorizontal: SCREEN_EDGE,
          marginVertical: 16,
          backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20,
          borderWidth: 2, borderColor: 'rgba(212,168,67,0.4)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 12 }}>
            <View>
              <Text style={{ color: '#888', fontSize: 13, textAlign: 'right' }}>הרכב המומלץ עבורך</Text>
              <Text style={{ color: '#F5F5F5', fontWeight: '800', fontSize: 18, textAlign: 'right' }}>
                {winner.brand} {winner.model} {winner.year}
              </Text>
            </View>
            <Text style={{ fontSize: 36 }}>🏆</Text>
          </View>

          <View style={{ gap: 8 }}>
            {/* Show category win count out of 11 */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: '#888', fontSize: 13, textAlign: 'right' }}>
                זכה ב־{categoryWinCounts[overallWinner]} מתוך 11 קטגוריות
              </Text>
              <Text>🎯</Text>
            </View>

            {/* Show summary lines */}
            {summaryLines.map((line, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                <Text style={{ color: '#888', fontSize: 13, textAlign: 'right' }}>
                  {line}
                </Text>
                <Text>{idx === 0 ? '💰' : idx === 1 ? '🚗' : '📊'}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => router.push(`/listing/${winner.id}`)}
            style={{ backgroundColor: '#D4A843', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 }}
          >
            <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 15 }}>
              צפה ברכב המנצח ←
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
