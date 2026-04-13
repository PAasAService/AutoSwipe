/** In-memory scroll offset for the main settings list (survives replace/back from legal, profile, etc.). */
let lastSettingsScrollY = 0

export function rememberSettingsScrollY(y: number) {
  lastSettingsScrollY = Math.max(0, y)
}

export function getSettingsScrollY() {
  return lastSettingsScrollY
}
