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
      className="lp-noise relative min-h-app overflow-hidden"
      dir="rtl"
      style={{ background: 'var(--lux-void)' }}
    >
      <div className="relative mx-auto grid min-h-app w-full max-w-6xl lg:grid-cols-[1fr_1.05fr]">
        <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
          <StaticCinematicBackdrop />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-8">
            <PortalCopy title={title} subtitle={subtitle} accentLabel={accentLabel} />
          </div>

          <div className="relative z-10">
            <p className="text-xs text-[var(--lux-text-muted)]">
              © ۱۴۰۵ هوشاگر — تمامی حقوق محفوظ است
            </p>
          </div>
        </aside>

        <div className="relative flex flex-col justify-center px-4 py-10 sm:px-8">
          <div className="mb-6 flex items-center justify-between">
            <HooshagarLogo size="sm" href="/" inverted />
            <Link
              href="/"
              className="text-xs font-bold text-[var(--lux-text-muted)] hover:text-[var(--lux-text)] lg:hidden"
            >
              صفحه اصلی
            </Link>
          </div>

          <div className="mb-6 flex flex-col items-center lg:hidden">
            <PortalMobileHeading title={title} subtitle={subtitle} />
          </div>

          <div className="lp-glass mx-auto w-full max-w-md p-6 sm:p-8">
            <PortalFormHeading title={title} subtitle={subtitle} />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
