import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Inter } from 'next/font/google'
import './globals.css'
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider'
import { Toaster } from 'sonner'
import { CookieConsent } from '@/components/cookie-consent'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
// TEMPORARY: Disabled reCAPTCHA due to React 18 compatibility issue
// import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

// فونت فارسی Vazirmatn
const vazirmatn = localFont({
  src: './fonts/Vazirmatn-Regular.woff2',
  variable: '--font-vazirmatn',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#020617',
  interactiveWidget: 'resizes-content',
}

export const metadata: Metadata = {
  title: 'هوشاگر - سیستم مدیریت هوشمند مدارس',
  description: 'سیستم عامل هوشمند مدیریت مدارس با قدرت هوش مصنوعی',
  keywords: ['مدرسه', 'مدیریت', 'هوش مصنوعی', 'آموزش'],
  authors: [{ name: 'تیم هوشاگر' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'هوشاگر',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'هوشاگر - سیستم مدیریت هوشمند مدارس',
    description: 'سیستم عامل هوشمند مدیریت مدارس با قدرت هوش مصنوعی',
    locale: 'fa_IR',
    type: 'website',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'آرم هوشاگر' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#020617" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="هوشاگر" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased min-h-app bg-[#020617]" suppressHydrationWarning>
        <SmoothScrollProvider>
          <div className="relative z-0 min-h-app">{children}</div>
        </SmoothScrollProvider>
        <CookieConsent />
        <ServiceWorkerRegister />
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            classNames: {
              toast: 'glass-panel border-white/10 text-foreground',
            },
          }}
        />
      </body>
    </html>
  )
}

