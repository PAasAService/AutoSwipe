import { useRef, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import { useQueryClient } from '@tanstack/react-query'
import { FeedListing, SwipeDirection } from '../../types'
import { useSwipeStore } from '../../store/swipe'
import { api } from '../../lib/api'
import { queryKeys } from '../../lib/query-keys'
import { colors } from '../../lib/theme'
import SwipeCard, { CARD_WIDTH, CARD_HEIGHT } from './SwipeCard'
import { track } from '../../lib/analytics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3
const SUPER_THRESHOLD = -80

interface Props {
  cards: FeedListing[]
  onNearEnd: () => void
  onReset: () => void
}

export default function SwipeDeck({ cards, onNearEnd, onReset }: Props) {
  const { currentIndex, swipe } = useSwipeStore()
  const swipeLockRef = useRef(false)
  const qc = useQueryClient()
  const router = useRouter()

  const position = useRef(new Animated.ValueXY()).current
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  })

  // Overlay opacities for swipe direction indicators
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.5],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.5, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })
  const superOpacity = position.y.interpolate({
    inputRange: [SUPER_THRESHOLD * 0.5, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const visibleCards = cards.slice(currentIndex, currentIndex + 3)
  const currentCard = cards[currentIndex]

  const triggerSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (swipeLockRef.current || !currentCard) return
      swipeLockRef.current = true

      if (direction === 'RIGHT') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else if (direction === 'LEFT') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } else if (direction === 'SUPER') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }

      // Single write: POST /api/swipes creates Favorite for RIGHT/SUPER. Show success only after
      // the server OKs so an error toast does not replace an optimistic "saved" message.
      void (async () => {
        try {
          await api.post('/api/swipes', {
            listingId: currentCard.id,
            direction,
          })
          if (direction === 'RIGHT') {
            Toast.show({
              type: 'success',
              text1: 'נשמר במועדפים! ❤️',
              visibilityTime: 2200,
            })
            qc.invalidateQueries({ queryKey: queryKeys.favorites() })
          } else if (direction === 'SUPER') {
            Toast.show({
              type: 'success',
              text1: 'סופר לייק! ⭐',
              visibilityTime: 2200,
            })
            qc.invalidateQueries({ queryKey: queryKeys.favorites() })
          }
        } catch (e) {
          Toast.show({
            type: 'error',
            text1: e instanceof Error ? e.message : 'שגיאת שרת',
            visibilityTime: 4000,
          })
        }
      })()

      track('swipe', {
        direction,
        brand: currentCard?.brand ?? '',
        model: currentCard?.model ?? '',
        price: currentCard?.price ?? 0,
      })

      const toX =
        direction === 'RIGHT'
          ? SCREEN_WIDTH * 1.5
          : direction === 'LEFT'
          ? -SCREEN_WIDTH * 1.5
          : 0
      const toY = direction === 'SUPER' ? -800 : 0

      Animated.timing(position, {
        toValue: { x: toX, y: toY },
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        swipe(direction)
        position.setValue({ x: 0, y: 0 })
        swipeLockRef.current = false

        if (cards.length - currentIndex - 1 <= 5) {
          onNearEnd()
        }
      })
    },
    [currentCard, currentIndex, cards.length, swipe, onNearEnd, qc, position]
  )

  // KEY FIX: keep a ref to triggerSwipe so PanResponder always calls the latest version
  const triggerSwipeRef = useRef(triggerSwipe)
  useEffect(() => {
    triggerSwipeRef.current = triggerSwipe
  }, [triggerSwipe])

  // PanResponder created ONCE — uses ref so it always calls current triggerSwipe
  const panResponder = useRef(
    PanResponder.create({
      // Use onMoveShouldSetPanResponder so short taps are NOT captured (allows card tap → detail)
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          triggerSwipeRef.current('RIGHT')
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          triggerSwipeRef.current('LEFT')
        } else if (gesture.dy < SUPER_THRESHOLD && Math.abs(gesture.dx) < SWIPE_THRESHOLD) {
          triggerSwipeRef.current('SUPER')
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  if (visibleCards.length === 0) {
    const noResults = cards.length === 0

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>{noResults ? '🔍' : '🎉'}</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          {noResults ? 'לא נמצאו רכבים' : 'ראית את כל הרכבים!'}
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 15 }}>
          {noResults
            ? 'נסה לעדכן את העדפות החיפוש שלך כדי לראות יותר תוצאות'
            : 'בוא נרענן את הפיד'}
        </Text>
        <TouchableOpacity
          onPress={onReset}
          style={{
            backgroundColor: colors.gold,
            borderRadius: 14,
            paddingHorizontal: 32,
            paddingVertical: 14,
            marginTop: 24,
          }}
        >
          <Text style={{ color: colors.background, fontWeight: '700', fontSize: 16 }}>
            {noResults ? '⚙️ עדכן העדפות' : '🔄 התחל מחדש'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT, marginTop: 8 }}>
        {visibleCards
          .slice()
          .reverse()
          .map((card, reversedIndex) => {
            const stackIndex = visibleCards.length - 1 - reversedIndex
            const isTop = stackIndex === 0
            const scale = 1 - stackIndex * 0.04
            const translateYOffset = stackIndex * 10

            if (isTop) {
              return (
                <Animated.View
                  key={card.id}
                  {...panResponder.panHandlers}
                  style={[
                    {
                      position: 'absolute',
                      width: CARD_WIDTH,
                      height: CARD_HEIGHT,
                    },
                    {
                      transform: [
                        { translateX: position.x },
                        { translateY: position.y },
                        { rotate },
                      ],
                    },
                  ]}
                >
                  <SwipeCard
                    card={card}
                    isTop
                    onPress={() => router.push(`/listing/${card.id}`)}
                  />

                  {/* LIKE overlay */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 24,
                      left: 20,
                      opacity: likeOpacity,
                      borderWidth: 3,
                      borderColor: colors.swipeLike,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      transform: [{ rotate: '-20deg' }],
                    }}
                  >
                    <Text style={{ color: colors.swipeLike, fontSize: 28, fontWeight: '900' }}>❤️ שמור</Text>
                  </Animated.View>

                  {/* NOPE overlay */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 24,
                      right: 20,
                      opacity: nopeOpacity,
                      borderWidth: 3,
                      borderColor: colors.swipeNope,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      transform: [{ rotate: '20deg' }],
                    }}
                  >
                    <Text style={{ color: colors.swipeNope, fontSize: 28, fontWeight: '900' }}>✕ דלג</Text>
                  </Animated.View>

                  {/* SUPER LIKE overlay */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      bottom: 80,
                      alignSelf: 'center',
                      opacity: superOpacity,
                      borderWidth: 3,
                      borderColor: colors.swipeSuper,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: colors.swipeSuper, fontSize: 28, fontWeight: '900' }}>⭐ סופר לייק</Text>
                  </Animated.View>
                </Animated.View>
              )
            }

            return (
              <Animated.View
                key={card.id}
                style={{
                  position: 'absolute',
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: [{ scale }, { translateY: translateYOffset }],
                }}
              >
                <SwipeCard card={card} isTop={false} />
              </Animated.View>
            )
          })}
      </View>

      {/* Action buttons */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
          marginTop: 24,
          paddingBottom: 8,
        }}
      >
        <ActionButton emoji="✕" color={colors.swipeNope} onPress={() => triggerSwipe('LEFT')} size={58} accessibilityLabel="דלג" />
        <ActionButton emoji="⭐" color={colors.swipeSuper} onPress={() => triggerSwipe('SUPER')} size={48} accessibilityLabel="סופר לייק" />
        <ActionButton emoji="❤️" color={colors.swipeLike} onPress={() => triggerSwipe('RIGHT')} size={58} accessibilityLabel="שמור מועדפים" />
      </View>
    </View>
  )
}

function ActionButton({
  emoji,
  color,
  onPress,
  size,
  accessibilityLabel,
}: {
  emoji: string
  color: string
  onPress: () => void
  size: number
  accessibilityLabel?: string
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        backgroundColor: `${color}18`,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <Text style={{ fontSize: size * 0.4 }}>{emoji}</Text>
    </TouchableOpacity>
  )
}
