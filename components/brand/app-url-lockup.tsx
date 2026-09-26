import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BrandLogoImage } from '@/components/brand/brand-logo-image'
import { getAppOrigin, getAppDisplayHost } from '@/lib/app-url'

type AppUrlLockupProps = {
  className?: string
  /** اندازهٔ لوگو در lockup */
  size?: 'sm' | 'md'
}

/**
 * لوگوی برند + آدرس سایت — برای ورود، فوتر و پیش‌نمایش پیامک
 */
export function AppUrlLockup({ className, size = 'sm' }: AppUrlLockupProps): JSX.Element {
  const host = getAppDisplayHost()
  const origin = getAppOrigin()
  const dims =
    size === 'md'
      ? { w: 96, h: 40, imgClass: 'h-6 w-auto' }
      : { w: 72, h: 30, imgClass: 'h-5 w-auto' }

  return (
    <Link
      href={origin}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-1.5 transition-colors hover:border-white/25 hover:bg-white/[0.07]',
        className,
      )}
      dir="ltr"
      title={origin}
    >
      <BrandLogoImage
        alt="هوشاگر"
        width={dims.w}
        height={dims.h}
        className={cn('shrink-0', dims.imgClass)}
      />
      <span className="font-mono text-xs font-bold tracking-tight text-[var(--lux-text-muted)] sm:text-sm">
        {host}
      </span>
    </Link>
  )
}
