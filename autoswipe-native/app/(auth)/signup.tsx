import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setToken } from '../../src/lib/api'
import { track } from '../../src/lib/analytics'
import { getApiBaseUrl } from '../../src/lib/api-base-url'
import { formatApiNetworkError, isConnectivityFailure } from '../../src/lib/network-errors'
import { AuthOAuthRow } from '../../src/components/AuthOAuth'
const DRAFT_KEY = 'autoswipe_signup_draft'

function isValidPhone(phone: string) {
  const stripped = phone.replace(/[-\s]/g, '')
  return /^0(5[0-9]|7[2-9])\d{7}$/.test(stripped)
}

function getPasswordRules(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }
}

const ROLE_OPTIONS = [
  { value: 'BUYER',  emoji: '🛍️', label: 'קונה',  desc: 'אני מחפש לקנות רכב' },
  { value: 'SELLER', emoji: '🚗', label: 'מוכר',  desc: 'יש לי רכב שאני רוצה למכור' },
  { value: 'BOTH',   emoji: '👥', label: 'שניהם', desc: 'אני גם קונה וגם מוכר' },
]

export default function SignupScreen() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)

  // Step 1
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Step 2
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Errors
  const [error, setError] = useState('')
  const [emailExists, setEmailExists] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  const rules = getPasswordRules(password)

  // Restore draft
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return
      try {
        const draft = JSON.parse(raw)
        if (draft.name) setName(draft.name)
        if (draft.email) setEmail(draft.email)
        if (draft.phone) setPhone(draft.phone)
        if (draft.step === 2) setStep(2)
        if (draft.role) setSelectedRole(draft.role)
      } catch { /* ignore */ }
    })
  }, [])

  async function saveDraft(extra: Record<string, unknown> = {}) {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      step,
      ...extra,
    }))
  }

  function advanceToStep2() {
    setError('')
    setPhoneError('')
    setEmailExists(false)

    if (!name.trim()) { setError('נא להזין שם מלא'); return }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('נא להזין כתובת אימייל תקינה'); return
    }
    if (phone && !isValidPhone(phone)) {
      setPhoneError('מספר הטלפון לא תקין (לדוגמה: 050-1234567)'); return
    }
    if (!rules.minLength || !rules.hasUppercase || !rules.hasNumber) {
      setError('הסיסמה לא עומדת בכל הדרישות'); return
    }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }
    if (!agreedToTerms) { setError('יש לאשר את תנאי השימוש כדי להמשיך'); return }

    saveDraft({ step: 2 })
    setStep(2)
  }

  async function handleSignup() {
    if (!selectedRole) { setError('נא לבחור תפקיד'); return }
    setSubmitting(true)
    setError('')
    setEmailExists(false)

    const apiRoles = selectedRole === 'BOTH' ? ['BUYER', 'SELLER'] : [selectedRole]
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      let res: Response
      try {
        res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || undefined,
            password,
            roles: apiRoles,
          }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) { setEmailExists(true); return }
        if (res.status === 429) throw new Error('יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.')
        throw new Error(data.error || data.message || 'שגיאה בהרשמה')
      }
      if (!data.token) throw new Error('שגיאת שרת — נסה שוב')

      await setToken(data.token)
      await AsyncStorage.removeItem(DRAFT_KEY)
      track('signup', { method: 'email', role: selectedRole })

      router.replace({
        pathname: '/(onboarding)',
        params: { role: selectedRole },
      } as any)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('השרת לא מגיב. בדוק שהשרת פועל ושה-IP נכון.')
      } else if (isConnectivityFailure(err)) {
        setError(formatApiNetworkError(err))
      } else {
        setError(err.message || 'משהו השתבש. נסה שוב בעוד רגע.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── STEP 1 ─────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#0F0F0F' }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 28, marginTop: 16 }}>
            <Text style={styles.pageTitle}>יצירת חשבון</Text>
            <Text style={styles.pageSubtitle}>שלב 1 מתוך 2 — פרטים בסיסיים</Text>
          </View>

          <AuthOAuthRow
            flow="signup"
            disabled={submitting}
            onError={setError}
            onSignedIn={(user) => {
              if (user.isOnboarded === false) {
                router.replace('/(onboarding)')
              } else {
                router.replace('/(tabs)/swipe')
              }
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <Text style={{ color: '#555', fontSize: 13 }}>או עם אימייל</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </View>

          <View style={{ gap: 12 }}>
            {/* Name */}
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setError('') }}
              placeholder="שם מלא"
              placeholderTextColor="#555"
              textAlign="right"
              style={styles.input}
            />

            {/* Email */}
            <TextInput
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); setEmailExists(false) }}
              placeholder="כתובת אימייל"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
              style={styles.input}
            />

            {/* Phone */}
            <View>
              <TextInput
                value={phone}
                onChangeText={(t) => { setPhone(t); setPhoneError('') }}
                placeholder="מספר טלפון (לא חובה)"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
                textAlign="right"
                style={[styles.input, !!phoneError && styles.inputError]}
              />
              {!!phoneError && <Text style={styles.fieldError}>{phoneError}</Text>}
            </View>

            {/* Password with live rules */}
            <View>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError('') }}
                  placeholder="סיסמה"
                  placeholderTextColor="#555"
                  secureTextEntry={!showPassword}
                  textAlign="right"
                  style={[styles.input, { paddingLeft: 52 }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeBtnText}>{showPassword ? 'הסתר' : 'הצג'}</Text>
                </TouchableOpacity>
              </View>
              {password.length > 0 && (
                <View style={styles.rulesRow}>
                  <RuleChip ok={rules.minLength} label="8 תווים" />
                  <RuleChip ok={rules.hasUppercase} label="אות גדולה" />
                  <RuleChip ok={rules.hasNumber} label="מספר" />
                </View>
              )}
            </View>

            {/* Confirm password */}
            <View style={{ position: 'relative' }}>
              <TextInput
                value={confirm}
                onChangeText={(t) => { setConfirm(t); setError('') }}
                placeholder="אימות סיסמה"
                placeholderTextColor="#555"
                secureTextEntry={!showConfirm}
                textAlign="right"
                style={[styles.input, { paddingLeft: 52 }]}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeBtnText}>{showConfirm ? 'הסתר' : 'הצג'}</Text>
              </TouchableOpacity>
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              onPress={() => setAgreedToTerms((v) => !v)}
              style={styles.checkboxRow}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Text style={{ color: '#0F0F0F', fontSize: 13, fontWeight: '800' }}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                {'קראתי ואני מסכים ל'}
                <Text style={styles.link}>תנאי השימוש</Text>
                {' ול'}
                <Text style={styles.link}>מדיניות הפרטיות</Text>
              </Text>
            </TouchableOpacity>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity onPress={advanceToStep2} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>הבא ←</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ alignItems: 'center', paddingTop: 4 }}>
              <Text style={{ color: '#888', fontSize: 14 }}>
                כבר יש לי חשבון?{' '}
                <Text style={{ color: '#D4A843', fontWeight: '600' }}>התחבר</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  // ── STEP 2 ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0F0F0F' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => { setStep(1); setError(''); setEmailExists(false) }}
          style={{ marginBottom: 24, marginTop: 8 }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ color: '#888', fontSize: 15 }}>→ חזרה</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>אני כאן בתור...</Text>
        <Text style={styles.pageSubtitle}>שלב 2 מתוך 2 — בחר את התפקיד שלך</Text>

        <View style={{ gap: 14, marginTop: 24 }}>
          {ROLE_OPTIONS.map((opt) => {
            const selected = selectedRole === opt.value
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { setSelectedRole(opt.value); setError(''); setEmailExists(false) }}
                style={[styles.roleCard, selected && styles.roleCardSelected]}
                activeOpacity={0.75}
              >
                <View style={{ alignItems: 'flex-end', flex: 1 }}>
                  <Text style={[styles.roleLabel, selected && { color: '#D4A843' }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.roleDesc}>{opt.desc}</Text>
                </View>
                <Text style={{ fontSize: 40 }}>{opt.emoji}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {emailExists && (
          <View style={styles.emailExistsBanner}>
            <Text style={{ color: '#F5F5F5', fontSize: 14, textAlign: 'center' }}>
              {'כתובת המייל הזו כבר רשומה. '}
              <Text
                style={{ color: '#D4A843', fontWeight: '700', textDecorationLine: 'underline' }}
                onPress={() => router.replace('/(auth)/login')}
              >
                רוצה להתחבר?
              </Text>
            </Text>
          </View>
        )}

        {!!error && !emailExists && (
          <Text style={[styles.errorText, { marginTop: 16 }]}>{error}</Text>
        )}

        <TouchableOpacity
          onPress={handleSignup}
          disabled={submitting || !selectedRole}
          style={[styles.primaryBtn, { marginTop: 24, opacity: submitting || !selectedRole ? 0.55 : 1 }]}
        >
          {submitting
            ? <ActivityIndicator color="#0F0F0F" />
            : <Text style={styles.primaryBtnText}>הירשם ←</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function RuleChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={[ruleStyles.chip, ok ? ruleStyles.chipOk : ruleStyles.chipFail]}>
      <Text style={[ruleStyles.text, ok ? ruleStyles.textOk : ruleStyles.textFail]}>
        {ok ? '✓' : '✕'} {label}
      </Text>
    </View>
  )
}

const ruleStyles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  chipOk: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)' },
  chipFail: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'transparent' },
  text: { fontSize: 12, fontWeight: '600' },
  textOk: { color: '#4CAF50' },
  textFail: { color: '#555' },
})

const styles = StyleSheet.create({
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#F5F5F5', textAlign: 'right' },
  pageSubtitle: { fontSize: 14, color: '#666', textAlign: 'right', marginTop: 4 },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    color: '#F5F5F5',
    fontSize: 16,
  },
  inputError: { borderColor: '#F44336' },
  fieldError: { color: '#F44336', fontSize: 12, textAlign: 'right', marginTop: 4 },
  eyeBtn: { position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeBtnText: { color: '#888', fontSize: 13, fontWeight: '500' },
  rulesRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#D4A843', borderColor: '#D4A843' },
  checkboxLabel: { flex: 1, color: '#888', fontSize: 13, lineHeight: 20, textAlign: 'right' },
  link: { color: '#D4A843', fontWeight: '600' },
  errorText: { color: '#F44336', textAlign: 'center', fontSize: 14 },
  primaryBtn: { backgroundColor: '#D4A843', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#0F0F0F', fontSize: 16, fontWeight: '700' },
  roleCard: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)',
  },
  roleCardSelected: { borderColor: '#D4A843', backgroundColor: 'rgba(212,168,67,0.08)' },
  roleLabel: { color: '#F5F5F5', fontWeight: '800', fontSize: 18, marginBottom: 4 },
  roleDesc: { color: '#888', fontSize: 14 },
  emailExistsBanner: {
    backgroundColor: 'rgba(244,67,54,0.08)', borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.3)', borderRadius: 12, padding: 14, marginTop: 16,
  },
})
