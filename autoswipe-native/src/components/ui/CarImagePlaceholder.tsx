import { View, Text } from 'react-native'

const BRAND_COLORS: Record<string, string> = {
  BMW: '#1C69D4',
  Mercedes: '#00ADEF',
  Audi: '#BB0A14',
  Toyota: '#EB0A1E',
  Honda: '#CC0000',
  Hyundai: '#002C5F',
  Kia: '#05141F',
  Mazda: '#910A2D',
  Volkswagen: '#001E50',
  Tesla: '#CC0000',
  Volvo: '#003057',
  Skoda: '#4BA82E',
  Ford: '#003476',
  Nissan: '#C3002F',
  Renault: '#EFDF00',
  Peugeot: '#213575',
  Subaru: '#013C86',
}

const BRAND_EMOJI: Record<string, string> = {
  BMW: '🔵',
  Mercedes: '⭐',
  Audi: '🔘',
  Toyota: '🔴',
  Tesla: '⚡',
  Volvo: '🔷',
  Hyundai: '🔹',
  Honda: '🔴',
}

interface Props {
  brand: string
  model: string
  year: number
  width?: number | string
  height?: number
}

export default function CarImagePlaceholder({ brand, model, year, width = '100%', height = 220 }: Props) {
  const bgColor = BRAND_COLORS[brand] ?? '#2A2A2A'
  const emoji = BRAND_EMOJI[brand] ?? '🚗'

  return (
    <View style={{ width: width as any, height, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 52, marginBottom: 8 }}>{emoji}</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
        {brand} {model}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>{year}</Text>
    </View>
  )
}
