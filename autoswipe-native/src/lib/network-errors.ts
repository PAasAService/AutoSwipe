/**
 * RN fetch failures (no TCP / ATS / wrong host) surface as TypeError or "Network request failed".
 */
export function isConnectivityFailure(err: unknown): boolean {
  if (err == null || typeof err !== 'object') return false
  const e = err as { message?: string; name?: string; code?: string }
  const msg = String(e.message ?? '')
  if (msg === 'Network request failed') return true
  if (e.name === 'TypeError') return true
  if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') return true
  return false
}

/** Shown when fetch fails before a response (wrong API URL, Next down, firewall, different Wi‑Fi). */
export const API_UNREACHABLE_HINT =
  'Cannot reach the API. Use the same Wi‑Fi as your computer, run Next (`npm run dev` with the port in .env), and restart Expo with `npx expo start --clear`. If it persists, set EXPO_PUBLIC_API_BASE_URL to http://YOUR_COMPUTER_LAN_IP:PORT (not localhost).'

export function formatApiNetworkError(err: unknown): string {
  if (isConnectivityFailure(err)) return API_UNREACHABLE_HINT
  return err instanceof Error ? err.message : 'Network error'
}
