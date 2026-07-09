import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BrandLogoImage } from '@/components/brand/brand-logo-image'

const SIZES = {
  xs: { img: 28, text: 'text-sm' },
  sm: { img: 36, text: 'text-base' },
  md: { img: 44, text: 'text-lg' },
  lg: { img: 52, text: 'text-xl' },
  xl: { img: 64, text: 'text-2xl' },
  hero: { img: 88, text: 'text-3xl' },
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
  showWordmark = true,
  showImage = true,
  subtitle,
  size = 'md',
  href = '/',
  className,
  priority = false,
  inverted = false,
}: HooshagarLogoProps) {
  const { img, text } = SIZES[size]

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 min-w-0', className)}>
      {showImage && (
        <BrandLogoImage
          width={img}
          height={img}
          priority={priority}
          className="shrink-0"
        />
      )}
      {showWordmark && (
        <div className="min-w-0 text-right leading-tight">
          <span
            className={cn(
              'font-bold tracking-tight block truncate',
              text,
              inverted ? 'text-white' : 'text-foreground',
            )}
          >
            هوشاگر
          </span>
          {subtitle && (
            <span
              className={cn(
                'text-xs block truncate mt-0.5',
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
  size = 40,
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
