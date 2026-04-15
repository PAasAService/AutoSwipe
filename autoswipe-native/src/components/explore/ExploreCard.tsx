import { View, Text, TouchableOpacity, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { FeedListing } from '../../types'
import { formatILS, formatMileage } from '../../lib/utils/format'
import { DEAL_TAG_LABELS, DEAL_TAG_COLORS } from '../../constants/cars'
import { calculateCostBreakdown } from '../../lib/utils/cost-calculator'
import { listingImageUri } from '../../lib/listing-image-uri'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
// 16px left padding + 16px right padding + 8px column gap → (w - 40) / 2
export const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2

interface Props {
  car: FeedListing
  isFavorited: boolean
  onPress: () => void
  onToggleFavorite: () => void
  isSelected?: boolean
  onToggleCompare?: () => void
}

export default function ExploreCard({ car, isFavorited, onPress, onToggleFavorite, isSelected = false, onToggleCompare }: Props) {
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
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? '#D4A843' : 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Image */}
      <View style={{ position: 'relative' }}>
        {primaryImage ? (
          <Image
            source={{ uri: listingImageUri(primaryImage.path) }}
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

        {/* Compare checkbox — top right (only if onToggleCompare provided) */}
        {onToggleCompare && (
          <TouchableOpacity
            onPress={onToggleCompare}
            hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
            style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: isSelected ? 'rgba(212,168,67,0.8)' : 'rgba(0,0,0,0.55)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: isSelected ? 0 : 1.5,
              borderColor: 'rgba(255,255,255,0.3)',
            }}
          >
            <Text style={{ fontSize: 14 }}>{isSelected ? '✓' : '⚖️'}</Text>
          </TouchableOpacity>
        )}

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
