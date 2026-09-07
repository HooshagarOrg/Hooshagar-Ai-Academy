import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { brandAssets } from '@/lib/brand'

type BrandLogoImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  alt?: string
}

/**
 * لوگوی برند — فایل WebP ازپیش‌فشرده؛ unoptimized تا /_next/image به LCP نخورد
 */
export function BrandLogoImage({
  alt = 'لوگوی هوشاگر',
  className,
  unoptimized = true,
  sizes = '96px',
  loading,
  priority,
  ...props
}: BrandLogoImageProps) {
  return (
    <span className="lp-brand-logo inline-flex leading-none">
      <Image
        src={brandAssets.logo}
        alt={alt}
        unoptimized={unoptimized}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : loading}
        className={cn('bg-transparent object-contain', className)}
        {...props}
      />
    </span>
  )
}
