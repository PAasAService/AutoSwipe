import { View, Text, TouchableOpacity, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { FeedListing } from '../../types'
import { formatILS, formatMileage } from '../../lib/utils/format'
import { DEAL_TAG_LABELS, DEAL_TAG_COLORS } from '../../constants/cars'
import { calculateCostBreakdown } from '../../lib/utils/cost-calculator'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
// 16px left padding + 16px right padding + 8px column gap → (w - 40) / 2
export const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2

interface Props {
  car: FeedListing
  isFavorited: boolean
  onPress: () => void
  onToggleFavorite: () => void
}

export default function ExploreCard({ car, isFavorited, onPress, onToggleFavorite }: Props) {
  const primaryImage = car.images.find((i) => i.isPrimary) || car.images[0]
  const costs = calculateCostBreakdown(
    car.price,
    car.insuranceEstimate,
    car.maintenanceEstimate,
    car.depreciationRate,
    car.fuelConsumption,
  )
  const monthlyCost = car.monthlyCost ?? costs.total
  const tagLabel = car.dealTag ? DEAL_TAG_LABELS[car.dealTag] : null
  const tagColor = car.dealTag ? DEAL_TAG_COLORS[car.dealTag] : '#D4A843'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={{
        width: CARD_WIDTH,
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Image */}
      <View style={{ position: 'relative' }}>
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage.url }}
            style={{ width: CARD_WIDTH, height: CARD_WIDTH * 0.72 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={{
            width: CARD_WIDTH,
            height: CARD_WIDTH * 0.72,
            backgroundColor: '#2A2A2A',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 36 }}>🚗</Text>
          </View>
        )}

        {/* Heart button — top left */}
        <TouchableOpacity
          onPress={onToggleFavorite}
          hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
          style={{
            position: 'absolute',
            top: 7,
            left: 7,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14 }}>{isFavorited ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        {/* Deal tag — bottom right */}
        {tagLabel && (
          <View style={{
            position: 'absolute',
            bottom: 7,
            right: 7,
            backgroundColor: tagColor + 'EE',
            borderRadius: 6,
            paddingHorizontal: 7,
            paddingVertical: 3,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{tagLabel}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ padding: 10, gap: 2 }}>
        <Text
          style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 13, textAlign: 'right' }}
          numberOfLines={1}
        >
          {car.brand} {car.model}
        </Text>
        <Text style={{ color: '#888888', fontSize: 11, textAlign: 'right' }}>
          {car.year} • {formatMileage(car.mileage)}
        </Text>
        <Text style={{ color: '#D4A843', fontWeight: '800', fontSize: 15, textAlign: 'right' }}>
          {formatILS(car.price)}
        </Text>
        <Text style={{ color: '#666666', fontSize: 10, textAlign: 'right' }}>
          ~{formatILS(Math.round(monthlyCost))}/חודש
        </Text>
      </View>
    </TouchableOpacity>
  )
}
