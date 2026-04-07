import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, Shield, Mail, Lock } from 'lucide-react'

export default async function SecurityPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const email = session.user.email ?? ''

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-28" dir="rtl">
      {/* Header */}
      <div className="bg-surface-container-low px-5 pt-safe-area-inset-top pb-5">
        <div className="pt-6 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <Link
              href="/settings"
              className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors text-sm"
            >
              <ChevronRight className="w-4 h-4" />
              <span>הגדרות</span>
            </Link>
          </div>
        </div>
        <div className="text-center mt-4">
          <h1 className="font-headline text-2xl font-bold text-on-surface">אבטחה ופרטיות</h1>
          <p className="text-on-surface-variant text-sm mt-1">נהל את אבטחת החשבון שלך</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Account security */}
        <Section title="אבטחת חשבון">
          {/* Email display row */}
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-on-surface-variant text-sm truncate max-w-[180px] text-left">{email}</span>
            <div className="flex items-center gap-2.5">
              <span className="text-on-surface text-sm font-medium">כתובת דוא&quot;ל</span>
              <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>

          {/* Change password row */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                בקרוב
              </span>
              <button
                disabled
                className="text-sm text-on-surface-variant opacity-60 cursor-not-allowed"
              >
                שלח קישור לאיפוס
              </button>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-on-surface text-sm font-medium">שינוי סיסמה</span>
              <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center">
                <Lock className="w-4 h-4 text-on-surface-variant" />
              </div>
            </div>
          </div>
        </Section>

        {/* Privacy */}
        <Section title="פרטיות">
          <Link href="/privacy">
            <div className="flex items-center justify-between px-4 py-4 hover:bg-surface-container-high transition-colors">
              <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
              <span className="text-on-surface text-sm">מדיניות פרטיות</span>
            </div>
          </Link>
          <Link href="/terms">
            <div className="flex items-center justify-between px-4 py-4 hover:bg-surface-container-high transition-colors border-t border-outline-variant/20">
              <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
              <span className="text-on-surface text-sm">תנאי שימוש</span>
            </div>
          </Link>
          <div className="px-4 py-3 border-t border-outline-variant/20">
            <p className="text-on-surface-variant text-xs text-right leading-relaxed">
              AutoSwipe אינה מוכרת את המידע האישי שלך לצדדים שלישיים.
            </p>
          </div>
        </Section>

        {/* Danger zone */}
        <div>
          <h3 className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2 text-right px-1">
            אזור מסוכן
          </h3>
          <div className="bg-surface-container rounded-2xl overflow-hidden border border-red-500/20">
            <div className="px-4 py-5">
              <div className="flex items-start gap-3 flex-row-reverse">
                <div>
                  <p className="text-on-surface text-sm font-semibold text-right">מחיקת חשבון</p>
                  <p className="text-on-surface-variant text-xs mt-1 text-right leading-relaxed">
                    מחיקת החשבון היא פעולה בלתי הפיכה. כל הנתונים שלך יימחקו לצמיתות.
                  </p>
                  <p className="text-on-surface-variant text-xs mt-2 text-right">
                    לביצוע המחיקה,{' '}
                    <span className="text-primary font-medium">צור קשר לתמיכה</span>
                  </p>
                </div>
              </div>
              <button
                disabled
                className="mt-4 w-full py-3 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold opacity-60 cursor-not-allowed"
              >
                מחק חשבון
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2 text-right px-1">
        {title}
      </h3>
      <div className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/20 divide-y divide-outline-variant/20">
        {children}
      </div>
    </div>
  )
}
