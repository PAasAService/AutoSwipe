import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'מדיניות פרטיות | AutoSwipe',
  description: 'מדיניות הפרטיות של AutoSwipe בהתאם לחוק הגנת הפרטיות התשמ"א-1981',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-background text-on-surface" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3">
        <Link
          href="/signup"
          className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          aria-label="חזרה"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-headline text-lg font-bold text-on-surface">מדיניות פרטיות</h1>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 pb-16 pt-6">
        <p className="text-on-surface-variant text-xs mb-6">
          עודכן לאחרונה: 15 במרץ 2026
        </p>

        {/* מבוא */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">מבוא</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            AutoSwipe ("החברה", "אנחנו" או "אנו") מכבדת את פרטיותך ומחויבת להגן על המידע האישי שאתה
            מוסר לנו. מדיניות פרטיות זו מתארת כיצד אנו אוספים, משתמשים, מאחסנים ומגנים על המידע
            האישי שלך בעת שימושך בשירות AutoSwipe — אפליקציית מסחר ברכבים בין-פרטיים בישראל.
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            מדיניות זו עומדת בדרישות חוק הגנת הפרטיות, התשמ"א-1981, תקנות הגנת הפרטיות (אבטחת
            מידע), התשע"ז-2017, וכל דין רלוונטי אחר החל בישראל. השימוש בשירות מהווה הסכמה לתנאי
            מדיניות זו.
          </p>
        </section>

        {/* המידע שאנו אוספים */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">המידע שאנו אוספים</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            אנו אוספים את סוגי המידע הבאים:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>
              <span className="text-on-surface font-medium">פרטי זיהוי:</span> שם מלא, כתובת דוא"ל,
              וסיסמה מוצפנת עם יצירת חשבון.
            </li>
            <li>
              <span className="text-on-surface font-medium">פרטי רכב:</span> מידע שאתה מוסר בעת פרסום
              מודעה — יצרן, דגם, שנה, מחיר, מיקום, תמונות ותיאור.
            </li>
            <li>
              <span className="text-on-surface font-medium">העדפות קנייה:</span> מסנני חיפוש, טווח
              תקציב, ערים מועדפות ודגמים מועדפים שתגדיר בתהליך ה-Onboarding.
            </li>
            <li>
              <span className="text-on-surface font-medium">נתוני שימוש:</span> סוואיפים (ימין/שמאל),
              רכבים שמורים, הודעות, ומעשי ניהול מודעה — לצורך שיפור ההמלצות.
            </li>
            <li>
              <span className="text-on-surface font-medium">נתונים טכניים:</span> כתובת IP, סוג דפדפן,
              מזהה מכשיר ונתוני לוגים — לצורכי אבטחה ואבחון שגיאות.
            </li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            אנו אינם אוספים מספרי תעודת זהות, פרטי כרטיס אשראי, או מידע רגיש כמשמעותו בחוק הגנת
            הפרטיות, אלא אם ניתנה לכך הסכמה מפורשת.
          </p>
        </section>

        {/* כיצד אנו משתמשים במידע */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">כיצד אנו משתמשים במידע</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            אנו משתמשים במידע שנאסף למטרות הבאות:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>הפעלת השירות — הרשמה, כניסה לחשבון, ופרסום מודעות.</li>
            <li>
              אלגוריתם המלצות — התאמה אישית של רכבים לפי תקציב, מיקום, דגמים ונתוני שימוש קודמים.
            </li>
            <li>שיפור השירות — ניתוח דפוסי שימוש אנונימיים לצורך פיתוח תכונות חדשות.</li>
            <li>תקשורת שירות — שליחת עדכונים, אישורי הרשמה ואזהרות אבטחה.</li>
            <li>אכיפת תנאי השימוש — זיהוי שימוש לרעה ומניעתו.</li>
            <li>ציות לחוק — מענה לדרישות רשויות מוסמכות בהתאם לכל דין.</li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            לא נשתמש במידע שלך לצורכי פרסום ממוקד של צדדים שלישיים ללא הסכמתך המפורשת.
          </p>
        </section>

        {/* שיתוף מידע עם צדדים שלישיים */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">שיתוף מידע עם צדדים שלישיים</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            אנו לא מוכרים, משכירים, או סוחרים במידע האישי שלך. נשתף מידע רק במקרים הבאים:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>
              <span className="text-on-surface font-medium">ספקי תשתית:</span> שרתי ענן ובסיסי נתונים
              (כגון Vercel, Supabase) הפועלים מכוח הסכמי עיבוד נתונים מחייבים.
            </li>
            <li>
              <span className="text-on-surface font-medium">אחסון תמונות:</span> שירות Cloudinary
              לאחסון תמונות רכבים בלבד.
            </li>
            <li>
              <span className="text-on-surface font-medium">חובה חוקית:</span> כאשר נדרש על-פי צו שיפוטי
              או דרישת רשות מוסמכת.
            </li>
            <li>
              <span className="text-on-surface font-medium">הגנה על זכויות:</span> במקרה של חשש סביר
              לפגיעה בזכויות החברה, משתמשים אחרים, או צדדים שלישיים.
            </li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            כל ספק צד שלישי כפוף להסכם עיבוד נתונים המחייב אותו לשמור על רמת אבטחה ופרטיות מספקת.
          </p>
        </section>

        {/* אבטחת מידע */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">אבטחת מידע</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            אנו נוקטים באמצעי אבטחה טכניים וארגוניים בהתאם לתקנות הגנת הפרטיות (אבטחת מידע),
            התשע"ז-2017:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>הצפנת סיסמאות באמצעות bcrypt עם Salt ייחודי לכל משתמש.</li>
            <li>העברת נתונים מוצפנת באמצעות HTTPS/TLS בלבד.</li>
            <li>הגבלת גישה לבסיס הנתונים לפי עיקרון הצורך-לדעת.</li>
            <li>ניטור לוגים ואיתור חריגות אבטחה.</li>
            <li>גיבויים תקופתיים מוצפנים של הנתונים.</li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            במקרה של אירוע אבטחה שעלול לפגוע בפרטיותך, נודיע לך בהקדם האפשרי בהתאם לחובות הדיווח
            הקבועות בדין.
          </p>
        </section>

        {/* זכויות המשתמש */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">זכויות המשתמש</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, עומדות לך הזכויות הבאות:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>
              <span className="text-on-surface font-medium">זכות עיון:</span> לבקש לעיין במידע האישי
              שנשמר אודותיך במאגר המידע שלנו.
            </li>
            <li>
              <span className="text-on-surface font-medium">זכות תיקון:</span> לדרוש תיקון מידע שגוי,
              לא מדויק, או לא שלם.
            </li>
            <li>
              <span className="text-on-surface font-medium">זכות מחיקה:</span> לבקש מחיקת חשבונך וכל
              המידע הנלווה לו, בכפוף לחובות שמירת מידע על-פי דין.
            </li>
            <li>
              <span className="text-on-surface font-medium">ביטול הסכמה:</span> לבטל הסכמה לשימוש
              במידע לצרכים שאינם חיוניים לשירות.
            </li>
            <li>
              <span className="text-on-surface font-medium">ניידות נתונים:</span> לבקש קבלת עותק של
              המידע שמסרת לנו בפורמט קריא-מכונה.
            </li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            לממש את זכויותיך, יש לפנות אלינו בכתב לכתובת המייל המפורטת בסעיף יצירת קשר. נטפל
            בפנייתך בתוך 30 יום.
          </p>
        </section>

        {/* עוגיות */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">עוגיות (Cookies)</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            אנו משתמשים בעוגיות (קבצי Cookie) ובטכנולוגיות דומות לצורך:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>
              <span className="text-on-surface font-medium">עוגיות חיוניות:</span> שמירת מצב הכניסה
              לחשבון (JWT Session) — נחוצות להפעלת השירות ואינן ניתנות לביטול.
            </li>
            <li>
              <span className="text-on-surface font-medium">עוגיות ביצועים:</span> מדידת ביצועי
              הדפדפן ואיתור שגיאות — ניתנות לביטול.
            </li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            תוכל לנהל עוגיות דרך הגדרות הדפדפן שלך. חסימת עוגיות חיוניות עלולה לפגוע בתפקוד השירות.
          </p>
        </section>

        {/* שינויים במדיניות */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">שינויים במדיניות</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. שינויים מהותיים יובאו לידיעתך באמצעות
            הודעה בולטת בשירות, או במייל לכתובת הרשומה בחשבונך, לפחות 14 יום לפני כניסתם לתוקף.
            המשך השימוש בשירות לאחר כניסת השינויים לתוקף מהווה הסכמה לנוסח המעודכן.
          </p>
        </section>

        {/* יצירת קשר */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">יצירת קשר</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            לשאלות, בקשות מימוש זכויות, או תלונות בנושא פרטיות, ניתן לפנות אלינו:
          </p>
          <div className="mt-3 bg-surface-container rounded-2xl p-4 text-sm space-y-1">
            <p className="text-on-surface font-medium">AutoSwipe</p>
            <p className="text-on-surface-variant">ישראל</p>
            <p className="text-on-surface-variant">
              דוא"ל:{' '}
              <a
                href="mailto:privacy@autoswipe.il"
                className="text-primary hover:underline"
              >
                privacy@autoswipe.il
              </a>
            </p>
          </div>
          <p className="text-on-surface-variant text-xs mt-4 leading-relaxed">
            אם אינך מרוצה מתגובתנו, תוכל לפנות לרשם מאגרי המידע במשרד המשפטים בישראל.
          </p>
        </section>
      </div>
    </main>
  )
}
