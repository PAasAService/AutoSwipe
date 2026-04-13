import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { AuthOAuthRow } from '../../src/components/AuthOAuth'
import { queryClient } from '../../src/lib/query-client'
import { queryKeys } from '../../src/lib/query-keys'

export default function GateScreen() {
  const router = useRouter()
  const [oauthError, setOauthError] = useState('')

  function handleOAuthSignedIn(payload: { isOnboarded?: boolean; created: boolean }) {
    queryClient.removeQueries({ queryKey: queryKeys.me() })
    if (payload.isOnboarded === false) {
      router.replace('/(onboarding)')
    } else {
      router.replace('/(tabs)/swipe')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
          <Text style={{ fontSize: 52 }}>🚗</Text>
        </View>
        <Text style={styles.logoText}>AutoSwipe</Text>
        <Text style={styles.slogan}>מצא את הרכב הבא שלך בסוואיפ</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonsArea}>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup')}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>הרשמה — זה בחינם ←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>כבר רשום? התחבר</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <Text style={{ color: '#555', fontSize: 13 }}>או</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        </View>

        <View style={{ marginTop: 14 }}>
          <AuthOAuthRow
            flow="login"
            onError={(msg) => setOauthError(msg)}
            onSignedIn={handleOAuthSignedIn}
          />
        </View>

        {!!oauthError && (
          <Text style={{ color: '#F44336', textAlign: 'center', fontSize: 13, marginTop: 12 }}>
            {oauthError}
          </Text>
        )}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>מעל 10,000 רכבים ממתינים לך</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 72,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(212,168,67,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(212,168,67,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#D4A843',
    letterSpacing: -0.5,
  },
  slogan: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsArea: {
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: '#D4A843',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#D4A843',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#0F0F0F',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryBtnText: {
    color: '#F5F5F5',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    color: '#444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 40,
  },
})
