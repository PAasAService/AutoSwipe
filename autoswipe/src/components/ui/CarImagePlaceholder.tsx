interface Props {
  brand: string
  model: string
  year: number
  className?: string
}

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
}

const BRAND_EMOJI: Record<string, string> = {
  BMW: '🔵',
  Mercedes: '⭐',
  Audi: '🔘',
  Toyota: '🔴',
  Tesla: '⚡',
}

export default function CarImagePlaceholder({ brand, model, year, className = '' }: Props) {
  const bg = BRAND_COLORS[brand] ?? '#2A2A2A'
  const emoji = BRAND_EMOJI[brand] ?? '🚗'

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{ backgroundColor: bg }}
      role="img"
      aria-label={`${brand} ${model} ${year}`}
    >
      <span className="text-5xl mb-2">{emoji}</span>
      <span className="text-white font-bold text-lg">{brand} {model}</span>
      <span className="text-white/70 text-sm mt-1">{year}</span>
    </div>
  )
}
