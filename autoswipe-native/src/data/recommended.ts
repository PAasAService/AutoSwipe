// ─────────────────────────────────────────────────────────────────────────────
// src/data/recommended.ts
// Static content for the Recommended screen.
//
// LIVE STATUS KEY:
//   isComingSoon: false  →  URL is a known, real destination. Safe to open.
//   isComingSoon: true   →  URL is a placeholder / not yet live. Button is
//                           disabled and shows "בקרוב" badge. Do NOT set to
//                           false until the real URL is confirmed and tested.
//
// Before enabling any item, verify:
//   - The exact URL resolves with a 200 in a browser
//   - Affiliate links are live account-linked slugs, not placeholder slugs
//   - PDFs are uploaded and publicly accessible
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceItem {
  id: string
  name: string
  description: string
  url: string
  logoEmoji: string
  isAffiliate: boolean
  isComingSoon: boolean
}

export interface ServiceCategory {
  id: string
  icon: string
  title: string
  subtitle: string
  items: ServiceItem[]
}

export interface OfficialLink {
  id: string
  icon: string
  title: string
  description: string
  url: string
  isComingSoon: boolean  // true = URL path unverified, button disabled
}

export interface DocumentItem {
  id: string
  icon: string
  title: string
  description: string
  url: string
  isComingSoon: boolean
}

export interface GuideItem {
  id: string
  emoji: string
  title: string
  subtitle: string
  readMinutes: number
  publishedAt: string   // ISO-8601 — used for "חדש" badge (< 7 days)
  url: string
  isComingSoon: boolean // must be true until blog.autoswipe.co.il is live
}

export interface GadgetItem {
  id: string
  emoji: string
  title: string
  description: string
  price: string
  url: string
  isAffiliate: boolean
  isComingSoon: boolean // must be true until real affiliate account slug is confirmed
}

// ─── 1. Services ─────────────────────────────────────────────────────────────
// LIVE items (isComingSoon: false): direct.co.il, harel-group.co.il,
//   gov.il vehicle-inspection topic, shagrir.co.il — all verified real domains.
// Everything else is marked coming soon until partnership/URL is confirmed.

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'insurance',
    icon: '🛡️',
    title: 'ביטוח רכב',
    subtitle: 'השוואת מחירים לביטוח חובה ומקיף',
    items: [
      {
        id: 'ins-direct',
        name: 'ביטוח ישיר',
        description: 'השוואת מחירים מהירה לביטוח מקיף',
        // ✅ LIVE — verified real domain. Replace with affiliate tracking link once deal is signed.
        url: 'https://www.direct.co.il',
        logoEmoji: '🔵',
        isAffiliate: false,
        isComingSoon: false,
      },
      {
        id: 'ins-harel',
        name: 'הראל ביטוח',
        description: 'ביטוח מקיף עם כיסוי פרמיום',
        // ✅ LIVE — verified real domain. Replace with affiliate tracking link once deal is signed.
        url: 'https://www.harel-group.co.il',
        logoEmoji: '🟢',
        isAffiliate: false,
        isComingSoon: false,
      },
      {
        id: 'ins-kamin',
        name: 'קמין',
        description: 'פלטפורמת השוואה לביטוח רכב',
        // 🔒 COMING SOON — URL unverified, pending partnership
        url: 'https://www.kamin.co.il',
        logoEmoji: '🟡',
        isAffiliate: false,
        isComingSoon: true,
      },
    ],
  },
  {
    id: 'financing',
    icon: '💳',
    title: 'מימון רכב',
    subtitle: 'הלוואות לרכישת רכב בתנאים טובים',
    items: [
      {
        id: 'fin-bank-leumi',
        name: 'בנק לאומי',
        description: 'הלוואה לרכישת רכב — בקשה דיגיטלית',
        // 🔒 COMING SOON — leumi.co.il is real but /car-loan deep path is unverified.
        // Verify exact URL before enabling. Could be under /loans or /personal-banking.
        url: 'https://www.leumi.co.il',
        logoEmoji: '🏦',
        isAffiliate: false,
        isComingSoon: true,
      },
      {
        id: 'fin-gmac',
        name: 'מימון ישיר',
        description: 'ליסינג פרטי ומימון לרכב יד שניה',
        // 🔒 COMING SOON — URL and partnership unverified
        url: 'https://www.mimunyashar.co.il',
        logoEmoji: '💰',
        isAffiliate: false,
        isComingSoon: true,
      },
    ],
  },
  {
    id: 'test',
    icon: '🔧',
    title: 'טסט ובדיקות',
    subtitle: 'קביעת תור לטסט ובדיקת רכב לפני קנייה',
    items: [
      {
        id: 'test-gov',
        name: 'תור לטסט — רשות הרישוי',
        description: 'קביעת תור לטסט דרך האתר הממשלתי',
        // ✅ LIVE — verified gov.il topic page for vehicle inspection
        url: 'https://www.gov.il/he/departments/topics/vehicle-inspection',
        logoEmoji: '🏛️',
        isAffiliate: false,
        isComingSoon: false,
      },
      {
        id: 'test-seker',
        name: 'סקר רכב',
        description: 'בדיקת רכב מקצועית לפני קנייה — מגיעים אליך',
        // 🔒 COMING SOON — URL and partnership unverified
        url: 'https://www.sekerrechev.co.il',
        logoEmoji: '🔍',
        isAffiliate: false,
        isComingSoon: true,
      },
    ],
  },
  {
    id: 'mechanics',
    icon: '⚙️',
    title: 'מוסכים ושירות',
    subtitle: 'מוסכים מורשים ואחזקה שוטפת',
    items: [
      {
        id: 'mec-torque',
        name: 'Torque — מוסך דיגיטלי',
        description: 'הזמנת טיפול אונליין, שקיפות מחירים',
        // 🔒 COMING SOON — URL and partnership unverified
        url: 'https://www.torque.co.il',
        logoEmoji: '🔩',
        isAffiliate: false,
        isComingSoon: true,
      },
    ],
  },
  {
    id: 'towing',
    icon: '🚛',
    title: 'גרר ושליפה',
    subtitle: 'שירות גרר מהיר 24/7',
    items: [
      {
        id: 'tow-shagrir',
        name: 'שגריר',
        description: 'שירות גרר ועזרה בדרך — 24/7',
        // ✅ LIVE — verified real domain (well-known Israeli roadside service)
        url: 'https://www.shagrir.co.il',
        logoEmoji: '🚛',
        isAffiliate: false,
        isComingSoon: false,
      },
      {
        id: 'tow-hever',
        name: 'חבר בדרך',
        description: 'חבילות סיוע בדרך לחברי ארגון',
        // 🔒 COMING SOON — URL and partnership unverified
        url: 'https://www.hever.co.il',
        logoEmoji: '🤝',
        isAffiliate: false,
        isComingSoon: true,
      },
    ],
  },
  {
    id: 'carwash',
    icon: '🧼',
    title: 'שטיפה ופינוק',
    subtitle: 'שטיפת רכב, ציפוי ועיצוב',
    items: [
      {
        id: 'wash-icar',
        name: 'iCar Wash',
        description: 'רשת שטיפה אוטומטית — מציאת הסניף הקרוב',
        // 🔒 COMING SOON — URL and partnership unverified
        url: 'https://www.icarwash.co.il',
        logoEmoji: '💦',
        isAffiliate: false,
        isComingSoon: true,
      },
    ],
  },
  {
    id: 'legal',
    icon: '⚖️',
    title: 'ייעוץ משפטי',
    subtitle: 'עורכי דין לתאונות ועסקאות רכב',
    items: [
      {
        id: 'legal-auto',
        name: 'עו"ד לרכב',
        description: 'ייעוץ משפטי לתאונות, ביטוח ועסקאות',
        // 🔒 COMING SOON — business partnership not yet established
        url: 'https://www.autoswipe.co.il/legal',
        logoEmoji: '📋',
        isAffiliate: false,
        isComingSoon: true,
      },
    ],
  },
]

// ─── 2. Official Links ────────────────────────────────────────────────────────
// LIVE (isComingSoon: false):
//   gov-vehicle-history, gov-mot, gov-pollution — verified gov.il service URLs.
//
// DISABLED (isComingSoon: true):
//   gov-stolen — stolen vehicle check exists but the exact gov.il service path
//     is unverified. Pointing to wrong deep path causes confusing gov.il 404.
//   gov-recall — recall service URL path unverified. Enable once confirmed.

export const OFFICIAL_LINKS: OfficialLink[] = [
  {
    id: 'gov-vehicle-history',
    icon: '🏛️',
    title: 'היסטוריית רכב — gov.il',
    description: 'בדיקת נתוני רכב לפי מספר לוחית רישוי',
    // ✅ LIVE — verified gov.il vehicle information service
    url: 'https://www.gov.il/he/service/vehicle_information_service',
    isComingSoon: false,
  },
  {
    id: 'gov-mot',
    icon: '🚗',
    title: 'רשות הרישוי',
    description: 'טסטים, רישיון נהיגה, רישום רכב',
    // ✅ LIVE — verified gov.il ministry of transport page
    url: 'https://www.gov.il/he/departments/ministry_of_transport_and_road_safety',
    isComingSoon: false,
  },
  {
    id: 'gov-pollution',
    icon: '🌿',
    title: 'קבוצת זיהום אוויר',
    description: 'בדיקת קבוצת זיהום של הרכב ואזורי הגבלה',
    // ✅ LIVE — verified gov.il pollution group service
    url: 'https://www.gov.il/he/service/pollution_group',
    isComingSoon: false,
  },
  {
    id: 'gov-stolen',
    icon: '🔎',
    title: 'בדיקת רכב גנוב — משטרה',
    description: 'האם הרכב מדווח כגנוב?',
    // 🔒 COMING SOON — service exists but gov.il deep path not confirmed.
    // Verify exact URL before enabling (search gov.il for "רכב גנוב").
    url: 'https://www.gov.il/he/topics/vehicles',
    isComingSoon: true,
  },
  {
    id: 'gov-recall',
    icon: '⚠️',
    title: 'ריקולים ותקלות בטיחות',
    description: 'בדיקת ריקולים פתוחים לדגם הרכב',
    // 🔒 COMING SOON — recall URL path not confirmed.
    // Verify exact URL on gov.il / Ministry of Transport before enabling.
    url: 'https://www.gov.il/he/topics/vehicles',
    isComingSoon: true,
  },
]

// ─── 3. Documents ─────────────────────────────────────────────────────────────
// ALL isComingSoon: true — PDFs have not been created or hosted yet.
// Process to enable:
//   1. Create Hebrew PDF (Canva / Google Docs / InDesign)
//   2. Upload to S3 / CDN with public read access
//   3. Replace URL below with real CDN URL
//   4. Set isComingSoon: false
//   5. Test Linking.openURL on both iOS and Android

export const DOCUMENT_ITEMS: DocumentItem[] = [
  {
    id: 'doc-buyer-checklist',
    icon: '📋',
    title: 'צ\'קליסט לקנייה',
    description: 'רשימת כל הבדיקות לפני סגירת עסקה',
    url: 'https://cdn.autoswipe.co.il/docs/buyer-checklist.pdf',
    isComingSoon: true,
  },
  {
    id: 'doc-seller-checklist',
    icon: '📝',
    title: 'צ\'קליסט למכירה',
    description: 'איך להכין את הרכב ואת המסמכים למכירה',
    url: 'https://cdn.autoswipe.co.il/docs/seller-checklist.pdf',
    isComingSoon: true,
  },
  {
    id: 'doc-transfer-guide',
    icon: '📄',
    title: 'מדריך העברת בעלות',
    description: 'שלב אחר שלב: העברת בעלות נכונה ומשפטית',
    url: 'https://cdn.autoswipe.co.il/docs/ownership-transfer.pdf',
    isComingSoon: true,
  },
]

// ─── 4. Guides ────────────────────────────────────────────────────────────────
// ALL isComingSoon: true — blog.autoswipe.co.il does not exist yet.
// Every guide URL will 404 until the blog is live.
//
// Process to enable a guide:
//   1. Publish the article at the URL below (or update URL to match)
//   2. Confirm the page loads with a 200
//   3. Set isComingSoon: false for that guide
//   4. Set publishedAt to the real publish date to trigger "חדש" badge

export const GUIDE_ITEMS: GuideItem[] = [
  {
    id: 'guide-how-to-buy',
    emoji: '🛒',
    title: 'איך לקנות רכב יד שניה בישראל',
    subtitle: 'מהחיפוש עד העברת הבעלות — המדריך המלא',
    readMinutes: 8,
    publishedAt: '2026-03-28T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/how-to-buy',
    isComingSoon: true,  // 🔒 blog.autoswipe.co.il not live
  },
  {
    id: 'guide-negotiation',
    emoji: '🤝',
    title: 'איך לנהל מו"מ עם המוכר',
    subtitle: 'טקטיקות שפועלות ומה לא להגיד',
    readMinutes: 5,
    publishedAt: '2026-03-20T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/negotiation',
    isComingSoon: true,  // 🔒 blog not live
  },
  {
    id: 'guide-true-cost',
    emoji: '💸',
    title: 'עלות האמיתית של הרכב',
    subtitle: 'ביטוח + דלק + טסט + פחת — חשב נכון',
    readMinutes: 6,
    publishedAt: '2026-03-15T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/true-cost',
    isComingSoon: true,  // 🔒 blog not live
  },
  {
    id: 'guide-electric',
    emoji: '⚡',
    title: 'כדאי לקנות חשמלי עכשיו?',
    subtitle: 'עלויות, טעינה, תמריצי מדינה — כל מה שצריך לדעת',
    readMinutes: 7,
    publishedAt: '2026-03-25T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/electric',
    isComingSoon: true,  // 🔒 blog not live
  },
  {
    id: 'guide-sell',
    emoji: '📸',
    title: 'איך לצלם ולתמחר את הרכב שלך',
    subtitle: 'צילום מקצועי + מחיר שמושך קונים',
    readMinutes: 4,
    publishedAt: '2026-04-01T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/how-to-sell',
    isComingSoon: true,  // 🔒 blog not live
  },
  {
    id: 'guide-inspection',
    emoji: '🔬',
    title: 'בדיקת רכב לפני קנייה — מה לחפש',
    subtitle: 'גם בלי להיות מכונאי — 15 דקות שחוסכות אלפים',
    readMinutes: 6,
    publishedAt: '2026-03-10T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/inspection',
    isComingSoon: true,  // 🔒 blog not live
  },
  {
    id: 'guide-financing',
    emoji: '🏦',
    title: 'ליסינג מול הלוואה — מה עדיף?',
    subtitle: 'השוואה כלכלית לפי תקציב ואורח חיים',
    readMinutes: 5,
    publishedAt: '2026-02-28T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/financing',
    isComingSoon: true,  // 🔒 blog not live
  },
]

// ─── 5. Gadgets ───────────────────────────────────────────────────────────────
// ALL isComingSoon: true — every amzn.to slug below is a fabricated placeholder.
// These slugs do not correspond to real affiliate-linked products.
// Opening them will either 404 or redirect to an unrelated Amazon page.
//
// Process to enable a gadget:
//   1. Register for Amazon Associates IL (or equivalent)
//   2. Find the specific product on Amazon IL
//   3. Generate a real affiliate short link from the Associates dashboard
//   4. Replace url below with that link
//   5. Set isComingSoon: false
//   6. Verify the link opens the correct product page

export const GADGET_ITEMS: GadgetItem[] = [
  {
    id: 'gad-obd',
    emoji: '📡',
    title: 'סורק OBD2 אלחוטי',
    description: 'קרא שגיאות מנוע מהסמארטפון לפני שאתה קונה',
    price: '₪89',
    url: 'https://www.amazon.co.il',  // 🔒 replace with real affiliate link
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-dashcam',
    emoji: '📷',
    title: 'מצלמת דרך 4K',
    description: 'הגנה מלאה בכביש, GPS מובנה, הקלטת לילה',
    price: '₪249',
    url: 'https://www.amazon.co.il',  // 🔒 replace with real affiliate link
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-carplay',
    emoji: '📱',
    title: 'מתאם CarPlay אלחוטי',
    description: 'הפוך CarPlay קווי לאלחוטי — התחבר מיד',
    price: '₪179',
    url: 'https://www.amazon.co.il',  // 🔒 replace with real affiliate link
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-tyre',
    emoji: '🔄',
    title: 'מד לחץ צמיגים דיגיטלי',
    description: 'בדיקה מדויקת, קומפקטי, חובה בכל רכב',
    price: '₪49',
    url: 'https://www.amazon.co.il',  // 🔒 replace with real affiliate link
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-jump',
    emoji: '⚡',
    title: 'סטרטר קפיצה נייד',
    description: 'הצת רכב גם ללא עזרה חיצונית — חובה בתיק',
    price: '₪199',
    url: 'https://www.amazon.co.il',  // 🔒 replace with real affiliate link
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-mat',
    emoji: '🧹',
    title: 'שטיחי רכב 3D פרמיום',
    description: 'שטיחים מותאמים לדגם הרכב שלך, הגנה מלאה',
    price: '₪220',
    url: 'https://www.amazon.co.il',  // 🔒 replace with real affiliate link
    isAffiliate: true,
    isComingSoon: true,
  },
]
