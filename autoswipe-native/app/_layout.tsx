import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { I18nManager } from 'react-native'
import { queryClient } from '../src/lib/query-client'
import { initAnalytics } from '../src/lib/analytics'

// Force RTL layout for Hebrew
I18nManager.allowRTL(true)
I18nManager.forceRTL(true)

export default function RootLayout() {
  useEffect(() => {
    initAnalytics()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="carousel" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="listing/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="listing/create/index" options={{ presentation: 'modal' }} />
            <Stack.Screen name="compare/index" options={{ presentation: 'modal' }} />
            <Stack.Screen name="notifications/index" options={{ presentation: 'modal' }} />
          </Stack>
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
