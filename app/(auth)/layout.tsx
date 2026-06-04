import type { Metadata } from 'next'
import { AmbientBackground } from '@/components/ui/ambient-background'

export const metadata: Metadata = {
  title: 'ورود و ثبت‌نام | هوشاگر',
  description: 'ورود به سیستم مدیریت هوشمند مدارس',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden ui-canvas" data-ui-tone="balanced">
      <AmbientBackground tone="balanced" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
