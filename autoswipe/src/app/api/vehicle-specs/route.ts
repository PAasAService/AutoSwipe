import { NextRequest, NextResponse } from 'next/server'
import { getCarSpecs, adjustSpecsForYear } from '@/lib/constants/car-specs-db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')
  const model = searchParams.get('model')
  const year  = searchParams.get('year')

  if (!brand || !model || !year) {
    return NextResponse.json({ error: 'Missing brand, model, or year' }, { status: 400 })
  }

  const yearNum = parseInt(year)
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear() + 1) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  const base = getCarSpecs(brand, model)
  if (!base) {
    // Unknown model — return null so the form stays blank for manual fill
    return NextResponse.json({ data: null })
  }

  const specs = adjustSpecsForYear(base, yearNum)

  return NextResponse.json({ data: specs })
}
