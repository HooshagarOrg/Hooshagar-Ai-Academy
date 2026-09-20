/**
 * پورتال ورود و احراز هویت هوشاگر
 * طراحی سینمایی، پیشرفته، بدون فضای خالی و کاملاً متناسب با هویت برند
 */

import type { ReactNode } from 'react'
import Link from 'next/link'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { StaticCinematicBackdrop } from '@/components/layout/static-cinematic-backdrop'
import { LoginBrandScene } from '@/components/auth/login-brand-scene'
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
      className="lp-noise relative min-h-app overflow-x-hidden bg-[var(--lux-void)]"
      dir="rtl"
    >
      {/* ── لایه پس‌زمینهٔ سینمایی و مش نوری ── */}
      <StaticCinematicBackdrop className="opacity-95" />

      {/* ── الگو و گرید اتمسفریک مدرن در پس‌زمینه ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      {/* هاله‌های نوری شناور جهت ایجاد عمق بصری */}
      <div
        className="pointer-events-none absolute -top-24 right-1/4 h-[38rem] w-[38rem] rounded-full opacity-35 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(139,124,255,0.4) 0%, rgba(84,210,255,0.2) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-[36rem] w-[36rem] rounded-full opacity-30 blur-[130px]"
        style={{
          background:
            'radial-gradient(circle, rgba(201,169,98,0.3) 0%, rgba(255,77,166,0.18) 45%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      {/* ── ساختار اصلی صفحه ورود (دو ستونه در دسکتاپ، عریض و کامل) ── */}
      <div className="relative z-10 mx-auto grid min-h-app w-full max-w-[1360px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-16">
        
        {/* ── ستون راست: شوکیس و معرفی بصری امکانات سامانه (در دید اول کاربر) ── */}
        <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:py-10 lg:pe-6 xl:py-12 xl:pe-10">
          
          {/* هدر برند و لوگو */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-4">
              <HooshagarLogo size="xl" href="/" inverted priority />
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-gold)]/30 bg-[var(--lux-gold)]/10 px-3 py-1 text-xs font-black text-[var(--lux-gold)]">
                ✨ سیستم‌عامل هوشمند مدیریت مدارس
              </span>
              <h2 className="lux-h2 mt-3 text-balance text-3xl font-black leading-tight text-white xl:text-4xl">
                یکپارچگی و آرامش در مدیریت مدرسه
              </h2>
              <p className="mt-2.5 max-w-lg text-sm leading-7 text-[var(--lux-text-muted)]">
                ارتباط بدون واسطه اولیا با معلمان، پرونده جامع تحصیلی و حضور و غیاب ابری با دستیار هوش مصنوعی
              </p>
            </div>
          </div>

          {/* شوکیس بصری پنل مدرسه و کارت‌های زنده */}
          <div className="relative z-10 my-6 flex flex-1 items-center justify-center">
            <LoginBrandScene />
          </div>

          {/* فوتر ستون برند */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-4 text-xs text-[var(--lux-text-muted)]">
            <p>© ۱۴۰۵ هوشاگر — تمامی حقوق محفوظ است</p>
            <Link
              href="/"
              className="font-bold text-[var(--lux-secondary)] transition-colors hover:text-white"
            >
              صفحه اصلی سایت
            </Link>
          </div>
        </aside>

        {/* ── ستون چپ: کارت فرم ورود (ارگونومیک، تفکیک نقش دقیق و دسترسی آسان) ── */}
        <div className="relative flex flex-col justify-center px-4 py-8 sm:px-8 sm:py-10 lg:py-12">
          
          {/* هدر موبایل */}
          <div className="relative mb-5 flex items-center justify-between lg:hidden">
            <HooshagarLogo size="lg" href="/" inverted priority />
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-[var(--lux-text-muted)] transition-colors hover:border-white/25 hover:text-white"
            >
              صفحه اصلی
            </Link>
          </div>

          {/* کارت شیشه‌ای فرم */}
          <div className="lp-glass relative mx-auto w-full max-w-[520px] p-6 shadow-2xl sm:p-8">
            <PortalFormHeading title={title} subtitle={subtitle} />
            {children}
          </div>
        </div>

      </div>
    </div>
  )
}
