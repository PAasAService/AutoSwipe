import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Manrope } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AccessibilityWidget } from '@/components/accessibility/AccessibilityWidget'
import { Providers } from '@/components/Providers'
import CookieBanner from '@/components/ui/CookieBanner'
import PostHogProvider from '@/components/providers/PostHogProvider'
import PageViewTracker from '@/components/providers/PageViewTracker'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AutoSwipe — גלה את הרכב הבא שלך',
  description: 'פלטפורמת קנייה ומכירה של רכבים עם חווית גילוי חכמה. סוואיפ, חסוך, קנה.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AutoSwipe',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'AutoSwipe',
    description: 'גלה את הרכב הבא שלך בסוואיפ',
    type: 'website',
    locale: 'he_IL',
    url: 'https://autoswipe.vercel.app',
    siteName: 'AutoSwipe',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoSwipe',
    description: 'גלה את הרכב הבא שלך בסוואיפ',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: '#D4A843',
  viewportFit: 'cover',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <body className="bg-[#050508] min-h-dvh font-body flex justify-center">
        <PostHogProvider>
          <PageViewTracker />
          <Providers>
            <div className="w-full max-w-[430px] min-h-dvh bg-background relative overflow-x-hidden">
              {children}
            </div>
          </Providers>
          <AccessibilityWidget />
          <CookieBanner />
        </PostHogProvider>
        <Toaster
          toastOptions={{
            style: {
              background: '#1f1f25',
              color: '#e4e1e9',
              border: '1px solid #4e4636',
              borderRadius: '16px',
              fontSize: '14px',
              direction: 'rtl',
            },
          }}
        />
      </body>
    </html>
  )
}

