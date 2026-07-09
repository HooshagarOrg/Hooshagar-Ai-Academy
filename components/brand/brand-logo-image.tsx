import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { brandAssets } from '@/lib/brand'

type BrandLogoImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  alt?: string
}

/**
 * لوگوی برند — PNG شفاف، بدون بهینه‌سازی که آلفا از بین نرود
 */
export function BrandLogoImage({
  alt = 'لوگوی هوشاگر',
  className,
  unoptimized = true,
  ...props
}: BrandLogoImageProps) {
  return (
    <span className="lp-brand-logo inline-flex leading-none">
      <Image
        src={brandAssets.logo}
        alt={alt}
        unoptimized={unoptimized}
        className={cn('bg-transparent object-contain', className)}
        {...props}
      />
    </span>
  )
}
