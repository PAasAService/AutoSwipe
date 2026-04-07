import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { getApiBaseUrl } from '../../src/lib/api-base-url'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.trim()) {
      setError('נא להזין כתובת אימייל')
      return
    }
    setLoading(true)
    setError('')
    try {
      await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      // Always show success — prevents email enumeration
      setSent(true)
    } catch {
      setError('שגיאה בשליחה. בדוק את החיבור שלך ונסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successArea}>
          <Text style={{ fontSize: 56, marginBottom: 20 }}>📬</Text>
          <Text style={styles.successTitle}>בדוק את המייל שלך</Text>
          <Text style={styles.successBody}>
            אם הכתובת קיימת במערכת, שלחנו לך קישור לאיפוס הסיסמה. הקישור תקף ל-15 דקות.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>חזרה להתחברות</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0F0F0F' }}
    >
      <SafeAreaView style={{ flex: 1, padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>→ חזרה</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>שכחתי סיסמה</Text>
        <Text style={styles.pageSubtitle}>
          הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה.
        </Text>

        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); setError('') }}
          placeholder="כתובת אימייל"
          placeholderTextColor="#555"
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign="right"
          style={styles.input}
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        >
          {loading
            ? <ActivityIndicator color="#0F0F0F" />
            : <Text style={styles.submitBtnText}>שלח קישור לאיפוס</Text>
          }
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  successArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5F5F5',
    textAlign: 'center',
    marginBottom: 12,
  },
  successBody: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backBtn: {
    backgroundColor: 'rgba(212,168,67,0.12)',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.3)',
  },
  backBtnText: {
    color: '#D4A843',
    fontSize: 16,
    fontWeight: '700',
  },
  backLink: {
    marginBottom: 28,
    paddingVertical: 4,
  },
  backLinkText: {
    color: '#888',
    fontSize: 15,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5F5F5',
    textAlign: 'right',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'right',
    marginBottom: 32,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    color: '#F5F5F5',
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#D4A843',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#0F0F0F',
    fontSize: 16,
    fontWeight: '700',
  },
})
