import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BrandLogoImage } from '@/components/brand/brand-logo-image'

const SIZES = {
  xs: { h: 40, w: 64, text: 'text-sm' },
  sm: { h: 52, w: 84, text: 'text-base' },
  md: { h: 64, w: 104, text: 'text-lg' },
  lg: { h: 80, w: 128, text: 'text-xl' },
  xl: { h: 96, w: 156, text: 'text-2xl' },
  hero: { h: 140, w: 220, text: 'text-3xl' },
} as const

export type HooshagarLogoSize = keyof typeof SIZES

export type LogoSurface = 'base' | 'hero' | 'elevated' | 'void' | 'light' | 'transparent'

export interface HooshagarLogoProps {
  showWordmark?: boolean
  showImage?: boolean
  subtitle?: string
  size?: HooshagarLogoSize
  href?: string
  className?: string
  priority?: boolean
  inverted?: boolean
  surface?: LogoSurface
}

export function HooshagarLogo({
  // New brand lockup already includes «هوشاگر»; keep text off by default.
  showWordmark = false,
  showImage = true,
  subtitle,
  size = 'md',
  href = '/',
  className,
  priority = false,
  inverted = false,
}: HooshagarLogoProps) {
  const { h, w, text } = SIZES[size]

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 min-w-0', className)}>
      {showImage && (
        <BrandLogoImage
          width={w}
          height={h}
          priority={priority}
          sizes={`${w}px`}
          className="shrink-0"
        />
      )}
      {(showWordmark || subtitle) && (
        <div className="min-w-0 text-right leading-tight">
          {showWordmark && (
            <span
              className={cn(
                'font-bold tracking-tight block truncate',
                text,
                inverted ? 'text-white' : 'text-foreground',
              )}
            >
              هوشاگر
            </span>
          )}
          {subtitle && (
            <span
              className={cn(
                'text-xs block truncate',
                showWordmark ? 'mt-0.5' : '',
                inverted ? 'text-white/70' : 'text-muted-foreground',
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {content}
      </Link>
    )
  }

  return content
}

export function HooshagarMark({
  size = 48,
  className,
  priority = false,
}: {
  size?: number
  className?: string
  priority?: boolean
  surface?: LogoSurface
  inverted?: boolean
}) {
  return (
    <BrandLogoImage
      alt="ه"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  )
}
