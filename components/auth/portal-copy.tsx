'use client'

import { usePathname } from 'next/navigation'

const PAGE_COPY: Record<string, {
  title: string
  subtitle: string
  accent?: string
  formTitle?: string
  formSubtitle?: string
}> = {
  '/login': {
    title: 'مدرسه، یکجا و امن',
    subtitle: 'هر نقش مسیر ورود خودش را دارد تا اشتباه در ورود کمتر شود.',
    accent: 'هوشاگر',
  },
  '/register': {
    title: 'ثبت‌نام در هوشاگر',
    subtitle: 'سه مرحله تا شروع تجربهٔ یادگیری هوشمند',
    accent: 'برای مدارس و خانواده‌ها',
    formTitle: 'ثبت‌نام',
    formSubtitle: 'نقش و اطلاعات خود را وارد کنید',
  },
  '/change-password': {
    title: 'تغییر رمز عبور',
    subtitle: 'رمز جدید امن برای حساب کاربری شما',
    formTitle: 'رمز جدید',
    formSubtitle: 'رمز قوی انتخاب کنید',
  },
  '/forgot-password': {
    title: 'بازیابی رمز عبور',
    subtitle: 'کد تأیید به موبایل ثبت‌شده ارسال می‌شود',
    accent: 'بازیابی امن با پیامک',
    formTitle: 'بازیابی رمز',
    formSubtitle: 'شماره موبایل ثبت‌شده را وارد کنید',
  },
  '/reset-password': {
    title: 'رمز عبور جدید',
    subtitle: 'رمز قوی و منحصربه‌فرد انتخاب کنید',
    formTitle: 'تنظیم رمز',
    formSubtitle: 'رمز جدید را وارد کنید',
  },
  '/activate': {
    title: 'فعال‌سازی حساب',
    subtitle: 'کد فعال‌سازی را از مدرسه دریافت کنید',
    formTitle: 'فعال‌سازی',
    formSubtitle: 'کد فعال‌سازی مدرسه را وارد کنید',
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
    <div className="flex max-w-md flex-col items-center text-center">
      {pageAccent ? (
        <p className="lp-kicker-gold text-[11px] font-extrabold tracking-[0.2em]">
          {pageAccent}
        </p>
      ) : null}
      <h2 className="lux-h2 mt-3 max-w-sm text-balance text-3xl leading-snug xl:text-[2.6rem]">
        {pageTitle}
      </h2>
      <p className="mt-4 max-w-sm text-sm leading-8 text-[var(--lux-text-muted)]">
        {pageSubtitle}
      </p>
    </div>
  )
}

export function PortalFormHeading({
  title,
  subtitle,
}: {
  title?: string
  subtitle?: string
}): JSX.Element | null {
  const pathname = usePathname()
  // صفحه ورود heading خودش را داخل فرم دارد تا نقش فعال روشن باشد
  if (pathname === '/login') return null

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
}): JSX.Element | null {
  const pathname = usePathname()
  if (pathname === '/login') return null

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
