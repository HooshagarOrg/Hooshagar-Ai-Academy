import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LuxStatRowItem = {
  label: string
  value: string | number
  icon?: LucideIcon
  color?: string
  bg?: string
}

interface LuxStatRowProps {
  items: LuxStatRowItem[]
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function LuxStatRow({ items, columns = 4, className }: LuxStatRowProps) {
  const gridClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : columns === 5
          ? 'grid-cols-2 md:grid-cols-5'
          : 'grid-cols-2 md:grid-cols-4'

  return (
    <div className={cn('grid gap-4', gridClass, className)}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className={cn(
              'lux-dash-stat flex items-center gap-3',
              item.bg,
            )}
          >
            {Icon && (
              <Icon className={cn('h-6 w-6 flex-shrink-0', item.color ?? 'text-[var(--lux-primary)]')} />
            )}
            <div className="min-w-0">
              <p className={cn('text-xl font-bold tabular-nums', item.color ?? 'text-[var(--lux-text)]')}>
                {item.value}
              </p>
              <p className="text-xs text-[var(--lux-text-muted)]">{item.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
