import { cn } from '@/lib/utils'

interface LuxStatItem {
  label: string
  value: string | number
  hint?: string
  icon?: React.ReactNode
  accent?: string
}

interface LuxStatGridProps {
  items: LuxStatItem[]
  className?: string
}

export function LuxStatGrid({ items, className }: LuxStatGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4 lg:grid-cols-4', className)}>
      {items.map((item) => (
        <div key={item.label} className="lux-dash-stat">
          {item.icon && (
            <div
              className="mb-3 inline-flex rounded-xl p-2.5"
              style={{
                background: `${item.accent ?? 'var(--lux-primary)'}22`,
                color: item.accent ?? 'var(--lux-primary)',
                border: `1px solid ${item.accent ?? 'var(--lux-primary)'}44`,
              }}
            >
              {item.icon}
            </div>
          )}
          <p className="text-xs font-bold text-[var(--lux-text-muted)]">{item.label}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[var(--lux-text)]">{item.value}</p>
          {item.hint && <p className="mt-1 text-xs text-[var(--lux-text-muted)]">{item.hint}</p>}
        </div>
      ))}
    </div>
  )
}
