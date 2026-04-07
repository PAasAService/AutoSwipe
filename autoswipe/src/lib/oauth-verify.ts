import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))

/**
 * Verify Google ID token (mobile or web client).
 * Pass allowed client IDs (iOS, Android, web) — token `aud` must match one.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  allowedAudiences: string[],
): Promise<JWTPayload> {
  if (allowedAudiences.length === 0) {
    throw new Error('GOOGLE_CLIENT_ID(s) not configured')
  }
  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: allowedAudiences,
  })
  return payload
}

/**
 * Verify Apple identity token (Sign in with Apple).
 * `allowedAudiences` must include the token `aud`: native app bundle ID, Services ID,
 * or `host.exp.Exponent` when testing Sign in with Apple inside Expo Go.
 */
export async function verifyAppleIdToken(
  idToken: string,
  allowedAudiences: string[],
): Promise<JWTPayload> {
  if (allowedAudiences.length === 0) {
    throw new Error('APPLE_CLIENT_ID(s) not configured')
  }
  const { payload } = await jwtVerify(idToken, appleJwks, {
    issuer: 'https://appleid.apple.com',
    audience: allowedAudiences,
  })
  return payload
}
