/**
 * پورتال ورود — پوستهٔ سرور؛ یک لوگوی بهینه‌شده؛ بدون GSAP/jalali
 */

import type { ReactNode } from 'react'
import Link from 'next/link'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { StaticCinematicBackdrop } from '@/components/layout/static-cinematic-backdrop'
import {
  PortalCopy,
  PortalFormHeading,
  PortalMobileHeading,
} from '@/components/auth/portal-copy'

interface CinematicPortalProps {
  children: ReactNode
  title?: string
  subtitle?: string
  accentLabel?: string
}

export function CinematicPortal({
  children,
  title,
  subtitle,
  accentLabel,
}: CinematicPortalProps): JSX.Element {
  return (
    <div
      className="lp-noise relative min-h-app overflow-x-hidden"
      dir="rtl"
      style={{ background: 'var(--lux-void)' }}
    >
      <StaticCinematicBackdrop className="opacity-90 lg:opacity-100" />

      <div className="relative z-10 mx-auto grid min-h-app w-full max-w-6xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:px-14 xl:py-12">
          <div className="relative z-10">
            <HooshagarLogo size="lg" href="/" inverted priority />
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-10">
            <PortalCopy title={title} subtitle={subtitle} accentLabel={accentLabel} />
          </div>

          <div className="relative z-10">
            <p className="text-xs leading-7 text-[var(--lux-text-muted)]">
              © ۱۴۰۵ هوشاگر — تمامی حقوق محفوظ است
            </p>
          </div>
        </aside>

        <div className="relative flex flex-col justify-start px-4 py-6 sm:px-8 sm:py-10 lg:justify-center lg:py-12">
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(84,210,255,0.2) 0%, rgba(139,124,255,0.12) 42%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          <div className="relative mb-5 flex items-center justify-between lg:mb-7">
            <HooshagarLogo size="md" href="/" inverted className="lg:hidden" />
            <Link
              href="/"
              className="ms-auto rounded-full border border-[rgba(232,236,244,0.12)] bg-[rgba(15,17,23,0.4)] px-3.5 py-1.5 text-xs font-bold text-[var(--lux-text-muted)] transition-colors hover:border-[rgba(84,210,255,0.35)] hover:text-[var(--lux-text)]"
            >
              صفحه اصلی
            </Link>
          </div>

          <div className="relative mb-5 flex flex-col items-center lg:hidden">
            <PortalMobileHeading title={title} subtitle={subtitle} />
          </div>

          <div className="lp-glass relative mx-auto w-full max-w-md p-5 sm:p-8">
            <PortalFormHeading title={title} subtitle={subtitle} />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
