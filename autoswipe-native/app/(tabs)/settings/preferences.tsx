import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { api } from '../../../src/lib/api'
import { useSwipeStore } from '../../../src/store/swipe'
import { queryKeys } from '../../../src/lib/query-keys'
import {
  VEHICLE_TYPES, FUEL_TYPES,
  VEHICLE_TYPE_LABELS, FUEL_TYPE_LABELS, CAR_BRANDS,
} from '../../../src/constants/cars'
import { ISRAELI_CITIES } from '../../../src/constants/cities'
import { FuelType, VehicleType, BuyerPreferences } from '../../../src/types'

const BUDGET_OPTIONS = [
  { label: 'עד ₪50K', max: 50000 },
  { label: 'עד ₪80K', max: 80000 },
  { label: 'עד ₪120K', max: 120000 },
  { label: 'עד ₪150K', max: 150000 },
  { label: 'עד ₪200K', max: 200000 },
  { label: 'מעל ₪200K', max: 9999999 },
]
const RADIUS_OPTIONS = [
  { label: '20 ק"מ', value: 20 },
  { label: '50 ק"מ', value: 50 },
  { label: '100 ק"מ', value: 100 },
  { label: 'כל הארץ', value: 9999 },
]

export default function PreferencesScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const resetFeed = useSwipeStore((s) => s.reset)

  const { data: prefs, isLoading } = useQuery({
    queryKey: queryKeys.preferences(),
    queryFn: () => api.get<{ data: BuyerPreferences }>('/api/users/preferences').then((r) => r.data),
  })

  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
  const [budgetMax, setBudgetMax] = useState(200000)
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState(50)
  const [brands, setBrands] = useState<string[]>([])
  const [citySearch, setCitySearch] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!prefs) return
    setVehicleTypes(Array.isArray(prefs.vehicleTypes) ? prefs.vehicleTypes : JSON.parse(prefs.vehicleTypes as any || '[]'))
    setFuelTypes(Array.isArray(prefs.fuelPreferences) ? prefs.fuelPreferences : JSON.parse(prefs.fuelPreferences as any || '[]'))
    setBudgetMax(prefs.budgetMax || 200000)
    setLocation(prefs.location || '')
    setRadius(prefs.searchRadius || 50)
    setBrands(Array.isArray(prefs.preferredBrands) ? prefs.preferredBrands : JSON.parse(prefs.preferredBrands as any || '[]'))
  }, [prefs])

  const mutation = useMutation({
    mutationFn: () => api.put('/api/users/preferences', {
      vehicleTypes, fuelPreferences: fuelTypes,
      budgetMax, location, searchRadius: radius,
      preferredBrands: brands,
    }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: queryKeys.recommendations() })
      resetFeed()
      setIsDirty(false)
      Toast.show({ type: 'success', text1: 'ההעדפות עודכנו! הפיד מתרענן ✓', visibilityTime: 2000 })
      router.push('/(tabs)/swipe')
    },
    onError: () => Toast.show({ type: 'error', text1: 'שגיאה בשמירת ההעדפות' }),
  })

  function toggle<T>(arr: T[], val: T, set: (v: T[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
    setIsDirty(true)
  }

  const filteredCities = ISRAELI_CITIES.filter((c) => c.includes(citySearch))

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#D4A843" size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#D4A843', fontSize: 16 }}>סגור</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#F5F5F5', fontSize: 20, fontWeight: '700' }}>העדפות חיפוש</Text>
          {isDirty && <Text style={{ color: '#888', fontSize: 12 }}>• שינויים שלא נשמרו</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* Vehicle Types */}
        <SectionHeader label="🚗 סוג רכב" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {VEHICLE_TYPES.map((vt) => (
            <Chip
              key={vt}
              label={VEHICLE_TYPE_LABELS[vt]}
              selected={vehicleTypes.includes(vt)}
              onPress={() => toggle(vehicleTypes, vt, setVehicleTypes)}
            />
          ))}
        </View>

        {/* Fuel */}
        <SectionHeader label="⛽ סוג דלק" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {FUEL_TYPES.map((ft) => (
            <Chip
              key={ft}
              label={FUEL_TYPE_LABELS[ft]}
              selected={fuelTypes.includes(ft)}
              onPress={() => toggle(fuelTypes, ft, setFuelTypes)}
            />
          ))}
        </View>

        {/* Budget */}
        <SectionHeader label="💰 תקציב" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {BUDGET_OPTIONS.map((opt) => (
            <Chip
              key={opt.max}
              label={opt.label}
              selected={budgetMax === opt.max}
              onPress={() => { setBudgetMax(opt.max); setIsDirty(true) }}
            />
          ))}
        </View>

        {/* Location */}
        <SectionHeader label="📍 מיקום" />
        <TextInput
          value={citySearch}
          onChangeText={setCitySearch}
          placeholder="חפש עיר..."
          placeholderTextColor="#555"
          textAlign="right"
          style={{
            backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12,
            color: '#F5F5F5', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
          }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {(citySearch ? filteredCities.slice(0, 20) : ISRAELI_CITIES.slice(0, 16)).map((city) => (
            <Chip
              key={city}
              label={city}
              selected={location === city}
              onPress={() => { setLocation(city); setCitySearch(''); setIsDirty(true) }}
            />
          ))}
        </View>

        {/* Radius */}
        <SectionHeader label="📡 רדיוס חיפוש" />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {RADIUS_OPTIONS.map((r) => (
            <Chip
              key={r.value}
              label={r.label}
              selected={radius === r.value}
              onPress={() => { setRadius(r.value); setIsDirty(true) }}
            />
          ))}
        </View>

        {/* Brands */}
        <SectionHeader label="⭐ מותגים מועדפים" />
        <Text style={{ color: '#888', fontSize: 13, textAlign: 'right', marginBottom: 8 }}>לא חובה</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {CAR_BRANDS.map((brand) => (
            <Chip
              key={brand}
              label={brand}
              selected={brands.includes(brand)}
              onPress={() => toggle(brands, brand, setBrands)}
            />
          ))}
        </View>

      </ScrollView>

      {/* Save Bar */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#0F0F0F', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
        padding: 16, paddingBottom: 28,
      }}>
        <TouchableOpacity
          onPress={() => mutation.mutate()}
          disabled={!isDirty || mutation.isPending}
          style={{
            backgroundColor: isDirty ? '#D4A843' : '#333',
            borderRadius: 14, padding: 16, alignItems: 'center',
          }}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#0F0F0F" />
            : <Text style={{ color: isDirty ? '#0F0F0F' : '#666', fontWeight: '700', fontSize: 16 }}>
                {isDirty ? 'שמור ועדכן פיד 🔄' : 'אין שינויים'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={{ color: '#F5F5F5', fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: 10 }}>{label}</Text>
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1.5,
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
