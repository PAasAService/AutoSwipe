// Israeli cities list — matches Yad2-style dropdown
export const ISRAELI_CITIES = [
  'אבן יהודה',
  'אופקים',
  'אור יהודה',
  'אור עקיבא',
  'אילת',
  'אלעד',
  'אריאל',
  'אשדוד',
  'אשקלון',
  'באר שבע',
  'בית שאן',
  'בית שמש',
  'בני ברק',
  'בת ים',
  'גבעת שמואל',
  'גבעתיים',
  'דימונה',
  'הוד השרון',
  'הרצליה',
  'חדרה',
  'חולון',
  'חיפה',
  'טבריה',
  'טירה',
  'יבנה',
  'יהוד-מונוסון',
  'יקנעם עילית',
  'ירושלים',
  'כפר סבא',
  'כרמיאל',
  'לוד',
  'מודיעין-מכבים-רעות',
  'מעלה אדומים',
  'מעלות-תרשיחא',
  'נהרייה',
  'נס ציונה',
  'נצרת',
  'נצרת עילית',
  'נשר',
  'נתיבות',
  'נתניה',
  'סחנין',
  'עכו',
  'עפולה',
  'ערד',
  'פתח תקווה',
  'צפת',
  'קריית אונו',
  'קריית אתא',
  'קריית ביאליק',
  'קריית גת',
  'קריית מוצקין',
  'קריית מלאכי',
  'קריית שמונה',
  'ראש העין',
  'ראשון לציון',
  'רחובות',
  'רמלה',
  'רמת גן',
  'רמת השרון',
  'רעננה',
  'שדרות',
  'תל אביב-יפו',
  'תל מונד',
] as const

export type IsraeliCity = (typeof ISRAELI_CITIES)[number]

// Approximate coordinates for distance calculation (lat, lon)
export const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'תל אביב-יפו': { lat: 32.0853, lon: 34.7818 },
  'ירושלים': { lat: 31.7683, lon: 35.2137 },
  'חיפה': { lat: 32.7940, lon: 34.9896 },
  'ראשון לציון': { lat: 31.9730, lon: 34.7896 },
  'פתח תקווה': { lat: 32.0840, lon: 34.8878 },
  'אשדוד': { lat: 31.8014, lon: 34.6553 },
  'נתניה': { lat: 32.3326, lon: 34.8600 },
  'באר שבע': { lat: 31.2518, lon: 34.7915 },
  'בני ברק': { lat: 32.0809, lon: 34.8338 },
  'חולון': { lat: 32.0114, lon: 34.7736 },
  'רמת גן': { lat: 32.0700, lon: 34.8200 },
  'אשקלון': { lat: 31.6658, lon: 34.5714 },
  'רחובות': { lat: 31.8928, lon: 34.8113 },
  'הרצליה': { lat: 32.1663, lon: 34.8438 },
  'כפר סבא': { lat: 32.1777, lon: 34.9066 },
  'מודיעין-מכבים-רעות': { lat: 31.8969, lon: 35.0100 },
  'בת ים': { lat: 32.0220, lon: 34.7500 },
  'לוד': { lat: 31.9516, lon: 34.8954 },
  'רמלה': { lat: 31.9285, lon: 34.8704 },
  'נס ציונה': { lat: 31.9296, lon: 34.7989 },
  'אילת': { lat: 29.5577, lon: 34.9519 },
  'גבעתיים': { lat: 32.0730, lon: 34.8122 },
  'הוד השרון': { lat: 32.1500, lon: 34.8900 },
  'קריית גת': { lat: 31.6100, lon: 34.7635 },
  'נהרייה': { lat: 33.0070, lon: 35.0973 },
  'עכו': { lat: 32.9237, lon: 35.0724 },
  'רמת השרון': { lat: 32.1460, lon: 34.8380 },
  'רעננה': { lat: 32.1841, lon: 34.8706 },
  'אור יהודה': { lat: 32.0285, lon: 34.8558 },
  'אור עקיבא': { lat: 32.5040, lon: 34.9199 },
  'חדרה': { lat: 32.4325, lon: 34.9198 },
  'טבריה': { lat: 32.7960, lon: 35.5310 },
  'צפת': { lat: 32.9643, lon: 35.4960 },
  'כרמיאל': { lat: 32.9143, lon: 35.2964 },
  'עפולה': { lat: 32.6059, lon: 35.2895 },
  'בית שאן': { lat: 32.4975, lon: 35.4997 },
  'קריית שמונה': { lat: 33.2068, lon: 35.5699 },
  'מעלות-תרשיחא': { lat: 33.0154, lon: 35.2722 },
  'ירקון': { lat: 32.0700, lon: 34.7900 },
  'דימונה': { lat: 31.0691, lon: 35.0328 },
  'ערד': { lat: 31.2548, lon: 35.2133 },
  'נתיבות': { lat: 31.4196, lon: 34.5903 },
  'שדרות': { lat: 31.5236, lon: 34.5982 },
  'אופקים': { lat: 31.3122, lon: 34.6219 },
  'קריית מלאכי': { lat: 31.7314, lon: 34.7380 },
}

/**
 * Calculate distance between two cities in km using Haversine formula
 */
export function distanceBetweenCities(city1: string, city2: string): number {
  const coord1 = CITY_COORDINATES[city1]
  const coord2 = CITY_COORDINATES[city2]

  if (!coord1 || !coord2) return 999 // unknown → treat as far

  const R = 6371 // Earth radius in km
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLon = toRad(coord2.lon - coord1.lon)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function toRad(deg: number) {
  return deg * (Math.PI / 180)
}
