import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { brandAssets } from '@/lib/brand'

type BrandLogoImageProps = {
  alt?: string
  className?: string
  width: number
  height: number
  sizes?: string
  loading?: 'eager' | 'lazy'
  priority?: boolean
  unoptimized?: boolean
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height' | 'loading'>

/**
 * لوگوی برند — img ساده تا runtime next/image وارد باندل لندینگ نشود
 */
export function BrandLogoImage({
  alt = 'لوگوی هوشاگر',
  className,
  width,
  height,
  loading,
  priority = false,
  unoptimized: _unoptimized,
  sizes: _sizes,
  ...props
}: BrandLogoImageProps): JSX.Element {
  return (
    <span className="lp-brand-logo inline-flex leading-none">
      <img
        src={brandAssets.logo}
        alt={alt}
        width={width}
        height={height}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : (loading ?? 'lazy')}
        className={cn('bg-transparent object-contain', className)}
        {...props}
      />
    </span>
  )
}
