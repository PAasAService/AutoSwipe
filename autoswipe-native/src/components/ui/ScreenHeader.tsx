import type { ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  BACK_ICON,
  BACK_ICON_ONLY,
  BACK_ICON_ONLY_SIZE,
  BACK_WITH_LABEL_FONT_SIZE,
  HEADER_DISMISS_FONT_SIZE,
} from '../../constants/ui'
import { SCREEN_EDGE, SCREEN_HEADER_BORDER, SCREEN_HEADER_SIDE_SLOT } from '../../constants/layout'

type BackVariant = 'icon' | 'labeled' | 'text' | 'none'

export type ScreenHeaderProps = {
  /** Default: triple column (back | center | trailing). `edges`: back vs trailing on one row. */
  mode?: 'triple' | 'edges'
  title?: string
  titleSize?: number
  subtitle?: string
  /** Replaces title+subtitle middle column when set. */
  center?: ReactNode
  onBack?: () => void
  backVariant?: BackVariant
  backLabel?: string
  backColor?: string
  trailing?: ReactNode
  showBorder?: boolean
  /** Full-width block under the main row (uses horizontal screen edge padding). */
  below?: ReactNode
  /** Widen leading/trailing zones when a wide `trailing` control is used (e.g. CTA chip). */
  sideSlotWidth?: number
}

function backContent(variant: BackVariant, label: string) {
  if (variant === 'icon') return BACK_ICON_ONLY
  if (variant === 'labeled') return `${BACK_ICON} ${label}`
  if (variant === 'text') return label
  return null
}

function backFontSize(variant: BackVariant) {
  if (variant === 'icon') return BACK_ICON_ONLY_SIZE
  if (variant === 'labeled') return BACK_WITH_LABEL_FONT_SIZE
  return HEADER_DISMISS_FONT_SIZE
}

export function ScreenHeader({
  mode = 'triple',
  title,
  titleSize = 20,
  subtitle,
  center,
  onBack,
  backVariant: backVariantProp,
  backLabel = 'חזור',
  backColor = '#D4A843',
  trailing,
  showBorder = true,
  below,
  sideSlotWidth = SCREEN_HEADER_SIDE_SLOT,
}: ScreenHeaderProps) {
  const { top } = useSafeAreaInsets()
  const backVariant: BackVariant =
    backVariantProp ?? (onBack ? 'icon' : 'none')

  const paddingTop = top + 8
  const border = showBorder
    ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SCREEN_HEADER_BORDER }
    : {}

  function renderBack() {
    if (!onBack || backVariant === 'none') return null
    const content = backContent(backVariant, backLabel)
    if (content == null) return null
    const fontSize = backFontSize(backVariant)
    const a11y = backVariant === 'icon' ? 'חזור' : backLabel
    return (
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={a11y}
      >
        <Text
          style={{
            color: backColor,
            fontSize,
            fontWeight: backVariant === 'text' ? '600' : undefined,
            textAlign: 'center',
          }}
        >
          {content}
        </Text>
      </TouchableOpacity>
    )
  }

  const centerNode =
    center ??
    (title != null && title !== '' ? (
      <View style={{ justifyContent: 'center', paddingVertical: 2 }}>
        <Text
          numberOfLines={1}
          style={{
            textAlign: 'center',
            fontSize: titleSize,
            fontWeight: '700',
            color: '#F5F5F5',
            writingDirection: 'rtl',
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: '#888888',
              marginTop: 2,
              writingDirection: 'rtl',
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    ) : null)

  if (mode === 'edges') {
    return (
      <View style={[{ backgroundColor: '#0F0F0F' }, border]}>
        <View
          style={{
            paddingTop,
            paddingBottom: 12,
            paddingHorizontal: SCREEN_EDGE,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexShrink: 1 }}>{renderBack()}</View>
          <View style={{ flexShrink: 0, marginStart: 12 }}>{trailing}</View>
        </View>
        {below != null ? (
          <View style={{ paddingHorizontal: SCREEN_EDGE, paddingBottom: 12 }}>{below}</View>
        ) : null}
      </View>
    )
  }

  return (
    <View style={[{ backgroundColor: '#0F0F0F' }, border]}>
      <View
        style={{
          paddingTop,
          paddingBottom: 12,
          paddingHorizontal: SCREEN_EDGE,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: sideSlotWidth,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderBack() ?? <View />}
        </View>
        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>{centerNode}</View>
        <View
          style={{
            width: sideSlotWidth,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {trailing ?? <View />}
        </View>
      </View>
      {below != null ? (
        <View style={{ paddingHorizontal: SCREEN_EDGE, paddingBottom: 12 }}>{below}</View>
      ) : null}
    </View>
  )
}
