import * as SecureStore from 'expo-secure-store'
import { getApiBaseUrl } from './api-base-url'

export const TOKEN_KEY = 'autoswipe_jwt'

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY)
}

function stringifyApiErrorField(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (v == null) return undefined
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const token = await getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    await clearToken()
    throw new Error('401')
  }

  if (!res.ok) {
    const text = await res.text()
    let msg: string | undefined
    try {
      const parsed = JSON.parse(text) as {
        message?: unknown
        error?: unknown
      }
      msg =
        stringifyApiErrorField(parsed.message) ??
        stringifyApiErrorField(parsed.error)
    } catch {
      /* not JSON — e.g. HTML error page */
    }
    const trimmed = text.trim()
    const hint =
      trimmed && !msg
        ? trimmed.length > 180
          ? `${trimmed.slice(0, 180)}…`
          : trimmed
        : ''
    const base =
      msg || (hint ? `${hint} [${res.status}]` : `HTTP ${res.status}`)
    throw new Error(`${base} (${method} ${path})`)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
