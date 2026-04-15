import { Text, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BACK_ICON_ONLY, BACK_ICON_ONLY_SIZE } from '../../constants/ui'

/** Circular overlay back (listing gallery) — icon only ›, positioned at top right (RTL-correct). */
export function BackOverlayCircle({
  onPress,
  topExtra = 8,
}: {
  onPress: () => void
  topExtra?: number
}) {
  const { top } = useSafeAreaInsets()
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: 'absolute',
        top: top + topExtra,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 22,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel="חזור"
    >
      <Text style={{ color: '#F5F5F5', fontSize: BACK_ICON_ONLY_SIZE }}>{BACK_ICON_ONLY}</Text>
    </TouchableOpacity>
  )
}
