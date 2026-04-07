import { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
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

// ── Types ─────────────────────────────────────────────────────────────────────

type SortOption = 'relevant' | 'newest' | 'price_asc' | 'price_desc' | 'mileage_asc'

interface FilterState {
  vehicleTypes: VehicleType[]
  fuelTypes: FuelType[]
  priceMax: number | null
  yearMin: number | null
  mileageMax: number | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_FILTERS: FilterState = {
  vehicleTypes: [],
  fuelTypes: [],
  priceMax: null,
  yearMin: null,
  mileageMax: null,
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevant',     label: 'הכי רלוונטי עבורי' },
  { value: 'newest',       label: 'חדש באתר' },
  { value: 'price_asc',    label: 'מחיר: נמוך לגבוה' },
  { value: 'price_desc',   label: 'מחיר: גבוה לנמוך' },
  { value: 'mileage_asc',  label: 'קילומטרז\': נמוך לגבוה' },
]

const PRICE_PRESETS = [
  { value: 100_000, label: 'עד ₪100K' },
  { value: 150_000, label: 'עד ₪150K' },
  { value: 200_000, label: 'עד ₪200K' },
  { value: 250_000, label: 'עד ₪250K' },
]

const YEAR_PRESETS = [
  { value: 2018, label: '2018+' },
  { value: 2020, label: '2020+' },
  { value: 2022, label: '2022+' },
]

const MILEAGE_PRESETS = [
  { value: 50_000,  label: 'עד 50K ק"מ' },
  { value: 100_000, label: 'עד 100K ק"מ' },
  { value: 150_000, label: 'עד 150K ק"מ' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyFilters(cards: FeedListing[], f: FilterState): FeedListing[] {
  return cards.filter((c) => {
    if (f.vehicleTypes.length > 0 && !f.vehicleTypes.includes(c.vehicleType)) return false
    if (f.fuelTypes.length > 0 && !f.fuelTypes.includes(c.fuelType)) return false
    if (f.priceMax !== null && c.price > f.priceMax) return false
    if (f.yearMin !== null && c.year < f.yearMin) return false
    if (f.mileageMax !== null && c.mileage > f.mileageMax) return false
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
    default:            return arr // relevant = original API order (matchScore)
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const router = useRouter()
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useRecommendations()
  const { data: favorites } = useFavorites()
  const toggleFavorite = useToggleFavorite()

  const [sort, setSort] = useState<SortOption>('relevant')
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [showSort, setShowSort] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const favoriteIds = new Set(favorites?.map((f) => f.id) ?? [])
  const allCards = data?.pages.flatMap((p) => p.data) ?? []
  const filteredCards = applyFilters(allCards, filters)
  const displayedCards = applySort(filteredCards, sort)

  const hasActiveFilters =
    filters.vehicleTypes.length > 0 ||
    filters.fuelTypes.length > 0 ||
    filters.priceMax !== null ||
    filters.yearMin !== null ||
    filters.mileageMax !== null

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? ''

  async function handleRefresh() {
    setIsRefreshing(true)
    try { await refetch() } finally { setIsRefreshing(false) }
  }

  function toggleVehicleType(vt: VehicleType) {
    setFilters((f) => ({
      ...f,
      vehicleTypes: f.vehicleTypes.includes(vt)
        ? f.vehicleTypes.filter((v) => v !== vt)
        : [...f.vehicleTypes, vt],
    }))
  }

  function toggleFuelType(ft: FuelType) {
    setFilters((f) => ({
      ...f,
      fuelTypes: f.fuelTypes.includes(ft)
        ? f.fuelTypes.filter((v) => v !== ft)
        : [...f.fuelTypes, ft],
    }))
  }

  function togglePriceMax(value: number) {
    setFilters((f) => ({ ...f, priceMax: f.priceMax === value ? null : value }))
  }

  function toggleYearMin(value: number) {
    setFilters((f) => ({ ...f, yearMin: f.yearMin === value ? null : value }))
  }

  function toggleMileageMax(value: number) {
    setFilters((f) => ({ ...f, mileageMax: f.mileageMax === value ? null : value }))
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS)
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
        <ExploreHeader
          sortLabel={currentSortLabel}
          onSortPress={() => {}}
          onSwipePress={() => router.push('/(tabs)/swipe')}
        />
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap',
          padding: 16, gap: 8,
        }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width={CARD_WIDTH} height={CARD_WIDTH * 1.35} borderRadius={14} />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ color: '#F5F5F5', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 20 }}>
          שגיאה בטעינת הרכבים
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>נסה שוב</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>

      {/* Fixed header */}
      <ExploreHeader
        sortLabel={currentSortLabel}
        onSortPress={() => setShowSort(true)}
        onSwipePress={() => router.push('/(tabs)/swipe')}
      />

      {/* Status line */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#888888', fontSize: 12, flex: 1, textAlign: 'right' }}>
          {hasActiveFilters
            ? `מציג ${displayedCards.length} מתוך ${allCards.length} רכבים שנטענו — פילטר פעיל`
            : `נטענו ${allCards.length} רכבים${hasNextPage ? ' — גלול לטעון עוד' : ''}`
          }
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters} style={{ marginRight: 12 }}>
            <Text style={{ color: '#D4A843', fontSize: 12, fontWeight: '600' }}>נקה ✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 7, alignItems: 'center' }}
        style={{ flexGrow: 0, flexShrink: 0 }}
      >
        {/* Vehicle types */}
        {VEHICLE_TYPES.slice(0, 5).map((vt) => (
          <FilterChip
            key={vt}
            label={VEHICLE_TYPE_LABELS[vt]}
            active={filters.vehicleTypes.includes(vt)}
            onPress={() => toggleVehicleType(vt)}
          />
        ))}

        <ChipDivider />

        {/* Fuel types */}
        {FUEL_TYPES.map((ft) => (
          <FilterChip
            key={ft}
            label={FUEL_TYPE_LABELS[ft]}
            active={filters.fuelTypes.includes(ft)}
            onPress={() => toggleFuelType(ft)}
          />
        ))}

        <ChipDivider />

        {/* Price presets */}
        {PRICE_PRESETS.map((p) => (
          <FilterChip
            key={p.value}
            label={p.label}
            active={filters.priceMax === p.value}
            onPress={() => togglePriceMax(p.value)}
          />
        ))}

        <ChipDivider />

        {/* Year presets */}
        {YEAR_PRESETS.map((y) => (
          <FilterChip
            key={y.value}
            label={y.label}
            active={filters.yearMin === y.value}
            onPress={() => toggleYearMin(y.value)}
          />
        ))}

        <ChipDivider />

        {/* Mileage presets */}
        {MILEAGE_PRESETS.map((m) => (
          <FilterChip
            key={m.value}
            label={m.label}
            active={filters.mileageMax === m.value}
            onPress={() => toggleMileageMax(m.value)}
          />
        ))}
      </ScrollView>

      {/* Grid */}
      <FlatList
        data={displayedCards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#D4A843"
            colors={['#D4A843']}
          />
        }
        renderItem={({ item }) => (
          <ExploreCard
            car={item}
            isFavorited={favoriteIds.has(item.id)}
            onPress={() => router.push(`/listing/${item.id}`)}
            onToggleFavorite={() =>
              toggleFavorite.mutate({ listingId: item.id, isFavorited: favoriteIds.has(item.id) })
            }
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 }}>
            {hasActiveFilters ? (
              <>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
                <Text style={{ color: '#F5F5F5', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                  אין תוצאות בין הרכבים שנטענו
                </Text>
                <Text style={{ color: '#888888', textAlign: 'center', marginBottom: 20, fontSize: 14 }}>
                  הפילטר פועל על הרכבים שנטענו עד כה.{'\n'}נקה פילטרים או גלול למטה לטעון עוד רכבים.
                </Text>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#0F0F0F', fontWeight: '700' }}>נקה פילטרים</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🚗</Text>
                <Text style={{ color: '#F5F5F5', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                  לא נמצאו רכבים כרגע
                </Text>
                <Text style={{ color: '#888888', textAlign: 'center', marginBottom: 20, fontSize: 14 }}>
                  נסה לרענן, או עדכן את העדפות החיפוש שלך.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/settings/preferences')}
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
              <Text style={{ color: '#888888', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                נטענו כל הרכבים הזמינים כרגע ({allCards.length}){'\n'}עדכן העדפות לראות תוצאות שונות
              </Text>
            </View>
          ) : null
        }
      />

      {/* Sort modal */}
      <Modal
        visible={showSort}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSort(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setShowSort(false)}
        >
          <View style={{
            backgroundColor: '#1A1A1A',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 36,
          }}>
            <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 18, textAlign: 'right', marginBottom: 16 }}>
              מיון תוצאות
            </Text>
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
                <Text style={{
                  color: sort === opt.value ? '#D4A843' : '#F5F5F5',
                  fontSize: 16,
                  fontWeight: sort === opt.value ? '700' : '400',
                }}>
                  {opt.label}
                </Text>
                {sort === opt.value && (
                  <Text style={{ color: '#D4A843', marginLeft: 10, fontSize: 16 }}>✓</Text>
                )}
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
  sortLabel,
  onSortPress,
  onSwipePress,
}: {
  sortLabel: string
  onSortPress: () => void
  onSwipePress: () => void
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 10,
    }}>
      {/* Sort button — left */}
      <TouchableOpacity
        onPress={onSortPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: '#1A1A1A',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Text style={{ color: '#D4A843', fontSize: 14 }}>↕</Text>
        <Text style={{ color: '#888', fontSize: 12 }}>מיון</Text>
      </TouchableOpacity>

      {/* Title — center */}
      <Text style={{ color: '#F5F5F5', fontSize: 22, fontWeight: '800' }}>גילוי 🔍</Text>

      {/* Toggle to swipe — right */}
      <TouchableOpacity
        onPress={onSwipePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: '#1A1A1A',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Text style={{ color: '#888', fontSize: 12 }}>סוויפ</Text>
        <Text style={{ fontSize: 14 }}>🔥</Text>
      </TouchableOpacity>
    </View>
  )
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: active ? '#D4A843' : 'rgba(255,255,255,0.15)',
        backgroundColor: active ? 'rgba(212,168,67,0.15)' : 'transparent',
      }}
    >
      <Text style={{
        color: active ? '#D4A843' : '#888888',
        fontSize: 13,
        fontWeight: active ? '600' : '400',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function ChipDivider() {
  return (
    <View style={{
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255,255,255,0.12)',
      marginHorizontal: 2,
      alignSelf: 'center',
    }} />
  )
}
