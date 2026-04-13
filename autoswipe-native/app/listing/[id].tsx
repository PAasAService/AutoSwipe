import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { goBackSafe } from '../../src/lib/go-back-safe'
import { BackOverlayCircle } from '../../src/components/ui/BackHeaderButton'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { api } from '../../src/lib/api'
import { listingImageUri } from '../../src/lib/listing-image-uri'
import { useFavorites, useToggleFavorite } from '../../src/hooks/useFavorites'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { CarListing } from '../../src/types'
import { formatILS, formatMileage, formatNumber, formatDate } from '../../src/lib/utils/format'
import { FUEL_TYPE_LABELS, VEHICLE_TYPE_LABELS, TRANSMISSION_LABELS, DEAL_TAG_LABELS, DEAL_TAG_COLORS } from '../../src/constants/cars'
import { calculateCostBreakdown } from '../../src/lib/utils/cost-calculator'
import Toast from 'react-native-toast-message'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function formatHand(hand: number): string {
  const labels: Record<number, string> = { 1: 'יד ראשונה', 2: 'יד שנייה', 3: 'יד שלישית', 4: 'יד רביעית', 5: 'יד חמישית' }
  return labels[hand] ?? `יד ${hand}`
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data: me } = useCurrentUser()
  const { data: favorites } = useFavorites()
  const toggleFavorite = useToggleFavorite()

  const [imageIndex, setImageIndex] = useState(0)

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get<{ data: CarListing }>(`/api/listings/${id}`).then((r) => r.data ?? r as any),
  })

  const startThread = useMutation({
    mutationFn: () =>
      api.post<{ data: { threadId: string } }>('/api/messages', { listingId: id }),
    onSuccess: () => {
      // Stay on the listing — do not navigate away.
      // Navigating to a tab route from a non-tab screen (e.g. /listing/[id]) via
      // router.push breaks the navigation stack so the back button jumps to the
      // wrong screen. Showing a toast here is sufficient; the buyer can check
      // their pending conversations in the Messages tab at any time.
      Toast.show({
        type: 'success',
        text1: 'בקשת הקשר נשלחה! 📩',
        text2: 'המוכר יצור איתך קשר ברגע שיאשר את השיחה',
        visibilityTime: 4000,
      })
    },
    onError: (err: any) => {
      // If a thread already exists the server returns 200, not an error.
      // Only surface a toast for genuine failures.
      Toast.show({ type: 'error', text1: 'שגיאה בפתיחת שיחה' })
    },
  })

  if (isLoading || !listing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4A843" />
      </View>
    )
  }

  const isFavorited = favorites?.some((f) => f.id === listing.id) ?? false
  const isSeller = me?.id === listing.sellerId
  const costs = calculateCostBreakdown(
    listing.price,
    listing.insuranceEstimate,
    listing.maintenanceEstimate,
    listing.depreciationRate,
    listing.fuelConsumption,
  )

  const priceVsMarketPct = listing.priceVsMarket ? Math.round(listing.priceVsMarket * 100) : null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={{ position: 'relative' }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
            }}
          >
            {listing.images.length > 0 ? (
              listing.images.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: listingImageUri(img.path) }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.7 }}
                  contentFit="cover"
                />
              ))
            ) : (
              <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.7, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 80 }}>🚗</Text>
              </View>
            )}
          </ScrollView>

          <BackOverlayCircle onPress={() => goBackSafe()} />

          {isSeller && listing.status !== 'DELETED' && (
            <TouchableOpacity
              onPress={() => router.push(`/listing/create?editId=${listing.id}`)}
              accessibilityLabel="ערוך מודעה"
              style={{
                position: 'absolute', top: insets.top + 8, end: 16,
                backgroundColor: 'rgba(212,168,67,0.95)', borderRadius: 20,
                paddingHorizontal: 14, paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#0F0F0F', fontSize: 14, fontWeight: '800' }}>✎ ערוך</Text>
            </TouchableOpacity>
          )}

          {/* Image counter */}
          {listing.images.length > 1 && (
            <View style={{
              position: 'absolute', bottom: 12, right: 12,
              backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
              paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Text style={{ color: '#F5F5F5', fontSize: 13 }}>
                {imageIndex + 1} / {listing.images.length}
              </Text>
            </View>
          )}
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          {/* Title & price */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {listing.dealTag && (
                <View style={{
                  backgroundColor: DEAL_TAG_COLORS[listing.dealTag],
                  borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                    {DEAL_TAG_LABELS[listing.dealTag]}
                  </Text>
                </View>
              )}
              <Text style={{ color: '#F5F5F5', fontSize: 26, fontWeight: '800', textAlign: 'right', flex: 1 }}>
                {listing.brand} {listing.model} {listing.year}
              </Text>
            </View>
            <Text style={{ color: '#D4A843', fontSize: 30, fontWeight: '800', textAlign: 'right', marginTop: 4 }}>
              {formatILS(listing.price)}
            </Text>
            {priceVsMarketPct != null && (
              <Text style={{
                color: priceVsMarketPct < 0 ? '#4CAF50' : priceVsMarketPct > 0 ? '#F44336' : '#888888',
                textAlign: 'right', fontSize: 14, marginTop: 2,
              }}>
                {priceVsMarketPct < 0 ? `${Math.abs(priceVsMarketPct)}% מתחת לשוק` : priceVsMarketPct > 0 ? `${priceVsMarketPct}% מעל השוק` : 'מחיר שוק'}
              </Text>
            )}
          </View>

          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {listing.isGovVerified && (
              <View style={{ backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: '600' }}>✓ מאומת ממשלתית</Text>
              </View>
            )}
            {listing.pollutionGroup != null && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ color: '#888888', fontSize: 13 }}>קבוצת זיהום: {listing.pollutionGroup}</Text>
              </View>
            )}
          </View>

          {/* Specs grid */}
          <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, gap: 12 }}>
            <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 16, textAlign: 'right', marginBottom: 4 }}>
              מפרט טכני
            </Text>
            {([
              ['שנה', String(listing.year)],
              ['קילומטרים', formatMileage(listing.mileage)],
              ['דלק', FUEL_TYPE_LABELS[listing.fuelType]],
              ['תיבת הילוכים', TRANSMISSION_LABELS[listing.transmission]],
              ['סוג רכב', VEHICLE_TYPE_LABELS[listing.vehicleType]],
              listing.color ? ['צבע', listing.color] : null,
              listing.doors != null ? ['דלתות', String(listing.doors)] : null,
              listing.seats != null ? ['מושבים', String(listing.seats)] : null,
              listing.engineSize ? ['מנוע', `${listing.engineSize} סמ"ק`] : null,
              listing.horsepower ? ['כוח סוס', `${listing.horsepower} כ"ס`] : null,
              ['צריכת דלק', `${listing.fuelConsumption} ל/100 ק"מ`],
              listing.hand != null ? ['יד', formatHand(listing.hand)] : null,
              listing.currentOwnershipType ? ['בעלות נוכחית', listing.currentOwnershipType] : null,
              listing.previousOwnershipType ? ['בעלות קודמת', listing.previousOwnershipType] : null,
              listing.testExpiry ? ['תאריך טסט', formatDate(listing.testExpiry)] : null,
              listing.roadEntryDate ? ['תאריך עליה לכביש', formatDate(listing.roadEntryDate)] : null,
              ['מיקום', listing.location],
              ['פורסם', formatDate(listing.createdAt)],
            ] as Array<[string, string] | null>)
              .filter((row): row is [string, string] => row !== null)
              .map(([label, value]) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#F5F5F5', fontSize: 14 }}>{value}</Text>
                  <Text style={{ color: '#888888', fontSize: 14 }}>{label}</Text>
                </View>
              ))}
          </View>

          {/* Monthly cost breakdown */}
          {(() => {
            const costsEstimated = !listing.insuranceEstimate && !listing.maintenanceEstimate
            const costRows: Array<[string, number]> = [
              ['פחת', costs.depreciation],
              ['דלק', costs.fuel],
              ...(listing.insuranceEstimate > 0 ? [['ביטוח', costs.insurance] as [string, number]] : []),
              ...(listing.maintenanceEstimate > 0 ? [['תחזוקה', costs.maintenance] as [string, number]] : []),
              ['עלות הון', costs.capital],
            ]
            return (
              <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#D4A843', fontWeight: '700', fontSize: 16 }}>
                    {formatILS(costs.total)}/חודש
                  </Text>
                  <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 16, textAlign: 'right' }}>
                    עלות חודשית{costsEstimated ? ' (משוערת)' : ''}
                  </Text>
                </View>
                {costRows.map(([label, value]) => (
                  <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#888888', fontSize: 14 }}>{formatILS(value)}</Text>
                    <Text style={{ color: '#888888', fontSize: 14 }}>{label}</Text>
                  </View>
                ))}
              </View>
            )
          })()}

          {/* Equipment / features */}
          {listing.equipment && listing.equipment.length > 0 && (
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16 }}>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 16, textAlign: 'right', marginBottom: 12 }}>
                אביזרים ואיבזור
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                {listing.equipment.map((item) => (
                  <View
                    key={item}
                    style={{
                      backgroundColor: 'rgba(212,168,67,0.1)',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderWidth: 1,
                      borderColor: 'rgba(212,168,67,0.25)',
                    }}
                  >
                    <Text style={{ color: '#D4A843', fontSize: 13 }}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {listing.description && (
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16 }}>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 16, textAlign: 'right', marginBottom: 8 }}>
                תיאור
              </Text>
              <Text style={{ color: '#888888', fontSize: 14, textAlign: 'right', lineHeight: 22 }}>
                {listing.description}
              </Text>
            </View>
          )}

          {/* Seller info */}
          {listing.seller && (
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#F5F5F5', fontWeight: '600', fontSize: 15 }}>{listing.seller.name}</Text>
                <Text style={{ color: '#888888', fontSize: 13 }}>מוכר</Text>
              </View>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#D4A843', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 18 }}>
                  {listing.seller.name.charAt(0)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action bar */}
      {!isSeller && (
        <View style={{
          flexDirection: 'row',
          padding: 16,
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
          backgroundColor: '#0F0F0F',
        }}>
          <TouchableOpacity
            onPress={() => Share.share({ message: `בדוק את הרכב הזה: ${listing.brand} ${listing.model} ${listing.year} - ${formatILS(listing.price)}` })}
            style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 20 }}>↗</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite.mutate({ listingId: listing.id, isFavorited })}
            style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: isFavorited ? 'rgba(244,67,54,0.15)' : '#1A1A1A',
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>{isFavorited ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>

          {listing.messagingMode === 'SELLER_FIRST' ? (
            <View style={{
              flex: 1, height: 48, borderRadius: 12,
              backgroundColor: '#1A1A1A',
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
            }}>
              <Text style={{ color: '#888888', fontSize: 15 }}>🔒 המוכר יצור קשר</Text>
            </View>
          ) : startThread.isSuccess ? (
            /* After sending: show confirmation state, button is inert */
            <View style={{
              flex: 1, height: 48, borderRadius: 12,
              backgroundColor: 'rgba(76,175,80,0.15)',
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)',
            }}>
              <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 15 }}>📩 הבקשה נשלחה</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => startThread.mutate()}
              disabled={startThread.isPending}
              style={{
                flex: 1, height: 48, borderRadius: 12,
                backgroundColor: '#D4A843',
                justifyContent: 'center', alignItems: 'center',
                opacity: startThread.isPending ? 0.7 : 1,
              }}
            >
              {startThread.isPending
                ? <ActivityIndicator color="#0F0F0F" size="small" />
                : <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>💬 שלח הודעה למוכר</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}
