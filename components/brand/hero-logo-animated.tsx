'use client'

import { cn } from '@/lib/utils'
import { BrandLogoImage } from '@/components/brand/brand-logo-image'

interface HeroLogoAnimatedProps {
  /** عرض و ارتفاع لوگو به px */
  size?: number
  /** اندازه کوچک‌تر برای موبایل */
  compact?: boolean
  className?: string
  priority?: boolean
}

/**
 * لوگوی هیرو — بدون چرخش؛ شناوری، تنفس، بازتاب شیشه‌ای و هالهٔ نرم (CSS خالص)
 */
export function HeroLogoAnimated({
  size,
  compact = false,
  className,
  priority = false,
}: HeroLogoAnimatedProps): JSX.Element {
  const dim = size ?? (compact ? 200 : 280)

  return (
    <div
      className={cn('hero-logo', compact && 'hero-logo--compact', className)}
      style={{ '--hero-logo-size': `${dim}px` } as React.CSSProperties}
      role="img"
      aria-label="لوگوی هوشاگر"
    >
      <div className="hero-logo__shadow" aria-hidden />
      <div className="hero-logo__motion">
        <div className="hero-logo__glow" aria-hidden />
        <div className="hero-logo__image-wrap">
          <BrandLogoImage
            alt=""
            width={dim}
            height={dim}
            priority={priority}
            className="hero-logo__image"
            aria-hidden
          />
          <div className="hero-logo__sweep" aria-hidden />
        </div>
      </div>
    </div>
  )
}
