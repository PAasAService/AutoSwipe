import { useState, useEffect } from 'react'
import { View, Text, Switch, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { api } from '../../../src/lib/api'

const SETTINGS = [
  { key: 'messages', label: 'הודעות חדשות', desc: 'קבל התראה כשמישהו שולח לך הודעה' },
  { key: 'matches', label: 'מתאימים חדשים', desc: 'רכבים חדשים שמתאימים להעדפותיך' },
  { key: 'priceDrops', label: 'הורדות מחיר', desc: 'כשמחיר רכב שאהבת יורד' },
  { key: 'listingStatus', label: 'עדכוני מצב מודעה', desc: 'עדכונים על המודעות שלך (מוכרים)' },
]

const DEFAULT_SETTINGS: Record<string, boolean> = {
  messages: true, matches: true, priceDrops: true, listingStatus: true,
}

export default function NotificationsScreen() {
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, boolean>>(DEFAULT_SETTINGS)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<{ data: Record<string, boolean> }>('/api/users/notifications')
        .then((r) => r.data ?? (r as any))
        .catch(() => DEFAULT_SETTINGS),
  })

  useEffect(() => {
    if (data) setSettings(data)
  }, [data])

  const save = useMutation({
    mutationFn: (updated: Record<string, boolean>) =>
      api.put('/api/users/notifications', updated),
    onError: () => Toast.show({ type: 'error', text1: 'שגיאה בשמירת ההגדרות' }),
  })

  function handleToggle(key: string, value: boolean) {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    save.mutate(updated)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#D4A843', fontSize: 16 }}>סגור</Text>
        </TouchableOpacity>
        <Text style={{ color: '#F5F5F5', fontSize: 20, fontWeight: '700' }}>התראות</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 0 }}>
        {SETTINGS.map((s) => (
          <View
            key={s.key}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, marginBottom: 8,
            }}
          >
            <Switch
              value={settings[s.key] ?? true}
              onValueChange={(v) => handleToggle(s.key, v)}
              trackColor={{ false: '#333', true: '#D4A843' }}
              thumbColor="#fff"
            />
            <View style={{ flex: 1, marginRight: 12, alignItems: 'flex-end' }}>
              <Text style={{ color: '#F5F5F5', fontSize: 16, fontWeight: '600' }}>{s.label}</Text>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
