import { useState, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Toast from 'react-native-toast-message'
import { hrefWithReturn } from '../../src/lib/go-back-safe'
import { HEADER_DISMISS_FONT_SIZE } from '../../src/constants/ui'
import { useRecommendations } from '../../src/hooks/useRecommendations'
import { useFavorites, useToggleFavorite } from '../../src/hooks/useFavorites'
import { FeedListing, FuelType, VehicleType } from '../../src/types'
import {
  FUEL_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPES,
  FUEL_TYPES,
} from '../../src/constants/cars'
import ExploreCard, { CARD_WIDTH } from '../../src/components/explore/ExploreCard'
import Skeleton from '../../src/components/ui/Skeleton'
import { BrandModelPicker, CityPickerField, YearDropdown, BudgetSlider } from '../../src/components/ui/pickers'

// ── Types ─────────────────────────────────────────────────────────────────────

type SortOption = 'relevant' | 'newest' | 'price_asc' | 'price_desc' | 'mileage_asc'

interface FilterState {
  brands: string[]
  models: string[]
  vehicleTypes: VehicleType[]
  fuelTypes: FuelType[]
  priceMax: number | null
  yearMin: number | null
  mileageMax: number | null
  city: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_FILTERS: FilterState = {
  brands: [],
  models: [],
  vehicleTypes: [],
  fuelTypes: [],
  priceMax: null,
  yearMin: null,
  mileageMax: null,
  city: '',
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevant',    label: 'הכי רלוונטי עבורי' },
  { value: 'newest',      label: 'חדש באתר' },
  { value: 'price_asc',   label: 'מחיר: נמוך לגבוה' },
  { value: 'price_desc',  label: 'מחיר: גבוה לנמוך' },
  { value: 'mileage_asc', label: 'קילומטרז׳: נמוך לגבוה' },
]

const PRICE_PRESETS = [
  { value: 60_000,  label: 'עד ₪60K' },
  { value: 100_000, label: 'עד ₪100K' },
  { value: 150_000, label: 'עד ₪150K' },
  { value: 200_000, label: 'עד ₪200K' },
  { value: 250_000, label: 'עד ₪250K' },
]

const YEAR_PRESETS = [
  { value: 2016, label: '2016+' },
  { value: 2018, label: '2018+' },
  { value: 2020, label: '2020+' },
  { value: 2022, label: '2022+' },
  { value: 2024, label: '2024+' },
]

const MILEAGE_PRESETS = [
  { value: 30_000,  label: 'עד 30K' },
  { value: 60_000,  label: 'עד 60K' },
  { value: 100_000, label: 'עד 100K' },
  { value: 150_000, label: 'עד 150K' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyFilters(cards: FeedListing[], f: FilterState): FeedListing[] {
  return cards.filter((c) => {
    if (f.brands.length > 0 && !f.brands.includes(c.brand)) return false
    if (f.models.length > 0 && !f.models.includes(c.model)) return false
    if (f.vehicleTypes.length > 0 && !f.vehicleTypes.includes(c.vehicleType)) return false
    if (f.fuelTypes.length > 0 && !f.fuelTypes.includes(c.fuelType)) return false
    if (f.priceMax !== null && c.price > f.priceMax) return false
    if (f.yearMin !== null && c.year < f.yearMin) return false
    if (f.mileageMax !== null && c.mileage > f.mileageMax) return false
    if (f.city && c.location && !c.location.includes(f.city)) return false
    return true
  })
}

function applySort(cards: FeedListing[], sort: SortOption): FeedListing[] {
  const arr = [...cards]
  switch (sort) {
    case 'newest':      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'price_asc':   return arr.sort((a, b) => a.price - b.price)
    case 'price_desc':  return arr.sort((a, b) => b.price - a.price)
    case 'mileage_asc': return arr.sort((a, b) => a.mileage - b.mileage)
    default:            return arr
  }
}

function countActiveFilters(f: FilterState): number {
  let n = 0
  if (f.brands.length > 0) n++
  if (f.models.length > 0) n++
  if (f.vehicleTypes.length > 0) n++
  if (f.fuelTypes.length > 0) n++
  if (f.priceMax !== null) n++
  if (f.yearMin !== null) n++
  if (f.mileageMax !== null) n++
  if (f.city) n++
  return n
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const router = useRouter()
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useRecommendations()
  const { data: favorites } = useFavorites()
  const toggleFavorite = useToggleFavorite()

  const [sort, setSort] = useState<SortOption>('relevant')
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  // draft = what's in the modal before Apply
  const [draft, setDraft] = useState<FilterState>(INITIAL_FILTERS)
  const [showFilter, setShowFilter] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const favoriteIds = new Set(favorites?.map((f) => f.id) ?? [])
  const allCards = data?.pages.flatMap((p) => p.data) ?? []
  const filteredCards = useMemo(() => applyFilters(allCards, filters), [allCards, filters])
  const displayedCards = useMemo(() => applySort(filteredCards, sort), [filteredCards, sort])

  const activeCount = countActiveFilters(filters)
  const draftCount = countActiveFilters(draft)
  const draftFiltered = useMemo(() => applyFilters(allCards, draft), [allCards, draft])

  function openFilter() {
    setDraft(filters)
    setShowFilter(true)
  }

  function applyFilter() {
    setFilters(draft)
    setShowFilter(false)
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS)
    setDraft(INITIAL_FILTERS)
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    try { await refetch() } finally { setIsRefreshing(false) }
  }

  function toggleDraftVehicleType(vt: VehicleType) {
    setDraft((d) => ({
      ...d,
      vehicleTypes: d.vehicleTypes.includes(vt) ? d.vehicleTypes.filter((v) => v !== vt) : [...d.vehicleTypes, vt],
    }))
  }

  function toggleDraftFuelType(ft: FuelType) {
    setDraft((d) => ({
      ...d,
      fuelTypes: d.fuelTypes.includes(ft) ? d.fuelTypes.filter((v) => v !== ft) : [...d.fuelTypes, ft],
    }))
  }

  function toggleCompare(id: string) {
    if (compareIds.includes(id)) {
      setCompareIds((prev) => prev.filter((x) => x !== id))
    } else if (compareIds.length >= 3) {
      Toast.show({ type: 'error', text1: 'ניתן להשוות עד 3 רכבים' })
    } else {
      setCompareIds((prev) => [...prev, id])
    }
  }

  // ── Active filter chips (above grid) ──────────────────────────────────────

  function ActiveChips() {
    const chips: { label: string; onRemove: () => void }[] = []

    filters.brands.forEach((b) =>
      chips.push({ label: b, onRemove: () => setFilters((f) => ({ ...f, brands: f.brands.filter((x) => x !== b), models: [] })) })
    )
    filters.models.forEach((m) =>
      chips.push({ label: m, onRemove: () => setFilters((f) => ({ ...f, models: f.models.filter((x) => x !== m) })) })
    )
    if (filters.city)
      chips.push({ label: `📍 ${filters.city}`, onRemove: () => setFilters((f) => ({ ...f, city: '' })) })
    filters.vehicleTypes.forEach((vt) =>
      chips.push({ label: VEHICLE_TYPE_LABELS[vt], onRemove: () => setFilters((f) => ({ ...f, vehicleTypes: f.vehicleTypes.filter((v) => v !== vt) })) })
    )
    filters.fuelTypes.forEach((ft) =>
      chips.push({ label: FUEL_TYPE_LABELS[ft], onRemove: () => setFilters((f) => ({ ...f, fuelTypes: f.fuelTypes.filter((v) => v !== ft) })) })
    )
    if (filters.priceMax !== null)
      chips.push({ label: `עד ₪${(filters.priceMax / 1000).toFixed(0)}K`, onRemove: () => setFilters((f) => ({ ...f, priceMax: null })) })
    if (filters.yearMin !== null)
      chips.push({ label: `${filters.yearMin}+`, onRemove: () => setFilters((f) => ({ ...f, yearMin: null })) })
    if (filters.mileageMax !== null)
      chips.push({ label: `עד ${(filters.mileageMax / 1000).toFixed(0)}K ק"מ`, onRemove: () => setFilters((f) => ({ ...f, mileageMax: null })) })

    if (chips.length === 0) return null

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 6, alignItems: 'center' }}
        style={{ flexGrow: 0, flexShrink: 0 }}
      >
        {chips.map((chip, i) => (
          <TouchableOpacity
            key={i}
            onPress={chip.onRemove}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 11,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: 'rgba(212,168,67,0.15)',
              borderWidth: 1,
              borderColor: '#D4A843',
            }}
          >
            <Text style={{ color: '#D4A843', fontSize: 12, fontWeight: '600' }}>{chip.label}</Text>
            <Text style={{ color: '#D4A843', fontSize: 12 }}>✕</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={clearFilters}
          style={{ paddingHorizontal: 10, paddingVertical: 5 }}
        >
          <Text style={{ color: '#666', fontSize: 12 }}>נקה הכל</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
        <ExploreHeader
          activeCount={0}
          onFilterPress={() => {}}
          onSortPress={() => {}}
          onSwipePress={() => router.push('/(tabs)/swipe')}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width={CARD_WIDTH} height={CARD_WIDTH * 1.35} borderRadius={14} />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ color: '#F5F5F5', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 20 }}>שגיאה בטעינת הרכבים</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>נסה שוב</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>

      <ExploreHeader
        activeCount={activeCount}
        onFilterPress={openFilter}
        onSortPress={() => setShowSort(true)}
        onSwipePress={() => router.push('/(tabs)/swipe')}
      />

      {/* Active filter chips */}
      <ActiveChips />

      {/* Status line */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Text style={{ color: '#555', fontSize: 11 }}>
          {activeCount > 0
            ? `${displayedCards.length} תוצאות`
            : `${allCards.length} רכבים${hasNextPage ? ' — גלול לעוד' : ''}`}
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={displayedCards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: compareIds.length >= 2 ? 120 : 100 }}
        columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#D4A843" colors={['#D4A843']} />
        }
        renderItem={({ item }) => (
          <ExploreCard
            car={item}
            isFavorited={favoriteIds.has(item.id)}
            onPress={() => router.push(`/listing/${item.id}`)}
            onToggleFavorite={() => toggleFavorite.mutate({ listingId: item.id, isFavorited: favoriteIds.has(item.id) })}
            isSelected={compareIds.includes(item.id)}
            onToggleCompare={() => toggleCompare(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 56, paddingHorizontal: 24 }}>
            {activeCount > 0 ? (
              <>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
                <Text style={{ color: '#F5F5F5', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                  אין תוצאות לסינון הזה
                </Text>
                <Text style={{ color: '#888', textAlign: 'center', marginBottom: 20, fontSize: 14, lineHeight: 20 }}>
                  נסה להרחיב את הסינון — למשל הסר אחד מהתנאים
                </Text>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#0F0F0F', fontWeight: '700' }}>נקה סינון</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🚗</Text>
                <Text style={{ color: '#F5F5F5', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                  לא נמצאו רכבים כרגע
                </Text>
                <TouchableOpacity
                  onPress={() => router.push(hrefWithReturn('/(tabs)/settings/preferences', 'explore'))}
                  style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#0F0F0F', fontWeight: '700' }}>⚙️ עדכן העדפות</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color="#D4A843" />
            </View>
          ) : !hasNextPage && allCards.length > 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Text style={{ color: '#555', fontSize: 12, textAlign: 'center' }}>
                הוצגו כל {allCards.length} הרכבים הזמינים
              </Text>
            </View>
          ) : null
        }
      />

      {/* Floating compare button */}
      {compareIds.length >= 2 && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#0F0F0F', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
          paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24,
        }}>
          <TouchableOpacity
            onPress={() => {
              const q = encodeURIComponent(compareIds.join(','))
              router.push(`/compare?ids=${q}`)
            }}
            style={{ backgroundColor: '#D4A843', borderRadius: 14, padding: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>
              ⚖️ השווה {compareIds.length} רכבים
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Filter bottom sheet ────────────────────────────────────────────── */}
      <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }}
            activeOpacity={1}
            onPress={() => setShowFilter(false)}
          />
          {/* Sheet */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              backgroundColor: '#141414',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              height: '88%',
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.07)',
              }}>
                <TouchableOpacity onPress={() => setDraft(INITIAL_FILTERS)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={{ color: '#888', fontSize: 14 }}>איפוס</Text>
                </TouchableOpacity>
                <Text style={{ color: '#F5F5F5', fontSize: 17, fontWeight: '800' }}>סינון רכבים</Text>
                <TouchableOpacity onPress={() => setShowFilter(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={{ color: '#D4A843', fontSize: HEADER_DISMISS_FONT_SIZE, fontWeight: '600' }}>סגור</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable content */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* ── יצרן + דגם ── */}
                <FilterSection title="יצרן ודגם" emoji="🚘">
                  <BrandModelPicker
                    selectedBrands={draft.brands}
                    selectedModels={draft.models}
                    onBrandsChange={(brands) => setDraft((d) => ({ ...d, brands }))}
                    onModelsChange={(models) => setDraft((d) => ({ ...d, models }))}
                  />
                </FilterSection>

                <FilterDivider />

                {/* ── שנה ── */}
                <FilterSection title="שנה מינימלית" emoji="📅">
                  <YearDropdown
                    value={draft.yearMin}
                    onChange={(y) => setDraft((d) => ({ ...d, yearMin: y }))}
                    placeholder="כל השנים"
                  />
                </FilterSection>

                <FilterDivider />

                {/* ── מחיר ── */}
                <FilterSection title="מחיר מקסימלי" emoji="💰">
                  <BudgetSlider
                    value={draft.priceMax ?? 500000}
                    min={20000}
                    max={500000}
                    step={10000}
                    onChange={(v) => setDraft((d) => ({ ...d, priceMax: v >= 500000 ? null : v }))}
                    noMaxLabel="ללא הגבלה"
                  />
                </FilterSection>

                <FilterDivider />

                {/* ── קילומטרז' ── */}
                <FilterSection title="קילומטרז׳ מקסימלי" emoji="🛣️">
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                    {MILEAGE_PRESETS.map((m) => (
                      <PresetChip
                        key={m.value}
                        label={m.label}
                        active={draft.mileageMax === m.value}
                        onPress={() => setDraft((d) => ({ ...d, mileageMax: d.mileageMax === m.value ? null : m.value }))}
                      />
                    ))}
                  </View>
                </FilterSection>

                <FilterDivider />

                {/* ── מיקום ── */}
                <FilterSection title="מיקום" emoji="📍">
                  <CityPickerField
                    value={draft.city}
                    onChange={(city) => setDraft((d) => ({ ...d, city }))}
                  />
                </FilterSection>

                <FilterDivider />

                {/* ── סוג דלק ── */}
                <FilterSection title="סוג דלק" emoji="⛽">
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                    {FUEL_TYPES.map((ft) => (
                      <PresetChip
                        key={ft}
                        label={FUEL_TYPE_LABELS[ft]}
                        active={draft.fuelTypes.includes(ft)}
                        onPress={() => toggleDraftFuelType(ft)}
                      />
                    ))}
                  </View>
                </FilterSection>

                <FilterDivider />

                {/* ── סוג רכב ── */}
                <FilterSection title="סוג רכב" emoji="🚙">
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                    {VEHICLE_TYPES.map((vt) => (
                      <PresetChip
                        key={vt}
                        label={VEHICLE_TYPE_LABELS[vt]}
                        active={draft.vehicleTypes.includes(vt)}
                        onPress={() => toggleDraftVehicleType(vt)}
                      />
                    ))}
                  </View>
                </FilterSection>
              </ScrollView>

              {/* Apply button */}
              <View style={{
                padding: 16,
                paddingBottom: Platform.OS === 'ios' ? 34 : 16,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.07)',
              }}>
                <TouchableOpacity
                  onPress={applyFilter}
                  style={{ backgroundColor: '#D4A843', borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}
                >
                  <Text style={{ color: '#0F0F0F', fontWeight: '800', fontSize: 16 }}>
                    {draftCount === 0 ? 'הצג את כל הרכבים' : `הצג ${draftFiltered.length} רכבים`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Sort modal ─────────────────────────────────────────────────────── */}
      <Modal visible={showSort} transparent animationType="slide" onRequestClose={() => setShowSort(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setShowSort(false)}
        >
          <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 }}>
            <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 18, textAlign: 'right', marginBottom: 16 }}>מיון תוצאות</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { setSort(opt.value); setShowSort(false) }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: sort === opt.value ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.04)',
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: sort === opt.value ? '#D4A843' : '#F5F5F5', fontSize: 16, fontWeight: sort === opt.value ? '700' : '400' }}>
                  {opt.label}
                </Text>
                {sort === opt.value && <Text style={{ color: '#D4A843', marginLeft: 10, fontSize: 16 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ExploreHeader({
  activeCount,
  onFilterPress,
  onSortPress,
  onSwipePress,
}: {
  activeCount: number
  onFilterPress: () => void
  onSortPress: () => void
  onSwipePress: () => void
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
      gap: 10,
    }}>
      {/* Sort — left */}
      <TouchableOpacity
        onPress={onSortPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: '#1A1A1A',
          borderRadius: 10,
          paddingHorizontal: 11,
          paddingVertical: 7,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Text style={{ color: '#D4A843', fontSize: 14 }}>↕</Text>
        <Text style={{ color: '#888', fontSize: 12 }}>מיון</Text>
      </TouchableOpacity>

      {/* Filter — center-left */}
      <TouchableOpacity
        onPress={onFilterPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: activeCount > 0 ? 'rgba(212,168,67,0.15)' : '#1A1A1A',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderWidth: 1,
          borderColor: activeCount > 0 ? '#D4A843' : 'rgba(255,255,255,0.1)',
        }}
      >
        <Text style={{ color: activeCount > 0 ? '#D4A843' : '#888', fontSize: 12 }}>סינון</Text>
        {activeCount > 0 ? (
          <View style={{
            backgroundColor: '#D4A843',
            borderRadius: 8,
            minWidth: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}>
            <Text style={{ color: '#0F0F0F', fontSize: 10, fontWeight: '800' }}>{activeCount}</Text>
          </View>
        ) : (
          <Text style={{ color: '#888', fontSize: 13 }}>⚙️</Text>
        )}
      </TouchableOpacity>

      {/* Title */}
      <Text style={{ color: '#F5F5F5', fontSize: 20, fontWeight: '800' }}>גילוי 🔍</Text>

      {/* Swipe — right */}
      <TouchableOpacity
        onPress={onSwipePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: '#1A1A1A',
          borderRadius: 10,
          paddingHorizontal: 11,
          paddingVertical: 7,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Text style={{ color: '#888', fontSize: 12 }}>סוויפ</Text>
        <Text style={{ fontSize: 13 }}>🔥</Text>
      </TouchableOpacity>
    </View>
  )
}

function FilterSection({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
        <Text style={{ color: '#F5F5F5', fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      {children}
    </View>
  )
}

function FilterDivider() {
  return <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 20 }} />
}

function PresetChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: active ? '#D4A843' : 'rgba(255,255,255,0.14)',
        backgroundColor: active ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.03)',
      }}
    >
      <Text style={{ color: active ? '#D4A843' : '#999', fontSize: 13, fontWeight: active ? '700' : '400' }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
