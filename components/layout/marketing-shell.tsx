'use client'

/**
 * لایهٔ مشترک صفحات مارکتینگ و قانونی — هدر، فوتر، پس‌زمینهٔ سینمایی
 */

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { ScrollProgressBar } from '@/components/landing/motion'

interface MarketingShellProps {
  children: ReactNode
  backHref?: string
  backLabel?: string
  action?: ReactNode
}

export function MarketingShell({
  children,
  backHref = '/',
  backLabel = 'صفحه اصلی',
  action,
}: MarketingShellProps): JSX.Element {
  return (
    <div className="lp-noise min-h-app" dir="rtl" style={{ background: 'var(--lux-void)' }}>
      <ScrollProgressBar />

      <header className="sticky top-0 z-50 border-b border-[rgba(232,236,244,0.08)] bg-[rgba(11,13,18,0.85)] backdrop-blur-xl">
        <div className="lux-container flex items-center justify-between py-4">
          <HooshagarLogo size="sm" href="/" inverted priority />
          <div className="flex items-center gap-3">
            {action}
            <Link
              href={backHref}
              className="lux-btn-ghost min-h-9 px-4 text-xs"
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              {backLabel}
            </Link>
          </div>
        </div>
      </header>

      <main className="lux-container py-10 sm:py-14">{children}</main>

      <footer className="border-t border-[rgba(232,236,244,0.08)] py-8" style={{ background: 'var(--lux-void)' }}>
        <div className="lux-container flex flex-col items-center justify-between gap-4 text-center text-xs text-[var(--lux-text-muted)] sm:flex-row sm:text-right">
          <p>© ۱۴۰۵ هوشاگر — سیستم‌عامل هوشمند مدیریت مدارس</p>
          <div className="flex gap-5 font-bold">
            <Link href="/terms" className="hover:text-[var(--lux-text)]">قوانین</Link>
            <Link href="/privacy" className="hover:text-[var(--lux-text)]">حریم خصوصی</Link>
            <Link href="/pricing" className="hover:text-[var(--lux-text)]">تعرفه</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** کارت محتوای قانونی/متنی */
export function MarketingContentCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}): JSX.Element {
  return (
    <article className={`lp-glass mx-auto max-w-3xl p-6 sm:p-10 ${className}`}>
      {children}
    </article>
  )
}
