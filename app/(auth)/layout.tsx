import type { Metadata } from 'next'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { Reveal } from '@/components/motion/reveal'

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
    <MarketingShell tone="balanced" showNav={false} background="auth">
      <div className="relative min-h-[calc(100dvh-2rem)] flex items-center justify-center p-4 sm:p-6">
        <Reveal className="relative z-10 w-full max-w-md">{children}</Reveal>
      </div>
    </MarketingShell>
  )
}
