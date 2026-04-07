import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../../../src/lib/api'
import {
  CAR_BRANDS, FUEL_TYPES, VEHICLE_TYPES,
  FUEL_TYPE_LABELS, VEHICLE_TYPE_LABELS, TRANSMISSION_LABELS,
} from '../../../src/constants/cars'
import { ISRAELI_CITIES } from '../../../src/constants/cities'
import { FuelType, VehicleType, Transmission } from '../../../src/types'
import { formatILS } from '../../../src/lib/utils/format'

const STEPS = ['רכב', 'פרטים', 'מחיר', 'עלויות', 'תמונות']
const CURRENT_YEAR = new Date().getFullYear()
const DRAFT_KEY = 'autoswipe_create_draft'

interface FormData {
  brand: string; model: string; year: string; fuelType: FuelType | ''
  vehicleType: VehicleType | ''; transmission: Transmission | ''
  engineSize: string; color: string
  mileage: string; doors: string; seats: string
  price: string; location: string
  insuranceEstimate: string; maintenanceEstimate: string
  depreciationRate: string; fuelConsumption: string
  description: string; sellerReason: string
  equipment: string[]
  plateNumber: string; isGovVerified: boolean
  messagingMode: 'OPEN' | 'SELLER_FIRST'
}

interface UploadedImage { uri: string; cloudUrl?: string; publicId?: string; uploading: boolean; error?: string }

export default function CreateListingScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [plateLoading, setPlateLoading] = useState(false)
  const [aiDescLoading, setAiDescLoading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])

  const [form, setForm] = useState<FormData>({
    brand: '', model: '', year: '', fuelType: '', vehicleType: '', transmission: '',
    engineSize: '', color: '',
    mileage: '', doors: '4', seats: '5',
    price: '', location: '',
    insuranceEstimate: '', maintenanceEstimate: '', depreciationRate: '12', fuelConsumption: '',
    description: '', sellerReason: '',
    equipment: [],
    plateNumber: '', isGovVerified: false,
    messagingMode: 'OPEN',
  })

  // Restore draft on mount
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return
      try {
        const saved = JSON.parse(raw)
        setForm((f) => ({ ...f, ...saved }))
      } catch { /* ignore corrupt draft */ }
    })
  }, [])

  // Auto-save draft on every form change
  useEffect(() => {
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  }, [form])

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
      const vehicle = res?.data ?? res
      if (vehicle) {
        setForm((f) => ({
          ...f,
          brand: vehicle.brand || f.brand,
          model: vehicle.model || f.model,
          year: vehicle.year?.toString() || f.year,
          fuelType: vehicle.fuelType || f.fuelType,
          color: vehicle.color || f.color,
          vehicleType: vehicle.vehicleType || f.vehicleType,
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
        const sign = await api.post<any>('/api/upload/sign', { folder: 'listings' })
        const formData = new FormData()
        formData.append('file', { uri: slots[i].uri, name: 'photo.jpg', type: 'image/jpeg' } as any)
        formData.append('signature', sign.signature)
        formData.append('timestamp', sign.timestamp.toString())
        formData.append('api_key', sign.apiKey)
        formData.append('folder', 'listings')

        const upload = await fetch(
          `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
          { method: 'POST', body: formData }
        )
        const data = await upload.json()
        setImages((prev) => prev.map((img, j) =>
          j === idx ? { ...img, cloudUrl: data.secure_url, publicId: data.public_id, uploading: false } : img
        ))
      } catch {
        setImages((prev) => prev.map((img, j) =>
          j === idx ? { ...img, uploading: false, error: 'שגיאת העלאה' } : img
        ))
      }
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  async function publish() {
    const hasUploading = images.some((i) => i.uploading)
    if (hasUploading) { Toast.show({ type: 'error', text1: 'יש תמונות שעדיין בהעלאה' }); return }
    if (!images.length) { Toast.show({ type: 'error', text1: 'נדרשת לפחות תמונה אחת' }); return }
    if (!form.brand || !form.model || !form.price || !form.mileage || !form.location) {
      Toast.show({ type: 'error', text1: 'נא למלא את כל השדות הנדרשים' })
      return
    }

    setPublishing(true)
    try {
      await api.post('/api/listings', {
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
        insuranceEstimate: parseInt(form.insuranceEstimate) || 5000,
        maintenanceEstimate: parseInt(form.maintenanceEstimate) || 3000,
        depreciationRate: parseInt(form.depreciationRate) / 100 || 0.12,
        description: form.description || undefined,
        sellerReason: form.sellerReason || undefined,
        equipment: form.equipment.length > 0 ? form.equipment : undefined,
        messagingMode: form.messagingMode,
        plateNumber: form.plateNumber || undefined,
        isGovVerified: form.isGovVerified,
        images: images.filter((i) => i.cloudUrl).map((i) => ({ url: i.cloudUrl!, publicId: i.publicId })),
      })
      qc.invalidateQueries({ queryKey: ['my-listings'] })
      await AsyncStorage.removeItem(DRAFT_KEY)
      Toast.show({ type: 'success', text1: 'המודעה פורסמה! 🎉', visibilityTime: 2500 })
      router.replace('/(tabs)/dashboard')
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'שגיאה בפרסום' })
    } finally {
      setPublishing(false)
    }
  }

  const canPublish = !publishing && images.length > 0 && !images.some((i) => i.uploading)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : router.back()}>
            <Text style={{ color: '#D4A843', fontSize: 16 }}>{step > 0 ? '→ חזור' : 'סגור'}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#F5F5F5', fontSize: 18, fontWeight: '700' }}>פרסום רכב</Text>
          <Text style={{ color: '#888', fontSize: 14 }}>{step + 1}/{STEPS.length}</Text>
        </View>

        {/* Progress */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 6, marginBottom: 8 }}>
          {STEPS.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? '#D4A843' : '#333' }} />
          ))}
        </View>

        <Text style={{ color: '#888', textAlign: 'center', fontSize: 13, marginBottom: 8 }}>
          {STEPS[step]}
        </Text>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
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
          padding: 16, paddingBottom: 28,
        }}>
          {step < STEPS.length - 1 ? (
            <TouchableOpacity
              onPress={() => setStep(step + 1)}
              style={{ backgroundColor: '#D4A843', borderRadius: 14, padding: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>הבא ←</Text>
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
                : <Text style={{ color: canPublish ? '#0F0F0F' : '#666', fontWeight: '700', fontSize: 16 }}>פרסם רכב 🚗</Text>
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
            <SelectChip key={b} label={b} selected={form.brand === b} onPress={() => set('brand', b)} />
          ))}
        </View>
      </ScrollView>

      <SectionLabel text="דגם *" />
      <FieldInput value={form.model} onChange={(v: string) => set('model', v)} placeholder="לדוגמה: Corolla" />

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
  return (
    <View style={{ gap: 14 }}>
      <SectionLabel text="קילומטרים *" />
      <FieldInput value={form.mileage} onChange={(v: string) => set('mileage', v)} placeholder="לדוגמה: 45000" keyboardType="numeric" />

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

      {/* Messaging mode */}
      <SectionLabel text="מצב הודעות" />
      <Text style={{ color: '#888', fontSize: 13, textAlign: 'right', marginTop: -8 }}>
        כיצד קונים יוכלו לפנות אליך
      </Text>

      <TouchableOpacity
        onPress={() => set('messagingMode', 'OPEN')}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
          gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5,
          borderColor: form.messagingMode === 'OPEN' ? '#D4A843' : 'rgba(255,255,255,0.1)',
          backgroundColor: form.messagingMode === 'OPEN' ? 'rgba(212,168,67,0.08)' : '#1A1A1A',
        }}
      >
        <View style={{ alignItems: 'flex-end', flex: 1 }}>
          <Text style={{ color: '#F5F5F5', fontWeight: '600', fontSize: 15 }}>📨 פתוח לפניות</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 3 }}>
            קונים שלחצו לייק יכולים לשלוח עד 3 הודעות
          </Text>
        </View>
        <View style={{
          width: 22, height: 22, borderRadius: 11, borderWidth: 2,
          borderColor: form.messagingMode === 'OPEN' ? '#D4A843' : '#555',
          backgroundColor: form.messagingMode === 'OPEN' ? '#D4A843' : 'transparent',
          justifyContent: 'center', alignItems: 'center',
        }}>
          {form.messagingMode === 'OPEN' && (
            <Text style={{ color: '#0F0F0F', fontSize: 11, fontWeight: '900' }}>✓</Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => set('messagingMode', 'SELLER_FIRST')}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
          gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5,
          borderColor: form.messagingMode === 'SELLER_FIRST' ? '#D4A843' : 'rgba(255,255,255,0.1)',
          backgroundColor: form.messagingMode === 'SELLER_FIRST' ? 'rgba(212,168,67,0.08)' : '#1A1A1A',
        }}
      >
        <View style={{ alignItems: 'flex-end', flex: 1 }}>
          <Text style={{ color: '#F5F5F5', fontWeight: '600', fontSize: 15 }}>🔒 אני יוזם</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 3 }}>
            רק אתה יכול להתחיל שיחה עם קונים
          </Text>
        </View>
        <View style={{
          width: 22, height: 22, borderRadius: 11, borderWidth: 2,
          borderColor: form.messagingMode === 'SELLER_FIRST' ? '#D4A843' : '#555',
          backgroundColor: form.messagingMode === 'SELLER_FIRST' ? '#D4A843' : 'transparent',
          justifyContent: 'center', alignItems: 'center',
        }}>
          {form.messagingMode === 'SELLER_FIRST' && (
            <Text style={{ color: '#0F0F0F', fontSize: 11, fontWeight: '900' }}>✓</Text>
          )}
        </View>
      </TouchableOpacity>
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
