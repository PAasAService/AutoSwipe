import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

export default function PrivacyScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="חזור"
          style={{ padding: 4 }}
        >
          <Text style={{ color: '#D4A843', fontSize: 18 }}>‹ חזור</Text>
        </TouchableOpacity>
        <Text style={{ color: '#F5F5F5', fontSize: 18, fontWeight: '700' }}>מדיניות פרטיות</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: '#888888', fontSize: 13, textAlign: 'right', marginBottom: 24 }}>
          עדכון אחרון: ינואר 2025
        </Text>

        <Section title="1. מידע שאנו אוספים">
          {`אנו אוספים את המידע הבא בעת השימוש בשירות AutoSwipe:

• פרטי חשבון: שם, כתובת אימייל וסיסמה מוצפנת.
• פרטי רכב: כאשר אתה מפרסם מודעה, אנו שומרים תמונות, תיאור ומחיר.
• נתוני שימוש: סוואיפים, מועדפים ועדפות חיפוש לשיפור ההמלצות.
• מידע על מכשיר: סוג המכשיר, גרסת מערכת ההפעלה ומזהה ייחודי לצורך אבטחה.`}
        </Section>

        <Section title="2. שימוש במידע">
          {`אנו משתמשים במידע שנאסף כדי:

• להפעיל ולשפר את שירות AutoSwipe.
• להתאים אישית המלצות רכבים בהתאם להעדפותיך.
• לאפשר תקשורת בין קונים למוכרים.
• לשלוח התראות רלוונטיות (ניתן לכיבוי בהגדרות).
• להבטיח אבטחת הפלטפורמה ומניעת הונאות.`}
        </Section>

        <Section title="3. שיתוף מידע">
          {`אנו לא מוכרים את המידע האישי שלך לצדדים שלישיים. מידע עשוי להיות משותף במקרים הבאים:

• ספקי שירות: חברות אחסון ענן ושירותי אימות בטוחים.
• דרישות חוקיות: כנדרש על פי חוק ישראלי.
• הגנה על זכויות: כדי להגן על הזכויות והרכוש של AutoSwipe ומשתמשיו.`}
        </Section>

        <Section title="4. אבטחת מידע">
          {`אנו נוקטים באמצעי אבטחה מתקדמים:

• הצפנת סיסמאות באמצעות bcrypt.
• חיבורי HTTPS מוצפנים לכל הנתונים.
• אחסון טוקני אימות מאובטחים במכשירך.
• גישה מוגבלת לנתוני משתמשים לעובדים מורשים בלבד.`}
        </Section>

        <Section title="5. שמירת נתונים">
          {`אנו שומרים את הנתונים שלך כל עוד חשבונך פעיל. עם מחיקת החשבון, נמחק את כל הנתונים האישיים תוך 30 ימים, למעט נתונים הנדרשים לצורכי חוק.`}
        </Section>

        <Section title="6. זכויותיך">
          {`בהתאם לחוק הגנת הפרטיות הישראלי, יש לך זכות:

• לקבל עותק של המידע שנאסף עליך.
• לתקן מידע שגוי.
• למחוק את חשבונך ואת כל הנתונים הקשורים אליו.
• לבטל הסכמה לשימוש בנתונים לצרכי שיווק.`}
        </Section>

        <Section title="7. עוגיות ומעקב">
          {`האפליקציה אינה משתמשת בעוגיות. אנו משתמשים ב-AsyncStorage מקומי לשמירת הגדרות בלבד.`}
        </Section>

        <Section title="8. יצירת קשר">
          {`לשאלות בנוגע למדיניות הפרטיות, ניתן לפנות אלינו:

אימייל: privacy@autoswipe.co.il
כתובת: תל אביב, ישראל`}
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
