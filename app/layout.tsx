import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Toaster } from 'sonner'

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
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

