import Image from 'next/image'
import Link from 'next/link'
import { brandAssets } from '@/lib/brand'
import { cn } from '@/lib/utils'

const SIZES = {
  xs: { box: 24, text: 'text-sm' },
  sm: { box: 32, text: 'text-base' },
  md: { box: 40, text: 'text-lg' },
  lg: { box: 56, text: 'text-xl' },
  xl: { box: 72, text: 'text-2xl' },
  hero: { box: 96, text: 'text-3xl' },
} as const

export type HooshagarLogoSize = keyof typeof SIZES

export interface HooshagarLogoProps {
  showWordmark?: boolean
  subtitle?: string
  size?: HooshagarLogoSize
  href?: string
  className?: string
  priority?: boolean
  inverted?: boolean
}

export function HooshagarLogo({
  showWordmark = true,
  subtitle,
  size = 'md',
  href = '/',
  className,
  priority = false,
  inverted = false,
}: HooshagarLogoProps) {
  const { box, text } = SIZES[size]

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 min-w-0 group', className)}>
      <span
        className={cn(
          'relative flex-shrink-0 rounded-2xl overflow-hidden bg-background',
          'ring-1 ring-white/10 shadow-glass transition-transform duration-200 group-hover:scale-[1.02]',
          size === 'hero' && 'shadow-lg shadow-brand-pink/30 glow-pink',
        )}
        style={{ width: box, height: box }}
      >
        <Image
          src={brandAssets.logo}
          alt="آرم هوشاگر"
          width={box}
          height={box}
          priority={priority}
          className="object-contain w-full h-full"
        />
      </span>
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
        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40"
      >
        {content}
      </Link>
    )
  }

  return content
}

export function HooshagarMark({
  size = 32,
  className,
  priority = false,
}: {
  size?: number
  className?: string
  priority?: boolean
}) {
  return (
    <span
      className={cn(
        'relative inline-flex flex-shrink-0 rounded-2xl overflow-hidden bg-background ring-1 ring-white/10',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={brandAssets.logo}
        alt="هوشاگر"
        width={size}
        height={size}
        priority={priority}
        className="object-contain w-full h-full"
      />
    </span>
  )
}
