import type { Metadata } from 'next'
import { ObsidianPortal } from '@/components/auth/obsidian-portal'

export const metadata: Metadata = {
  title: 'ورود و ثبت‌نام | هوشاگر',
  description: 'ورود به سیستم مدیریت هوشمند مدارس',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ObsidianPortal>{children}</ObsidianPortal>
}
