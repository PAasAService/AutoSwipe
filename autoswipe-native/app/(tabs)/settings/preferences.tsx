import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator,
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
  VEHICLE_TYPE_LABELS, FUEL_TYPE_LABELS,
} from '../../../src/constants/cars'
import { FuelType, VehicleType, BuyerPreferences } from '../../../src/types'
import {
  BrandModelPicker,
  CityPickerField,
  YearDropdown,
  BudgetSlider,
} from '../../../src/components/ui/pickers'

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
  const [models, setModels] = useState<string[]>([])
  const [yearMin, setYearMin] = useState<number | null>(null)
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
      vehicleTypes,
      fuelPreferences: fuelTypes,
      budgetMax,
      location,
      searchRadius: radius,
      preferredBrands: brands,
      yearFrom: yearMin ?? undefined,
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

  function mark() { setIsDirty(true) }

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

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── סוג רכב ── */}
        <SectionHeader label="🚙 סוג רכב" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {VEHICLE_TYPES.map((vt) => (
            <Chip
              key={vt}
              label={VEHICLE_TYPE_LABELS[vt]}
              selected={vehicleTypes.includes(vt)}
              onPress={() => toggle(vehicleTypes, vt, setVehicleTypes)}
            />
          ))}
        </View>

        {/* ── סוג דלק ── */}
        <SectionHeader label="⛽ סוג דלק" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {FUEL_TYPES.map((ft) => (
            <Chip
              key={ft}
              label={FUEL_TYPE_LABELS[ft]}
              selected={fuelTypes.includes(ft)}
              onPress={() => toggle(fuelTypes, ft, setFuelTypes)}
            />
          ))}
        </View>

        {/* ── תקציב מקסימלי ── */}
        <SectionHeader label="💰 תקציב מקסימלי" />
        <View style={{ marginBottom: 28 }}>
          <BudgetSlider
            value={budgetMax}
            min={20000}
            max={600000}
            step={10000}
            onChange={(v) => { setBudgetMax(v); mark() }}
            noMaxLabel="ללא הגבלה"
          />
        </View>

        {/* ── שנה מינימלית ── */}
        <SectionHeader label="📅 שנה מינימלית" />
        <View style={{ marginBottom: 28 }}>
          <YearDropdown
            value={yearMin}
            onChange={(y) => { setYearMin(y); mark() }}
            placeholder="כל השנים"
          />
        </View>

        {/* ── מיקום ── */}
        <SectionHeader label="📍 מיקום" />
        <View style={{ marginBottom: 16 }}>
          <CityPickerField
            value={location}
            onChange={(city) => { setLocation(city); mark() }}
          />
        </View>

        {/* ── רדיוס חיפוש ── */}
        <SectionHeader label="📡 רדיוס חיפוש" />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
          {RADIUS_OPTIONS.map((r) => (
            <Chip
              key={r.value}
              label={r.label}
              selected={radius === r.value}
              onPress={() => { setRadius(r.value); mark() }}
            />
          ))}
        </View>

        {/* ── יצרן ודגם מועדף ── */}
        <SectionHeader label="⭐ יצרן ודגם מועדף" />
        <Text style={{ color: '#666', fontSize: 13, textAlign: 'right', marginBottom: 12 }}>
          לא חובה — בחירה תשפיע על הפיד שלך
        </Text>
        <View style={{ marginBottom: 28 }}>
          <BrandModelPicker
            selectedBrands={brands}
            selectedModels={models}
            onBrandsChange={(b) => { setBrands(b); mark() }}
            onModelsChange={(m) => { setModels(m); mark() }}
          />
        </View>

      </ScrollView>

      {/* Save Bar */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#0F0F0F',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        padding: 16,
        paddingBottom: 28,
      }}>
        <TouchableOpacity
          onPress={() => mutation.mutate()}
          disabled={!isDirty || mutation.isPending}
          style={{
            backgroundColor: isDirty ? '#D4A843' : '#333',
            borderRadius: 14,
            padding: 16,
            alignItems: 'center',
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
  return (
    <Text style={{
      color: '#F5F5F5',
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'right',
      marginBottom: 12,
    }}>
      {label}
    </Text>
  )
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
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
