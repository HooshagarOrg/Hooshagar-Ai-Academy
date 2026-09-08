import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { PublicRuntimeScripts } from '@/components/public-runtime-scripts'
import { CANONICAL_APP_ORIGIN } from '@/lib/app-url'

const vazirmatn = localFont({
  src: './fonts/Vazirmatn-Regular.woff2',
  variable: '--font-vazirmatn',
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Arial',
})

const vazirmatnBlack = localFont({
  src: './fonts/Vazirmatn-Black.woff2',
  variable: '--font-vazirmatn-black',
  weight: '900',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0D12',
  interactiveWidget: 'resizes-content',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || CANONICAL_APP_ORIGIN),
  title: 'هوشاگر - سیستم مدیریت هوشمند مدارس',
  description: 'سیستم عامل هوشمند مدیریت مدارس با قدرت هوش مصنوعی',
  keywords: ['مدرسه', 'مدیریت', 'هوش مصنوعی', 'آموزش'],
  authors: [{ name: 'تیم هوشاگر' }],
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }],
    apple: '/apple-touch-icon.png',
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
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} ${vazirmatnBlack.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#0F1117" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="هوشاگر" />
      </head>
      <body className="font-sans antialiased min-h-app bg-background text-foreground" suppressHydrationWarning>
        <div className="relative z-10 min-h-app">{children}</div>
        <PublicRuntimeScripts />
      </body>
    </html>
  )
}
