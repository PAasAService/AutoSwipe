import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { goBackSafeWithReturn } from '../../src/lib/go-back-safe'
import { useReturnTo } from '../../src/hooks/useReturnTo'
import { ScreenHeader } from '../../src/components/ui/ScreenHeader'
import { SCREEN_EDGE } from '../../src/constants/layout'

export default function TermsScreen() {
  const returnTo = useReturnTo()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }} edges={['bottom', 'left', 'right']}>
      <ScreenHeader
        onBack={() => goBackSafeWithReturn(returnTo, '/(tabs)/settings')}
        backVariant="labeled"
        title="תנאי שימוש"
        titleSize={20}
      />

      <ScrollView
        contentContainerStyle={{ padding: SCREEN_EDGE }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', marginBottom: 24 }}>
          עדכון אחרון: ינואר 2025
        </Text>

        <Section title="1. הסכמה לתנאים">
          {`ברוך הבא ל-AutoSwipe. בעת שימוש באפליקציה, אתה מסכים לתנאי שימוש אלו. אם אינך מסכים, אנא הפסק את השימוש באפליקציה.`}
        </Section>

        <Section title="2. תיאור השירות">
          {`AutoSwipe היא פלטפורמה ישראלית לקנייה ומכירה של רכבים. השירות מאפשר:

• גלישה וסוואיפ על מודעות רכב מהשוק הישראלי.
• פרסום מודעות מכירה לרכב פרטי.
• תקשורת ישירה בין קונים למוכרים.
• שמירת מועדפים והשוואת רכבים.`}
        </Section>

        <Section title="3. רישום וחשבון">
          {`• עליך להיות בן 18 ומעלה לשימוש בשירות.
• אתה אחראי על שמירת פרטי הכניסה לחשבונך.
• חל איסור לפתוח מספר חשבונות לאותו משתמש.
• עליך לספק מידע מדויק ועדכני בעת ההרשמה.`}
        </Section>

        <Section title="4. כללי התנהגות">
          {`המשתמשים מתחייבים:

• לא לפרסם מידע כוזב או מטעה על רכבים.
• לא להשתמש בשירות לצרכים בלתי חוקיים.
• לא להטריד משתמשים אחרים בפלטפורמה.
• לא לנסות לפרוץ או לשבש את מערכות AutoSwipe.
• לא לפרסם תוכן פוגעני, גזעני או בלתי הולם.`}
        </Section>

        <Section title="5. מודעות ורכבים">
          {`בעת פרסום מודעה:

• המוכר מצהיר שהמידע על הרכב הוא אמיתי ומדויק.
• AutoSwipe אינה אחראית על עסקאות בין קונים למוכרים.
• חל איסור לפרסם רכבים גנובים או בעיית בעלות.
• AutoSwipe רשאית להסיר מודעות שמפרות את התנאים.`}
        </Section>

        <Section title="6. תשלומים ועמלות">
          {`כרגע השירות חינמי לחלוטין. AutoSwipe שומרת לעצמה את הזכות להציג תוכניות פרמיום בעתיד, עם הודעה מוקדמת למשתמשים.`}
        </Section>

        <Section title="7. קניין רוחני">
          {`כל הזכויות ב-AutoSwipe, כולל הלוגו, העיצוב והקוד, שייכות ל-AutoSwipe בע"מ. חל איסור על שכפול או שימוש מסחרי ללא אישור בכתב.`}
        </Section>

        <Section title="8. הגבלת אחריות">
          {`AutoSwipe מספקת את השירות "כפי שהוא". אנו לא אחראים לנזקים עקיפים שנגרמו משימוש בשירות, כולל נזקים שנגרמו מעסקאות בין משתמשים.`}
        </Section>

        <Section title="9. ביטול חשבון">
          {`ניתן למחוק את החשבון בכל עת מהגדרות האפליקציה. AutoSwipe רשאית לחסום חשבונות שמפרים את תנאי השימוש.`}
        </Section>

        <Section title="10. שינויים בתנאים">
          {`AutoSwipe רשאית לעדכן תנאים אלו. שינויים מהותיים יודעו למשתמשים 14 יום מראש. המשך שימוש לאחר השינוי מהווה הסכמה לתנאים החדשים.`}
        </Section>

        <Section title="11. דין וסמכות שיפוט">
          {`תנאים אלו כפופים לדין הישראלי. סכסוכים יידונו בבתי המשפט המוסמכים בתל אביב.`}
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        color: '#D4A843',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'right',
        marginBottom: 10,
      }}>
        {title}
      </Text>
      <Text style={{
        color: '#F5F5F5',
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'right',
      }}>
        {children}
      </Text>
    </View>
  )
}
