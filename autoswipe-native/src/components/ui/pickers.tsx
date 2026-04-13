/**
 * Shared picker components used across the filter modal and preferences screen.
 * BrandModelPicker, CityPickerField, YearDropdown, BudgetSlider
 */
import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Modal, FlatList, Platform,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { ISRAELI_CITIES } from '../../constants/cities'
import { CAR_BRANDS, CAR_MODELS } from '../../constants/cars'

// ─── BrandModelPicker ─────────────────────────────────────────────────────────
// Select brands → selected brands expand to show their models below

interface BrandModelPickerProps {
  selectedBrands: string[]
  selectedModels: string[]
  onBrandsChange: (brands: string[]) => void
  onModelsChange: (models: string[]) => void
}

export function BrandModelPicker({
  selectedBrands,
  selectedModels,
  onBrandsChange,
  onModelsChange,
}: BrandModelPickerProps) {
  function toggleBrand(brand: string) {
    if (selectedBrands.includes(brand)) {
      // remove brand + its models
      const brandModels = CAR_MODELS[brand] ?? []
      onBrandsChange(selectedBrands.filter((b) => b !== brand))
      onModelsChange(selectedModels.filter((m) => !brandModels.includes(m)))
    } else {
      onBrandsChange([...selectedBrands, brand])
    }
  }

  function toggleModel(model: string) {
    onModelsChange(
      selectedModels.includes(model)
        ? selectedModels.filter((m) => m !== model)
        : [...selectedModels, model]
    )
  }

  return (
    <View>
      {/* Brand chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
        {CAR_BRANDS.map((brand) => {
          const active = selectedBrands.includes(brand)
          return (
            <TouchableOpacity
              key={brand}
              onPress={() => toggleBrand(brand)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: active ? '#D4A843' : 'rgba(255,255,255,0.14)',
                backgroundColor: active ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.03)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {active && <Text style={{ color: '#D4A843', fontSize: 11 }}>✓</Text>}
              <Text style={{
                color: active ? '#D4A843' : '#999',
                fontSize: 13,
                fontWeight: active ? '700' : '400',
              }}>
                {brand}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Model sections — one per selected brand */}
      {selectedBrands.map((brand) => {
        const models = CAR_MODELS[brand]
        if (!models) return null
        const allSelected = models.every((m) => selectedModels.includes(m))
        return (
          <View key={brand} style={{
            marginTop: 14,
            backgroundColor: 'rgba(212,168,67,0.05)',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(212,168,67,0.2)',
            padding: 14,
          }}>
            {/* Brand header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <TouchableOpacity onPress={() => {
                if (allSelected) {
                  onModelsChange(selectedModels.filter((m) => !models.includes(m)))
                } else {
                  const newModels = Array.from(new Set([...selectedModels, ...models]))
                  onModelsChange(newModels)
                }
              }}>
                <Text style={{ color: '#D4A843', fontSize: 12, fontWeight: '600' }}>
                  {allSelected ? 'בטל הכל' : 'בחר הכל'}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: '#D4A843', fontSize: 14, fontWeight: '800' }}>
                {brand} ↳
              </Text>
            </View>

            {/* Hint if no model selected */}
            {models.filter((m) => selectedModels.includes(m)).length === 0 && (
              <Text style={{ color: '#666', fontSize: 11, textAlign: 'right', marginBottom: 8 }}>
                לא בחרת דגם — יוצגו כל דגמי {brand}
              </Text>
            )}

            {/* Model chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'flex-end' }}>
              {models.map((model) => {
                const active = selectedModels.includes(model)
                return (
                  <TouchableOpacity
                    key={model}
                    onPress={() => toggleModel(model)}
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: active ? '#D4A843' : 'rgba(255,255,255,0.18)',
                      backgroundColor: active ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <Text style={{ color: active ? '#D4A843' : '#bbb', fontSize: 12, fontWeight: active ? '700' : '400' }}>
                      {model}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ─── CityPickerField ──────────────────────────────────────────────────────────
// Text input with live autocomplete dropdown

interface CityPickerFieldProps {
  value: string
  onChange: (city: string) => void
  placeholder?: string
}

export function CityPickerField({ value, onChange, placeholder = 'חפש עיר...' }: CityPickerFieldProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const suggestions = query.trim()
    ? ISRAELI_CITIES.filter((c) => c.includes(query.trim())).slice(0, 8)
    : ISRAELI_CITIES.slice(0, 8)

  function select(city: string) {
    onChange(city)
    setQuery('')
    setOpen(false)
  }

  function clear() {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  return (
    <View>
      {/* Input row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: open || value ? '#D4A843' : 'rgba(255,255,255,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 0,
        gap: 8,
      }}>
        {value ? (
          <>
            <TouchableOpacity onPress={clear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: '#888', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, color: '#D4A843', fontSize: 15, fontWeight: '600', textAlign: 'right', paddingVertical: 13 }}>
              📍 {value}
            </Text>
          </>
        ) : (
          <>
            <Text style={{ color: '#666', fontSize: 16 }}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={(t) => { setQuery(t); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              placeholderTextColor="#555"
              style={{ flex: 1, color: '#F5F5F5', fontSize: 15, textAlign: 'right', paddingVertical: 13 }}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </>
        )}
      </View>

      {/* Dropdown */}
      {open && !value && (
        <View style={{
          backgroundColor: '#1E1E1E',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(212,168,67,0.3)',
          marginTop: 4,
          overflow: 'hidden',
        }}>
          {suggestions.length === 0 ? (
            <Text style={{ color: '#666', textAlign: 'right', padding: 14, fontSize: 14 }}>לא נמצאו ערים</Text>
          ) : (
            suggestions.map((city, i) => (
              <TouchableOpacity
                key={city}
                onPress={() => select(city)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  borderBottomWidth: i < suggestions.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <Text style={{ color: '#F5F5F5', textAlign: 'right', fontSize: 15 }}>{city}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  )
}

// ─── YearDropdown ─────────────────────────────────────────────────────────────
// Compact dropdown for selecting a year

const YEARS = Array.from({ length: 2026 - 2000 }, (_, i) => 2025 - i) // 2025..2000

interface YearDropdownProps {
  value: number | null
  onChange: (year: number | null) => void
  placeholder?: string
}

export function YearDropdown({ value, onChange, placeholder = 'בחר שנה' }: YearDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <View>
      {/* Trigger button */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1E1E1E',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: value ? '#D4A843' : 'rgba(255,255,255,0.1)',
          paddingHorizontal: 16,
          paddingVertical: 13,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {value && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onChange(null) }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: '#888', fontSize: 15 }}>✕</Text>
            </TouchableOpacity>
          )}
          <Text style={{ color: '#888', fontSize: 14 }}>▼</Text>
        </View>
        <Text style={{ color: value ? '#D4A843' : '#666', fontSize: 15, fontWeight: value ? '700' : '400' }}>
          {value ? `${value} ומעלה` : placeholder}
        </Text>
      </TouchableOpacity>

      {/* Modal picker */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={{
            backgroundColor: '#1A1A1A',
            borderRadius: 20,
            width: '70%',
            maxHeight: 400,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', alignItems: 'center' }}>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 16 }}>בחר שנה</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => { onChange(null); setOpen(false) }}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                  backgroundColor: !value ? 'rgba(212,168,67,0.1)' : 'transparent',
                }}
              >
                <Text style={{ color: !value ? '#D4A843' : '#888', fontSize: 15 }}>ללא הגבלה</Text>
              </TouchableOpacity>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  onPress={() => { onChange(y); setOpen(false) }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.06)',
                    alignItems: 'center',
                    backgroundColor: value === y ? 'rgba(212,168,67,0.1)' : 'transparent',
                  }}
                >
                  <Text style={{ color: value === y ? '#D4A843' : '#F5F5F5', fontSize: 15, fontWeight: value === y ? '700' : '400' }}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

// ─── BudgetSlider ─────────────────────────────────────────────────────────────

interface BudgetSliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  /** If true, show ∞ label when at max */
  noMaxLabel?: string
}

export function BudgetSlider({
  value,
  min = 20000,
  max = 500000,
  step = 10000,
  onChange,
  noMaxLabel,
}: BudgetSliderProps) {
  const isAtMax = value >= max

  function formatValue(v: number): string {
    if (v >= 1000000) return `₪${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `₪${Math.round(v / 1000)}K`
    return `₪${v}`
  }

  return (
    <View>
      {/* Value display */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: '#D4A843', fontSize: 26, fontWeight: '800' }}>
          {isAtMax && noMaxLabel ? noMaxLabel : formatValue(value)}
        </Text>
        {isAtMax && noMaxLabel && (
          <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>ללא הגבלת תקציב</Text>
        )}
      </View>

      {/* Slider */}
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor="#D4A843"
        maximumTrackTintColor="rgba(255,255,255,0.12)"
        thumbTintColor="#D4A843"
        style={{ width: '100%', height: 40 }}
      />

      {/* Min / Max labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ color: '#555', fontSize: 11 }}>{formatValue(max)}{noMaxLabel ? '+' : ''}</Text>
        <Text style={{ color: '#555', fontSize: 11 }}>{formatValue(min)}</Text>
      </View>
    </View>
  )
}
