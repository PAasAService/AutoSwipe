import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { goBackSafe } from '../../../src/lib/go-back-safe'
import { useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api, uploadListingImageFromUri, deletePendingListingImage } from '../../../src/lib/api'
import { listingImageUri } from '../../../src/lib/listing-image-uri'
import { useCurrentUser } from '../../../src/hooks/useCurrentUser'
import type { CarListing } from '../../../src/types'
import {
  CAR_BRANDS, CAR_MODELS, FUEL_TYPES, VEHICLE_TYPES,
  FUEL_TYPE_LABELS, VEHICLE_TYPE_LABELS, TRANSMISSION_LABELS,
} from '../../../src/constants/cars'
import { ISRAELI_CITIES } from '../../../src/constants/cities'
import { FuelType, VehicleType, Transmission } from '../../../src/types'
import { formatILS } from '../../../src/lib/utils/format'
import { FORWARD_ICON, BACK_WITH_LABEL_FONT_SIZE } from '../../../src/constants/ui'
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader'
import { SCREEN_EDGE } from '../../../src/constants/layout'

const STEPS = ['רכב', 'פרטים', 'מחיר', 'עלויות', 'תמונות']
const CURRENT_YEAR = new Date().getFullYear()
const DRAFT_KEY = 'autoswipe_create_draft'

interface FormData {
  brand: string; model: string; year: string; fuelType: FuelType | ''
  vehicleType: VehicleType | ''; transmission: Transmission | ''
  engineSize: string; color: string
  mileage: string; doors: string; seats: string; hand: string
  price: string; location: string
  insuranceEstimate: string; maintenanceEstimate: string
  depreciationRate: string; fuelConsumption: string
  description: string; sellerReason: string
  equipment: string[]
  plateNumber: string; isGovVerified: boolean
  vehicleCategory: 'car' | 'motorcycle' | 'truck'
}

interface UploadedImage { uri: string; path?: string; uploading: boolean; error?: string }

export default function CreateListingScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: me, isLoading: meLoading } = useCurrentUser()
  const rawEditId = useLocalSearchParams<{ editId?: string | string[] }>().editId
  const editId = useMemo(
    () => (Array.isArray(rawEditId) ? rawEditId[0] : rawEditId) ?? '',
    [rawEditId],
  )
  const isEdit = editId.length > 0

  const [step, setStep] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [editReady, setEditReady] = useState(!isEdit)
  const [plateLoading, setPlateLoading] = useState(false)
  const [aiDescLoading, setAiDescLoading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])

  const [form, setForm] = useState<FormData>({
    brand: '', model: '', year: '', fuelType: '', vehicleType: '', transmission: '',
    engineSize: '', color: '',
    mileage: '', doors: '4', seats: '5', hand: '',
    price: '', location: '',
    insuranceEstimate: '', maintenanceEstimate: '', depreciationRate: '12', fuelConsumption: '',
    description: '', sellerReason: '',
    equipment: [],
    plateNumber: '', isGovVerified: false,
    vehicleCategory: 'car',
  })

  // Restore draft on mount (create only)
  useEffect(() => {
    if (isEdit) return
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return
      try {
        const saved = JSON.parse(raw)
        setForm((f) => ({ ...f, ...saved }))
      } catch { /* ignore corrupt draft */ }
    })
  }, [isEdit])

  // Auto-save draft on every form change (create only)
  useEffect(() => {
    if (isEdit) return
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  }, [form, isEdit])

  // Load listing when editing
  useEffect(() => {
    if (!isEdit || !editId) {
      setEditReady(true)
      return
    }
    if (meLoading) return
    if (!me?.id) {
      Toast.show({ type: 'error', text1: 'יש להתחבר מחדש' })
      goBackSafe('/(tabs)/dashboard')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get<{ data: CarListing }>(`/api/listings/${editId}`)
        const L = res.data
        if (cancelled) return
        if (L.sellerId !== me.id) {
          Toast.show({ type: 'error', text1: 'אין הרשאה לערוך מודעה זו' })
          goBackSafe('/(tabs)/dashboard')
          return
        }

        let equipment: string[] = []
        try {
          if (L.equipmentJson) equipment = JSON.parse(L.equipmentJson) as string[]
        } catch { /* ignore */ }

        const why = L.whySelling ?? ''

        setForm({
          brand: L.brand,
          model: L.model,
          year: String(L.year),
          fuelType: L.fuelType || '',
          vehicleType: L.vehicleType || '',
          transmission: L.transmission || '',
          engineSize: L.engineSize != null ? String(L.engineSize) : '',
          color: L.color ?? '',
          mileage: String(L.mileage),
          doors: String(L.doors ?? 4),
          seats: String(L.seats ?? 5),
          hand: L.hand != null ? String(L.hand) : '',
          price: String(L.price),
          location: L.location,
          insuranceEstimate: String(L.insuranceEstimate),
          maintenanceEstimate: String(L.maintenanceEstimate),
          depreciationRate: String(Math.round(L.depreciationRate * 100)),
          fuelConsumption: String(L.fuelConsumption),
          description: L.description ?? '',
          sellerReason: why,
          equipment,
          plateNumber: L.plateNumber ?? '',
          isGovVerified: !!L.isGovVerified,
          vehicleCategory: 'car',
        })

        const ordered = [...(L.images ?? [])].sort((a, b) => a.order - b.order)
        setImages(
          ordered.map((img) => ({
            uri: listingImageUri(img.path),
            path: img.url,
            uploading: false,
          })),
        )
        setEditReady(true)
      } catch {
        if (!cancelled) {
          setEditReady(true)
          Toast.show({ type: 'error', text1: 'לא ניתן לטעון את המודעה' })
          goBackSafe('/(tabs)/dashboard')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEdit, editId, me?.id, meLoading, router])

  function set(key: keyof FormData, val: any) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function addEquipment(item: string) {
    const trimmed = item.trim()
    if (!trimmed) return
    setForm((f) => ({ ...f, equipment: [...f.equipment, trimmed] }))
  }

  function removeEquipment(idx: number) {
    setForm((f) => ({ ...f, equipment: f.equipment.filter((_, i) => i !== idx) }))
  }

  // ── Plate Lookup ──────────────────────────────────────────────────────────
  async function lookupPlate() {
    if (!form.plateNumber.trim()) return
    setPlateLoading(true)
    try {
      const res = await api.get<any>(`/api/vehicle-lookup?plate=${encodeURIComponent(form.plateNumber.trim())}`)
      const response = res?.data ?? res

      // The API returns { category, data } structure
      const vehicle = response?.data || response
      const category = response?.category || 'car'

      if (vehicle) {
        setForm((f) => ({
          ...f,
          // Primary lookup fields (always apply if available)
          brand: vehicle.brand || f.brand,
          model: vehicle.model || f.model,
          year: vehicle.year?.toString() || f.year,
          fuelType: vehicle.fuelType || f.fuelType,
          color: vehicle.color || f.color,
          vehicleType: vehicle.vehicleType || f.vehicleType,

          // Enriched fields (only apply if high-confidence values returned)
          doors: vehicle.doors?.toString() || f.doors,
          engineSize: vehicle.engineCapacityCC?.toString() || f.engineSize,
          seats: vehicle.seats?.toString() || f.seats,

          // Track vehicle category from API
          vehicleCategory: category as 'car' | 'motorcycle' | 'truck',

          isGovVerified: !!vehicle.isGovVerified,
        }))
        Toast.show({ type: 'success', text1: '✓ פרטים אומתו מהרישוי הממשלתי' })
      }
    } catch {
      Toast.show({ type: 'error', text1: 'לא נמצאה לוחית — ניתן למלא ידנית' })
    } finally {
      setPlateLoading(false)
    }
  }

  // ── AI Description ────────────────────────────────────────────────────────
  async function generateDescription() {
    if (!form.brand || !form.model) {
      Toast.show({ type: 'error', text1: 'נא למלא מותג ודגם קודם' })
      return
    }
    setAiDescLoading(true)
    try {
      const res = await api.post<{ description: string }>('/api/ai-description', {
        brand: form.brand, model: form.model,
        year: parseInt(form.year) || CURRENT_YEAR,
        mileage: parseInt(form.mileage) || 0,
        fuelType: form.fuelType || 'GASOLINE',
        color: form.color,
        description: form.description,
      })
      if (res.description) set('description', res.description)
    } catch {
      Toast.show({ type: 'error', text1: 'שגיאה ביצירת תיאור אוטומטי' })
    } finally {
      setAiDescLoading(false)
    }
  }

  // ── Image Upload ──────────────────────────────────────────────────────────
  async function pickImages() {
    if (images.length >= 6) {
      Toast.show({ type: 'error', text1: 'מקסימום 6 תמונות' })
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (result.canceled) return

    const slots = result.assets.slice(0, 6 - images.length)
    const newImages: UploadedImage[] = slots.map((a) => ({ uri: a.uri, uploading: true }))
    setImages((prev) => [...prev, ...newImages])

    for (let i = 0; i < slots.length; i++) {
      const idx = images.length + i
      try {
        const { path } = await uploadListingImageFromUri(slots[i].uri)
        setImages((prev) => prev.map((img, j) =>
          j === idx ? { ...img, path, uploading: false } : img
        ))
      } catch {
        setImages((prev) => prev.map((img, j) =>
          j === idx ? { ...img, uploading: false, error: 'שגיאת העלאה' } : img
        ))
      }
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => {
      const img = prev[idx]
      if (img?.path?.includes('/uploads/listings/pending/')) {
        deletePendingListingImage(img.path).catch(() => {})
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  async function publish() {
    const hasUploading = images.some((i) => i.uploading)
    if (hasUploading) { Toast.show({ type: 'error', text1: 'יש תמונות שעדיין בהעלאה' }); return }
    if (!images.length) { Toast.show({ type: 'error', text1: 'נדרשת לפחות תמונה אחת' }); return }
    if (!form.brand || !form.model || !form.price || !form.mileage || !form.location || !form.hand) {
      Toast.show({ type: 'error', text1: 'נא למלא את כל השדות הנדרשים (כולל יד רכב)' })
      return
    }

    setPublishing(true)
    try {
      const payload = {
        brand: form.brand, model: form.model,
        year: parseInt(form.year) || CURRENT_YEAR,
        mileage: parseInt(form.mileage),
        price: parseInt(form.price),
        location: form.location,
        fuelType: form.fuelType || 'GASOLINE',
        vehicleType: form.vehicleType || 'SEDAN',
        transmission: form.transmission || 'AUTOMATIC',
        fuelConsumption: parseFloat(form.fuelConsumption) || 8,
        engineSize: form.engineSize ? parseInt(form.engineSize) : undefined,
        color: form.color || undefined,
        doors: parseInt(form.doors) || 4,
        seats: parseInt(form.seats) || 5,
        hand: form.hand ? parseInt(form.hand) : undefined,
        insuranceEstimate: parseInt(form.insuranceEstimate) || 5000,
        maintenanceEstimate: parseInt(form.maintenanceEstimate) || 3000,
        depreciationRate: parseInt(form.depreciationRate) / 100 || 0.12,
        description: form.description || undefined,
        whySelling: form.sellerReason || undefined,
        equipment: form.equipment.length > 0 ? form.equipment : undefined,
        plateNumber: form.plateNumber || undefined,
        isGovVerified: form.isGovVerified,
        images: images.filter((i) => i.path).map((i) => ({ path: i.path! })),
      }
      if (isEdit) {
        await api.patch(`/api/listings/${editId}`, payload)
        Toast.show({ type: 'success', text1: 'המודעה עודכנה', visibilityTime: 2500 })
      } else {
        const { whySelling: _w, equipment: _e, ...createBody } = payload
        await api.post('/api/listings', {
          ...createBody,
          sellerReason: form.sellerReason || undefined,
        })
        await AsyncStorage.removeItem(DRAFT_KEY)
        Toast.show({ type: 'success', text1: 'המודעה פורסמה! 🎉', visibilityTime: 2500 })
      }
      qc.invalidateQueries({ queryKey: ['my-listings'] })
      router.replace('/(tabs)/dashboard')
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'שגיאה בפרסום' })
    } finally {
      setPublishing(false)
    }
  }

  const canPublish = !publishing && images.length > 0 && !images.some((i) => i.uploading)

  if (isEdit && !editReady) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4A843" />
        <Text style={{ color: '#888', marginTop: 16, fontSize: 15 }}>טוען מודעה…</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
      <ScreenHeader
        onBack={() => (step > 0 ? setStep(step - 1) : goBackSafe('/(tabs)/dashboard'))}
        backVariant={step > 0 ? 'labeled' : 'text'}
        backLabel={step > 0 ? 'חזור' : 'סגור'}
        title={isEdit ? 'עריכת מודעה' : 'פרסום רכב'}
        titleSize={18}
        sideSlotWidth={72}
        trailing={(
          <Text style={{ color: '#888', fontSize: 14, writingDirection: 'rtl' }}>
            {step + 1}/{STEPS.length}
          </Text>
        )}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Progress */}
        <View style={{ flexDirection: 'row', paddingHorizontal: SCREEN_EDGE, gap: 6, marginBottom: 8, marginTop: 4 }}>
          {STEPS.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? '#D4A843' : '#333' }} />
          ))}
        </View>

        <Text style={{ color: '#888', textAlign: 'center', fontSize: 13, marginBottom: 8 }}>
          {STEPS[step]}
        </Text>

        <ScrollView contentContainerStyle={{ padding: SCREEN_EDGE, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          {step === 0 && <StepVehicle form={form} set={set} plateLoading={plateLoading} onLookup={lookupPlate} />}
          {step === 1 && <StepDetails form={form} set={set} />}
          {step === 2 && <StepPrice form={form} set={set} />}
          {step === 3 && <StepCosts form={form} set={set} />}
          {step === 4 && (
            <StepImages
              form={form} set={set}
              images={images} onPickImages={pickImages} onRemoveImage={removeImage}
              aiDescLoading={aiDescLoading} onGenerateDesc={generateDescription}
              onAddEquipment={addEquipment} onRemoveEquipment={removeEquipment}
            />
          )}
        </ScrollView>

        {/* Bottom Nav */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#0F0F0F', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
          paddingHorizontal: SCREEN_EDGE, paddingTop: 16, paddingBottom: 28,
        }}>
          {step < STEPS.length - 1 ? (
            <TouchableOpacity
              onPress={() => setStep(step + 1)}
              style={{ backgroundColor: '#D4A843', borderRadius: 14, padding: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: BACK_WITH_LABEL_FONT_SIZE }}>{`הבא ${FORWARD_ICON}`}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={publish} disabled={!canPublish}
              style={{
                backgroundColor: canPublish ? '#D4A843' : '#333',
                borderRadius: 14, padding: 16, alignItems: 'center',
              }}
            >
              {publishing
                ? <ActivityIndicator color="#0F0F0F" />
                : <Text style={{ color: canPublish ? '#0F0F0F' : '#666', fontWeight: '700', fontSize: 16 }}>{isEdit ? 'שמור שינויים ✓' : 'פרסם רכב 🚗'}</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─────────────────── STEP 0: Vehicle Info ────────────────────────────────────
function StepVehicle({ form, set, plateLoading, onLookup }: any) {
  return (
    <View style={{ gap: 14 }}>
      <SectionLabel text="לוחית רישוי (אופציונלי)" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={onLookup} disabled={plateLoading}
          style={{ backgroundColor: '#D4A843', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' }}
        >
          {plateLoading ? <ActivityIndicator color="#0F0F0F" size="small" /> : <Text style={{ color: '#0F0F0F', fontWeight: '700' }}>בדוק</Text>}
        </TouchableOpacity>
        <FieldInput value={form.plateNumber} onChange={(v: string) => set('plateNumber', v)} placeholder="XX-XXX-XX" style={{ flex: 1 }} />
      </View>
      {form.isGovVerified && (
        <Text style={{ color: '#4CAF50', textAlign: 'right', fontSize: 13 }}>✓ פרטים אומתו מהרישוי הממשלתי</Text>
      )}

      <SectionLabel text="מותג *" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CAR_BRANDS.map((b) => (
            <SelectChip
              key={b}
              label={b}
              selected={form.brand === b}
              onPress={() => {
                set('brand', b)
                set('model', '')
              }}
            />
          ))}
        </View>
      </ScrollView>

      {form.brand && (
        <>
          <SectionLabel text="דגם *" />
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(CAR_MODELS[form.brand] || []).map((m) => (
                  <SelectChip key={m} label={m} selected={form.model === m} onPress={() => set('model', m)} />
                ))}
              </View>
            </ScrollView>
            {(!CAR_MODELS[form.brand] || CAR_MODELS[form.brand].length === 0) && (
              <FieldInput value={form.model} onChange={(v: string) => set('model', v)} placeholder="הקלד דגם ידנית" />
            )}
          </View>
        </>
      )}

      <SectionLabel text="שנה *" />
      <FieldInput value={form.year} onChange={(v: string) => set('year', v)} placeholder={CURRENT_YEAR.toString()} keyboardType="numeric" />

      <SectionLabel text="סוג דלק" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FUEL_TYPES.map((ft) => (
          <SelectChip key={ft} label={FUEL_TYPE_LABELS[ft]} selected={form.fuelType === ft} onPress={() => set('fuelType', ft)} />
        ))}
      </View>

      <SectionLabel text="סוג רכב" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {VEHICLE_TYPES.map((vt) => (
          <SelectChip key={vt} label={VEHICLE_TYPE_LABELS[vt]} selected={form.vehicleType === vt} onPress={() => set('vehicleType', vt)} />
        ))}
      </View>

      <SectionLabel text="צבע (אופציונלי)" />
      <FieldInput value={form.color} onChange={(v: string) => set('color', v)} placeholder="לדוגמה: לבן" />

      <SectionLabel text="נפח מנוע cc (אופציונלי)" />
      <FieldInput value={form.engineSize} onChange={(v: string) => set('engineSize', v)} placeholder="לדוגמה: 1600" keyboardType="numeric" />
    </View>
  )
}

// ─────────────────── STEP 1: Details ─────────────────────────────────────────
function StepDetails({ form, set }: any) {
  const showCarFields = form.vehicleCategory === 'car'

  return (
    <View style={{ gap: 14 }}>
      <SectionLabel text="קילומטרים *" />
      <FieldInput value={form.mileage} onChange={(v: string) => set('mileage', v)} placeholder="לדוגמה: 45000" keyboardType="numeric" />

      {showCarFields && (
        <>
          <SectionLabel text="תיבת הילוכים" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['AUTOMATIC', 'MANUAL'] as Transmission[]).map((t) => (
              <SelectChip key={t} label={TRANSMISSION_LABELS[t]} selected={form.transmission === t} onPress={() => set('transmission', t)} />
            ))}
          </View>

          <SectionLabel text="דלתות" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['2', '4', '5'].map((d) => (
              <SelectChip key={d} label={d} selected={form.doors === d} onPress={() => set('doors', d)} />
            ))}
          </View>

          <SectionLabel text="מושבים" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['2', '4', '5', '7'].map((s) => (
              <SelectChip key={s} label={s} selected={form.seats === s} onPress={() => set('seats', s)} />
            ))}
          </View>
        </>
      )}

      {/* Vehicle hand applies to BOTH cars and motorcycles */}
      <SectionLabel text="יד רכב *" />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {['1', '2', '3', '4', '5', '6'].map((h) => (
          <SelectChip key={h} label={`יד ${h}`} selected={form.hand === h} onPress={() => set('hand', h)} />
        ))}
      </View>
    </View>
  )
}

// ─────────────────── STEP 2: Price + Location ─────────────────────────────────
function StepPrice({ form, set }: any) {
  const [citySearch, setCitySearch] = useState('')
  const filteredCities = citySearch
    ? ISRAELI_CITIES.filter((c) => c.includes(citySearch)).slice(0, 20)
    : ISRAELI_CITIES

  return (
    <View style={{ gap: 14 }}>
      <SectionLabel text="מחיר מבוקש (₪) *" />
      <View style={{ position: 'relative' }}>
        <FieldInput value={form.price} onChange={(v: string) => set('price', v)} placeholder="לדוגמה: 85000" keyboardType="numeric" />
      </View>
      {form.price ? (
        <Text style={{ color: '#D4A843', textAlign: 'right', fontSize: 14 }}>
          {formatILS(parseInt(form.price) || 0)}
        </Text>
      ) : null}

      <SectionLabel text="מיקום *" />
      <TextInput
        value={citySearch}
        onChangeText={setCitySearch}
        placeholder="חפש עיר..."
        placeholderTextColor="#555"
        textAlign="right"
        style={{
          backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12,
          color: '#F5F5F5', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        }}
      />
      <ScrollView style={{ maxHeight: 200 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {filteredCities.map((city) => (
            <SelectChip
              key={city}
              label={city}
              selected={form.location === city}
              onPress={() => { set('location', city); setCitySearch('') }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

// ─────────────────── STEP 3: Running Costs ───────────────────────────────────
function StepCosts({ form, set }: any) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: '#888', textAlign: 'right', fontSize: 14, marginBottom: 4 }}>
        הנתונים האלה עוזרים לקונים לחשב את עלות הבעלות הכוללת
      </Text>

      <SectionLabel text="עלות ביטוח שנתי (₪)" />
      <FieldInput value={form.insuranceEstimate} onChange={(v: string) => set('insuranceEstimate', v)} placeholder="לדוגמה: 5000" keyboardType="numeric" />

      <SectionLabel text="עלות תחזוקה שנתית (₪)" />
      <FieldInput value={form.maintenanceEstimate} onChange={(v: string) => set('maintenanceEstimate', v)} placeholder="לדוגמה: 3000" keyboardType="numeric" />

      <SectionLabel text="צריכת דלק (ל׳/100 ק״מ)" />
      <FieldInput value={form.fuelConsumption} onChange={(v: string) => set('fuelConsumption', v)} placeholder="לדוגמה: 7.5" keyboardType="decimal-pad" />

      <SectionLabel text={`שיעור פחת שנתי: ${form.depreciationRate}%`} />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {['5', '8', '10', '12', '15', '18', '20'].map((r) => (
          <SelectChip key={r} label={`${r}%`} selected={form.depreciationRate === r} onPress={() => set('depreciationRate', r)} />
        ))}
      </View>
    </View>
  )
}

// ─────────────────── STEP 4: Images + Description ────────────────────────────
function StepImages({ form, set, images, onPickImages, onRemoveImage, aiDescLoading, onGenerateDesc, onAddEquipment, onRemoveEquipment }: any) {
  const [newEquipmentText, setNewEquipmentText] = useState('')

  function handleAddEquipment() {
    if (!newEquipmentText.trim()) return
    onAddEquipment(newEquipmentText)
    setNewEquipmentText('')
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Images */}
      <SectionLabel text="תמונות (עד 6)" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {images.map((img: UploadedImage, idx: number) => (
          <View key={idx} style={{ width: 100, height: 80, borderRadius: 10, overflow: 'hidden', borderWidth: idx === 0 ? 2 : 0, borderColor: '#D4A843' }}>
            <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            {img.uploading && (
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color="#D4A843" size="small" />
              </View>
            )}
            {img.error && (
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(244,67,54,0.7)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 10 }}>שגיאה</Text>
              </View>
            )}
            {idx === 0 && !img.uploading && (
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(212,168,67,0.9)', alignItems: 'center' }}>
                <Text style={{ color: '#0F0F0F', fontSize: 10, fontWeight: '700' }}>שער</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => onRemoveImage(idx)}
              style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(244,67,54,0.9)', justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {images.length < 6 && (
          <TouchableOpacity
            onPress={onPickImages}
            style={{ width: 100, height: 80, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' }}
          >
            <Text style={{ fontSize: 28, color: '#888' }}>+</Text>
            <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>הוסף</Text>
          </TouchableOpacity>
        )}
      </View>
      {images.length > 0 && <Text style={{ color: '#888', fontSize: 12, textAlign: 'right' }}>התמונה הראשונה היא תמונת שער</Text>}

      {/* Description */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={onGenerateDesc} disabled={aiDescLoading}
          style={{ backgroundColor: 'rgba(212,168,67,0.15)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
        >
          {aiDescLoading
            ? <ActivityIndicator color="#D4A843" size="small" />
            : <Text style={{ color: '#D4A843', fontSize: 13, fontWeight: '600' }}>✨ צור תיאור אוטומטי</Text>
          }
        </TouchableOpacity>
        <Text style={{ color: '#F5F5F5', fontSize: 16, fontWeight: '700' }}>תיאור</Text>
      </View>

      <TextInput
        value={form.description}
        onChangeText={(v) => set('description', v)}
        placeholder="תאר את הרכב, מצבו, אביזרים מיוחדים..."
        placeholderTextColor="#555"
        multiline numberOfLines={5}
        textAlign="right"
        style={{
          backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14,
          color: '#F5F5F5', fontSize: 15, minHeight: 120,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
          textAlignVertical: 'top',
        }}
      />

      {/* Equipment */}
      <SectionLabel text="אביזרים ואיבזור" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={handleAddEquipment}
          disabled={!newEquipmentText.trim()}
          style={{
            backgroundColor: newEquipmentText.trim() ? '#D4A843' : '#333',
            borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center',
          }}
        >
          <Text style={{ color: newEquipmentText.trim() ? '#0F0F0F' : '#666', fontWeight: '700', fontSize: 18 }}>+</Text>
        </TouchableOpacity>
        <TextInput
          value={newEquipmentText}
          onChangeText={setNewEquipmentText}
          onSubmitEditing={handleAddEquipment}
          placeholder="לדוג׳: מזגן, ABS, מצלמת רוורס..."
          placeholderTextColor="#555"
          textAlign="right"
          returnKeyType="done"
          style={{
            flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
            padding: 14, color: '#F5F5F5', fontSize: 15,
          }}
        />
      </View>
      {form.equipment.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {form.equipment.map((item: string, idx: number) => (
            <TouchableOpacity
              key={idx}
              onPress={() => onRemoveEquipment(idx)}
              style={{
                flexDirection: 'row', gap: 6, alignItems: 'center',
                backgroundColor: 'rgba(212,168,67,0.1)', borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 6,
                borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
              }}
            >
              <Text style={{ color: '#F44336', fontSize: 12, fontWeight: '700' }}>✕</Text>
              <Text style={{ color: '#D4A843', fontSize: 13 }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Reason for selling */}
      <SectionLabel text="מדוע אתה מוכר?" />
      <TextInput
        value={form.sellerReason}
        onChangeText={(v) => set('sellerReason', v)}
        placeholder="לדוג׳: קניתי רכב חדש, עוזב הארץ..."
        placeholderTextColor="#555"
        multiline numberOfLines={3}
        textAlign="right"
        style={{
          backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14,
          color: '#F5F5F5', fontSize: 15, minHeight: 80,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
          textAlignVertical: 'top',
        }}
      />

    </View>
  )
}

// ─────────────────── Shared Primitives ───────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <Text style={{ color: '#F5F5F5', fontSize: 15, fontWeight: '700', textAlign: 'right' }}>{text}</Text>
}

function FieldInput({ value, onChange, placeholder, keyboardType = 'default', style = {} }: any) {
  return (
    <TextInput
      value={value} onChangeText={onChange}
      placeholder={placeholder} placeholderTextColor="#555"
      keyboardType={keyboardType} textAlign="right"
      style={[{
        backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12, padding: 14, color: '#F5F5F5', fontSize: 16,
      }, style]}
    />
  )
}

function SelectChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
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
