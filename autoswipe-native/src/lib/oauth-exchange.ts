import { setToken } from './api'
import { getApiBaseUrl } from './api-base-url'
import { formatApiNetworkError, isConnectivityFailure } from './network-errors'

export type OAuthUserPayload = { isOnboarded?: boolean }

/**
 * POST /api/auth/oauth — same JWT + user shape as email credentials.
 */
export async function exchangeOAuthToken(
  provider: 'google' | 'apple',
  idToken: string
): Promise<{ user: OAuthUserPayload }> {
  let res: Response
  try {
    res = await fetch(`${getApiBaseUrl()}/api/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, idToken }),
    })
  } catch (e: unknown) {
    if (isConnectivityFailure(e)) throw new Error(formatApiNetworkError(e))
    throw e instanceof Error ? e : new Error('שגיאת רשת')
  }
  let data: Record<string, unknown> = {}
  try {
    data = (await res.json()) as Record<string, unknown>
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : 'שגיאה בהתחברות'
    throw new Error(msg)
  }
  if (typeof data.token !== 'string') throw new Error('תגובה לא תקינה מהשרת')
  await setToken(data.token)
  return { user: (data.user as OAuthUserPayload) ?? {} }
}
