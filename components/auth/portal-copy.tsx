'use client'

import { usePathname } from 'next/navigation'

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
    <>
      <h2 className="lux-h2 mt-8 max-w-sm text-center text-2xl leading-snug">
        {pageTitle}
      </h2>
      <p className="mt-3 max-w-xs text-center text-sm leading-7 text-[var(--lux-text-muted)]">
        {pageSubtitle}
      </p>
      {pageAccent ? (
        <span className="mt-5 rounded-full border border-[rgba(201,169,98,0.35)] bg-[rgba(201,169,98,0.1)] px-4 py-1.5 text-xs font-extrabold text-[var(--lux-gold)]">
          {pageAccent}
        </span>
      ) : null}
    </>
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
  return (
    <div className="mb-6 hidden lg:block">
      <h1 className="lux-h2 text-xl">{title ?? copy.title}</h1>
      <p className="mt-1 text-sm text-[var(--lux-text-muted)]">{subtitle ?? copy.subtitle}</p>
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
      <h1 className="lux-h2 mt-4 text-center text-lg">
        {title ?? copy.title}
      </h1>
      <p className="mt-1 max-w-xs text-center text-xs leading-7 text-[var(--lux-text-muted)]">
        {subtitle ?? copy.subtitle}
      </p>
    </>
  )
}
