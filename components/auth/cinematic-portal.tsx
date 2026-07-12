'use client'

/**
 * پورتال سینمایی ورود/ثبت‌نام
 */

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CinematicBackdrop } from '@/components/layout/cinematic-backdrop'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { HeroLogoAnimated } from '@/components/brand/hero-logo-animated'
import { PersianDateDisplay } from '@/components/ui/persian-date-display'

interface CinematicPortalProps {
  children: ReactNode
  title?: string
  subtitle?: string
  accentLabel?: string
}

const PAGE_COPY: Record<string, { title: string; subtitle: string; accent?: string }> = {
  '/login': {
    title: 'ورود به هوشاگر',
    subtitle: 'سیستم‌عامل هوشمند مدیریت مدارس — امن و یکپارچه',
    accent: 'ورود امن با رمز یا پیامک',
  },
  '/register': {
    title: 'ثبت‌نام در هوشاگر',
    subtitle: 'سه مرحله تا شروع تجربهٔ یادگیری هوشمند',
    accent: 'برای مدارس و خانواده‌ها',
  },
  '/change-password': {
    title: 'تغییر رمز عبور',
    subtitle: 'رمز جدید امن برای حساب کاربری شما',
  },
  '/forgot-password': {
    title: 'بازیابی رمز عبور',
    subtitle: 'کد تأیید به موبایل ثبت‌شده ارسال می‌شود',
    accent: 'بازیابی امن با پیامک',
  },
  '/reset-password': {
    title: 'رمز عبور جدید',
    subtitle: 'رمز قوی و منحصربه‌فرد انتخاب کنید',
  },
  '/activate': {
    title: 'فعال‌سازی حساب',
    subtitle: 'کد فعال‌سازی را از مدرسه دریافت کنید',
  },
}

export function CinematicPortal({
  children,
  title,
  subtitle,
  accentLabel,
}: CinematicPortalProps): JSX.Element {
  const pathname = usePathname()
  const isLogin = pathname === '/login'
  const copy = PAGE_COPY[pathname ?? ''] ?? PAGE_COPY['/login']
  const pageTitle = title ?? copy.title
  const pageSubtitle = subtitle ?? copy.subtitle
  const pageAccent = accentLabel ?? copy.accent

  return (
    <div className="lp-noise relative min-h-app overflow-hidden" dir="rtl" style={{ background: 'var(--lux-void)' }}>
      <div className="relative mx-auto grid min-h-app w-full max-w-6xl lg:grid-cols-[1fr_1.05fr]">
        <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
          <CinematicBackdrop />

          <div className="relative z-10">
            <HooshagarLogo size="lg" href="/" inverted priority showWordmark={false} />
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-8">
            <HeroLogoAnimated priority />
            <h2 className="mt-8 max-w-sm text-center text-2xl font-black leading-snug text-[var(--lux-text)]">
              {pageTitle}
            </h2>
            <p className="mt-3 max-w-xs text-center text-sm leading-7 text-[var(--lux-text-muted)]">
              {pageSubtitle}
            </p>
            {pageAccent && (
              <span className="mt-5 rounded-full border border-[rgba(201,169,98,0.35)] bg-[rgba(201,169,98,0.1)] px-4 py-1.5 text-xs font-extrabold text-[var(--lux-gold)]">
                {pageAccent}
              </span>
            )}
          </div>

          <div className="relative z-10 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--lux-text-muted)]">
              © ۱۴۰۵ هوشاگر — تمامی حقوق محفوظ است
            </p>
            {!isLogin && <PersianDateDisplay variant="compact" />}
          </div>
        </aside>

        <div className="relative flex flex-col justify-center px-4 py-10 sm:px-8">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <HooshagarLogo size="sm" href="/" inverted priority />
            <div className="flex items-center gap-2">
              {!isLogin && <PersianDateDisplay variant="compact" />}
              <Link href="/" className="text-xs font-bold text-[var(--lux-text-muted)] hover:text-[var(--lux-text)]">
                صفحه اصلی
              </Link>
            </div>
          </div>

          {isLogin && (
            <div className="mb-6 flex flex-col items-center lg:hidden">
              <HeroLogoAnimated compact priority />
              <p className="mt-4 text-center text-lg font-black text-[var(--lux-text)]">{pageTitle}</p>
              <p className="mt-1 max-w-xs text-center text-xs leading-7 text-[var(--lux-text-muted)]">
                {pageSubtitle}
              </p>
            </div>
          )}

          <div className="lp-glass mx-auto w-full max-w-md p-6 sm:p-8">
            <div className="mb-6 hidden lg:block">
              <h1 className="text-xl font-black text-[var(--lux-text)]">{pageTitle}</h1>
              <p className="mt-1 text-sm text-[var(--lux-text-muted)]">{pageSubtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
