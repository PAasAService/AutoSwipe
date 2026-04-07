import { useRef, useEffect } from 'react'
import { Animated, DimensionValue, ViewStyle } from 'react-native'

interface Props {
  width: DimensionValue
  height: number
  borderRadius?: number
  style?: ViewStyle
}

export default function Skeleton({ width, height, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#2A2A2A', opacity }, style]}
    />
  )
}
