import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { goBackSafe } from '../../src/lib/go-back-safe'
import { getApiBaseUrl } from '../../src/lib/api-base-url'
import { ScreenHeader } from '../../src/components/ui/ScreenHeader'
import { SCREEN_EDGE } from '../../src/constants/layout'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const raw = useLocalSearchParams<{ token?: string | string[] }>().token
  const token = Array.isArray(raw) ? raw[0] : raw ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    setError('')
    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError('הסיסמה חייבת להכיל לפחות אות גדולה אחת')
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('הסיסמה חייבת להכיל לפחות ספרה אחת')
      return
    }
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'שגיאת שרת')
        return
      }
      setDone(true)
      setTimeout(() => router.replace('/(auth)/login'), 2500)
    } catch {
      setError('שגיאת חיבור')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
        <ScreenHeader
          onBack={() => goBackSafe('/(auth)/login')}
          backVariant="labeled"
          backLabel="חזרה"
          title="איפוס סיסמה"
          titleSize={20}
        />
        <View style={{ paddingHorizontal: SCREEN_EDGE, paddingTop: 16 }}>
          <Text style={styles.errorText}>קישור לא תקף או פג תוקף</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/forgot-password')} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>בקש קישור חדש</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>הסיסמה אופסה בהצלחה</Text>
        <Text style={styles.successBody}>מועבר להתחברות…</Text>
      </SafeAreaView>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0F0F0F' }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
        <ScreenHeader
          onBack={() => goBackSafe('/(auth)/login')}
          backVariant="labeled"
          backLabel="חזרה"
          title="איפוס סיסמה"
          titleSize={22}
        />
        <View style={{ flex: 1, paddingHorizontal: SCREEN_EDGE, paddingTop: 16 }}>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.label}>סיסמה חדשה</Text>
        <TextInput
          value={password}
          onChangeText={(t) => { setPassword(t); setError('') }}
          placeholder="לפחות 8 תווים, אות גדולה ומספר"
          placeholderTextColor="#555"
          secureTextEntry
          textAlign="right"
          style={styles.input}
        />

        <Text style={styles.label}>אימות סיסמה</Text>
        <TextInput
          value={confirm}
          onChangeText={(t) => { setConfirm(t); setError('') }}
          placeholder="הזן שוב"
          placeholderTextColor="#555"
          secureTextEntry
          textAlign="right"
          style={styles.input}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        >
          {loading ? <ActivityIndicator color="#0F0F0F" /> : <Text style={styles.submitBtnText}>אפס סיסמה</Text>}
        </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  label: { color: '#888', fontSize: 13, textAlign: 'right', marginBottom: 6, marginTop: 12, writingDirection: 'rtl' },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 14,
    color: '#F5F5F5',
    fontSize: 16,
  },
  submitBtn: {
    marginTop: 28,
    backgroundColor: '#D4A843',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnText: { color: '#0F0F0F', fontWeight: '800', fontSize: 16 },
  errorText: { color: '#F44336', textAlign: 'center', marginBottom: 12, fontSize: 14 },
  successEmoji: { fontSize: 56, textAlign: 'center', marginTop: 40 },
  successTitle: { color: '#F5F5F5', fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  successBody: { color: '#888', textAlign: 'center', marginTop: 8 },
  linkBtn: { marginTop: 24, alignSelf: 'center' },
  linkBtnText: { color: '#D4A843', fontSize: 16 },
})
