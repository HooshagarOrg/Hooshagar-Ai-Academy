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

export type LogoSurface = 'base' | 'hero' | 'elevated' | 'void' | 'light' | 'transparent'

export interface HooshagarLogoProps {
  showWordmark?: boolean
  subtitle?: string
  size?: HooshagarLogoSize
  href?: string
  className?: string
  priority?: boolean
  inverted?: boolean
  /** پس‌زمینه باکس لوگو — همرنگ تم اطراف */
  surface?: LogoSurface
}

const SURFACE_BG: Record<LogoSurface, string> = {
  base: '#0F1117',
  hero: '#12151C',
  elevated: '#161B26',
  void: '#0B0D12',
  light: '#E6EBF4',
  transparent: 'transparent',
}

export function HooshagarLogo({
  showWordmark = true,
  subtitle,
  size = 'md',
  href = '/',
  className,
  priority = false,
  inverted = false,
  surface = 'base',
}: HooshagarLogoProps) {
  const { box, text } = SIZES[size]

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 min-w-0 group', className)}>
      <span
        className={cn(
          'relative flex-shrink-0 rounded-2xl overflow-hidden',
          'transition-transform duration-200 group-hover:scale-[1.02]',
          size === 'hero' && 'shadow-lg shadow-brand-cyan/25',
        )}
        style={{
          width: box,
          height: box,
          backgroundColor: SURFACE_BG[surface],
        }}
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
  surface = 'base',
}: {
  size?: number
  className?: string
  priority?: boolean
  surface?: LogoSurface
}) {
  return (
    <span
      className={cn(
        'relative inline-flex flex-shrink-0 rounded-2xl overflow-hidden',
        className,
      )}
      style={{ width: size, height: size, backgroundColor: SURFACE_BG[surface] }}
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
