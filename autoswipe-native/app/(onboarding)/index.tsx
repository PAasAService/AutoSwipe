import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Switch, StyleSheet,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../../src/lib/api'
import { VehicleType, FuelType } from '../../src/types'
import {
  VEHICLE_TYPE_LABELS, FUEL_TYPE_LABELS, VEHICLE_TYPES, FUEL_TYPES, CAR_BRANDS,
} from '../../src/constants/cars'
import { ISRAELI_CITIES } from '../../src/constants/cities'
import { formatILS } from '../../src/lib/utils/format'

const ONBOARDING_DRAFT_KEY = 'autoswipe_onboarding_draft'

type Step =
  | 'prefs'
  | 'notifications'
  | 'messaging-mode'
  | 'both-done'

const RADIUS_OPTIONS = [
  { label: '20 ק"מ', value: 20 },
  { label: '50 ק"מ', value: 50 },
  { label: '100 ק"מ', value: 100 },
  { label: 'כל הארץ', value: 9999 },
]
const QUICK_CITIES    = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע']
const QUICK_YEAR_FROM = [2005, 2010, 2015, 2018, 2020]
const QUICK_YEAR_TO   = [2020, 2021, 2022, 2023, 2024, 2025]
const VEHICLE_EMOJIS: Record<VehicleType, string> = {
  SEDAN: '🚗', SUV: '🚙', HATCHBACK: '🚘', COUPE: '🏎️',
  CONVERTIBLE: '🚗', MINIVAN: '🚐', PICKUP: '🛻', WAGON: '🚗', CROSSOVER: '🚙',
}
const FUEL_EMOJIS: Record<FuelType, string> = {
  GASOLINE: '⛽', DIESEL: '🔶', HYBRID: '🌿', ELECTRIC: '⚡', PLUG_IN_HYBRID: '🔌',
}
const EMAIL_FREQ = [
  { value: 'IMMEDIATE', label: 'מיידי' },
  { value: 'DAILY',     label: 'פעם ביום' },
  { value: 'WEEKLY',    label: 'פעם בשבוע' },
]

function getNextStep(current: Step): Step {
  switch (current) {
    case 'prefs':         return 'notifications'
    case 'notifications': return 'messaging-mode'
    case 'messaging-mode': return 'both-done'
    default:              return 'both-done'
  }
}

// All users are always both buyer and seller — fixed progress path
const PROGRESS_STEPS: Step[] = ['prefs', 'notifications', 'messaging-mode', 'both-done']

export default function OnboardingScreen() {
  const router = useRouter()

  // All users are BOTH buyer and seller — no role selection needed
  const role = 'BOTH'
  const [step, setStep]   = useState<Step>('prefs')
  const [loading, setLoading] = useState(false)

  // Buyer prefs
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [fuelTypes, setFuelTypes]       = useState<FuelType[]>([])
  const [budgetMin, setBudgetMin]       = useState(0)
  const [budgetMax, setBudgetMax]       = useState(200000)
  const [yearFrom, setYearFrom]         = useState('')
  const [yearTo, setYearTo]             = useState('')
  const [mileageMin, setMileageMin]     = useState('')
  const [mileageMax, setMileageMax]     = useState('')
  const [location, setLocation]         = useState('')
  const [radius, setRadius]             = useState(50)
  const [citySearch, setCitySearch]     = useState('')
  const [brands, setBrands]             = useState<string[]>([])
  const [anyBrand, setAnyBrand]         = useState(false)

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [emailFrequency, setEmailFrequency]         = useState('IMMEDIATE')
  const [pushNotifications, setPushNotifications]   = useState(true)

  // Seller
  const [messagingMode, setMessagingMode] = useState<'OPEN' | 'BUMBLE'>('OPEN')

  // Restore draft
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DRAFT_KEY).then((raw) => {
      if (!raw) return
      try {
        const d = JSON.parse(raw)
        if (d.step && PROGRESS_STEPS.includes(d.step)) setStep(d.step)
        if (d.vehicleTypes) setVehicleTypes(d.vehicleTypes)
        if (d.fuelTypes)    setFuelTypes(d.fuelTypes)
        if (d.budgetMin !== undefined) setBudgetMin(d.budgetMin)
        if (d.budgetMax !== undefined) setBudgetMax(d.budgetMax)
        if (d.yearFrom)   setYearFrom(d.yearFrom)
        if (d.yearTo)     setYearTo(d.yearTo)
        if (d.mileageMin) setMileageMin(d.mileageMin)
        if (d.mileageMax) setMileageMax(d.mileageMax)
        if (d.location)   setLocation(d.location)
        if (d.radius)     setRadius(d.radius)
        if (d.brands)     setBrands(d.brands)
        if (d.anyBrand !== undefined) setAnyBrand(d.anyBrand)
        if (d.emailNotifications !== undefined) setEmailNotifications(d.emailNotifications)
        if (d.emailFrequency)  setEmailFrequency(d.emailFrequency)
        if (d.pushNotifications !== undefined) setPushNotifications(d.pushNotifications)
        if (d.messagingMode) setMessagingMode(d.messagingMode)
      } catch { /* ignore */ }
    })
  }, [])

  async function saveDraft(extra: Record<string, unknown> = {}) {
    await AsyncStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({
      role, vehicleTypes, fuelTypes, budgetMin, budgetMax,
      yearFrom, yearTo, mileageMin, mileageMax,
      location, radius, brands, anyBrand,
      emailNotifications, emailFrequency, pushNotifications,
      messagingMode, step, ...extra,
    }))
  }

  function toggleItem<T>(arr: T[], val: T, set: (v: T[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  function advance() {
    const next = getNextStep(step)
    saveDraft({ step: next })
    setStep(next)
  }

  // ── Finish: all users are both buyer and seller ──────────────────────────
  async function finishBoth(dest: string) {
    setLoading(true)
    try {
      await api.put('/api/users/preferences', {
        vehicleTypes,
        fuelPreferences: fuelTypes,
        budgetMin,
        budgetMax,
        yearFrom:   yearFrom   ? parseInt(yearFrom, 10)   : undefined,
        yearTo:     yearTo     ? parseInt(yearTo, 10)     : undefined,
        mileageMin: mileageMin ? parseInt(mileageMin, 10) : undefined,
        mileageMax: mileageMax ? parseInt(mileageMax, 10) : undefined,
        location,
        searchRadius: radius,
        ownershipYears: 3,
        preferredBrands: anyBrand ? [] : brands,
        preferredModels: [],
        roles: ['BUYER', 'SELLER'],
      })
      await api.put('/api/users/me', { messagingMode, emailNotifications, emailFrequency, pushNotifications })
      await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY)
    } catch { /* proceed anyway */ }
    setLoading(false)
    router.replace(dest as any)
  }

  const progressSteps = PROGRESS_STEPS

  // ══════════════════════════════════════════════════════════════════════════
  // BUYER PREFERENCES (one big scrollable screen)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'prefs') {
    const filteredCities = citySearch
      ? ISRAELI_CITIES.filter((c) => c.includes(citySearch)).slice(0, 20)
      : []

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
        <ProgressDots steps={progressSteps} current={step} />
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 120 }}>

          <Text style={s.h1}>מה חשוב לך ברכב?</Text>
          <Text style={[s.subtitle, { marginBottom: 20 }]}>
            ככל שתמלא יותר — הפיד יהיה מדויק יותר עבורך. הכל ניתן לשינוי אחר כך.
          </Text>

          {/* ── Brands ── */}
          <SectionHeader label="⭐ מותגים מועדפים" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {CAR_BRANDS.map((b) => (
              <Chip
                key={b}
                label={b}
                selected={!anyBrand && brands.includes(b)}
                onPress={() => { setAnyBrand(false); toggleItem(brands, b, setBrands) }}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={() => { setAnyBrand(true); setBrands([]) }}
            style={[s.skipChip, anyBrand && s.skipChipSelected]}
          >
            <Text style={[s.skipChipText, anyBrand && { color: '#D4A843' }]}>
              {anyBrand ? '✓ ' : ''}לא משנה לי
            </Text>
          </TouchableOpacity>

          {/* ── Vehicle type ── */}
          <SectionHeader label="🚗 סוג רכב" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', marginBottom: 20 }}>
            {VEHICLE_TYPES.map((vt) => (
              <TouchableOpacity
                key={vt}
                onPress={() => toggleItem(vehicleTypes, vt, setVehicleTypes)}
                style={[s.vehicleChip, vehicleTypes.includes(vt) && s.vehicleChipSel]}
              >
                <Text style={{ fontSize: 28, marginBottom: 4 }}>{VEHICLE_EMOJIS[vt]}</Text>
                <Text style={[s.vehicleLabel, vehicleTypes.includes(vt) && { color: '#D4A843' }]}>
                  {VEHICLE_TYPE_LABELS[vt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Fuel type ── */}
          <SectionHeader label="⛽ סוג דלק" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {FUEL_TYPES.map((ft) => (
              <Chip
                key={ft}
                label={`${FUEL_EMOJIS[ft]} ${FUEL_TYPE_LABELS[ft]}`}
                selected={fuelTypes.includes(ft)}
                onPress={() => toggleItem(fuelTypes, ft, setFuelTypes)}
              />
            ))}
          </View>

          {/* ── Year range ── */}
          <SectionHeader label="📅 טווח שנים" />
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <TextInput
              value={yearTo}
              onChangeText={(t) => setYearTo(t.replace(/\D/g, '').slice(0, 4))}
              placeholder="עד שנת"
              placeholderTextColor="#555"
              keyboardType="numeric"
              maxLength={4}
              textAlign="center"
              style={[s.rangeInput, { flex: 1 }]}
            />
            <Text style={{ color: '#555' }}>—</Text>
            <TextInput
              value={yearFrom}
              onChangeText={(t) => setYearFrom(t.replace(/\D/g, '').slice(0, 4))}
              placeholder="משנת"
              placeholderTextColor="#555"
              keyboardType="numeric"
              maxLength={4}
              textAlign="center"
              style={[s.rangeInput, { flex: 1 }]}
            />
          </View>
          <Text style={s.quickLabel}>משנת:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {QUICK_YEAR_FROM.map((y) => (
              <SmallChip key={y} label={String(y)} selected={yearFrom === String(y)} onPress={() => setYearFrom(String(y))} />
            ))}
          </View>
          <Text style={s.quickLabel}>עד שנת:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {QUICK_YEAR_TO.map((y) => (
              <SmallChip key={y} label={String(y)} selected={yearTo === String(y)} onPress={() => setYearTo(String(y))} />
            ))}
          </View>

          {/* ── Mileage range ── */}
          <SectionHeader label="🛣️ טווח קילומטרז'" />
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <TextInput
              value={mileageMax}
              onChangeText={(t) => setMileageMax(t.replace(/\D/g, ''))}
              placeholder={'עד ק"מ'}
              placeholderTextColor="#555"
              keyboardType="numeric"
              textAlign="center"
              style={[s.rangeInput, { flex: 1 }]}
            />
            <Text style={{ color: '#555' }}>—</Text>
            <TextInput
              value={mileageMin}
              onChangeText={(t) => setMileageMin(t.replace(/\D/g, ''))}
              placeholder={'מינימום ק"מ'}
              placeholderTextColor="#555"
              keyboardType="numeric"
              textAlign="center"
              style={[s.rangeInput, { flex: 1 }]}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {[0, 50000, 100000, 150000, 200000].map((v) => {
              const lbl = v === 0 ? 'ללא הגבלה' : `${v / 1000}K`
              const valStr = v === 0 ? '' : String(v)
              return (
                <SmallChip
                  key={v}
                  label={lbl}
                  selected={mileageMax === valStr}
                  onPress={() => setMileageMax(valStr)}
                />
              )
            })}
          </View>

          {/* ── Price range ── */}
          <SectionHeader label="💰 טווח מחירים" />
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#D4A843', fontSize: 16, fontWeight: '800' }}>
                {budgetMax >= 500000 ? 'ללא הגבלה' : formatILS(budgetMax)}
              </Text>
              <Text style={{ color: '#888', fontSize: 13 }}>מקסימום</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0} maximumValue={500000} step={10000}
              value={budgetMax}
              onValueChange={(v: number) => { setBudgetMax(v); if (budgetMin > v) setBudgetMin(v) }}
              minimumTrackTintColor="#D4A843" maximumTrackTintColor="#333" thumbTintColor="#D4A843"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 4 }}>
              <Text style={{ color: '#D4A843', fontSize: 16, fontWeight: '800' }}>
                {budgetMin === 0 ? '₪0' : formatILS(budgetMin)}
              </Text>
              <Text style={{ color: '#888', fontSize: 13 }}>מינימום</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0} maximumValue={490000} step={10000}
              value={budgetMin}
              onValueChange={(v: number) => { setBudgetMin(v); if (v > budgetMax) setBudgetMax(v + 10000) }}
              minimumTrackTintColor="#888" maximumTrackTintColor="#D4A843" thumbTintColor="#D4A843"
            />
            <Text style={{ color: '#555', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
              {budgetMin === 0 && budgetMax >= 500000
                ? 'כל המחירים'
                : `${formatILS(budgetMin)} — ${budgetMax >= 500000 ? 'ללא הגבלה' : formatILS(budgetMax)}`}
            </Text>
          </View>

          {/* ── Location ── */}
          <SectionHeader label="📍 מיקום" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {QUICK_CITIES.map((city) => (
              <Chip key={city} label={city} selected={location === city}
                onPress={() => { setLocation(city); setCitySearch('') }} />
            ))}
            <Chip label="הכל" selected={location === ''}
              onPress={() => { setLocation(''); setCitySearch('') }} />
          </View>
          <TextInput
            value={citySearch}
            onChangeText={setCitySearch}
            placeholder="חפש עיר אחרת..."
            placeholderTextColor="#555"
            textAlign="right"
            style={s.citySearch}
          />
          {citySearch.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {filteredCities.map((city) => (
                <Chip key={city} label={city} selected={location === city}
                  onPress={() => { setLocation(city); setCitySearch('') }} />
              ))}
            </View>
          )}

          {/* ── Radius ── */}
          <SectionHeader label="📡 רדיוס חיפוש" />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            {RADIUS_OPTIONS.map((r) => (
              <Chip key={r.value} label={r.label} selected={radius === r.value} onPress={() => setRadius(r.value)} />
            ))}
          </View>
        </ScrollView>

        <NavBar onBack={() => router.back()} onNext={advance} onSkip={advance} />
      </SafeAreaView>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS STEP
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'notifications') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
        <ProgressDots steps={progressSteps} current={step} />
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <Text style={s.h1}>תישאר מעודכן</Text>
          <Text style={[s.subtitle, { marginBottom: 28 }]}>
            בחר איך תרצה לקבל התראות על רכבים חדשים שמתאימים לך.
          </Text>

          {/* Email notifications */}
          <View style={s.notifCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#333', true: 'rgba(212,168,67,0.5)' }}
                thumbColor={emailNotifications ? '#D4A843' : '#888'}
              />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 12 }}>
                <Text style={s.notifTitle}>עדכן אותי כשיעלה רכב מתאים</Text>
                <Text style={s.notifDesc}>
                  נשלח לך אימייל ברגע שיעלה רכב שמתאים להעדפות שלך — כך לא תפספס דיל טוב.
                </Text>
              </View>
            </View>
            {emailNotifications && (
              <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 14, marginTop: 12 }}>
                <Text style={{ color: '#888', fontSize: 13, textAlign: 'right', marginBottom: 10 }}>
                  כמה פעמים לשלוח?
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                  {EMAIL_FREQ.map((opt) => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      selected={emailFrequency === opt.value}
                      onPress={() => setEmailFrequency(opt.value)}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Push notifications */}
          <View style={s.notifCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#333', true: 'rgba(212,168,67,0.5)' }}
                thumbColor={pushNotifications ? '#D4A843' : '#888'}
              />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 12 }}>
                <Text style={s.notifTitle}>התראות לטלפון</Text>
                <Text style={s.notifDesc}>
                  שלחו לי התראה גם לטלפון כשיש הודעה חדשה.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <NavBar onBack={() => setStep('prefs')} onNext={advance} onSkip={advance} />
      </SafeAreaView>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MESSAGING MODE STEP (seller / both)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'messaging-mode') {
    const MODES = [
      {
        value: 'OPEN' as const,
        icon: '💬',
        title: 'פתוח לפניות',
        desc: 'קונים שמועדף עליהם הרכב שלך יוכלו לשלוח לך הודעה ישירות. אתה תחליט אם לענות.',
        extra: 'מגביל ל-3 הודעות ראשוניות לכל קונה, כדי שלא תוצף.',
      },
      {
        value: 'BUMBLE' as const,
        icon: '🔒',
        title: 'אתה קובע עם מי לדבר',
        desc: 'קונים יסמנו לייק על הרכב שלך, אבל לא יוכלו לשלוח הודעות. רק אתה רואה מי עשה לייק — ואתה בוחר עם מי להתחיל שיחה.',
        extra: 'מתאים אם אתה רוצה שקט ורוצה לסנן לפני שמדברים.',
      },
    ]
    const prevStep: Step = 'notifications'

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
        <ProgressDots steps={progressSteps} current={step} />
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <Text style={s.h1}>איך תרצה לקבל פניות מקונים?</Text>
          <Text style={[s.subtitle, { marginBottom: 28 }]}>
            תוכל לשנות את זה בכל עת מהגדרות המודעה.
          </Text>

          <View style={{ gap: 14 }}>
            {MODES.map((mode) => {
              const sel = messagingMode === mode.value
              return (
                <TouchableOpacity
                  key={mode.value}
                  onPress={() => setMessagingMode(mode.value)}
                  style={[s.modeCard, sel && s.modeCardSel]}
                  activeOpacity={0.75}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={[s.radio, sel && s.radioSel]}>
                      {sel && <View style={s.radioDot} />}
                    </View>
                    <Text style={[s.modeTitle, sel && { color: '#D4A843' }]}>
                      {mode.icon} {mode.title}
                    </Text>
                  </View>
                  <Text style={s.modeDesc}>{mode.desc}</Text>
                  <View style={s.modeExtra}>
                    <Text style={s.modeExtraText}>💡 {mode.extra}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        <NavBar onBack={() => setStep(prevStep)} onNext={advance} onSkip={advance} />
      </SafeAreaView>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DONE (everyone is both buyer and seller)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'both-done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F', padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <View style={s.doneIcon}><Text style={{ fontSize: 44 }}>🎉</Text></View>
          <Text style={s.doneTitle}>הכל מוכן!</Text>
          <Text style={s.doneSub}>
            הפרופיל שלך הוגדר. אתה יכול לגלול רכבים, ולפרסם את הרכב שלך.
          </Text>
        </View>
        <View style={{ gap: 14 }}>
          <TouchableOpacity
            onPress={() => finishBoth('/listing/create/index')}
            disabled={loading}
            style={[s.primaryBtn, { opacity: loading ? 0.7 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#0F0F0F" />
              : <Text style={s.primaryBtnText}>פרסם רכב עכשיו 🚗 ←</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => finishBoth('/(tabs)/swipe')}
            disabled={loading}
            style={s.outlineBtn}
          >
            <Text style={s.outlineBtnText}>גלה רכבים ←</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return null
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function ProgressDots({ steps, current }: { steps: Step[]; current: Step }) {
  const idx = steps.indexOf(current)
  if (idx < 0 || steps.length === 0) return null
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 14 }}>
      {steps.map((_, i) => (
        <View key={i} style={{
          width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
          backgroundColor: i === idx ? '#D4A843' : i < idx ? 'rgba(212,168,67,0.4)' : '#333',
        }} />
      ))}
    </View>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <Text style={{ color: '#F5F5F5', fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: 10, marginTop: 4 }}>
      {label}
    </Text>
  )
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
        borderColor: selected ? '#D4A843' : 'rgba(255,255,255,0.15)',
        backgroundColor: selected ? 'rgba(212,168,67,0.15)' : 'transparent',
      }}
    >
      <Text style={{ color: selected ? '#D4A843' : '#888', fontSize: 14, fontWeight: selected ? '600' : '400' }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function SmallChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
        borderColor: selected ? '#D4A843' : 'rgba(255,255,255,0.12)',
        backgroundColor: selected ? 'rgba(212,168,67,0.12)' : '#1A1A1A',
      }}
    >
      <Text style={{ color: selected ? '#D4A843' : '#888', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  )
}

function NavBar({ onBack, onNext, onSkip }: { onBack: () => void; onNext: () => void; onSkip: () => void }) {
  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: '#0F0F0F', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
      flexDirection: 'row', padding: 16, paddingBottom: 28, gap: 10,
    }}>
      <TouchableOpacity
        onPress={onBack}
        style={{ paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1A1A1A' }}
      >
        <Text style={{ color: '#F5F5F5', fontWeight: '600' }}>→</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSkip} style={{ paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12 }}>
        <Text style={{ color: '#888', fontWeight: '500' }}>דלג</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onNext}
        style={{ flex: 1, backgroundColor: '#D4A843', borderRadius: 12, alignItems: 'center', paddingVertical: 14 }}
      >
        <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>הבא ←</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  h1:       { fontSize: 26, fontWeight: '800', color: '#F5F5F5', textAlign: 'right' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'right', lineHeight: 22 },
  roleCard: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  roleLabel: { color: '#F5F5F5', fontWeight: '700', fontSize: 18 },
  roleSub:   { color: '#888', fontSize: 14, marginTop: 2 },
  skipChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-end', marginBottom: 20,
  },
  skipChipSelected: { borderColor: '#D4A843', backgroundColor: 'rgba(212,168,67,0.12)' },
  skipChipText: { color: '#888', fontSize: 14, fontWeight: '500' },
  vehicleChip: {
    alignItems: 'center', padding: 12, borderRadius: 14, width: 88, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1A1A',
  },
  vehicleChipSel: { borderColor: '#D4A843', backgroundColor: 'rgba(212,168,67,0.12)' },
  vehicleLabel:   { color: '#888', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  rangeInput: {
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, padding: 12, color: '#F5F5F5', fontSize: 15,
  },
  quickLabel: { color: '#666', fontSize: 12, textAlign: 'right', marginBottom: 4 },
  citySearch: {
    backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12,
    color: '#F5F5F5', marginBottom: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  notifCard: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 14,
  },
  notifTitle: { color: '#F5F5F5', fontWeight: '700', fontSize: 15, textAlign: 'right', marginBottom: 6 },
  notifDesc:  { color: '#888', fontSize: 13, textAlign: 'right', lineHeight: 20 },
  modeCard: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)',
  },
  modeCardSel:   { borderColor: '#D4A843', backgroundColor: 'rgba(212,168,67,0.06)' },
  modeTitle:     { color: '#F5F5F5', fontWeight: '700', fontSize: 17, textAlign: 'right' },
  modeDesc:      { color: '#888', fontSize: 14, textAlign: 'right', lineHeight: 22, marginBottom: 10 },
  modeExtra:     { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 },
  modeExtraText: { color: '#666', fontSize: 12, textAlign: 'right', lineHeight: 18 },
  radio:         { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  radioSel:      { borderColor: '#D4A843' },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4A843' },
  doneIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 2, borderColor: '#D4A843',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    shadowColor: '#D4A843', shadowOpacity: 0.3, shadowRadius: 20, elevation: 6,
  },
  doneTitle:      { fontSize: 28, fontWeight: '800', color: '#F5F5F5', textAlign: 'center', marginBottom: 10 },
  doneSub:        { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 24 },
  primaryBtn:     { backgroundColor: '#D4A843', borderRadius: 16, padding: 18, alignItems: 'center' },
  primaryBtnText: { color: '#0F0F0F', fontSize: 17, fontWeight: '800' },
  outlineBtn:     { borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  outlineBtnText: { color: '#F5F5F5', fontSize: 17, fontWeight: '600' },
})
