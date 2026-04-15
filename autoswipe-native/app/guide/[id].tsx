import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { goBackSafeWithReturn } from '../../src/lib/go-back-safe'
import { useReturnTo } from '../../src/hooks/useReturnTo'
import { ScreenHeader } from '../../src/components/ui/ScreenHeader'
import ShareButton from '../../src/components/ui/ShareButton'
import { SCREEN_EDGE } from '../../src/constants/layout'
import { GUIDE_ITEMS, GuideBlock } from '../../src/data/recommended'
import { SCREEN_HEADER_BORDER } from '../../src/constants/layout'
import { BACK_ICON_ONLY, BACK_ICON_ONLY_SIZE } from '../../src/constants/ui'

/**
 * Build guide share message, handling optional subtitle safely.
 * If subtitle is missing/null/empty, only include title.
 * Otherwise, include title and subtitle on separate lines.
 */
function buildGuideShareMessage(title: string, subtitle?: string | null): string {
  if (!subtitle || subtitle.trim() === '') {
    return title
  }
  return `${title}\n${subtitle}`
}

function BlockRenderer({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <Text style={{
          fontSize: 18,
          fontWeight: '800',
          color: '#F5F5F5',
          textAlign: 'right',
          marginTop: 20,
          marginBottom: 8,
          lineHeight: 26,
        }}>
          {block.text}
        </Text>
      )

    case 'subheading':
      return (
        <Text style={{
          fontSize: 14,
          fontWeight: '700',
          color: '#D4A843',
          textAlign: 'right',
          marginTop: 14,
          marginBottom: 6,
        }}>
          {block.text}
        </Text>
      )

    case 'paragraph':
      return (
        <Text style={{
          fontSize: 15,
          color: '#C8C8C8',
          textAlign: 'right',
          lineHeight: 24,
          marginBottom: 10,
        }}>
          {block.text}
        </Text>
      )

    case 'tip':
      return (
        <View style={{
          backgroundColor: 'rgba(212,168,67,0.1)',
          borderRightWidth: 3,
          borderRightColor: '#D4A843',
          borderRadius: 8,
          padding: 12,
          marginVertical: 10,
        }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '800',
            color: '#D4A843',
            textAlign: 'right',
            marginBottom: 4,
          }}>
            💡 טיפ
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#D4A843',
            textAlign: 'right',
            lineHeight: 21,
          }}>
            {block.text}
          </Text>
        </View>
      )

    case 'warning':
      return (
        <View style={{
          backgroundColor: 'rgba(239,68,68,0.08)',
          borderRightWidth: 3,
          borderRightColor: '#EF4444',
          borderRadius: 8,
          padding: 12,
          marginVertical: 10,
        }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '800',
            color: '#EF4444',
            textAlign: 'right',
            marginBottom: 4,
          }}>
            ⚠️ שים לב
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#EF4444',
            textAlign: 'right',
            lineHeight: 21,
          }}>
            {block.text}
          </Text>
        </View>
      )

    case 'list':
      return (
        <View style={{ marginBottom: 10 }}>
          {block.items.map((item, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              marginBottom: 6,
              gap: 8,
            }}>
              <Text style={{ fontSize: 14, color: '#C8C8C8', textAlign: 'right', flex: 1, lineHeight: 21 }}>
                {item}
              </Text>
              <Text style={{ color: '#D4A843', fontSize: 14, marginTop: 3 }}>•</Text>
            </View>
          ))}
        </View>
      )

    case 'numbered':
      return (
        <View style={{ marginBottom: 10 }}>
          {block.items.map((item, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              marginBottom: 8,
              gap: 10,
            }}>
              <Text style={{ fontSize: 14, color: '#C8C8C8', textAlign: 'right', flex: 1, lineHeight: 21 }}>
                {item}
              </Text>
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#1E1E1E',
                borderWidth: 1,
                borderColor: '#D4A843',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 1,
              }}>
                <Text style={{ color: '#D4A843', fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
              </View>
            </View>
          ))}
        </View>
      )

    case 'divider':
      return (
        <View style={{
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.06)',
          marginVertical: 16,
        }} />
      )

    default:
      return null
  }
}

export default function GuideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const returnTo = useReturnTo()
  const insets = useSafeAreaInsets()
  const guide = GUIDE_ITEMS.find((g) => g.id === id)

  if (!guide || !guide.content) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
        <ScreenHeader
          onBack={() => goBackSafeWithReturn(returnTo, '/(tabs)/recommended')}
          backVariant="labeled"
          title="מדריך"
          titleSize={20}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#666', fontSize: 16, writingDirection: 'rtl' }}>המדריך לא נמצא</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
      {/* Custom header: Share on left, Back on right (RTL-correct, part of header structure, not floating) */}
      <View
        style={{
          backgroundColor: '#0F0F0F',
          borderBottomWidth: 1,
          borderBottomColor: SCREEN_HEADER_BORDER,
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Share button: LEFT */}
        <ShareButton
          variant="custom"
          message={buildGuideShareMessage(guide!.title, guide?.subtitle)}
          size={48}
        />

        {/* Back button: RIGHT — styled like BackOverlayCircle (circular dark) but in header, not floating */}
        <TouchableOpacity
          onPress={() => goBackSafeWithReturn(returnTo, '/(tabs)/recommended')}
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SCREEN_EDGE, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Guide hero */}
        <View style={{ alignItems: 'flex-end', marginBottom: 20 }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: '#1A1A1A',
            borderWidth: 1,
            borderColor: 'rgba(212,168,67,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 14,
          }}>
            <Text style={{ fontSize: 32 }}>{guide.emoji}</Text>
          </View>
          <Text style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#F5F5F5',
            textAlign: 'right',
            lineHeight: 30,
            marginBottom: 6,
          }}>
            {guide.title}
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#888',
            textAlign: 'right',
            lineHeight: 19,
            marginBottom: 12,
          }}>
            {guide.subtitle}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Text style={{ color: '#555', fontSize: 12 }}>{guide.readMinutes} דק׳ קריאה</Text>
            <Text style={{ color: '#555', fontSize: 12 }}>•</Text>
            <Text style={{ color: '#555', fontSize: 12 }}>AutoSwipe מדריכים</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />

        {/* Content */}
        {guide.content.map((block, index) => (
          <BlockRenderer key={index} block={block} />
        ))}

        {/* Footer */}
        <View style={{
          marginTop: 32,
          padding: 14,
          backgroundColor: '#141414',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.05)',
        }}>
          <Text style={{ color: '#444', fontSize: 11, textAlign: 'right', lineHeight: 17 }}>
            המידע במדריך זה הוא לצורך הכוונה כללית בלבד ואינו מהווה ייעוץ משפטי, פיננסי או מקצועי. AutoSwipe ממליצה תמיד לבדוק עם אנשי מקצוע לפני קבלת החלטות גדולות.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
