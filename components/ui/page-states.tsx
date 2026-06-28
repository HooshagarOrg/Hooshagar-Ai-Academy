'use client'

import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PageStateVariant = 'lux' | 'default'

const spinnerColor: Record<PageStateVariant, string> = {
  lux: 'text-[var(--lux-primary)]',
  default: 'text-brand-cyan',
}

const skeletonBg: Record<PageStateVariant, string> = {
  lux: 'bg-[var(--lux-surface)]',
  default: 'bg-muted',
}

interface PageLoadingProps {
  label?: string
  className?: string
  variant?: PageStateVariant
  compact?: boolean
}

/** Loading یکپارچه — فاز ۶ */
export function PageLoading({
  label = 'در حال بارگذاری...',
  className,
  variant = 'default',
  compact = false,
}: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        compact ? 'py-10' : 'py-16',
        className,
      )}
      dir="rtl"
    >
      <Loader2 className={cn('h-8 w-8 animate-spin', spinnerColor[variant])} aria-hidden />
      {label && (
        <p
          className={cn(
            'text-sm font-medium',
            variant === 'lux' ? 'text-[var(--lux-text-muted)]' : 'text-muted-foreground',
          )}
        >
          {label}
        </p>
      )}
      <span className="sr-only">{label}</span>
    </div>
  )
}

interface PageErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
  variant?: PageStateVariant
}

/** خطای کاربرپسند فارسی — فاز ۶ */
export function PageErrorState({
  title = 'خطا در دریافت اطلاعات',
  message,
  onRetry,
  retryLabel = 'تلاش مجدد',
  className,
  variant = 'default',
}: PageErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl border p-6 text-center',
        variant === 'lux'
          ? 'border-[var(--lux-accent)]/30 bg-[var(--lux-accent)]/10'
          : 'border-destructive/30 bg-destructive/5',
        className,
      )}
      dir="rtl"
    >
      <AlertCircle
        className={cn(
          'mx-auto mb-3 h-10 w-10',
          variant === 'lux' ? 'text-[var(--lux-accent)]' : 'text-destructive',
        )}
        aria-hidden
      />
      <p className={cn('font-bold', variant === 'lux' ? 'text-[var(--lux-text)]' : 'text-foreground')}>
        {title}
      </p>
      <p
        className={cn(
          'mt-2 text-sm leading-7',
          variant === 'lux' ? 'text-[var(--lux-text-muted)]' : 'text-muted-foreground',
        )}
      >
        {message}
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="mt-4 min-h-10 gap-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

interface PageSkeletonCardsProps {
  count?: number
  className?: string
  variant?: PageStateVariant
}

/** Skeleton کارت — responsive grid */
export function PageSkeletonCards({
  count = 4,
  className,
  variant = 'default',
}: PageSkeletonCardsProps) {
  return (
    <div
      aria-busy="true"
      aria-label="در حال بارگذاری"
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}
      dir="rtl"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('h-32 animate-pulse rounded-2xl', skeletonBg[variant])}
        />
      ))}
    </div>
  )
}

interface PageSkeletonTableProps {
  rows?: number
  className?: string
  variant?: PageStateVariant
}

/** Skeleton جدول */
export function PageSkeletonTable({
  rows = 5,
  className,
  variant = 'default',
}: PageSkeletonTableProps) {
  return (
    <div
      aria-busy="true"
      aria-label="در حال بارگذاری"
      className={cn('space-y-2 rounded-2xl border p-4', variant === 'lux' ? 'border-[var(--lux-surface)]' : 'border-border', className)}
      dir="rtl"
    >
      <div className={cn('h-10 animate-pulse rounded-lg', skeletonBg[variant])} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('h-12 animate-pulse rounded-lg', skeletonBg[variant])} />
      ))}
    </div>
  )
}
