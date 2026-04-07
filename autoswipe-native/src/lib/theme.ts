export const colors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceHigh: '#2A2A2A',
  border: '#333333',
  textPrimary: '#F5F5F5',
  textSecondary: '#888888',
  textMuted: '#555555',
  gold: '#D4A843',
  goldDark: '#C49733',
  goldLight: '#E5BF6B',
  success: '#4CAF50',
  error: '#F44336',
  info: '#2196F3',
  warning: '#FF9800',
  swipeLike: '#4CAF50',
  swipeNope: '#F44336',
  swipeSuper: '#2196F3',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '400' as const },
} as const
