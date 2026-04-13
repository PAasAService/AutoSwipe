import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { FUEL_TYPE_HE, VEHICLE_TYPE_HE } from '@/lib/constants/cars'
import {
  Bell, Shield, ChevronLeft, Heart, Settings2, Car, MapPin, Wallet,
  Inbox, GitCompareArrows, FileText, Scale, User,
} from 'lucide-react'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id! },
    include: { buyerPreferences: true },
  })
  if (!user) redirect('/login')

  const prefs = user.buyerPreferences
    ? {
        ...user.buyerPreferences,
        preferredBrands: tryParse(user.buyerPreferences.preferredBrands, []),
        fuelPreferences: tryParse(user.buyerPreferences.fuelPreferences, []),
        vehicleTypes: tryParse(user.buyerPreferences.vehicleTypes, []),
      }
    : null
  const roles: string[] = tryParse(user.roles, [])

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-28" dir="rtl">
      {/* Profile header */}
      <div className="bg-surface-container-low px-5 pt-safe-area-inset-top pb-6">
        <div className="pt-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary font-headline">
            {user.name.charAt(0)}
          </div>
          <div className="text-right flex-1">
            <h2 className="font-headline text-xl font-bold text-on-surface">{user.name}</h2>
            <p className="text-on-surface-variant text-sm mt-0.5">{user.email}</p>
            <div className="flex gap-2 mt-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-medium"
                >
                  {role === 'BUYER' ? 'קונה' : 'מוכר'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Buyer preferences */}
        {prefs && (
          <Section title="העדפות חיפוש">
            <InfoRow icon={MapPin} label="מיקום" value={prefs.location || '—'} />
            <InfoRow icon={Wallet} label="תקציב" value={prefs.budgetMax ? `עד ₪${(prefs.budgetMax / 1000).toFixed(0)}K` : '—'} />
            <InfoRow
              icon={Car}
              label="מותגים"
              value={prefs.preferredBrands.length > 0 ? prefs.preferredBrands.slice(0, 3).join(', ') : 'הכל'}
            />
            {prefs.fuelPreferences.length > 0 && (
              <InfoRow
                icon={Settings2}
                label="דלק"
                value={prefs.fuelPreferences.map((f: string) => FUEL_TYPE_HE[f]).join(', ')}
              />
            )}
            <div className="pt-2 px-4 pb-3">
              <Link href="/settings/preferences" className="block w-full bg-primary/10 border border-primary/20 text-primary font-semibold rounded-xl py-3 text-center text-sm">
                ערוך העדפות
              </Link>
            </div>
          </Section>
        )}

        {/* Account */}
        <Section title="חשבון">
          <SettingsLink icon={User} label="עריכת פרופיל" href="/settings/profile" />
          <SettingsLink icon={Inbox} label="כל ההתראות" href="/notifications" />
          <SettingsLink icon={Bell} label="הגדרות התראות" href="/settings/notifications" />
          <SettingsLink icon={Shield} label="אבטחה ופרטיות" href="/settings/security" />
        </Section>

        {/* Activity */}
        <Section title="פעילות">
          <SettingsLink icon={Heart} label="המועדפים שלי" href="/favorites" />
          <SettingsLink icon={GitCompareArrows} label="השוואת רכבים" href="/compare" />
          <SettingsLink icon={Car} label="המודעות שלי" href="/dashboard" />
        </Section>

        {/* Legal — matches native settings */}
        <Section title="משפטי וסיוע">
          <SettingsLink icon={FileText} label="מדיניות פרטיות" href="/privacy" />
          <SettingsLink icon={Scale} label="תנאי שימוש" href="/terms" />
        </Section>

        {/* Sign out */}
        <SignOutButton />

        <p className="text-center text-on-surface-variant text-xs pt-2 pb-2">
          AutoSwipe v0.1.0 · כל הזכויות שמורות
        </p>
      </div>
    </div>
  )
}

function tryParse(val: any, fallback: any) {
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return fallback }
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

function SettingsLink({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between px-4 py-4 hover:bg-surface-container-high transition-colors">
        <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
        <div className="flex items-center gap-3">
          <span className="text-on-surface text-sm">{label}</span>
          <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center">
            <Icon className="w-4 h-4 text-on-surface-variant" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-on-surface-variant text-sm">{value}</span>
      <div className="flex items-center gap-2.5">
        <span className="text-on-surface text-sm font-medium">{label}</span>
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
  )
}
