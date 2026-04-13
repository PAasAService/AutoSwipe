import { setToken } from './api'
import { getApiBaseUrl } from './api-base-url'
import { formatApiNetworkError, isConnectivityFailure } from './network-errors'

export type OAuthUserPayload = { isOnboarded?: boolean }

export type OAuthExchangeResult = {
  user: OAuthUserPayload
  /** True when the server created a new user for this SSO identity. */
  created: boolean
}

/**
 * POST /api/auth/oauth — server resolves existing user (by SSO id or email) or creates one, then returns JWT + user + `created`.
 */
export type OAuthExchangeOptions = {
  /** Apple full name (first sign-in) or other client-known display name — server prefers this over JWT/email fallback. */
  displayName?: string
}

export async function exchangeOAuthToken(
  provider: 'google' | 'apple',
  idToken: string,
  options?: OAuthExchangeOptions
): Promise<OAuthExchangeResult> {
  let res: Response
  try {
    const displayName = options?.displayName?.trim()
    res = await fetch(`${getApiBaseUrl()}/api/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        idToken,
        ...(displayName && displayName.length > 0 ? { displayName } : {}),
      }),
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
  const created = data.created === true
  return { user: (data.user as OAuthUserPayload) ?? {}, created }
}
