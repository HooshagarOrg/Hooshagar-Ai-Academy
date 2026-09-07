/**
 * Hero لندینگ — HTML سرور برای LCP. بدون GSAP و بدون PNG یک‌مگابایتی.
 */

import { ArrowLeft, Sparkles } from 'lucide-react'
import { BrandLogoImage } from '@/components/brand/brand-logo-image'

export default function LandingHero(): JSX.Element {
  return (
    <section
      data-hero-section
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-transparent"
      aria-label="معرفی هوشاگر"
    >
      <div className="lp-beam right-[18%] top-0 h-full opacity-60" aria-hidden="true" />
      <div className="lp-beam left-[22%] top-0 h-full opacity-40" aria-hidden="true" />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(139,124,255,0.22), rgba(84,210,255,0.08) 55%, transparent 72%)',
        }}
        aria-hidden="true"
      />

      <div data-hero-content className="lux-container relative z-10 py-24 text-center">
        <div className="relative mx-auto mb-8 flex justify-center">
          <BrandLogoImage
            alt="لوگوی هوشاگر"
            width={96}
            height={96}
            sizes="96px"
            className="h-24 w-24"
          />
        </div>

        <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(201,169,98,0.35)] bg-[rgba(201,169,98,0.08)] px-4 py-1.5 text-xs font-extrabold text-[var(--lux-gold)]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          سیستم‌عامل هوشمند مدارس ایران
        </div>

        <h1 className="lux-display mx-auto max-w-4xl">
          مدرسه‌ای که آیندهٔ فرزندتان را می‌بیند
        </h1>

        <h2 className="lux-h2 mt-3 text-[clamp(1.9rem,5.5vw,3.6rem)] leading-tight">
          با قدرت هوش مصنوعی
        </h2>

        <p className="lux-body mx-auto mt-7 max-w-2xl text-balance text-[1.05rem]">
          هوشاگر تحلیل تحصیلی، کشف استعداد، همراه مطالعهٔ هوشمند و گزارش‌های عمیق
          برای والدین را در یک تجربهٔ یکپارچه گرد هم می‌آورد — برای دانش‌آموز، معلم،
          والدین و مدیر مدرسه.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="/login" className="lux-btn-accent px-8 text-base">
            ورود به هوشاگر
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </a>
          <a href="#cinematic" className="lux-btn-ghost px-8 text-base">
            تماشای ویدیو
          </a>
        </div>

        <div className="mx-auto mt-16 flex max-w-md items-center justify-center gap-8 text-xs font-bold text-[var(--lux-text-muted)]">
          <span>۱۲ قابلیت هوش مصنوعی</span>
          <span className="h-4 w-px bg-[rgba(232,236,244,0.18)]" aria-hidden="true" />
          <span>۴ نقش کاربری</span>
          <span className="h-4 w-px bg-[rgba(232,236,244,0.18)]" aria-hidden="true" />
          <span>فارسی و بومی</span>
        </div>
      </div>

      <div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[var(--lux-text-muted)]"
        aria-hidden="true"
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-[rgba(232,236,244,0.25)] p-1">
          <div className="h-2 w-1 animate-bounce rounded-full bg-[var(--lux-gold)]" />
        </div>
      </div>
    </section>
  )
}
