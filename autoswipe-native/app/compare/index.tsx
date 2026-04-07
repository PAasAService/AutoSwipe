import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQueries } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { api } from '../../src/lib/api'
import { CarListing } from '../../src/types'
import { formatILS, formatMileage } from '../../src/lib/utils/format'
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from '../../src/constants/cars'
import { calculateCostBreakdown } from '../../src/lib/utils/cost-calculator'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function CompareScreen() {
  const router = useRouter()
  const { ids } = useLocalSearchParams<{ ids: string }>()
  const idList = ids?.split(',') ?? []

  const results = useQueries({
    queries: idList.map((id) => ({
      queryKey: ['listing', id],
      queryFn: () => api.get<{ data: CarListing }>(`/api/listings/${id}`).then((r) => r.data ?? r as any),
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const listings = results.map((r) => r.data).filter(Boolean) as CarListing[]

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4A843" />
      </View>
    )
  }

  if (listings.length < 2) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#F5F5F5', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          בחר לפחות שני רכבים להשוואה
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: '#0F0F0F', fontWeight: '700' }}>חזור למועדפים</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // Calculate costs for each listing
  const costs = listings.map((l) => calculateCostBreakdown(
    l.price, l.insuranceEstimate, l.maintenanceEstimate, l.depreciationRate, l.fuelConsumption,
  ))

  // Winner index helpers
  function winnerIdx(values: (number | null)[], lowerIsBetter: boolean): number {
    const valids = values.map((v, i) => ({ v, i })).filter(({ v }) => v !== null) as { v: number; i: number }[]
    if (!valids.length) return -1
    if (lowerIsBetter) return valids.reduce((best, cur) => cur.v < best.v ? cur : best).i
    return valids.reduce((best, cur) => cur.v > best.v ? cur : best).i
  }

  const priceWinner = winnerIdx(listings.map((l) => l.price), true)
  const mileageWinner = winnerIdx(listings.map((l) => l.mileage), true)
  const yearWinner = winnerIdx(listings.map((l) => l.year), false)
  const monthlyWinner = winnerIdx(costs.map((c) => c.total), true)

  // Overall winner: most wins
  const winCounts = listings.map((_, i) =>
    [priceWinner, mileageWinner, yearWinner, monthlyWinner].filter((w) => w === i).length
  )
  const overallWinner = winCounts.indexOf(Math.max(...winCounts))

  const colWidth = (SCREEN_WIDTH - 48) / (listings.length + 1)

  const rows: Array<{
    label: string
    values: string[]
    winnerI: number
  }> = [
    {
      label: 'מחיר',
      values: listings.map((l) => formatILS(l.price)),
      winnerI: priceWinner,
    },
    {
      label: 'עלות חודשית',
      values: costs.map((c) => formatILS(c.total)),
      winnerI: monthlyWinner,
    },
    {
      label: 'קילומטרים',
      values: listings.map((l) => formatMileage(l.mileage)),
      winnerI: mileageWinner,
    },
    {
      label: 'שנה',
      values: listings.map((l) => String(l.year)),
      winnerI: yearWinner,
    },
    {
      label: 'דלק',
      values: listings.map((l) => FUEL_TYPE_LABELS[l.fuelType]),
      winnerI: -1,
    },
    {
      label: 'תיבת הילוכים',
      values: listings.map((l) => TRANSMISSION_LABELS[l.transmission]),
      winnerI: -1,
    },
    {
      label: 'צריכת דלק',
      values: listings.map((l) => `${l.fuelConsumption} ל/100`),
      winnerI: winnerIdx(listings.map((l) => l.fuelConsumption), true),
    },
    {
      label: 'ביטוח/שנה',
      values: listings.map((l) => formatILS(l.insuranceEstimate)),
      winnerI: winnerIdx(listings.map((l) => l.insuranceEstimate), true),
    },
    {
      label: 'תחזוקה/שנה',
      values: listings.map((l) => formatILS(l.maintenanceEstimate)),
      winnerI: winnerIdx(listings.map((l) => l.maintenanceEstimate), true),
    },
    {
      label: 'מיקום',
      values: listings.map((l) => l.location),
      winnerI: -1,
    },
    ...(listings.some((l) => l.marketAvgPrice) ? [{
      label: 'שווי שוק',
      values: listings.map((l) => l.marketAvgPrice ? formatILS(l.marketAvgPrice) : '—'),
      winnerI: winnerIdx(listings.map((l) => l.marketAvgPrice ?? null), false),
    }] : []),
  ]

  const winner = listings[overallWinner]
  const priceDiff = listings.length === 2 ? Math.abs(listings[0].price - listings[1].price) : 0
  const monthlyCostDiff = listings.length === 2 ? Math.abs(costs[0].total - costs[1].total) : 0
  const mileageDiff = listings.length === 2 ? Math.abs(listings[0].mileage - listings[1].mileage) : 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#D4A843', fontSize: 16 }}>→</Text>
        </TouchableOpacity>
        <Text style={{ color: '#F5F5F5', fontSize: 22, fontWeight: '700', flex: 1, textAlign: 'right' }}>
          השוואת רכבים ⚖️
        </Text>
      </View>

      <ScrollView>
        {/* Car headers */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 4, marginBottom: 12 }}>
          <View style={{ width: colWidth }} />
          {listings.map((car, i) => (
            <View key={car.id} style={{ width: colWidth, alignItems: 'center', gap: 4 }}>
              <View style={{ position: 'relative' }}>
                {car.images[0] && (
                  <Image
                    source={{ uri: car.images[0].url }}
                    style={{ width: colWidth - 6, height: 64, borderRadius: 10, borderWidth: i === overallWinner ? 2 : 0, borderColor: '#D4A843' }}
                    contentFit="cover"
                  />
                )}
                {i === overallWinner && (
                  <View style={{ position: 'absolute', top: -8, right: -4, backgroundColor: '#D4A843', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ color: '#0F0F0F', fontSize: 10, fontWeight: '800' }}>🏆</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 12, textAlign: 'center' }} numberOfLines={2}>
                {car.brand} {car.model}
              </Text>
              <Text style={{ color: '#D4A843', fontWeight: '700', fontSize: 12 }}>{formatILS(car.price)}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {rows.map((row, i) => (
          <View key={row.label} style={{
            flexDirection: 'row',
            paddingHorizontal: 16, paddingVertical: 10, gap: 4,
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
                  backgroundColor: j === row.winnerI ? 'rgba(212,168,67,0.1)' : 'transparent',
                  borderRadius: 6,
                }}
              >
                <Text style={{
                  color: j === row.winnerI ? '#D4A843' : '#F5F5F5',
                  fontSize: 12, fontWeight: j === row.winnerI ? '700' : '400',
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
          margin: 16, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20,
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
            {priceDiff > 5000 && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                <Text style={{ color: '#888', fontSize: 13, textAlign: 'right' }}>
                  זול ב-{formatILS(priceDiff)} מהיתרים
                </Text>
                <Text>💰</Text>
              </View>
            )}
            {monthlyCostDiff > 100 && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                <Text style={{ color: '#888', fontSize: 13, textAlign: 'right' }}>
                  חיסכון של {formatILS(monthlyCostDiff)}/חודש בעלות השוטפת
                </Text>
                <Text>📊</Text>
              </View>
            )}
            {mileageDiff > 10000 && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                <Text style={{ color: '#888', fontSize: 13, textAlign: 'right' }}>
                  נמוך ב-{formatMileage(mileageDiff)} מהמתחרים
                </Text>
                <Text>🚗</Text>
              </View>
            )}
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
