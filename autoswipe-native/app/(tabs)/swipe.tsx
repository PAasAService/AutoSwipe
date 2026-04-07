import { View, Text, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useRecommendations, useResetFeed } from '../../src/hooks/useRecommendations'
import SwipeDeck from '../../src/components/swipe/SwipeDeck'
import Skeleton from '../../src/components/ui/Skeleton'

export default function SwipeScreen() {
  const router = useRouter()
  const { data, isLoading, isError, fetchNextPage, hasNextPage } = useRecommendations()
  const resetFeed = useResetFeed()

  const allCards = data?.pages.flatMap((p) => p.data) ?? []

  if (isLoading) {
    const { width } = Dimensions.get('window')
    const cardW = width - 32
    const cardH = cardW * 1.35
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/explore')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: '#1A1A1A', borderRadius: 10,
                paddingHorizontal: 12, paddingVertical: 7,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: '#888', fontSize: 12 }}>גריד</Text>
              <Text style={{ color: '#888', fontSize: 14 }}>⊞</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#D4A843' }}>AutoSwipe 🔥</Text>
          </View>
          <Text style={{ color: '#888888', textAlign: 'right', marginTop: 2 }}>גלול ימינה לשמור, שמאלה לדלג</Text>
        </View>
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <Skeleton width={cardW} height={cardH} borderRadius={20} />
          <View style={{ marginTop: 20, gap: 10, alignSelf: 'stretch', paddingHorizontal: 16, alignItems: 'flex-end' }}>
            <Skeleton width={190} height={22} borderRadius={8} />
            <Skeleton width={130} height={16} borderRadius={8} />
            <Skeleton width={110} height={30} borderRadius={8} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ color: '#F5F5F5', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
          שגיאה בטעינת הפיד
        </Text>
        <TouchableOpacity
          onPress={resetFeed}
          style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 }}
        >
          <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Toggle to grid view */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/explore')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: '#1A1A1A', borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 7,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Text style={{ color: '#888', fontSize: 12 }}>גריד</Text>
            <Text style={{ color: '#888', fontSize: 14 }}>⊞</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 28, fontWeight: '800', color: '#D4A843' }}>
            AutoSwipe 🔥
          </Text>
        </View>
        <Text style={{ color: '#888888', textAlign: 'right', marginTop: 2 }}>
          גלול ימינה לשמור, שמאלה לדלג
        </Text>
      </View>

      <SwipeDeck
        cards={allCards}
        onNearEnd={() => hasNextPage && fetchNextPage()}
        onReset={resetFeed}
      />
    </SafeAreaView>
  )
}
