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

export type GuideBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'warning'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'numbered'; items: string[] }
  | { type: 'divider' }

export interface GuideItem {
  id: string
  emoji: string
  title: string
  subtitle: string
  readMinutes: number
  publishedAt: string   // ISO-8601 — used for "חדש" badge (< 7 days)
  url: string
  isComingSoon: boolean // true = opens external URL, false = opens in-app
  content?: GuideBlock[]
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

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'insurance',
    icon: '🛡️',
    title: 'ביטוח רכב',
    subtitle: 'השוואת מחירים לביטוח חובה ומקיף',
    items: [
      {
        id: 'ins-harel',
        name: 'הראל ביטוח',
        description: 'ביטוח מקיף עם כיסוי פרמיום',
        url: 'https://www.harel-group.co.il',
        logoEmoji: '🟢',
        isAffiliate: false,
        isComingSoon: false,
      },
      {
        id: 'ins-bestie',
        name: 'Bestie',
        description: 'השוואת ביטוח רכב — מחיר אמיתי בדקה',
        url: 'https://www.bestie.co.il',
        logoEmoji: '🟣',
        isAffiliate: false,
        isComingSoon: false,
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
        url: 'https://www.leumi.co.il',
        logoEmoji: '🏦',
        isAffiliate: false,
        isComingSoon: true,
      },
      {
        id: 'fin-5555',
        name: '5555 מימון',
        description: 'הלוואה לקניית רכב — בקשה מהירה ותשובה מיידית',
        url: 'https://www.5555.co.il/%D7%9E%D7%99%D7%9E%D7%95%D7%9F-%D7%9C%D7%A7%D7%A0%D7%99%D7%99%D7%AA-%D7%A8%D7%9B%D7%91',
        logoEmoji: '💰',
        isAffiliate: false,
        isComingSoon: false,
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
        url: 'https://www.gov.il/he/service/vehicle_authorized_licensing_agency',
        logoEmoji: '🏛️',
        isAffiliate: false,
        isComingSoon: false,
      },
      {
        id: 'test-seker',
        name: 'סקר רכב',
        description: 'בדיקת רכב מקצועית לפני קנייה — מגיעים אליך',
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
        url: 'https://www.shagrir.co.il',
        logoEmoji: '🚛',
        isAffiliate: false,
        isComingSoon: false,
      },
      {
        id: 'tow-yedidim',
        name: 'ידידים',
        description: 'עזרה בדרך מהקהילה — שירות התנדבותי 24/7',
        url: 'https://yedidim-il.org',
        logoEmoji: '🧡',
        isAffiliate: false,
        isComingSoon: false,
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
        url: 'https://www.autoswipe.co.il/legal',
        logoEmoji: '📋',
        isAffiliate: false,
        isComingSoon: true,
      },
    ],
  },
]

// ─── 2. Official Links ────────────────────────────────────────────────────────

export const OFFICIAL_LINKS: OfficialLink[] = [
  {
    id: 'gov-vehicle-history',
    icon: '🏛️',
    title: 'היסטוריית רכב — gov.il',
    description: 'בדיקת נתוני רכב פרטי לפי מספר לוחית רישוי',
    url: 'https://www.gov.il/he/Departments/DynamicCollectors/private_vehicle_history_1?skip=0',
    isComingSoon: false,
  },
  {
    id: 'gov-licence-renewal',
    icon: '🪪',
    title: 'חידוש רישיון רכב — gov.il',
    description: 'חידוש רישיון הרכב אונליין ללא המתנה',
    url: 'https://www.gov.il/he/service/car_licence_renewal',
    isComingSoon: false,
  },
  {
    id: 'gov-mot',
    icon: '🚗',
    title: 'רשות הרישוי',
    description: 'טסטים, רישיון נהיגה, רישום רכב',
    url: 'https://www.gov.il/he/departments/ministry_of_transport_and_road_safety',
    isComingSoon: false,
  },
  {
    id: 'gov-stolen',
    icon: '🔎',
    title: 'בדיקת רכב גנוב — משטרה',
    description: 'האם הרכב מדווח כגנוב?',
    url: 'https://www.gov.il/he/topics/vehicles',
    isComingSoon: true,
  },
  {
    id: 'gov-recall',
    icon: '⚠️',
    title: 'ריקולים ותקלות בטיחות',
    description: 'בדיקת ריקולים פתוחים לדגם הרכב',
    url: 'https://www.gov.il/he/topics/vehicles',
    isComingSoon: true,
  },
]

// ─── 3. Documents ─────────────────────────────────────────────────────────────

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

export const GUIDE_ITEMS: GuideItem[] = [
  {
    id: 'guide-how-to-buy',
    emoji: '🛒',
    title: 'איך לקנות רכב יד שניה בישראל',
    subtitle: 'מהחיפוש עד העברת הבעלות — המדריך המלא',
    readMinutes: 8,
    publishedAt: '2026-03-28T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/how-to-buy',
    isComingSoon: false,
    content: [
      {
        type: 'paragraph',
        text: 'רכישת רכב יד שניה זו אחת הרכישות הגדולות שרוב האנשים עושים — ובישראל יש לה כללים משלה. השוק כאן שונה מאירופה, המחירים לא זולים, והמוכרים לא תמיד שקופים. המדריך הזה ייקח אותך שלב אחר שלב.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'שלב 1 — לפני שמחפשים: מה אתה צריך?' },
      {
        type: 'paragraph',
        text: 'לפני שפותחים אפליקציה אחת, שב ותענה על שלוש שאלות:',
      },
      {
        type: 'numbered',
        items: [
          'כמה ק"מ בשנה אתה נוסע? (עד 15,000 — חשמלי הגיוני. מעל 20,000 — תשקול שוב)',
          'האם יש לך חניה פרטית? (חיוני לטעינת חשמלי)',
          'מה התקציב המקסימלי — כולל ביטוח, טסט ותיקונים?',
        ],
      },
      {
        type: 'tip',
        text: 'אל תתאהב בדגם מסוים לפני שבדקת את עלות הביטוח שלו. לפעמים ביטוח מקיף לרכב ספורטיבי עולה יותר מהרכב עצמו.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'שלב 2 — תקציב ריאלי' },
      {
        type: 'paragraph',
        text: 'טעות קלאסית: לחשוב שמחיר הרכב = עלות הרכב. בישראל תוסיף עוד 15–25% מעל המחיר שראית במודעה:',
      },
      {
        type: 'list',
        items: [
          'ביטוח מקיף: ₪3,000–₪9,000 לשנה (תלוי גיל, ניסיון ואזור)',
          'בדיקה מכונאית לפני קנייה: ₪300–₪600',
          'טסט: ₪280 (אם לא עשוי)',
          'העברת בעלות ואגרות: ₪1,100–₪1,800',
          'כרית לתיקונים ראשוניים: לפחות ₪3,000',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'שלב 3 — איפה לחפש?' },
      {
        type: 'paragraph',
        text: 'יד2 הוא הדומיננטי, אבל לא היחיד. AutoSwipe מאפשר למצוא לפי העדפות — לא רק לפי דגם. מגרשי רכב מספקים ערבות אמיתית אבל גובים על זה. פרטי דרך חברים — לרוב הפאנד הכי טוב, ובתנאי שהרכב נבדק.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'שלב 4 — נורות אדומות שחייבים לזהות' },
      {
        type: 'warning',
        text: 'מוכר שמסרב לבדיקה מכונאית עצמאית — עצור הכול. זה כמעט תמיד מסתיר משהו.',
      },
      {
        type: 'list',
        items: [
          'קילומטרז׳ נמוך מאוד ביחס לגיל הרכב (מעל 15 שנה, פחות מ-80,000 ק"מ? שאל שאלות)',
          'תמונות מטושטשות, בלי פנים, או "הרכב אצל אחי"',
          'לחץ לסגור מהר — "יש עוד מישהו שמחכה"',
          'מוכר שמסרב להציג את ספר השירות',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'שלב 5 — מה לא לדלג עליו' },
      {
        type: 'numbered',
        items: [
          'בדיקה ב-gov.il לפי מספר הרכב — חינמי ולוקח שתי דקות',
          'בדיקה מכונאית עצמאית — גם אם הרכב נראה מושלם',
          'ווידוא שהרכב לא ממושכן (בדיקת עיקולים בהוצאה לפועל)',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'שלב 6 — ניהול המשא ומתן' },
      {
        type: 'paragraph',
        text: 'אחרי הבדיקה יש לך קלפים. כל ליקוי שנמצא הוא הנחה לגיטימית. אל תתנצל על זה — המוכר כבר השקיע בך זמן ורוצה לסגור.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'שלב 7 — העברת בעלות נכונה' },
      {
        type: 'paragraph',
        text: 'הולכים יחד לדואר. מביאים תעודות זהות, רישיון רכב וטסט תקף. משלמים ביחד. אל תעביר כסף לפני שהבעלות הועברה רשמית.',
      },
      {
        type: 'tip',
        text: 'תמיד בדוק ב-gov.il לפני שאתה מגיע לראות את הרכב. אם הנתונים לא מסתדרים עם מה שהמוכר אמר — אתה כבר יודע מה לעשות.',
      },
    ],
  },

  {
    id: 'guide-negotiation',
    emoji: '🤝',
    title: 'איך לנהל מו"מ עם המוכר',
    subtitle: 'טקטיקות שפועלות ומה לא להגיד',
    readMinutes: 5,
    publishedAt: '2026-03-20T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/negotiation',
    isComingSoon: false,
    content: [
      {
        type: 'paragraph',
        text: 'ישראלים לא אוהבים להתמקח — אבל בשוק רכבי יד שניה זה המשחק. מי שלא מנהל משא ומתן משאיר בממוצע ₪3,000–₪7,000 על השולחן. הנה איך לא להיות אותו אחד.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'כלל 1 — אל תגלה אהבה' },
      {
        type: 'paragraph',
        text: 'אם ראית רכב שאתה אוהב — אל תגיד את זה. "יפה", "בדיוק מה שחיפשתי" — המחיר עולה ב-5% רק בגלל שהבעת עניין. שמור על פוקר פייס. אמור: "בסדר, יש לי עוד שניים לראות".',
      },
      { type: 'divider' },
      { type: 'heading', text: 'כלל 2 — הבדיקה היא הנשק שלך' },
      {
        type: 'paragraph',
        text: 'כל ליקוי שמוצא מכונאי הוא נקודת מינוף. "לא תיקנת את הכרית הקדמית? בסדר, אנחנו מורידים ₪1,500 מהמחיר ואני אדאג לזה." זה הגיוני, זה הוגן, ורוב המוכרים יסכימו.',
      },
      {
        type: 'tip',
        text: 'קבל הצעת מחיר מהמוסך לפני הפגישה עם המוכר. כך תציג מספרים קונקרטיים, לא ניחושים.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'כלל 3 — ה"שבור" הראשון' },
      {
        type: 'paragraph',
        text: 'אל תציע מחיר ראשון. שאל: "מה המחיר הכי טוב שאתה יכול לתת?" לרוב המוכר יוריד כבר בשלב הזה. רק אחרי שהוא הוריד — אתה מתחיל.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'כלל 4 — כסף מזומן עדיין מדבר' },
      {
        type: 'paragraph',
        text: 'גם בעידן הביט — מוכר פרטי שמקבל ₪50,000 במזומן מרגיש את זה אחרת מהעברה בנקאית. לרוב זה שווה ₪500–₪2,000 נוספים בהנחה.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'כלל 5 — הצע "חבילה"' },
      {
        type: 'paragraph',
        text: '"אני לוקח היום, לא מתמקח עוד, אבל תצרף את מגשי שלג / כיסויי מושב / שנה ביטוח." לפעמים הם מוסיפים אקסטרות שעולות להם מעט — ואתה מרגיש שקיבלת.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'מה לא לעשות' },
      {
        type: 'list',
        items: [
          'אל תשלח הצעה נמוכה מדי בוואטסאפ לפני הפגישה — זה משדר שאינך רציני',
          'אל תנהל מו"מ בטלפון — בפנים אתה קורא את שפת הגוף',
          'אל תיתן אולטימטום שאתה לא מוכן לעמוד בו',
          'אל תתנצל על כך שאתה מבקש הנחה — זה מקובל לחלוטין',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'הסיום הנכון' },
      {
        type: 'paragraph',
        text: 'כשהגעתם להסכמה — כתבו הסכם ידיים קצר. שם, ת.ז., מחיר, מספר רכב, תנאי תשלום. זה מגן על שניכם ומבהיר שהעסקה סגורה.',
      },
      {
        type: 'tip',
        text: 'אם המוכר לא מוכן לרדת כלל במחיר — שאל אותו מה הוא כן יכול להוסיף לעסקה. לפעמים גמישות בצורה אחרת פותחת את הדיון.',
      },
    ],
  },

  {
    id: 'guide-true-cost',
    emoji: '💸',
    title: 'עלות האמיתית של הרכב',
    subtitle: 'ביטוח + דלק + טסט + פחת — חשב נכון',
    readMinutes: 6,
    publishedAt: '2026-03-15T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/true-cost',
    isComingSoon: false,
    content: [
      {
        type: 'paragraph',
        text: 'קנית רכב ב-₪70,000? מזל טוב. עכשיו תחשב כמה הוא באמת יעלה לך בשנה. הנתון שרוב האנשים לא מחשבים לפני הקנייה — ואחר כך מתפלאים.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'עלות 1 — ביטוח' },
      {
        type: 'list',
        items: [
          'ביטוח חובה (חובה לפי חוק): ₪1,200–₪2,500 לשנה',
          'ביטוח מקיף: ₪2,500–₪9,000 לשנה (תלוי גיל, ניסיון ואזור)',
          'יחד: ₪300–₪960 לחודש — רק לביטוח',
        ],
      },
      {
        type: 'tip',
        text: 'לפני שקונים — קבל הצעת ביטוח לאותו הרכב. המחיר יפתיע אותך, לטוב ולרע.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'עלות 2 — דלק ואנרגיה' },
      {
        type: 'list',
        items: [
          'בנזין: כ-₪7.20 לליטר. רכב שצורך 8 ליטר/100 ק"מ × 1,500 ק"מ בחודש = ₪864',
          'חשמלי: כ-₪0.55 לקו"ט. אותה נסיעה עולה בסביבות ₪165 בחודש',
          'גפ"מ (LPG): ₪3.50–₪4.50 לליטר — פתרון ביניים',
        ],
      },
      {
        type: 'paragraph',
        text: 'ההפרש בין בנזין לחשמלי: כ-₪700 לחודש. זה ₪8,400 בשנה. לאורך 5 שנים — יותר מ-₪40,000.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'עלות 3 — טסט ורישיון' },
      {
        type: 'list',
        items: [
          'טסט שנתי: ₪280',
          'רישיון רכב: ₪400 לשנה',
          'סה"כ: כ-₪680 לשנה — או ₪57 לחודש',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'עלות 4 — תחזוקה שוטפת' },
      {
        type: 'list',
        items: [
          'החלפת שמן: ₪250–₪500 כל 10,000–15,000 ק"מ',
          'צמיגים: ₪1,500–₪3,000 כל 4–5 שנים',
          'בלמים: ₪800–₪2,000 כל כמה שנים',
          'פילטרים ונוזלים: ₪300–₪600 בשנה',
          'ממוצע שנתי: ₪2,000–₪5,000',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'עלות 5 — פחת (הכי נסתר, הכי כואב)' },
      {
        type: 'paragraph',
        text: 'רכב מאבד כ-10% מערכו בשנה הראשונה, ו-7–8% בשנים הבאות. רכב שקנית ב-₪100,000 שווה ₪90,000 אחרי שנה — זו "עלות" של ₪10,000 שלא רואים בחשבון הבנק אבל מרגישים בעת המכירה.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'החישוב הכולל — רכב ממוצע' },
      {
        type: 'list',
        items: [
          'ביטוח: ~₪550 לחודש',
          'דלק: ~₪700 לחודש',
          'תחזוקה: ~₪250 לחודש',
          'פחת: ~₪600 לחודש',
          'סה"כ: כ-₪2,100 לחודש',
        ],
      },
      {
        type: 'warning',
        text: 'זה לפני תשלומי הלוואה, חניה, וקנסות תנועה. לפני שאתה קונה — שאל את עצמך: האם אני יכול להרשות לעצמי ₪2,000–₪2,500 לחודש בסך הכל?',
      },
    ],
  },

  {
    id: 'guide-electric',
    emoji: '⚡',
    title: 'כדאי לקנות חשמלי עכשיו?',
    subtitle: 'עלויות, טעינה, תמריצי מדינה — כל מה שצריך לדעת',
    readMinutes: 7,
    publishedAt: '2026-03-25T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/electric',
    isComingSoon: false,
    content: [
      {
        type: 'paragraph',
        text: 'ב-2026, מכוניות חשמליות הן כבר לא עתיד — הן ההווה. אבל האם הן נכונות עבורך? זו שאלה שונה לגמרי, ותלויה בנסיבות האישיות שלך.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'הצד החיובי — מה מרוויחים' },
      {
        type: 'subheading',
        text: 'עלויות נסיעה',
      },
      {
        type: 'paragraph',
        text: 'חשמלי עולה כ-₪165 לחודש בטעינה לעומת כ-₪864 בדלק בנזין. חיסכון של יותר מ-₪700 לחודש — זה ₪8,400 בשנה.',
      },
      {
        type: 'subheading',
        text: 'תחזוקה',
      },
      {
        type: 'paragraph',
        text: 'אין החלפת שמן, פחות בלאי בבלמים (בזכות רקופרציה), פחות חלקים זזים. תחזוקה שנתית בסביבות ₪800–₪1,500 לעומת ₪2,500–₪5,000 ברכב בנזין.',
      },
      {
        type: 'subheading',
        text: 'תמריצי מדינה',
      },
      {
        type: 'paragraph',
        text: 'על חשמלי חדש — עד ₪15,000 הנחה במס קנייה. לרכב יד שניה פחות ישיר, אבל המחיר כבר מגולם בשוק.',
      },
      {
        type: 'tip',
        text: 'נסיעה בעיר עם תחנות טעינה ציבוריות? לפעמים זה אפילו זול יותר מטעינה בבית.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'הצד השלילי — מה צריך לדעת' },
      {
        type: 'subheading',
        text: 'טעינה בדרך',
      },
      {
        type: 'paragraph',
        text: 'תחנות DC מהירות בישראל — יש, אבל לא מספיק. נסיעה מתל אביב לאילת דורשת תכנון מראש ועצירות בדרך.',
      },
      {
        type: 'subheading',
        text: 'גרים בדירה בלי חניה?',
      },
      {
        type: 'warning',
        text: 'אם אין לך חניה פרטית — חשמלי הוא כאב ראש אמיתי. טעינה ב"עמוד רחוב" עדיין לא מספיק נפוצה בישראל.',
      },
      {
        type: 'subheading',
        text: 'מחיר כניסה',
      },
      {
        type: 'paragraph',
        text: 'חשמלי יד שניה עדיין יקר יותר ממקביל הבנזין. ההחזר על ההשקעה לוקח בין 3 ל-5 שנים תלוי בנסיעות.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'למי חשמלי מתאים?' },
      {
        type: 'list',
        items: [
          '✅ גר בבית עם חניה פרטית',
          '✅ נוסע עד 150 ק"מ ביום',
          '✅ מתכנן להחזיק את הרכב לפחות 3 שנים',
          '✅ נוסע בעיקר בתוך העיר',
          '❌ גר בדירה ללא חניה',
          '❌ נוסע הרבה בין ערים',
          '❌ זקוק לגמישות מוחלטת בכל מזג אוויר',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'דגמים שכדאי לבדוק' },
      {
        type: 'subheading',
        text: 'יד שניה בישראל',
      },
      {
        type: 'list',
        items: [
          'ניסן ליף — זול, אמין, טווח קצר (מתאים לעיר בלבד)',
          'MG ZS EV — מחיר-ביצועים טוב',
          'יונדאי קונה EV — אמין, טווח סביר',
        ],
      },
      {
        type: 'subheading',
        text: 'חדשים ומומלצים',
      },
      {
        type: 'list',
        items: [
          'BYD Atto 3 — ערך מצוין לכסף',
          'מיצובישי Eclipse Cross PHEV — היברידי נטען לגמישות מקסימלית',
        ],
      },
      { type: 'divider' },
      {
        type: 'paragraph',
        text: 'אם יש לך חניה פרטית — כנראה שחשמלי עדיף כלכלית לאורך זמן. אם אין — אל תכנס לכאב ראש. PHEV (היברידי נטען) עשוי להיות פתרון הביניים המושלם.',
      },
    ],
  },

  {
    id: 'guide-sell',
    emoji: '📸',
    title: 'איך לצלם ולתמחר את הרכב שלך',
    subtitle: 'צילום מקצועי + מחיר שמושך קונים',
    readMinutes: 4,
    publishedAt: '2026-04-01T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/how-to-sell',
    isComingSoon: false,
    content: [
      {
        type: 'paragraph',
        text: 'שני דברים קובעים כמה שיחות תקבל: תמונות ומחיר. אפשר לכתוב את הפרסומת הכי יפה בעולם — אבל אם התמונות גרועות, אף אחד לא יגיע לראות את הרכב.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'צילום — 10 כללים שמשנים הכל' },
      {
        type: 'numbered',
        items: [
          'שטוף קודם. נראה ברור, אבל 40% מהמוכרים לא עושים את זה. רכב נקי נראה שווה יותר.',
          'צלם בשעת הזהב — שעה אחרי זריחה או לפני שקיעה. האור הזה מחמיא לכל רכב.',
          '7 תמונות חוץ חובה: חזית, צד ימין, אחורה, צד שמאל, וג׳ אלכסוני קדמי ואחורי.',
          'הפנים חשובים לא פחות: לוח מחוונים, מושבים קדמיים ואחוריים, תא מטען, תקרה.',
          'יש שריטה? צלם אותה וציין אותה. זה יוצר אמון ומונע אכזבה בפגישה.',
          'לא על רקע כאוס — חניית בית חולים, ליד פח, על דשא שרוף. מצא רחוב נקי ורגוע.',
          'תמונת מד הקילומטרים — חובה. זה הדבר הראשון שקונים רוצים לראות.',
          'בקש מישהו לעזור — לפעמים אחד מחזיק דלת בזווית מסוימת וזה נראה הרבה יותר מקצועי.',
          'אל תפלטר יתר על המידה. בהירות קצת — כן. פילטרים שמסתירים צבע — לא.',
          'כמות: יד2 מאפשר 20 תמונות. קח 20.',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'תמחור — איך לדעת כמה לבקש' },
      {
        type: 'paragraph',
        text: 'בדוק 10–15 מודעות של אותו דגם, שנה ומנוע. זה יהיה הטווח שלך. לאחר מכן התאם:',
      },
      {
        type: 'subheading',
        text: 'הוסף לממוצע אם:',
      },
      {
        type: 'list',
        items: [
          'קילומטרז׳ נמוך',
          'ספר שירות מלא',
          'טסט כלול',
          'צמיגים חדשים',
          'ריפוד מעולה',
        ],
      },
      {
        type: 'subheading',
        text: 'הורד מהממוצע אם:',
      },
      {
        type: 'list',
        items: [
          'נזק ידוע',
          'קילומטרז׳ גבוה',
          'צבע לא פופולרי',
          'ליקויים שלא תוקנו',
        ],
      },
      {
        type: 'tip',
        text: 'קבע מחיר ₪3,000–₪5,000 מעל מה שאתה מוכן לסגור בו. לא יותר — מחיר גבוה מדי גורם לאנשים להתעלם מהמודעה לגמרי.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'הכותרת והתיאור' },
      {
        type: 'paragraph',
        text: 'כותרת: שנה + דגם + נקודה בולטת אחת ("קילומטרז׳ נמוך", "ספר שירות מלא").',
      },
      {
        type: 'paragraph',
        text: 'תיאור: כתוב כמו שאתה מספר לחבר. ישיר, בלי buzzwords. ציין: תאריך טסט, קילומטרז׳, מקור הרכב, ותנאי תשלום מועדפים.',
      },
    ],
  },

  {
    id: 'guide-inspection',
    emoji: '🔬',
    title: 'בדיקת רכב לפני קנייה — מה לחפש',
    subtitle: 'גם בלי להיות מכונאי — 15 דקות שחוסכות אלפים',
    readMinutes: 6,
    publishedAt: '2026-03-10T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/inspection',
    isComingSoon: false,
    content: [
      {
        type: 'paragraph',
        text: 'לא צריך להיות מכונאי כדי לזהות רכב בעייתי. 80% מהבעיות ניתנות לזיהוי בבדיקה ויזואלית של 15 דקות — אם יודעים מה לחפש.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'לפני שמגיעים — gov.il' },
      {
        type: 'paragraph',
        text: 'בדוק קודם כל ב-gov.il לפי מספר הרכב. תגלה: שנת ייצור, קילומטרז׳ אחרון בטסט (לא ניתן לזייף) ומספר בעלויות קודמות.',
      },
      {
        type: 'tip',
        text: 'אם הקילומטרז׳ שהמוכר מציג נמוך מהקילומטרז׳ שרשום בטסט הקודם — עצור. זה אחד הסימנים הבטוחים לזיוף.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'חלק 1 — בדיקה ויזואלית חיצונית' },
      {
        type: 'subheading',
        text: 'קרוסריה',
      },
      {
        type: 'paragraph',
        text: 'לך לאורך הרכב ותסתכל לאורך הפח. חפש אי-שוויוניות, גלים קטנים, או שינויי גוון — כל אלה מצביעים על תיקון תאונה. בדוק שהפסים בין הדלתות שווים בכל הרכב.',
      },
      {
        type: 'subheading',
        text: 'צבע',
      },
      {
        type: 'paragraph',
        text: 'בדוק בצל. הבדל גוון בין פנלים = הרכב צובע. גע בפח — אם יש מרקם "תפוח" קל, זה בדרך כלל פוטי על נזק.',
      },
      {
        type: 'subheading',
        text: 'שמשה קדמית',
      },
      {
        type: 'paragraph',
        text: 'סדקים קטנים, אפילו שוליים — יגדלו. בישראל שמשה קדמית עם סדק לא עוברת טסט.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'חלק 2 — מתחת למכסה' },
      {
        type: 'subheading',
        text: 'שמן מנוע',
      },
      {
        type: 'paragraph',
        text: 'שלוף את הדיפסטיק. שמן שחור לגמרי = לא החליפו מזמן. שמן שנראה כמו קפה עם חלב = בעיית קירור חמורה — ברח.',
      },
      {
        type: 'subheading',
        text: 'נוזל קירור',
      },
      {
        type: 'paragraph',
        text: 'בדוק צבע בצינור הגמיש. אמור להיות ירוק, כתום או ורוד. חום או שחור = בעיה.',
      },
      {
        type: 'subheading',
        text: 'חגורת שיניים',
      },
      {
        type: 'warning',
        text: 'שאל מתי הוחלפה חגורת השיניים. אם לא יודעים — זה עלות של ₪1,500–₪3,000 שתצטרך להוסיף. שלא תגלה את זה רק אחרי הקנייה.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'חלק 3 — בתוך הרכב' },
      {
        type: 'list',
        items: [
          'הדלק מנוע — כל נורות האזהרה צריכות לכבות תוך 3 שניות. נורה שנשארת — שאל.',
          'הדלק מיזוג על קר MAX — תוך 2 דקות אמור לצאת אוויר קר מאוד.',
          'בדוק גג פנורמי: פתח וסגור כמה פעמים. האיטום תקין?',
          'נסה כל החלונות, נעילת דלתות ורמקולים.',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'חלק 4 — נסיעת מבחן' },
      {
        type: 'paragraph',
        text: 'נסע 15–20 דקות. כלל אחד: בלי מוזיקה. תקשיב.',
      },
      {
        type: 'list',
        items: [
          'האם יש רעשים חריגים מהמתלים בבליעת מהמורות?',
          'האם הרכב מושך לצד כשמרפים מההגה?',
          'האם הבלמים "תופסים" מוקדם או מאוחר מדי?',
          'האם ההגה חוזר לאמצע אחרי פנייה?',
          'האם יש רטט חריג במהירות כביש מהיר?',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'מתי לברוח מיד' },
      {
        type: 'warning',
        text: 'המוכר מסרב לבדיקה מכונאית עצמאית — עצור. אין אחד שמסרב לבדיקה כשהרכב תקין.',
      },
      {
        type: 'tip',
        text: 'בדיקה מכונאית ב-₪300–₪600 יכולה לחסוך ₪10,000–₪30,000. אל תדלג עליה.',
      },
    ],
  },

  {
    id: 'guide-financing',
    emoji: '🏦',
    title: 'ליסינג מול הלוואה — מה עדיף?',
    subtitle: 'השוואה כלכלית לפי תקציב ואורח חיים',
    readMinutes: 5,
    publishedAt: '2026-02-28T00:00:00.000Z',
    url: 'https://blog.autoswipe.co.il/financing',
    isComingSoon: false,
    content: [
      {
        type: 'paragraph',
        text: 'שאלה שכולם שואלים ומעט מבינים לעומק. התשובה תלויה במצב הספציפי שלך — אין "תמיד עדיף". בואו נפרק את זה.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'מה זה ליסינג פרטי?' },
      {
        type: 'paragraph',
        text: 'אתה משכיר רכב לתקופה קבועה (בדרך כלל 3–5 שנים) ומשלם תשלום חודשי קבוע. בסוף — מחזיר את הרכב. אתה לא בעלים.',
      },
      {
        type: 'subheading',
        text: 'יתרונות ליסינג:',
      },
      {
        type: 'list',
        items: [
          'תשלום חודשי ידוע וקבוע — אין הפתעות',
          'לרוב כולל תחזוקה, ביטוח ולפעמים אפילו טסט',
          'אחרי 3–5 שנים — רכב חדש ללא טרחה',
          'אין סיכון פחת — הוא בעיה של חברת הליסינג',
        ],
      },
      {
        type: 'subheading',
        text: 'חסרונות ליסינג:',
      },
      {
        type: 'list',
        items: [
          'לא מקבל בעלות — לא מצבר נכס',
          'קילומטרז׳ מוגבל (עלייה = עמלה יקרה)',
          'יקר יותר לאורך שנים רבות',
          'תלות בחברת הליסינג לכל בעיה',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'מה זה הלוואה לרכב?' },
      {
        type: 'paragraph',
        text: 'לווה כסף מהבנק, קונה רכב, מחזיר עם ריבית. בסוף — הרכב שלך לגמרי.',
      },
      {
        type: 'subheading',
        text: 'יתרונות הלוואה:',
      },
      {
        type: 'list',
        items: [
          'הרכב הוא נכס שלך — יכול למכור מתי שתרצה',
          'גמיש — אין הגבלת קילומטרז׳',
          'זול יותר בטווח הארוך',
          'חופש מוחלט בשימוש ובשינויים',
        ],
      },
      {
        type: 'subheading',
        text: 'חסרונות הלוואה:',
      },
      {
        type: 'list',
        items: [
          'אחראי לכל תחזוקה ותיקון',
          'סיכון פחת — הרכב יורד בערך',
          'הון עצמי ראשוני גדול יותר',
        ],
      },
      { type: 'divider' },
      { type: 'heading', text: 'השוואה מספרית — רכב ₪150,000' },
      {
        type: 'subheading',
        text: 'ליסינג 3 שנים:',
      },
      {
        type: 'list',
        items: [
          'תשלום חודשי: ~₪3,500',
          'סך הכל 3 שנים: ~₪126,000',
          'בסוף: אין רכב',
        ],
      },
      {
        type: 'subheading',
        text: 'הלוואה בנקאית (20% הון עצמי):',
      },
      {
        type: 'list',
        items: [
          'תשלום חודשי: ~₪2,800',
          'סך הכל 5 שנים: ~₪168,000',
          'בסוף: רכב שווה ~₪70,000',
        ],
      },
      {
        type: 'paragraph',
        text: 'חישוב נטו: הלוואה עלתה ₪168K אבל נשאר נכס של ₪70K → עלות אמיתית ₪98K. ליסינג עלה ₪126K ולא נשאר כלום. לאורך זמן — הלוואה זולה יותר.',
      },
      { type: 'divider' },
      { type: 'heading', text: 'מי צריך ליסינג?' },
      {
        type: 'list',
        items: [
          'עצמאי שמנכה הוצאות רכב (יתרון מס משמעותי)',
          'מי שלא אוהב הפתעות ורוצה תקציב קבוע',
          'מי שרוצה תמיד רכב עדכני ללא טרחה',
          'מי שנוסע עד 15,000 ק"מ בשנה',
        ],
      },
      { type: 'heading', text: 'מי צריך הלוואה?' },
      {
        type: 'list',
        items: [
          'מי שנוסע הרבה — ק"מ ללא הגבלה',
          'מי שרוצה לבנות נכס לטווח ארוך',
          'מי שיכול לדאוג לתחזוקה בעצמו',
          'מי שמתכנן להחזיק את הרכב 7+ שנים',
        ],
      },
      { type: 'divider' },
      {
        type: 'tip',
        text: 'ליסינג = שלם יותר, שקט יותר. הלוואה = שלם פחות, אחראי יותר. אם אתה לא בטוח — הלוואה תהיה זולה יותר לאורך זמן.',
      },
    ],
  },
]

// ─── 5. Gadgets ───────────────────────────────────────────────────────────────

export const GADGET_ITEMS: GadgetItem[] = [
  {
    id: 'gad-obd',
    emoji: '📡',
    title: 'סורק OBD2 אלחוטי',
    description: 'קרא שגיאות מנוע מהסמארטפון לפני שאתה קונה',
    price: '₪89',
    url: 'https://www.amazon.co.il',
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-dashcam',
    emoji: '📷',
    title: 'מצלמת דרך 4K',
    description: 'הגנה מלאה בכביש, GPS מובנה, הקלטת לילה',
    price: '₪249',
    url: 'https://www.amazon.co.il',
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-carplay',
    emoji: '📱',
    title: 'מתאם CarPlay אלחוטי',
    description: 'הפוך CarPlay קווי לאלחוטי — התחבר מיד',
    price: '₪179',
    url: 'https://www.amazon.co.il',
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-tyre',
    emoji: '🔄',
    title: 'מד לחץ צמיגים דיגיטלי',
    description: 'בדיקה מדויקת, קומפקטי, חובה בכל רכב',
    price: '₪49',
    url: 'https://www.amazon.co.il',
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-jump',
    emoji: '⚡',
    title: 'סטרטר קפיצה נייד',
    description: 'הצת רכב גם ללא עזרה חיצונית — חובה בתיק',
    price: '₪199',
    url: 'https://www.amazon.co.il',
    isAffiliate: true,
    isComingSoon: true,
  },
  {
    id: 'gad-mat',
    emoji: '🧹',
    title: 'שטיחי רכב 3D פרמיום',
    description: 'שטיחים מותאמים לדגם הרכב שלך, הגנה מלאה',
    price: '₪220',
    url: 'https://www.amazon.co.il',
    isAffiliate: true,
    isComingSoon: true,
  },
]
