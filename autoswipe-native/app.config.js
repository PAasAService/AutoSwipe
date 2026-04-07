/**
 * Injects devLanHost = best guess LAN IPv4 of the machine running `expo start`.
 * Physical devices can reach Next on the same host without hand-editing .env.
 *
 * Google Sign-In (expo-auth-session): iOS needs the reversed client URL scheme so OAuth can return to the app.
 * Derived from EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID or EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (same pattern as Google docs).
 */
function isIPv4(n) {
  return n.family === 'IPv4' || n.family === 4
}

function googleIosUrlSchemeFromEnv() {
  const id =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    ''
  const suffix = '.apps.googleusercontent.com'
  if (!id.endsWith(suffix)) return null
  const prefix = id.slice(0, -suffix.length)
  return `com.googleusercontent.apps.${prefix}`
}

function firstLanIPv4() {
  const os = require('os')
  const addrs = []
  for (const list of Object.values(os.networkInterfaces())) {
    if (!list) continue
    for (const n of list) {
      if (isIPv4(n) && !n.internal) addrs.push(n.address)
    }
  }
  if (addrs.length === 0) return null
  const score = (a) => {
    if (a.startsWith('192.168.')) return 4
    if (a.startsWith('10.')) return 3
    if (a.startsWith('172.16.') || a.startsWith('172.17.')) return 1
    return 2
  }
  return addrs.sort((a, b) => score(b) - score(a))[0]
}

module.exports = ({ config }) => {
  const googleScheme = googleIosUrlSchemeFromEnv()
  const baseScheme = config.scheme ?? 'autoswipe'
  const scheme = googleScheme
    ? Array.isArray(baseScheme)
      ? [...baseScheme, googleScheme]
      : [baseScheme, googleScheme]
    : baseScheme

  return {
    ...config,
    scheme,
    extra: {
      ...(config.extra || {}),
      devLanHost: firstLanIPv4(),
    },
  }
}
