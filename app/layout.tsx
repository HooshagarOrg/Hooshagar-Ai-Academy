import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Toaster } from 'sonner'
import RegisterServiceWorker from './register-sw'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
// TEMPORARY: Disabled reCAPTCHA due to React 18 compatibility issue
// import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

// فونت فارسی Vazirmatn
const vazirmatn = localFont({
  src: './fonts/Vazirmatn-Regular.woff2',
  variable: '--font-vazirmatn',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'هوشاگر - سیستم مدیریت هوشمند مدارس',
  description: 'سیستم عامل هوشمند مدیریت مدارس با قدرت هوش مصنوعی',
  keywords: ['مدرسه', 'مدیریت', 'هوش مصنوعی', 'آموزش'],
  authors: [{ name: 'تیم هوشاگر' }],
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'هوشاگر',
  },
  openGraph: {
    title: 'هوشاگر - سیستم مدیریت هوشمند مدارس',
    description: 'سیستم عامل هوشمند مدیریت مدارس با قدرت هوش مصنوعی',
    locale: 'fa_IR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="هوشاگر" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased">
        <RegisterServiceWorker />
        {/* TEMPORARY: Removed GoogleReCaptchaProvider wrapper */}
        {children}
        <PWAInstallPrompt />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

