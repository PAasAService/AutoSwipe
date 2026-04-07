import Constants from 'expo-constants'
import { NativeModules } from 'react-native'

/**
 * In dev, when EXPO_PUBLIC_API_BASE_URL uses localhost, a physical phone cannot reach your Mac.
 * We derive the dev machine host from (in order):
 * 1) extra.devLanHost from app.config.js (IPv4 of the machine running `expo start`)
 * 2) Metro bundle URL (SourceCode.scriptURL)
 * 3) Expo Constants (hostUri, experienceUrl, …)
 *
 * API port comes from EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_API_DEV_PORT (default 3000).
 * Set EXPO_PUBLIC_API_BASE_URL to a full non-localhost URL to skip remapping.
 */
function hostFromScriptUrl(): string | null {
  const raw = NativeModules?.SourceCode?.scriptURL as string | undefined
  if (!raw || typeof raw !== 'string') return null
  if (raw.startsWith('file:')) return null
  try {
    const base = raw.split('?')[0]
    const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(base) ? base : `http://${base}`
    const u = new URL(normalized)
    const host = u.hostname
    if (!host || host === 'localhost' || host === '127.0.0.1') return null
    return host
  } catch {
    return null
  }
}
function extractLanHost(input: string | undefined | null): string | null {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  const withoutProto = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  const host = withoutProto.split(':')[0]?.split('/')[0]
  if (!host || host === 'localhost' || host === '127.0.0.1') return null
  return host
}

function envUsesLoopback(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url)
}

/** Port for Next when remapping loopback → LAN (must match `next dev -p`). */
function resolveApiPort(fromEnv: string): string {
  const override = process.env.EXPO_PUBLIC_API_DEV_PORT?.trim()
  if (override) return override
  try {
    const u = new URL(fromEnv.startsWith('http') ? fromEnv : `http://${fromEnv}`)
    if (u.port) return u.port
  } catch {
    /* ignore */
  }
  return '3000'
}

export function getApiBaseUrl(): string {
  const fromEnv = (
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
  ).trim()
  const apiPort = resolveApiPort(fromEnv)

  if (!__DEV__ || !envUsesLoopback(fromEnv)) {
    return fromEnv
  }

  const hostUri = Constants.expoConfig?.hostUri
  const experienceUrl = Constants.experienceUrl
  const linkingUri = Constants.linkingUri
  const debuggerHost = (Constants.expoGoConfig as { debuggerHost?: string } | null)
    ?.debuggerHost
  const legacyManifest = (
    Constants as { manifest?: { hostUri?: string; debuggerHost?: string } | null }
  ).manifest

  const devLanRaw = (
    Constants.expoConfig?.extra as { devLanHost?: string | null } | undefined
  )?.devLanHost
  const devLan =
    typeof devLanRaw === 'string' && devLanRaw.trim().length > 0
      ? devLanRaw.trim()
      : null
  const devLanOk =
    devLan &&
    devLan !== 'localhost' &&
    devLan !== '127.0.0.1'
      ? devLan
      : null

  const host =
    devLanOk ||
    hostFromScriptUrl() ||
    extractLanHost(hostUri) ||
    extractLanHost(experienceUrl) ||
    extractLanHost(linkingUri) ||
    extractLanHost(debuggerHost) ||
    extractLanHost(legacyManifest?.hostUri) ||
    extractLanHost(legacyManifest?.debuggerHost)

  if (host) {
    return `http://${host}:${apiPort}`
  }

  return fromEnv
}
