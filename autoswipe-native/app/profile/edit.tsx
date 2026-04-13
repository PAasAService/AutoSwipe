import { useState, useEffect } from 'react'
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
import { goBackSafeWithReturn } from '../../src/lib/go-back-safe'
import { useReturnTo } from '../../src/hooks/useReturnTo'
import { ScreenHeader } from '../../src/components/ui/ScreenHeader'
import { SCREEN_EDGE } from '../../src/constants/layout'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { getToken } from '../../src/lib/api'
import { queryClient } from '../../src/lib/query-client'
import { queryKeys } from '../../src/lib/query-keys'
import {
  USER_DISPLAY_NAME_TAKEN_CODE,
  USER_DISPLAY_NAME_TAKEN_HE,
} from '../../src/lib/user-display-name'
import { getApiBaseUrl } from '../../src/lib/api-base-url'

export default function EditProfileScreen() {
  const returnTo = useReturnTo()
  const { data: me } = useCurrentUser()

  const [name, setName] = useState(me?.name ?? '')
  const [phone, setPhone] = useState(me?.phone ?? '')
  const [loading, setLoading] = useState(false)
  const [nameTaken, setNameTaken] = useState(false)

  useEffect(() => {
    if (me?.name != null) {
      setName(me.name)
      setNameTaken(false)
    }
    setPhone(me?.phone ?? '')
  }, [me?.name, me?.phone])

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('שגיאה', 'שם תצוגה הוא שדה חובה')
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
        if (res.status === 409 && json.code === USER_DISPLAY_NAME_TAKEN_CODE) {
          setNameTaken(true)
          Alert.alert('שם תצוגה תפוס', typeof json.error === 'string' ? json.error : USER_DISPLAY_NAME_TAKEN_HE)
          return
        }
        Alert.alert('שגיאה', json.error ?? json.message ?? 'שגיאת שרת')
        return
      }

      // Invalidate the current user cache so it refreshes
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() })

      Alert.alert('בוצע', 'הפרופיל עודכן בהצלחה', [
        { text: 'אישור', onPress: () => goBackSafeWithReturn(returnTo, '/(tabs)/settings') },
      ])
    } catch {
      Alert.alert('שגיאה', 'שגיאת חיבור. בדוק את החיבור לאינטרנט.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
      <ScreenHeader
        onBack={() => goBackSafeWithReturn(returnTo, '/(tabs)/settings')}
        backVariant="text"
        backLabel="ביטול"
        title="שם תצוגה ופרטים"
        titleSize={18}
      />

      <ScrollView contentContainerStyle={{ padding: SCREEN_EDGE }}>
        {/* Display name — same field as Google/Apple "name" stored on the server */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            color: '#888888',
            fontSize: 13,
            textAlign: 'right',
            marginBottom: 8,
          }}>
            שם תצוגה
          </Text>
          <Text style={{ color: '#555555', fontSize: 12, textAlign: 'right', marginBottom: 10, lineHeight: 18 }}>
            השם חייב להיות ייחודי במערכת. כך תופיע באפליקציה — לא חייב להיות זהה לשם בחשבון Google או Apple.
          </Text>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t)
              setNameTaken(false)
            }}
            placeholder="למשל: יוסי כהן"
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
              borderColor: nameTaken ? '#F44336' : '#2A2A2A',
            }}
          />
          {nameTaken && (
            <Text style={{ color: '#F44336', fontSize: 12, textAlign: 'right', marginTop: 6 }}>
              {USER_DISPLAY_NAME_TAKEN_HE}
            </Text>
          )}
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
