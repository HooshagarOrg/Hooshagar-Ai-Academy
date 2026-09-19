'use client'

import { usePathname } from 'next/navigation'
import { KeyRound, Shield, Users } from 'lucide-react'

const LOGIN_TRUST_POINTS = [
  { icon: Users, text: 'ورود جدا برای کارکنان، والدین و دانش‌آموز' },
  { icon: KeyRound, text: 'رمز عبور، کد ورود یا پیامک' },
  { icon: Shield, text: 'محافظت در برابر تلاش‌های مشکوک' },
] as const

const PAGE_COPY: Record<string, {
  title: string
  subtitle: string
  accent?: string
  formTitle?: string
  formSubtitle?: string
}> = {
  '/login': {
    title: 'ورود به هوشاگر',
    subtitle: 'سیستم‌عامل هوشمند مدیریت مدارس — امن و یکپارچه',
    accent: 'ورود امن با رمز یا پیامک',
    formTitle: 'خوش آمدید',
    formSubtitle: 'روش ورود خود را انتخاب کنید',
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

interface PortalCopyProps {
  title?: string
  subtitle?: string
  accentLabel?: string
}

export function PortalCopy({
  title,
  subtitle,
  accentLabel,
}: PortalCopyProps): JSX.Element {
  const pathname = usePathname()
  const copy = PAGE_COPY[pathname ?? ''] ?? PAGE_COPY['/login']
  const pageTitle = title ?? copy.title
  const pageSubtitle = subtitle ?? copy.subtitle
  const pageAccent = accentLabel ?? copy.accent

  return (
    <div className="flex flex-col items-center text-center">
      <p className="lp-kicker-gold text-[11px] font-extrabold tracking-[0.18em]">
        هوشاگر
      </p>
      <h2 className="lux-h2 mt-4 max-w-sm text-balance text-3xl leading-snug xl:text-4xl">
        {pageTitle}
      </h2>
      <p className="mt-4 max-w-sm text-sm leading-8 text-[var(--lux-text-muted)]">
        {pageSubtitle}
      </p>
      {pageAccent ? (
        <span className="mt-6 rounded-full border border-[rgba(201,169,98,0.35)] bg-[rgba(201,169,98,0.1)] px-4 py-1.5 text-xs font-extrabold text-[var(--lux-gold)]">
          {pageAccent}
        </span>
      ) : null}
      {pathname === '/login' ? (
        <ul className="mt-9 w-full max-w-sm space-y-2.5 text-right">
          {LOGIN_TRUST_POINTS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-3 rounded-xl border border-[rgba(232,236,244,0.08)] bg-[rgba(15,17,23,0.38)] px-3.5 py-2.5"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(139,124,255,0.14)] text-[var(--lux-primary)]">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="text-xs leading-7 text-[var(--lux-text-muted)]">{text}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function PortalFormHeading({
  title,
  subtitle,
}: {
  title?: string
  subtitle?: string
}): JSX.Element {
  const pathname = usePathname()
  const copy = PAGE_COPY[pathname ?? ''] ?? PAGE_COPY['/login']
  const heading = copy.formTitle ?? title ?? copy.title
  const description = copy.formSubtitle ?? subtitle ?? copy.subtitle

  return (
    <div className="mb-6 hidden lg:block">
      <h1 className="lux-h2 text-xl leading-snug">{heading}</h1>
      <p className="mt-1.5 text-sm leading-7 text-[var(--lux-text-muted)]">
        {description}
      </p>
    </div>
  )
}

export function PortalMobileHeading({
  title,
  subtitle,
}: {
  title?: string
  subtitle?: string
}): JSX.Element {
  const pathname = usePathname()
  const copy = PAGE_COPY[pathname ?? ''] ?? PAGE_COPY['/login']
  return (
    <>
      <h1 className="lux-h2 text-center text-xl leading-snug">
        {title ?? copy.title}
      </h1>
      <p className="mt-1.5 max-w-xs text-center text-xs leading-7 text-[var(--lux-text-muted)]">
        {subtitle ?? copy.subtitle}
      </p>
    </>
  )
}
