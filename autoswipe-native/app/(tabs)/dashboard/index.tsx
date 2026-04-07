import { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, Modal, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import Toast from 'react-native-toast-message'
import { api } from '../../../src/lib/api'
import { CarListing } from '../../../src/types'
import { formatILS } from '../../../src/lib/utils/format'

export default function DashboardScreen() {
  const router = useRouter()
  const qc = useQueryClient()

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get<{ data: CarListing[] }>('/api/listings?mine=true').then((r) => r.data ?? (r as any)),
  })

  const patchListing = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/listings/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
    onError: () => Toast.show({ type: 'error', text1: 'שגיאה בעדכון הסטטוס' }),
  })

  const deleteListing = useMutation({
    mutationFn: (id: string) => api.delete(`/api/listings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] })
      Toast.show({ type: 'success', text1: 'המודעה נמחקה' })
    },
    onError: () => Toast.show({ type: 'error', text1: 'שגיאה במחיקת המודעה' }),
  })

  function confirmDelete(id: string) {
    Alert.alert('מחיקת מודעה', 'האם אתה בטוח? פעולה זו לא ניתנת לביטול.', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => deleteListing.mutate(id) },
    ])
  }

  const activeListings = listings?.filter((l) => l.status === 'ACTIVE') ?? []
  const totalViews = listings?.reduce((s, l) => s + (l.viewCount || 0), 0) ?? 0
  const totalLikes = listings?.reduce((s, l) => s + (l.likeCount || 0), 0) ?? 0
  const avgDays = activeListings.length > 0
    ? Math.round(
        activeListings.reduce((sum, l) => {
          const days = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0) / activeListings.length,
      )
    : 0

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4A843" />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => router.push('/listing/create/')}
          style={{ backgroundColor: '#D4A843', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Text style={{ color: '#0F0F0F', fontWeight: '700' }}>+ מודעה חדשה</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#F5F5F5', textAlign: 'right' }}>
          מודעות שלי 🚗
        </Text>
      </View>

      <ScrollView>
        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 }}>
          <StatCard icon="👁" label="צפיות" value={String(totalViews)} />
          <StatCard icon="❤️" label="לייקים" value={String(totalLikes)} />
          <StatCard icon="🚗" label="פעילות" value={String(activeListings.length)} />
          <StatCard icon="📅" label="ממוצע ימים" value={String(avgDays)} />
        </View>

        {/* Listings */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => router.push('/listing/create/')}>
              <Text style={{ color: '#D4A843', fontSize: 14, fontWeight: '600' }}>הוסף +</Text>
            </TouchableOpacity>
            <Text style={{ color: '#F5F5F5', fontSize: 18, fontWeight: '700' }}>המודעות שלי</Text>
          </View>

          {!listings?.length ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ fontSize: 64, marginBottom: 16 }}>🚗</Text>
              <Text style={{ color: '#F5F5F5', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
                אין מודעות פעילות
              </Text>
              <Text style={{ color: '#888888', textAlign: 'center', marginTop: 8 }}>
                פרסם את הרכב שלך ותגיע לאלפי קונים
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/listing/create')}
                accessibilityLabel="פרסם רכב"
                style={{ backgroundColor: '#D4A843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24 }}
              >
                <Text style={{ color: '#0F0F0F', fontWeight: '700', fontSize: 16 }}>פרסם רכב</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {listings.map((item, idx) => (
                <DashboardCard
                  key={item.id}
                  car={item}
                  featured={idx === 0}
                  onView={() => router.push(`/listing/${item.id}`)}
                  onPatch={(status) => patchListing.mutate({ id: item.id, status })}
                  onDelete={() => confirmDelete(item.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{
      flex: 1, minWidth: '45%', backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16,
      alignItems: 'flex-end', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <Text style={{ fontSize: 28, marginBottom: 6 }}>{icon}</Text>
      <Text style={{ color: '#F5F5F5', fontSize: 22, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: '#888', fontSize: 13 }}>{label}</Text>
    </View>
  )
}

function DashboardCard({
  car, featured, onView, onPatch, onDelete,
}: {
  car: CarListing
  featured: boolean
  onView: () => void
  onPatch: (status: string) => void
  onDelete: () => void
}) {
  const [menuVisible, setMenuVisible] = useState(false)
  const primaryImage = car.images.find((i) => i.isPrimary) || car.images[0]

  const statusColor = car.status === 'ACTIVE' ? '#4CAF50' : car.status === 'SOLD' ? '#F44336' : '#FF9800'
  const statusLabel = car.status === 'ACTIVE' ? 'פעיל' : car.status === 'SOLD' ? 'נמכר' : 'מושהה'

  return (
    <View style={{
      backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    }}>
      <View style={{ flexDirection: 'row' }}>
        {primaryImage ? (
          <Image source={{ uri: primaryImage.url }} style={{ width: featured ? 120 : 100, height: featured ? 110 : 90 }} contentFit="cover" />
        ) : (
          <View style={{ width: 100, height: 90, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 32 }}>🚗</Text>
          </View>
        )}
        <View style={{ flex: 1, padding: 12, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={() => setMenuVisible(true)} accessibilityLabel="אפשרויות נוספות" style={{ padding: 4 }}>
              <Text style={{ color: '#888', fontSize: 20 }}>⋯</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 15, textAlign: 'right' }}>
                {car.brand} {car.model} {car.year}
              </Text>
              <View style={{ backgroundColor: `${statusColor}22`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2 }}>
                <Text style={{ color: statusColor, fontSize: 11, fontWeight: '600' }}>{statusLabel}</Text>
              </View>
            </View>
          </View>
          <Text style={{ color: '#D4A843', fontWeight: '700', fontSize: 15, textAlign: 'right' }}>
            {formatILS(car.price)}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
            <Text style={{ color: '#888888', fontSize: 12 }}>❤️ {car.likeCount}</Text>
            <Text style={{ color: '#888888', fontSize: 12 }}>👁 {car.viewCount}</Text>
          </View>
        </View>
      </View>

      {/* Quick actions row */}
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
        <TouchableOpacity
          onPress={onView}
          accessibilityLabel="צפה במודעה"
          style={{ flex: 1, padding: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' }}
        >
          <Text style={{ color: '#888', fontSize: 13 }}>👁 צפה</Text>
        </TouchableOpacity>
        {car.status === 'ACTIVE' ? (
          <TouchableOpacity
            onPress={() => onPatch('PAUSED')}
            accessibilityLabel="השהה מודעה"
            style={{ flex: 1, padding: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' }}
          >
            <Text style={{ color: '#FF9800', fontSize: 13 }}>⏸ השהה</Text>
          </TouchableOpacity>
        ) : car.status === 'PAUSED' ? (
          <TouchableOpacity
            onPress={() => onPatch('ACTIVE')}
            accessibilityLabel="הפעל מודעה"
            style={{ flex: 1, padding: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' }}
          >
            <Text style={{ color: '#4CAF50', fontSize: 13 }}>▶ הפעל</Text>
          </TouchableOpacity>
        ) : null}
        {car.status !== 'SOLD' && (
          <TouchableOpacity
            onPress={() => onPatch('SOLD')}
            accessibilityLabel="סמן כנמכר"
            style={{ flex: 1, padding: 10, alignItems: 'center' }}
          >
            <Text style={{ color: '#D4A843', fontSize: 13 }}>✓ נמכר</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Actions menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          onPress={() => setMenuVisible(false)}
        >
          <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 4 }}>
            <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 17, textAlign: 'right', marginBottom: 12 }}>
              {car.brand} {car.model}
            </Text>
            <MenuAction label="👁 צפה במודעה" color="#F5F5F5" onPress={() => { setMenuVisible(false); onView() }} />
            {car.status !== 'SOLD' && <MenuAction label="✓ סמן כנמכר" color="#D4A843" onPress={() => { setMenuVisible(false); onPatch('SOLD') }} />}
            {car.status === 'ACTIVE' && <MenuAction label="⏸ השהה מודעה" color="#FF9800" onPress={() => { setMenuVisible(false); onPatch('PAUSED') }} />}
            {car.status === 'PAUSED' && <MenuAction label="▶ הפעל מודעה" color="#4CAF50" onPress={() => { setMenuVisible(false); onPatch('ACTIVE') }} />}
            <MenuAction label="🗑 מחק מודעה" color="#F44336" onPress={() => { setMenuVisible(false); onDelete() }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

function MenuAction({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 4 }}
    >
      <Text style={{ color, fontSize: 16, textAlign: 'right' }}>{label}</Text>
    </TouchableOpacity>
  )
}
