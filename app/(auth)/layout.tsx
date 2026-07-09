import type { Metadata } from 'next'
import { CinematicPortal } from '@/components/auth/cinematic-portal'

export const metadata: Metadata = {
  title: 'ورود و ثبت‌نام | هوشاگر',
  description: 'ورود به سیستم مدیریت هوشمند مدارس',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CinematicPortal>{children}</CinematicPortal>
}
