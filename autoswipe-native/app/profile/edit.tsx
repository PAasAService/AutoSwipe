import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { getToken } from '../../src/lib/api'
import { queryClient } from '../../src/lib/query-client'
import { getApiBaseUrl } from '../../src/lib/api-base-url'

export default function EditProfileScreen() {
  const router = useRouter()
  const { data: me } = useCurrentUser()

  const [name, setName] = useState(me?.name ?? '')
  const [phone, setPhone] = useState(me?.phone ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('שגיאה', 'שם מלא הוא שדה חובה')
      return
    }
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${getApiBaseUrl()}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      })

      const json = await res.json()

      if (!res.ok) {
        Alert.alert('שגיאה', json.error ?? 'שגיאת שרת')
        return
      }

      // Invalidate the current user cache so it refreshes
      await queryClient.invalidateQueries({ queryKey: ['me'] })

      Alert.alert('בוצע', 'הפרופיל עודכן בהצלחה', [
        { text: 'אישור', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('שגיאה', 'שגיאת חיבור. בדוק את החיבור לאינטרנט.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#D4A843', fontSize: 16 }}>ביטול</Text>
        </TouchableOpacity>
        <Text style={{ color: '#F5F5F5', fontSize: 18, fontWeight: '700' }}>ערוך פרופיל</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Name field */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            color: '#888888',
            fontSize: 13,
            textAlign: 'right',
            marginBottom: 8,
          }}>
            שם מלא
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="הכנס שם מלא"
            placeholderTextColor="#555555"
            textAlign="right"
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: '#F5F5F5',
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#2A2A2A',
            }}
          />
        </View>

        {/* Email field (read-only) */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            color: '#888888',
            fontSize: 13,
            textAlign: 'right',
            marginBottom: 8,
          }}>
            אימייל
          </Text>
          <View style={{
            backgroundColor: '#111111',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: '#222222',
          }}>
            <Text style={{ color: '#555555', fontSize: 16, textAlign: 'right' }}>
              {me?.email ?? ''}
            </Text>
          </View>
          <Text style={{ color: '#444444', fontSize: 12, textAlign: 'right', marginTop: 4 }}>
            לא ניתן לשנות כתובת אימייל
          </Text>
        </View>

        {/* Phone field */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            color: '#888888',
            fontSize: 13,
            textAlign: 'right',
            marginBottom: 8,
          }}>
            טלפון
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="050-0000000"
            placeholderTextColor="#555555"
            keyboardType="phone-pad"
            textAlign="right"
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: '#F5F5F5',
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#2A2A2A',
            }}
          />
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#8A6E2A' : '#D4A843',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          {loading && <ActivityIndicator size="small" color="#0F0F0F" />}
          <Text style={{ color: '#0F0F0F', fontSize: 16, fontWeight: '700' }}>
            {loading ? 'שומר...' : 'שמור שינויים'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
