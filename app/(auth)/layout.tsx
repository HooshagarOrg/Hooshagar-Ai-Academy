import type { Metadata } from 'next'
import { SpectrumPortal } from '@/components/auth/spectrum-portal'

export const metadata: Metadata = {
  title: 'ورود و ثبت‌نام | هوشاگر',
  description: 'ورود به سیستم مدیریت هوشمند مدارس',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SpectrumPortal>{children}</SpectrumPortal>
}
