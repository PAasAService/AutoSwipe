import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { GUIDE_ITEMS, GuideBlock } from '../../src/data/recommended'

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
  const router = useRouter()

  const guide = GUIDE_ITEMS.find((g) => g.id === id)

  if (!guide || !guide.content) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#666', fontSize: 16 }}>המדריך לא נמצא</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#D4A843', fontSize: 14 }}>חזור</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  async function handleShare() {
    try {
      await Share.share({ message: `${guide!.title}\n${guide!.subtitle}` })
    } catch {}
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
      }}>
        <TouchableOpacity onPress={handleShare} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ fontSize: 20 }}>🔗</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ color: '#D4A843', fontSize: 15, fontWeight: '600' }}>{'< חזור'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
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
