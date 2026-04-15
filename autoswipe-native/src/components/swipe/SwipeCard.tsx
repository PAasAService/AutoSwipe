import { useState } from 'react'
import { View, Text, TouchableOpacity, Dimensions, Modal, StatusBar, FlatList } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { FeedListing } from '../../types'
import { formatILS, formatMileage } from '../../lib/utils/format'
import { calculateCostBreakdown } from '../../lib/utils/cost-calculator'
import { DEAL_TAG_LABELS, DEAL_TAG_COLORS, FUEL_TYPE_LABELS } from '../../constants/cars'
import { colors } from '../../lib/theme'
import CarImagePlaceholder from '../ui/CarImagePlaceholder'
import { listingImageUri } from '../../lib/listing-image-uri'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
export const CARD_WIDTH = SCREEN_WIDTH - 32
export const CARD_HEIGHT = CARD_WIDTH * 1.35

interface Props {
  card: FeedListing
  isTop: boolean
  onPress?: () => void
}

export default function SwipeCard({ card, isTop, onPress }: Props) {
  const router = useRouter()
  const [galleryVisible, setGalleryVisible] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const primaryImage = card.images.find((i) => i.isPrimary) || card.images[0]
  const hasMultipleImages = card.images.length > 1

  const costs = calculateCostBreakdown(
    card.price,
    card.insuranceEstimate,
    card.maintenanceEstimate,
    card.depreciationRate,
    card.fuelConsumption,
  )
  const monthlyCost = card.monthlyCost ?? costs.total

  const matchLabel =
    card.matchScore >= 0.9 ? 'במיוחד עבורך ✨' :
    card.matchScore >= 0.7 ? 'התאמה גבוהה' :
    `${Math.round(card.matchScore * 100)}% התאמה`

  const isNewListing = (Date.now() - new Date(card.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
  const infoChips: string[] = []
  if (card.isGovVerified) infoChips.push('מוכר מאומת ✓')
  if (isNewListing) infoChips.push('פורסם לאחרונה')

  function handleImagePress() {
    if (!isTop) return
    if (hasMultipleImages) {
      setGalleryIndex(0)
      setGalleryVisible(true)
    }
  }

  function handleCardPress() {
    if (!isTop) return
    router.push(`/listing/${card.id}`)
  }

  return (
    <>
      <View
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {/* Car Image — tappable to open gallery */}
        <TouchableOpacity
          activeOpacity={hasMultipleImages && isTop ? 0.85 : 1}
          onPress={handleImagePress}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        >
          {primaryImage ? (
            <Image
              source={{ uri: listingImageUri(primaryImage.path) }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <CarImagePlaceholder
              brand={card.brand}
              model={card.model}
              year={card.year}
              height={CARD_HEIGHT}
            />
          )}

          {/* Image count indicator */}
          {hasMultipleImages && isTop && (
            <View
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>📷 {card.images.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Gradient overlay */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: 24,
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        >
          {/* Match score badge */}
          {card.matchScore != null && (
            <View
              style={{
                position: 'absolute',
                top: -CARD_HEIGHT + 16,
                right: 16,
                backgroundColor: 'rgba(212,168,67,0.9)',
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: colors.background, fontWeight: '800', fontSize: 13 }}>
                {matchLabel}
              </Text>
            </View>
          )}

          {/* Deal tag badge */}
          {card.dealTag && (
            <View
              style={{
                alignSelf: 'flex-end',
                backgroundColor: DEAL_TAG_COLORS[card.dealTag],
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginBottom: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                {DEAL_TAG_LABELS[card.dealTag]}
              </Text>
            </View>
          )}

          {/* Info chips: verified seller, new listing */}
          {infoChips.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 8 }}>
              {infoChips.map((chip) => (
                <View
                  key={chip}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{chip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tap to open detail — only on info area */}
          <TouchableOpacity activeOpacity={isTop ? 0.7 : 1} onPress={handleCardPress}>
            {/* Car name */}
            <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800', textAlign: 'right' }}>
              {card.brand} {card.model}
            </Text>

            {/* Year & fuel */}
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, textAlign: 'right', marginTop: 2 }}>
              {card.year} • {FUEL_TYPE_LABELS[card.fuelType]}
            </Text>

            {/* Location & mileage */}
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'right', marginTop: 4 }}>
              📍 {card.location} • {formatMileage(card.mileage)}
            </Text>

            {/* Price */}
            <Text style={{ color: colors.gold, fontSize: 28, fontWeight: '800', textAlign: 'right', marginTop: 8 }}>
              {formatILS(card.price)}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'right', marginTop: 2 }}>
              ~{formatILS(Math.round(monthlyCost))}/חודש
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full-screen Image Gallery Modal */}
      <Modal
        visible={galleryVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setGalleryVisible(false)}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 56,
              paddingBottom: 12,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
              {galleryIndex + 1} / {card.images.length}
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
              {card.brand} {card.model}
            </Text>
            <TouchableOpacity onPress={() => setGalleryVisible(false)}>
              <Text style={{ color: colors.gold, fontSize: 16 }}>סגור</Text>
            </TouchableOpacity>
          </View>

          {/* Images */}
          <FlatList
            data={card.images}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={galleryIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
              setGalleryIndex(index)
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75, justifyContent: 'center' }}>
                <Image
                  source={{ uri: listingImageUri(item.path) }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 }}
                  contentFit="contain"
                />
              </View>
            )}
          />

          {/* Dot indicators */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 16 }}>
            {card.images.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === galleryIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === galleryIndex ? colors.gold : colors.border,
                }}
              />
            ))}
          </View>

          {/* View full listing button */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            <TouchableOpacity
              onPress={() => {
                setGalleryVisible(false)
                router.push(`/listing/${card.id}`)
              }}
              style={{
                backgroundColor: colors.gold,
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.background, fontWeight: '700', fontSize: 16 }}>
                פתח מודעה מלאה ←
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}
