import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'תנאי שימוש | AutoSwipe',
  description: 'תנאי השימוש של AutoSwipe בהתאם לדין הישראלי',
}

export default function TermsPage() {
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
        <h1 className="font-headline text-lg font-bold text-on-surface">תנאי שימוש</h1>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 pb-16 pt-6">
        <p className="text-on-surface-variant text-xs mb-6">
          עודכן לאחרונה: 15 במרץ 2026
        </p>

        {/* הסכמה לתנאים */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">הסכמה לתנאים</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            ברוך הבא ל-AutoSwipe. תנאי שימוש אלה ("התנאים") מהווים הסכם משפטי מחייב בינך ("המשתמש")
            לבין AutoSwipe ("החברה"). גלישה, הרשמה, או שימוש בשירות מהווים הסכמה מלאה ובלתי מסויגת
            לתנאים אלה. אם אינך מסכים לתנאים, הנך מתבקש להימנע מהשימוש בשירות.
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            תנאי שימוש אלה כפופים לדין הישראלי ומנוסחים בהתאם לחוק החוזים (חלק כללי), התשל"ג-1973,
            וחוק המחשבים, התשנ"ה-1995. גיל המינימום לשימוש בשירות הוא 18 שנים.
          </p>
        </section>

        {/* שירות AutoSwipe */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">שירות AutoSwipe</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            AutoSwipe היא פלטפורמת מסחר דיגיטלית המאפשרת לבעלי רכבים פרטיים לפרסם מודעות מכירה,
            ולמשתמשים המחפשים רכב לגלוש ולהתחבר עם מוכרים. השירות כולל:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>פרסום מודעות רכב בין-פרטיות ללא עמלה בגרסת הבסיס.</li>
            <li>מנגנון גילוי רכבים מבוסס סוואיפ עם אלגוריתם המלצות אישי.</li>
            <li>מערכת הודעות ישירות בין קונים ומוכרים.</li>
            <li>כלי השוואה ומחשבון עלות בעלות כוללת.</li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            השירות מיועד לעסקאות בין פרטיים בלבד. סוחרי רכב ובתי עסק אינם מורשים להשתמש בפלטפורמה
            ללא אישור מפורש בכתב מהחברה.
          </p>
        </section>

        {/* הרשמה וחשבון */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">הרשמה וחשבון</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            בעת ההרשמה לשירות, אתה מצהיר ומתחייב כי:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>הפרטים שמסרת נכונים, עדכניים ומדויקים.</li>
            <li>הנך בגיר (מעל גיל 18) ובעל כשרות משפטית להתקשר בהסכם.</li>
            <li>לא תמסור את פרטי הכניסה לחשבונך לאחרים.</li>
            <li>תעדכן את פרטיך בהקדם האפשרי אם יחול שינוי.</li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            אתה אחראי לכל פעילות המתבצעת תחת חשבונך. יש להודיע לנו מיידית על כל שימוש לא מורשה
            בחשבונך. החברה שומרת לעצמה את הזכות להשעות או לסגור חשבונות שמידע ההרשמה שלהם אינו
            מדויק.
          </p>
        </section>

        {/* כללי התנהגות */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">כללי התנהגות</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            בשימוש בשירות, אתה מתחייב שלא:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>לפרסם מידע שקרי, מטעה, או מוטעה אודות רכב.</li>
            <li>להתחזות לאדם אחר או לגורם אחר.</li>
            <li>לשלוח הודעות פרסומיות לא מבוקשות (ספאם).</li>
            <li>לנסות לגשת למערכות, שרתים, או מאגרי נתונים ללא הרשאה.</li>
            <li>לבצע scraping, crawling, או הורדת תוכן אוטומטית ללא אישור כתוב.</li>
            <li>לפרסם תוכן פוגעני, גזעני, מאיים, או בלתי חוקי.</li>
            <li>לבצע עסקאות מחוץ לפלטפורמה כדי להתחמק ממדיניות השירות.</li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            הפרת כללים אלה עלולה לגרור השעיית חשבון, מחיקתו, ו/או נקיטת הליכים משפטיים.
          </p>
        </section>

        {/* פרסום רכבים למכירה */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">פרסום רכבים למכירה</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            מוכר המפרסם מודעה באמצעות השירות מצהיר ומאשר כי:
          </p>
          <ul className="text-on-surface-variant text-sm leading-relaxed list-disc list-inside mt-2 space-y-1.5 pr-2">
            <li>הינו בעל הרכב או מורשה על-ידי הבעלים לפרסמו.</li>
            <li>כל הפרטים המפורסמים (שנה, קילומטראז', מצב, מחיר) נכונים ומדויקים.</li>
            <li>הרכב אינו גנוב, אינו משועבד לגורמים שלישיים ואין עיקולים המונעים מכירתו.</li>
            <li>התמונות המפורסמות מייצגות את הרכב האמיתי ואינן מניפולטיביות.</li>
            <li>הוא יעדכן את המודעה או יסירה עם מכירת הרכב.</li>
          </ul>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            החברה אינה צד לעסקה בין הקונה למוכר ואינה אחראית על מצב הרכב, כשרות העסקה, או
            תשלומים. המשתמשים אחראים לוודא את נכונות הפרטים ולבצע בדיקות עצמאיות לפני כל עסקה.
          </p>
        </section>

        {/* אחריות וסיוג */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">אחריות וסיוג</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            השירות מסופק "כמות שהוא" (AS-IS) ו"כפי שזמין" (AS-AVAILABLE), ללא אחריות מכל סוג שהוא,
            מפורשת או משתמעת, לרבות אחריות לסחירות, התאמה למטרה מסוימת, או אי-הפרת זכויות.
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            החברה אינה אחראית לנזקים עקיפים, תוצאתיים, מיוחדים, או עונשיים הנובעים מהשימוש
            בשירות, לרבות: הפסד כסף בעסקאות, נזקים הנובעים ממידע שגוי שפרסם משתמש, הפסקות זמינות
            השירות, או אובדן נתונים.
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            האחריות הכוללת של החברה כלפי משתמש בגין כל עילה לא תעלה על הסכום ששולם על-ידי המשתמש
            לחברה בשלושת החודשים שקדמו לאירוע, ולא יותר מ-500 ש"ח בכל מקרה.
          </p>
        </section>

        {/* קניין רוחני */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">קניין רוחני</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            כל זכויות הקניין הרוחני בשירות AutoSwipe — לרבות עיצוב, לוגו, קוד, אלגוריתמים, ותוכן
            מקורי — שייכות לחברה ומוגנות בחוק זכות יוצרים, התשס"ח-2007, וחוקי קניין רוחני אחרים.
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            בפרסום תוכן בפלטפורמה (תמונות, תיאורים), אתה מעניק לחברה רישיון לא-בלעדי, חינמי,
            עולמי, להציג ולהפיץ תוכן זה לצורך הפעלת השירות בלבד. הבעלות בתוכן נותרת שלך.
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            אין להעתיק, לשכפל, להפיץ, או לעשות שימוש מסחרי בתכנים של השירות ללא אישור כתוב מראש.
          </p>
        </section>

        {/* סיום שירות */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">סיום שירות</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            אתה רשאי לסגור את חשבונך בכל עת דרך הגדרות החשבון. החברה שומרת לעצמה את הזכות להשעות
            או לסיים את חשבונך, כולו או חלקו, בכל עת ועל-פי שיקול דעתה הבלעדי, ובפרט במקרה של
            הפרת תנאי שימוש אלה.
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            עם סגירת חשבון, המודעות הפעילות שלך יוסרו. נתונים מסוימים עשויים להישמר לתקופה
            מוגבלת בהתאם לחובות חוקיות ולמדיניות הפרטיות שלנו.
          </p>
        </section>

        {/* דין חל וסמכות שיפוטית */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">דין חל וסמכות שיפוטית</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            תנאי שימוש אלה כפופים לדין הישראלי. סמכות השיפוט הבלעדית לדון בכל מחלוקת הנובעת
            מהסכם זה תהא לבתי המשפט המוסמכים במחוז תל-אביב-יפו, ישראל, ולהם בלבד.
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed mt-3">
            הצדדים מסכימים לנסות ליישב מחלוקות תחילה בדרך של מו"מ ישיר, ורק לאחר מיצוי הליך זה
            לפנות לערכאות שיפוטיות.
          </p>
        </section>

        {/* יצירת קשר */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-2 mt-6">יצירת קשר</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            לשאלות בנוגע לתנאי השימוש, פנה אלינו:
          </p>
          <div className="mt-3 bg-surface-container rounded-2xl p-4 text-sm space-y-1">
            <p className="text-on-surface font-medium">AutoSwipe</p>
            <p className="text-on-surface-variant">ישראל</p>
            <p className="text-on-surface-variant">
              דוא"ל:{' '}
              <a
                href="mailto:legal@autoswipe.il"
                className="text-primary hover:underline"
              >
                legal@autoswipe.il
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
