'use client'

import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGregorianIsoDate, usePersianDateString } from '@/lib/hooks/use-persian-date'
import type { JalaliDatePreset } from '@/lib/date/jalali'

interface PersianDateDisplayProps {
  /** compact: هدر | full: پروفایل و جزئیات */
  variant?: 'compact' | 'full'
  className?: string
  showIcon?: boolean
}

const VARIANT_PRESET: Record<'compact' | 'full', JalaliDatePreset> = {
  compact: 'compact',
  full: 'full',
}

export function PersianDateDisplay({
  variant = 'compact',
  className,
  showIcon = true,
}: PersianDateDisplayProps) {
  const preset = VARIANT_PRESET[variant]
  const dateLabel = usePersianDateString(preset)
  const isoDate = useGregorianIsoDate()

  if (variant === 'full') {
    return (
      <time
        dateTime={isoDate || undefined}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-[var(--lux-border)] bg-[var(--lux-card)] p-3',
          className,
        )}
      >
        {showIcon && (
          <Calendar className="h-5 w-5 shrink-0 text-[var(--lux-primary)]" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="text-xs text-[var(--lux-text-muted)]">تاریخ امروز (شمسی)</p>
          <p className="truncate font-bold text-[var(--lux-text)] tabular-nums">{dateLabel}</p>
        </div>
      </time>
    )
  }

  return (
    <time
      dateTime={isoDate || undefined}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-[var(--lux-border)]',
        'bg-[var(--lux-surface-strong)] px-2 py-1 text-[10px] font-bold',
        'text-[var(--lux-text-muted)] tabular-nums whitespace-nowrap',
        className,
      )}
      aria-label={`تاریخ امروز: ${dateLabel}`}
    >
      {showIcon && <Calendar className="h-3 w-3 shrink-0" aria-hidden />}
      <span>{dateLabel}</span>
    </time>
  )
}
