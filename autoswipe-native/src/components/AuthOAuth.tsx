import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import * as AppleAuthentication from 'expo-apple-authentication'
import { exchangeOAuthToken } from '../lib/oauth-exchange'
import { track } from '../lib/analytics'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_WEB =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
  ''
const GOOGLE_IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || GOOGLE_WEB
const GOOGLE_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || GOOGLE_WEB

/** True when Expo has at least one client id for the current platform (WEB id counts for iOS/Android via fallback). */
function isGoogleOAuthConfigured(): boolean {
  if (Platform.OS === 'ios') return Boolean(GOOGLE_IOS)
  if (Platform.OS === 'android') return Boolean(GOOGLE_ANDROID)
  return Boolean(GOOGLE_WEB)
}

export type AuthOAuthFlow = 'login' | 'signup'

type Props = {
  flow: AuthOAuthFlow
  disabled?: boolean
  onError: (message: string) => void
  onSignedIn: (user: { isOnboarded?: boolean }) => void
}

function GoogleOAuthButton({
  flow,
  disabled,
  onError,
  onSignedIn,
}: Omit<Props, 'flow'> & { flow: AuthOAuthFlow }) {
  const handledNonce = useRef<string | null>(null)
  const [busy, setBusy] = useState(false)
  const onErrorRef = useRef(onError)
  const onSignedInRef = useRef(onSignedIn)
  onErrorRef.current = onError
  onSignedInRef.current = onSignedIn

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB || undefined,
    iosClientId: GOOGLE_IOS || undefined,
    androidClientId: GOOGLE_ANDROID || undefined,
    clientId: GOOGLE_WEB || undefined,
  })

  useEffect(() => {
    if (!response) return
    if (response.type === 'dismiss' || response.type === 'cancel') {
      setBusy(false)
      return
    }
    if (response.type === 'error') {
      setBusy(false)
      onErrorRef.current(response.error?.message || 'שגיאת Google')
      return
    }
    if (response.type !== 'success') return

    const idToken =
      (typeof response.params?.id_token === 'string' && response.params.id_token) ||
      (response.authentication as { idToken?: string } | undefined)?.idToken
    if (!idToken) {
      setBusy(false)
      onErrorRef.current('Google לא החזיר אסימון. נסה שוב.')
      return
    }

    const mark = idToken.slice(0, 48)
    if (handledNonce.current === mark) return
    handledNonce.current = mark

    void (async () => {
      try {
        const { user } = await exchangeOAuthToken('google', idToken)
        track(flow === 'signup' ? 'signup' : 'login', { method: 'google' })
        onSignedInRef.current(user)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'שגיאה בהתחברות עם Google'
        onErrorRef.current(msg)
      } finally {
        setBusy(false)
        handledNonce.current = null
      }
    })()
  }, [response, flow])

  async function onPress() {
    if (disabled || busy) return
    if (!request) {
      onErrorRef.current('Google עדיין נטען — נסה שוב בעוד רגע')
      return
    }
    setBusy(true)
    try {
      const result = await promptAsync()
      if (result.type !== 'success') setBusy(false)
    } catch (e: unknown) {
      setBusy(false)
      onErrorRef.current(e instanceof Error ? e.message : 'שגיאה בפתיחת Google')
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || busy || !request}
      style={[styles.oauthBtn, styles.googleBtn, (disabled || busy) && styles.oauthBtnDimmed]}
      activeOpacity={0.85}
    >
      {busy ? (
        <ActivityIndicator color="#0F0F0F" />
      ) : (
        <Text style={styles.googleBtnText}>Google — המשך</Text>
      )}
    </TouchableOpacity>
  )
}

function GoogleOAuthUnconfiguredHint() {
  return (
    <TouchableOpacity
      onPress={() =>
        Alert.alert(
          'Google Sign-In',
          'כמו Apple: צריך מפתחות OAuth בשני הצדדים.\n\n' +
            '• autoswipe-native/.env — EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (חובה), ו־EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID לבניית iOS native.\n' +
            '• autoswipe/.env — GOOGLE_CLIENT_ID עם כל מזהי הלקוח שהטוקן עשוי להשתמש בהם (מופרדים בפסיק), כולל Web ו־iOS.\n\n' +
            'אחרי שמירה: הפעל מחדש Metro ואת Next.',
          [{ text: 'אישור' }],
        )
      }
      style={[styles.oauthBtn, styles.googleBtn, { borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' }]}
      activeOpacity={0.85}
    >
      <Text style={styles.googleBtnText}>Google — נדרש מפתח ב־.env</Text>
    </TouchableOpacity>
  )
}

function AppleOAuthButton({
  flow,
  disabled,
  onError,
  onSignedIn,
}: Omit<Props, 'flow'> & { flow: AuthOAuthFlow }) {
  const [busy, setBusy] = useState(false)
  const onErrorRef = useRef(onError)
  const onSignedInRef = useRef(onSignedIn)
  onErrorRef.current = onError
  onSignedInRef.current = onSignedIn

  async function onPress() {
    if (disabled || busy) return
    setBusy(true)
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      const idToken = credential.identityToken
      if (!idToken) throw new Error('Apple לא החזיר אסימון')
      const { user } = await exchangeOAuthToken('apple', idToken)
      track(flow === 'signup' ? 'signup' : 'login', { method: 'apple' })
      onSignedInRef.current(user)
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code?: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        /* user dismissed */
      } else {
        onErrorRef.current(e instanceof Error ? e.message : 'שגיאה בהתחברות עם Apple')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || busy}
      style={[styles.oauthBtn, styles.appleBtn, (disabled || busy) && styles.oauthBtnDimmed]}
      activeOpacity={0.85}
    >
      {busy ? (
        <ActivityIndicator color="#F5F5F5" />
      ) : (
        <Text style={styles.appleBtnText}>Apple — המשך</Text>
      )}
    </TouchableOpacity>
  )
}

export function AuthOAuthRow({ flow, disabled, onError, onSignedIn }: Props) {
  const [appleAvailable, setAppleAvailable] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable)
  }, [])

  const googleConfigured = isGoogleOAuthConfigured()
  const showGoogleRow =
    Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web'

  return (
    <View style={styles.row}>
      {showGoogleRow &&
        (googleConfigured ? (
          <GoogleOAuthButton
            flow={flow}
            disabled={disabled}
            onError={onError}
            onSignedIn={onSignedIn}
          />
        ) : (
          <GoogleOAuthUnconfiguredHint />
        ))}
      {Platform.OS === 'ios' && appleAvailable && (
        <AppleOAuthButton
          flow={flow}
          disabled={disabled}
          onError={onError}
          onSignedIn={onSignedIn}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { gap: 10 },
  oauthBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  oauthBtnDimmed: { opacity: 0.65 },
  googleBtn: { backgroundColor: '#F5F5F5' },
  googleBtnText: { color: '#0F0F0F', fontSize: 15, fontWeight: '700' },
  appleBtn: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  appleBtnText: { color: '#F5F5F5', fontSize: 15, fontWeight: '700' },
})
