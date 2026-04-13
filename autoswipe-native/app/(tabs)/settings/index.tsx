import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { clearToken } from '../../../src/lib/api'
import { unregisterPushDevice } from '../../../src/lib/unregister-push-device'
import { queryClient } from '../../../src/lib/query-client'
import { useCurrentUser } from '../../../src/hooks/useCurrentUser'

export default function SettingsScreen() {
  const router = useRouter()
  const { data: me } = useCurrentUser()

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
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Profile Header */}
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
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#F5F5F5' }}>{me?.name ?? ''}</Text>
          <Text style={{ color: '#888888', marginTop: 2 }}>{me?.email ?? ''}</Text>
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
        <MenuItem emoji="🎯" label="העדפות חיפוש" onPress={() => router.push('/(tabs)/settings/preferences')} />

        <View style={{ height: 20 }} />

        {/* Account */}
        <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', marginBottom: 8, marginRight: 4 }}>חשבון</Text>
        <MenuItem emoji="✏️" label="ערוך פרופיל" onPress={() => router.push('/profile/edit')} />
        <MenuItem emoji="🔔" label="התראות" onPress={() => router.push('/(tabs)/settings/notifications')} />
        <MenuItem emoji="🔒" label="אבטחה ופרטיות" onPress={() => router.push('/(tabs)/settings/security')} />

        <View style={{ height: 20 }} />

        {/* Activity */}
        <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', marginBottom: 8, marginRight: 4 }}>פעילות</Text>
        <MenuItem emoji="❤️" label="המועדפים שלי" onPress={() => router.push('/(tabs)/favorites')} />
        <MenuItem emoji="🚗" label="המודעות שלי" onPress={() => router.push('/(tabs)/dashboard')} />

        <View style={{ height: 20 }} />

        {/* Legal */}
        <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', marginBottom: 8, marginRight: 4 }}>משפטי וסיוע</Text>
        <MenuItem emoji="📄" label="מדיניות פרטיות" onPress={() => router.push('/legal/privacy')} />
        <MenuItem emoji="📋" label="תנאי שימוש" onPress={() => router.push('/legal/terms')} />
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
