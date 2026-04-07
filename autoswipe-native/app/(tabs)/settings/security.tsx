import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Toast from 'react-native-toast-message'
import { api } from '../../../src/lib/api'

export default function SecurityScreen() {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    if (!current || !next || !confirm) { setError('נא למלא את כל השדות'); return }
    if (next.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    if (next !== confirm) { setError('הסיסמאות אינן תואמות'); return }

    setLoading(true)
    try {
      await api.put('/api/users/me', { currentPassword: current, newPassword: next })
      Toast.show({ type: 'success', text1: 'הסיסמה עודכנה בהצלחה ✓', visibilityTime: 2000 })
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון הסיסמה')
    } finally {
      setLoading(false)
    }
  }

  const input = (value: string, onChange: (v: string) => void, placeholder: string, secure = false) => (
    <TextInput
      value={value} onChangeText={onChange}
      placeholder={placeholder} placeholderTextColor="#555"
      secureTextEntry={secure} textAlign="right"
      style={{
        backgroundColor: '#1A1A1A', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
        padding: 16, color: '#F5F5F5', fontSize: 16, marginBottom: 12,
      }}
    />
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#D4A843', fontSize: 16 }}>סגור</Text>
          </TouchableOpacity>
          <Text style={{ color: '#F5F5F5', fontSize: 20, fontWeight: '700' }}>אבטחה ופרטיות</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: '#888', fontSize: 14, textAlign: 'right', marginBottom: 20 }}>
            לשינוי הסיסמה נדרש אימות הסיסמה הנוכחית
          </Text>

          {input(current, setCurrent, 'סיסמה נוכחית', true)}
          {input(next, setNext, 'סיסמה חדשה (לפחות 6 תווים)', true)}
          {input(confirm, setConfirm, 'אימות סיסמה חדשה', true)}

          {!!error && (
            <Text style={{ color: '#F44336', textAlign: 'center', marginBottom: 12 }}>{error}</Text>
          )}

          <TouchableOpacity
            onPress={handleSave} disabled={loading}
            style={{
              backgroundColor: '#D4A843', borderRadius: 12,
              padding: 16, alignItems: 'center', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator color="#0F0F0F" />
              : <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>שמור סיסמה</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
