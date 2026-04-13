import { useEffect } from 'react'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { api } from '../lib/api'
import { setStoredPushToken } from '../lib/push-token-storage'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

function projectId(): string | undefined {
  const fromExtra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
  return (
    fromExtra?.eas?.projectId?.trim() ||
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId?.trim() ||
    undefined
  )
}

/**
 * Registers for remote notifications and POSTs the Expo token to the API.
 * No-op if no EAS projectId (set EXPO_PUBLIC_EAS_PROJECT_ID or app.json extra.eas.projectId).
 */
export function useRegisterExpoPush(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return

    ;(async () => {
      const pid = projectId()
      if (!pid) return

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        })
      }

      const { status: existing } = await Notifications.getPermissionsAsync()
      let final = existing
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        final = status
      }
      if (final !== 'granted') return

      let expoPushToken: string
      try {
        const res = await Notifications.getExpoPushTokenAsync({ projectId: pid })
        expoPushToken = res.data
      } catch {
        return
      }

      try {
        await api.post('/api/users/push-token', {
          token: expoPushToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        })
        await setStoredPushToken(expoPushToken)
      } catch {
        /* ignore */
      }
    })()
  }, [userId])
}
