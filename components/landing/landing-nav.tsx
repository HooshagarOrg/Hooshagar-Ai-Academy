/**
 * ناوبری لندینگ — HTML سرور، بدون next/image و بدون JS هیرو.
 * کلاس is-visible را اسکریپت enhance بعد از اسکرول اضافه می‌کند.
 */
import { BrandLogoImage } from '@/components/brand/brand-logo-image'

export function LandingNav(): JSX.Element {
  return (
    <nav id="lp-nav" className="lp-nav" aria-label="ناوبری اصلی">
      <a href="/" className="inline-flex items-center">
        <BrandLogoImage
          alt="هوشاگر"
          width={120}
          height={81}
          sizes="120px"
          className="h-10 w-auto sm:h-12"
          priority
        />
      </a>
      <div className="hidden items-center gap-5 text-sm font-bold text-[var(--lux-text-muted)] sm:flex">
        <a href="#cinematic" className="transition-colors hover:text-[var(--lux-text)]">
          جهان
        </a>
        <a href="#insights" className="transition-colors hover:text-[var(--lux-text)]">
          بینش
        </a>
        <a href="#hooshiar" className="transition-colors hover:text-[var(--lux-text)]">
          هوشیار
        </a>
        <a href="#features" className="transition-colors hover:text-[var(--lux-text)]">
          قابلیت‌ها
        </a>
        <a href="#roles" className="transition-colors hover:text-[var(--lux-text)]">
          نقش‌ها
        </a>
      </div>
      <a
        href="/login"
        className="rounded-full bg-[var(--lux-primary)] px-4 py-1.5 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5"
      >
        ورود
      </a>
    </nav>
  )
}
