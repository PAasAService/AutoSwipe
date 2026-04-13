import { getToken } from './api'
import { getApiBaseUrl } from './api-base-url'
import { clearStoredPushToken, getStoredPushToken } from './push-token-storage'

/** Remove this device token from the server (call before logout). */
export async function unregisterPushDevice(): Promise<void> {
  const pushToken = await getStoredPushToken()
  if (!pushToken) return

  const jwt = await getToken()
  try {
    await fetch(
      `${getApiBaseUrl()}/api/users/push-token?token=${encodeURIComponent(pushToken)}`,
      {
        method: 'DELETE',
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      },
    )
  } catch {
    /* offline — still clear local token */
  }
  await clearStoredPushToken()
}
