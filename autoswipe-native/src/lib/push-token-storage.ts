import * as SecureStore from 'expo-secure-store'

const KEY = 'autoswipe_expo_push_token'

export async function setStoredPushToken(token: string) {
  await SecureStore.setItemAsync(KEY, token)
}

export async function getStoredPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY)
}

export async function clearStoredPushToken() {
  try {
    await SecureStore.deleteItemAsync(KEY)
  } catch {
    /* ignore */
  }
}
