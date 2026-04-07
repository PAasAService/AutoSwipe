import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { setToken } from '../../src/lib/api'
import { track } from '../../src/lib/analytics'
import { getApiBaseUrl } from '../../src/lib/api-base-url'
import { formatApiNetworkError, isConnectivityFailure } from '../../src/lib/network-errors'
import { AuthOAuthRow } from '../../src/components/AuthOAuth'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim()) { setError('נא להזין כתובת אימייל'); return }
    if (!password) { setError('נא להזין סיסמה'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'שגיאה בהתחברות')
      await setToken(data.token)
      track('login', { method: 'email' })
      if (data.user?.isOnboarded === false) {
        router.replace('/(onboarding)')
      } else {
        router.replace('/(tabs)/swipe')
      }
    } catch (err: any) {
      if (isConnectivityFailure(err)) {
        setError(formatApiNetworkError(err))
      } else {
        setError(err?.message || 'שגיאה בהתחברות')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleOAuthSignedIn(user: { isOnboarded?: boolean }) {
    if (user.isOnboarded === false) {
      router.replace('/(onboarding)')
    } else {
      router.replace('/(tabs)/swipe')
    }
  }

  const inputStyle = {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)' as const,
    borderRadius: 12,
    padding: 16,
    paddingLeft: 50,
    color: '#F5F5F5' as const,
    fontSize: 16,
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0F0F0F' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 52 }}>
          <Text style={{ fontSize: 52 }}>🚗</Text>
          <Text style={{ fontSize: 36, fontWeight: '800', color: '#D4A843', marginTop: 12 }}>AutoSwipe</Text>
          <Text style={{ fontSize: 16, color: '#888888', marginTop: 6 }}>ברוך הבא בחזרה</Text>
          <Text style={{ fontSize: 14, color: '#555', marginTop: 2 }}>התחבר לחשבון שלך</Text>
        </View>

        {/* Form */}
        <View style={{ gap: 14 }}>
          <TextInput
            value={email}
            onChangeText={(t) => { setEmail(t); setError('') }}
            placeholder="כתובת אימייל"
            placeholderTextColor="#555"
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
            style={{ ...inputStyle, paddingLeft: 16 }}
          />

          {/* Password with show/hide */}
          <View style={{ position: 'relative' }}>
            <TextInput
              value={password}
              onChangeText={(t) => { setPassword(t); setError('') }}
              placeholder="סיסמה"
              placeholderTextColor="#555"
              secureTextEntry={!showPassword}
              textAlign="right"
              style={inputStyle}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute',
                left: 14,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>
                {showPassword ? 'הסתר' : 'הצג'}
              </Text>
            </TouchableOpacity>
          </View>

          {!!error && (
            <Text style={{ color: '#F44336', textAlign: 'center', fontSize: 14 }}>{error}</Text>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: '#D4A843', borderRadius: 14, padding: 16,
              alignItems: 'center', marginTop: 4, opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator color="#0F0F0F" />
              : <Text style={{ color: '#0F0F0F', fontSize: 16, fontWeight: '700' }}>התחבר</Text>
            }
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <Text style={{ color: '#555', fontSize: 13 }}>או</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </View>

          <AuthOAuthRow
            flow="login"
            disabled={loading}
            onError={setError}
            onSignedIn={handleOAuthSignedIn}
          />

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={{ alignItems: 'center' }}
          >
            <Text style={{ color: '#888', fontSize: 13 }}>שכחתי סיסמה</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            style={{ alignItems: 'center' }}
          >
            <Text style={{ color: '#888888', fontSize: 14 }}>
              עוד אין לי חשבון?{' '}
              <Text style={{ color: '#D4A843', fontWeight: '600' }}>הרשמה</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
