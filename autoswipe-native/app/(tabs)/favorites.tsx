import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { goBackSafeWithReturn, hrefWithReturn } from '../../src/lib/go-back-safe'
import { useReturnTo } from '../../src/hooks/useReturnTo'
import { Image } from 'expo-image'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../src/lib/api'
import { listingImageUri } from '../../src/lib/listing-image-uri'
import { useFavorites, useRemoveFavorite } from '../../src/hooks/useFavorites'
import { CarListing } from '../../src/types'
import { formatILS, formatMileage } from '../../src/lib/utils/format'
import { FUEL_TYPE_LABELS } from '../../src/constants/cars'
import Skeleton from '../../src/components/ui/Skeleton'
import { SCREEN_EDGE, SCREEN_HEADER_BORDER } from '../../src/constants/layout'
import { BACK_ICON_ONLY, BACK_ICON_ONLY_SIZE } from '../../src/constants/ui'

export default function FavoritesScreen() {
  const router = useRouter()
  const returnTo = useReturnTo()
  const insets = useSafeAreaInsets()

  const { data: favorites, isLoading, isError, error } = useFavorites()
  const removeFavorite = useRemoveFavorite()
  const [compareIds, setCompareIds] = useState<string[]>([])

  const startThread = useMutation({
    mutationFn: (listingId: string) =>
      api.post<any>('/api/messages', { listingId }),
    onSuccess: (res) => {
      const threadId = res?.data?.threadId ?? res?.threadId
      if (threadId) router.push(hrefWithReturn(`/(tabs)/messages/${threadId}`, 'favorites'))
    },
    onError: () => Toast.show({ type: 'error', text1: 'שגיאה בפתיחת שיחה' }),
  })

  useEffect(() => {
    if (isLoading) return
    if (isError && error instanceof Error && error.message === '401') {
      router.replace('/(auth)/login')
    }
  }, [isLoading, isError, error, router])

  function handleFavoritesBack() {
    goBackSafeWithReturn(returnTo)
  }

  if (!isLoading && isError && error instanceof Error && error.message === '401') {
    return null
  }

  function toggleCompare(id: string) {
    if (compareIds.includes(id)) {
      setCompareIds((prev) => prev.filter((x) => x !== id))
    } else if (compareIds.length >= 3) {
      Toast.show({ type: 'error', text1: 'ניתן להשוות עד 3 רכבים' })
    } else {
      setCompareIds((prev) => [...prev, id])
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
        {/* Custom header with back button on RIGHT (RTL-correct) */}
        <View
          style={{
            backgroundColor: '#0F0F0F',
            borderBottomWidth: 1,
            borderBottomColor: SCREEN_HEADER_BORDER,
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            paddingHorizontal: SCREEN_EDGE,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Spacer: LEFT */}
          <View style={{ width: 44 }} />

          {/* Title: CENTER */}
          <Text style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#F5F5F5',
            textAlign: 'center',
            writingDirection: 'rtl',
          }}>
            המועדפים שלי ❤️
          </Text>

          {/* Back button: RIGHT */}
          <TouchableOpacity
            onPress={handleFavoritesBack}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="חזור"
          >
            <Text style={{ color: '#F5F5F5', fontSize: BACK_ICON_ONLY_SIZE }}>
              {BACK_ICON_ONLY}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: SCREEN_EDGE, paddingTop: 12 }}>
          <Skeleton width={180} height={28} borderRadius={8} />
          <View style={{ marginTop: 8 }}>
            <Skeleton width={120} height={16} borderRadius={6} />
          </View>
        </View>
        <View style={{ padding: SCREEN_EDGE, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'hidden', flexDirection: 'row' }}>
              <Skeleton width={110} height={100} borderRadius={0} />
              <View style={{ flex: 1, padding: 12, gap: 8 }}>
                <Skeleton width="70%" height={18} borderRadius={6} />
                <Skeleton width="50%" height={14} borderRadius={6} />
                <Skeleton width="60%" height={14} borderRadius={6} />
                <Skeleton width="40%" height={18} borderRadius={6} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    )
  }

  if (!favorites?.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
        {/* Custom header with back button on RIGHT (RTL-correct) */}
        <View
          style={{
            backgroundColor: '#0F0F0F',
            borderBottomWidth: 1,
            borderBottomColor: SCREEN_HEADER_BORDER,
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            paddingHorizontal: SCREEN_EDGE,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Spacer: LEFT */}
          <View style={{ width: 44 }} />

          {/* Title: CENTER */}
          <Text style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#F5F5F5',
            textAlign: 'center',
            writingDirection: 'rtl',
          }}>
            המועדפים שלי ❤️
          </Text>

          {/* Back button: RIGHT */}
          <TouchableOpacity
            onPress={handleFavoritesBack}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="חזור"
          >
            <Text style={{ color: '#F5F5F5', fontSize: BACK_ICON_ONLY_SIZE }}>
              {BACK_ICON_ONLY}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>❤️</Text>
          <Text style={{ color: '#F5F5F5', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
            אין רכבים שמורים עדיין
          </Text>
          <Text style={{ color: '#888888', textAlign: 'center', fontSize: 15, marginBottom: 24 }}>
            החלק ימינה על רכבים שאהבת כדי לשמור אותם כאן
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/swipe')}
            style={{ backgroundColor: '#D4A843', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}
          >
            <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>חזור לגלול</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
      {/* Custom header with back button on RIGHT (RTL-correct) */}
      <View
        style={{
          backgroundColor: '#0F0F0F',
          borderBottomWidth: 1,
          borderBottomColor: SCREEN_HEADER_BORDER,
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: SCREEN_EDGE,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Spacer: LEFT */}
        <View style={{ width: 44 }} />

        {/* Title + Subtitle: CENTER */}
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Text style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#F5F5F5',
            textAlign: 'center',
            writingDirection: 'rtl',
          }}>
            המועדפים שלי ❤️
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#888888',
            textAlign: 'center',
            marginTop: 2,
            writingDirection: 'rtl',
          }}>
            {favorites.length} רכבים שמורים
          </Text>
        </View>

        {/* Back button: RIGHT */}
        <TouchableOpacity
          onPress={handleFavoritesBack}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="חזור"
        >
          <Text style={{ color: '#F5F5F5', fontSize: BACK_ICON_ONLY_SIZE }}>
            {BACK_ICON_ONLY}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Below header: Comparison hint */}
      {compareIds.length >= 2 && (
        <View style={{ paddingHorizontal: SCREEN_EDGE, paddingVertical: 12 }}>
          <Text style={{ color: '#D4A843', textAlign: 'center', fontSize: 13, writingDirection: 'rtl' }}>
            בחר עד 3 רכבים להשוואה
          </Text>
        </View>
      )}

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SCREEN_EDGE, gap: 12, paddingBottom: compareIds.length >= 2 ? 100 : 20 }}
        renderItem={({ item }) => (
          <FavoriteCard
            car={item}
            isSelected={compareIds.includes(item.id)}
            onToggleCompare={() => toggleCompare(item.id)}
            onRemove={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              removeFavorite.mutate(item.id)
            }}
            onPress={() => router.push(`/listing/${item.id}`)}
            onMessage={(listingId: string) => startThread.mutate(listingId)}
          />
        )}
      />

      {/* Floating compare button */}
      {compareIds.length >= 2 && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#0F0F0F', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
          paddingHorizontal: SCREEN_EDGE, paddingTop: 16, paddingBottom: 24,
        }}>
          <TouchableOpacity
            onPress={() => {
              const q = encodeURIComponent(compareIds.join(','))
              // Query string required — `params` on `router.push` is often dropped when opening a root-stack modal from tabs.
              router.push(`/compare?ids=${q}`)
            }}
            style={{ backgroundColor: '#D4A843', borderRadius: 14, padding: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>
              ⚖️ השווה {compareIds.length} רכבים
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

function FavoriteCard({
  car, isSelected, onToggleCompare, onRemove, onPress, onMessage,
}: {
  car: CarListing; isSelected: boolean
  onToggleCompare: () => void; onRemove: () => void
  onPress: () => void; onMessage: (listingId: string) => void
}) {
  const primaryImage = car.images.find((i) => i.isPrimary) || car.images[0]

  return (
    <View style={{
      backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'hidden',
      borderWidth: isSelected ? 2 : 1,
      borderColor: isSelected ? '#D4A843' : 'rgba(255,255,255,0.08)',
    }}>
      <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row' }}>
        {primaryImage ? (
          <Image source={{ uri: listingImageUri(primaryImage.path) }} style={{ width: 110, height: 100 }} contentFit="cover" />
        ) : (
          <View style={{ width: 110, height: 100, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 32 }}>🚗</Text>
          </View>
        )}
        <View style={{ flex: 1, padding: 12, gap: 3 }}>
          <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 16, textAlign: 'right' }}>
            {car.brand} {car.model}
          </Text>
          <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right' }}>
            {car.year} • {FUEL_TYPE_LABELS[car.fuelType]}
          </Text>
          <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right' }}>
            {formatMileage(car.mileage)} • {car.location}
          </Text>
          <Text style={{ color: '#D4A843', fontWeight: '700', fontSize: 16, textAlign: 'right' }}>
            {formatILS(car.price)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Action row */}
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
        <TouchableOpacity
          onPress={onToggleCompare}
          accessibilityLabel={isSelected ? 'הסר מהשוואה' : 'הוסף להשוואה'}
          style={{
            flex: 1, padding: 10, alignItems: 'center',
            borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)',
            backgroundColor: isSelected ? 'rgba(212,168,67,0.1)' : 'transparent',
          }}
        >
          <Text style={{ fontSize: 12, color: isSelected ? '#D4A843' : '#888', fontWeight: isSelected ? '700' : '400' }}>
            {isSelected ? '✓ השווה' : 'השווה'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onMessage(car.id)}
          accessibilityLabel="שלח הודעה למוכר"
          style={{ flex: 1, padding: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' }}
        >
          <Text style={{ fontSize: 12, color: '#888' }}>💬 הודעה</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRemove}
          accessibilityLabel="הסר ממועדפים"
          style={{ flex: 1, padding: 10, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 12, color: '#F44336' }}>✕ הסר</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
