import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, PanResponder,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CAROUSEL_SEEN_KEY = 'autoswipe_carousel_seen'

const SLIDES = [
  {
    id: 'discover',
    title: 'גלה את הרכב הבא שלך',
    subtitle: 'סוויפ ימינה על רכבים שאהבת, שמאלה על מה שלא. פשוט כמו שזה נשמע.',
  },
  {
    id: 'compare',
    title: 'השווה ותחליט בחכמה',
    subtitle: "שמור רכבים שאהבת והשווה אותם — מחיר, עלות חודשית, קילומטרז' וכל מה שחשוב לך.",
  },
  {
    id: 'connect',
    title: 'דבר ישירות עם המוכר',
    subtitle: 'אהבת רכב? שלח הודעה למוכר ישירות מהאפליקציה — בלי טלפונים, בלי בלגן.',
  },
]

function DiscoverIllustration() {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative' }}>
        <View style={styles.bigCard}>
          <Text style={{ fontSize: 60 }}>🚗</Text>
          <Text style={{ color: '#D4A843', fontSize: 13, fontWeight: '700', marginTop: 6 }}>Toyota Corolla</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>₪89,000 · 2021</Text>
        </View>
        <View style={styles.heartBadge}>
          <Text style={{ fontSize: 26 }}>❤️</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <Text style={{ color: '#F44336', fontSize: 22 }}>✕</Text>
        <Text style={{ color: '#555', fontSize: 13 }}>החלק</Text>
        <Text style={{ color: '#4CAF50', fontSize: 22 }}>♥</Text>
      </View>
    </View>
  )
}

function CompareIllustration() {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[styles.miniCard, { borderColor: '#4CAF50' }]}>
          <Text style={{ fontSize: 34 }}>🚗</Text>
          <View style={{ gap: 5, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12 }}>✅</Text>
              <Text style={{ color: '#888', fontSize: 11 }}>מחיר</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12 }}>✅</Text>
              <Text style={{ color: '#888', fontSize: 11 }}>קילומטרז'</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12 }}>❌</Text>
              <Text style={{ color: '#888', fontSize: 11 }}>שנה</Text>
            </View>
          </View>
        </View>
        <View style={[styles.miniCard, { borderColor: '#FF5722' }]}>
          <Text style={{ fontSize: 34 }}>🚙</Text>
          <View style={{ gap: 5, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12 }}>❌</Text>
              <Text style={{ color: '#888', fontSize: 11 }}>מחיר</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12 }}>✅</Text>
              <Text style={{ color: '#888', fontSize: 11 }}>קילומטרז'</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12 }}>✅</Text>
              <Text style={{ color: '#888', fontSize: 11 }}>שנה</Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={{ color: '#D4A843', fontSize: 13, fontWeight: '600', marginTop: 14 }}>⚖️ השוואה חכמה</Text>
    </View>
  )
}

function ConnectIllustration() {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.bigCard, { marginBottom: 0 }]}>
        <Text style={{ fontSize: 48 }}>🚗</Text>
      </View>
      <View style={{ gap: 8, marginTop: 16, width: 220 }}>
        <View style={[styles.chatBubble, { alignSelf: 'flex-end', backgroundColor: '#D4A843' }]}>
          <Text style={{ color: '#0F0F0F', fontSize: 13, fontWeight: '600' }}>אפשר לקבל פרטים? 🙋</Text>
        </View>
        <View style={[styles.chatBubble, { alignSelf: 'flex-start', backgroundColor: '#2A2A2A' }]}>
          <Text style={{ color: '#F5F5F5', fontSize: 13 }}>בשמחה! מתי נוח לך? 📱</Text>
        </View>
      </View>
    </View>
  )
}

function Illustration({ id }: { id: string }) {
  if (id === 'discover') return <DiscoverIllustration />
  if (id === 'compare') return <CompareIllustration />
  return <ConnectIllustration />
}

export default function CarouselScreen() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)

  async function markSeenAndNavigate(path: string) {
    await AsyncStorage.setItem(CAROUSEL_SEEN_KEY, 'true')
    router.replace(path as any)
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (g.dx < -50 && currentIndex < SLIDES.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else if (g.dx > 50 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1)
      }
    },
  })

  const slide = SLIDES[currentIndex]
  const isLast = currentIndex === SLIDES.length - 1

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => markSeenAndNavigate('/(auth)/gate')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>דלג</Text>
        </TouchableOpacity>
      </View>

      {/* Slide content — swipeable area */}
      <View
        style={styles.slideArea}
        {...panResponder.panHandlers}
      >
        <Illustration id={slide.id} />

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      {/* Navigation dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setCurrentIndex(i)}>
            <View
              style={[
                styles.dot,
                {
                  width: i === currentIndex ? 28 : 8,
                  backgroundColor:
                    i === currentIndex
                      ? '#D4A843'
                      : i < currentIndex
                      ? 'rgba(212,168,67,0.4)'
                      : '#333',
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.buttonsArea}>
        {isLast ? (
          <>
            <TouchableOpacity
              onPress={() => markSeenAndNavigate('/(auth)/gate')}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>בואו נתחיל ←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => markSeenAndNavigate('/(auth)/login')}
              style={styles.secondaryLink}
            >
              <Text style={styles.secondaryLinkText}>כבר יש לי חשבון — התחבר</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={() => setCurrentIndex((i) => i + 1)}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>הבא ←</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipText: {
    color: '#555',
    fontSize: 15,
  },
  slideArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5F5F5',
    textAlign: 'center',
    marginTop: 36,
    marginBottom: 14,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonsArea: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#D4A843',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0F0F0F',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryLinkText: {
    color: '#888',
    fontSize: 14,
  },
  bigCard: {
    width: 150,
    height: 120,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(212,168,67,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A843',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  heartBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#1A1A1A',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  miniCard: {
    width: 120,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
  },
  chatBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: 200,
  },
})
