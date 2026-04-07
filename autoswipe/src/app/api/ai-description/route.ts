import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { brand, model, year, mileage, fuelType, color } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey.includes('your-')) {
      // Fallback description when no AI key
      const fuelMap: Record<string, string> = {
        GASOLINE: 'בנזין', DIESEL: 'דיזל', HYBRID: 'היברידי',
        ELECTRIC: 'חשמלי', PLUG_IN_HYBRID: 'פלאג-אין היברידי',
      }
      const fuelHe = fuelMap[fuelType] || fuelType
      const colorText = color ? `, צבע ${color}` : ''
      const description = `${brand} ${model} שנת ${year}${colorText}, מנוע ${fuelHe}. ` +
        `הרכב עבר ${(mileage || 0).toLocaleString()} ק"מ ונמצא במצב מצוין. ` +
        `מתאים לנסיעות עיר ובין-עירוניות. כל הבדיקות תקינות, אתם מוזמנים לבוא לראות.`
      return NextResponse.json({ description })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-20240307',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `כתוב תיאור מכירה קצר ומשכנע בעברית לרכב הבא (2-3 משפטים, טבעי ואנושי):
${brand} ${model} שנת ${year}, ${(mileage || 0).toLocaleString()} ק"מ, ${fuelType}${color ? `, צבע ${color}` : ''}.
תיאור בגוף ראשון, אל תמציא מספרים ספציפיים שלא ניתנו.`,
        }],
      }),
    })

    const data = await response.json()
    const description = data.content?.[0]?.text?.trim() || ''
    return NextResponse.json({ description })
  } catch (err) {
    console.error('[ai-description]', err)
    return NextResponse.json({ error: 'שגיאה ביצירת תיאור' }, { status: 500 })
  }
}
