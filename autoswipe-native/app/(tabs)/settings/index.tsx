import { useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { hrefWithReturn } from '../../../src/lib/go-back-safe'
import { getSettingsScrollY, rememberSettingsScrollY } from '../../../src/lib/settings-scroll-memory'
import { clearToken } from '../../../src/lib/api'
import { unregisterPushDevice } from '../../../src/lib/unregister-push-device'
import { queryClient } from '../../../src/lib/query-client'
import { useCurrentUser } from '../../../src/hooks/useCurrentUser'

export default function SettingsScreen() {
  const router = useRouter()
  const { data: me } = useCurrentUser()
  const scrollRef = useRef<ScrollView>(null)
  const scrollYRef = useRef(0)

  useFocusEffect(
    useCallback(() => {
      const y = getSettingsScrollY()
      const id = requestAnimationFrame(() => {
        if (y > 0) scrollRef.current?.scrollTo({ y, animated: false })
      })
      return () => {
        cancelAnimationFrame(id)
        rememberSettingsScrollY(scrollYRef.current)
      }
    }, []),
  )

  async function handleLogout() {
    Alert.alert('התנתקות', 'האם אתה בטוח שברצונך להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק',
        style: 'destructive',
        onPress: async () => {
          await unregisterPushDevice()
          await clearToken()
          queryClient.clear()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const roles: string[] = me?.roles
    ? typeof me.roles === 'string'
      ? JSON.parse(me.roles)
      : me.roles
    : []

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20 }}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y
        }}
        scrollEventThrottle={100}
      >

        {/* Profile header — name is display name (editable under ערוך פרופיל) */}
        <View style={{
          backgroundColor: '#1A1A1A',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          alignItems: 'flex-end',
        }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: '#D4A843',
            justifyContent: 'center', alignItems: 'center',
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F0F0F' }}>
              {me?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={{ color: '#888888', fontSize: 12, marginBottom: 2 }}>שם תצוגה</Text>
          <Text style={{ color: '#555555', fontSize: 11, marginBottom: 4, textAlign: 'right' }}>ייחודי במערכת</Text>
          <TouchableOpacity
            onPress={() => router.push(hrefWithReturn('/profile/edit', 'settings'))}
            accessibilityRole="button"
            accessibilityLabel="ערוך שם תצוגה"
            hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>{me?.name?.trim() || '—'}</Text>
            <Text style={{ color: '#D4A843', fontSize: 13, marginTop: 4, textAlign: 'right' }}>עריכה ›</Text>
          </TouchableOpacity>
          <Text style={{ color: '#888888', marginTop: 10, fontSize: 12 }}>אימייל</Text>
          <Text style={{ color: '#AAAAAA', marginTop: 2, fontSize: 15 }}>{me?.email ?? ''}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {roles.includes('BUYER') && (
              <View style={{ backgroundColor: 'rgba(212,168,67,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)' }}>
                <Text style={{ color: '#D4A843', fontSize: 13, fontWeight: '600' }}>קונה</Text>
              </View>
            )}
            {roles.includes('SELLER') && (
              <View style={{ backgroundColor: 'rgba(212,168,67,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)' }}>
                <Text style={{ color: '#D4A843', fontSize: 13, fontWeight: '600' }}>מוכר</Text>
              </View>
            )}
          </View>
        </View>

        {/* Search Preferences */}
        <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', marginBottom: 8, marginRight: 4 }}>העדפות חיפוש</Text>
        <MenuItem emoji="🎯" label="העדפות חיפוש" onPress={() => router.push(hrefWithReturn('/(tabs)/settings/preferences', 'settings'))} />

        <View style={{ height: 20 }} />

        {/* Account */}
        <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', marginBottom: 8, marginRight: 4 }}>חשבון</Text>
        <MenuItem emoji="✏️" label="שם תצוגה, טלפון ועוד" onPress={() => router.push(hrefWithReturn('/profile/edit', 'settings'))} />
        <MenuItem emoji="📥" label="כל ההתראות" onPress={() => router.push(hrefWithReturn('/notifications', 'settings'))} />
        <MenuItem emoji="🔔" label="הגדרות התראות" onPress={() => router.push(hrefWithReturn('/(tabs)/settings/notifications', 'settings'))} />
        <MenuItem emoji="🔒" label="אבטחה ופרטיות" onPress={() => router.push(hrefWithReturn('/(tabs)/settings/security', 'settings'))} />

        <View style={{ height: 20 }} />

        {/* Activity */}
        <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', marginBottom: 8, marginRight: 4 }}>פעילות</Text>
        <MenuItem
          emoji="❤️"
          label="המועדפים שלי"
          onPress={() => router.push(hrefWithReturn('/(tabs)/favorites', 'settings'))}
        />
        <MenuItem emoji="🚗" label="המודעות שלי" onPress={() => router.push(hrefWithReturn('/(tabs)/dashboard', 'settings'))} />

        <View style={{ height: 20 }} />

        {/* Legal */}
        <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', marginBottom: 8, marginRight: 4 }}>משפטי וסיוע</Text>
        <MenuItem emoji="📄" label="מדיניות פרטיות" onPress={() => router.push(hrefWithReturn('/legal/privacy', 'settings'))} />
        <MenuItem emoji="📋" label="תנאי שימוש" onPress={() => router.push(hrefWithReturn('/legal/terms', 'settings'))} />
        <MenuItem
          emoji="🆘"
          label="שירות לקוחות ועזרה"
          onPress={() =>
            Alert.alert('שירות לקוחות', 'לכל שאלה או בעיה שלחו מייל ל:\nsupport@autoswipe.co.il', [{ text: 'סגור' }])
          }
        />
        <MenuItem
          emoji="🚩"
          label="דיווח על תוכן לא הולם"
          onPress={() =>
            Alert.alert('דיווח', 'לדיווח על תוכן פוגעני שלחו מייל ל:\nreport@autoswipe.co.il', [{ text: 'סגור' }])
          }
        />

        <View style={{ height: 24 }} />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            padding: 16,
            backgroundColor: 'rgba(244,67,54,0.1)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(244,67,54,0.3)',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#F44336', fontSize: 16, fontWeight: '600' }}>🚪 התנתקות</Text>
        </TouchableOpacity>

        <Text style={{ color: '#444', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          AutoSwipe v1.0.0 · כל הזכויות שמורות
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function MenuItem({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: '#888888', fontSize: 18 }}>‹</Text>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Text style={{ color: '#F5F5F5', fontSize: 16 }}>{label}</Text>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
    </TouchableOpacity>
  )
}
