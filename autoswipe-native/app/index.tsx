import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getToken } from '../src/lib/api'
import { getApiBaseUrl } from '../src/lib/api-base-url'

const CAROUSEL_SEEN_KEY = 'autoswipe_carousel_seen'

export default function Index() {
  const [checked, setChecked] = useState(false)
  const [redirect, setRedirect] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      const token = await getToken()

      if (!token) {
        // No session — show carousel on first launch, gate on repeat visits
        const carouselSeen = await AsyncStorage.getItem(CAROUSEL_SEEN_KEY)
        setRedirect(carouselSeen ? '/(auth)/gate' : '/carousel')
        setChecked(true)
        return
      }

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('401')
        const json = await res.json()
        const user = json.data ?? json
        if (!user.isOnboarded) {
          setRedirect('/(onboarding)')
        } else {
          setRedirect('/(tabs)/swipe')
        }
      } catch {
        // Token invalid or network error — send to gate
        setRedirect('/(auth)/gate')
      }
      setChecked(true)
    }
    check()
  }, [])

  if (!checked || !redirect) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#D4A843" size="large" />
      </View>
    )
  }

  return <Redirect href={redirect as any} />
}
