import { cn } from '@/lib/utils'

interface LuxPageHeaderProps {
  title: string
  subtitle?: string
  kicker?: string
  action?: React.ReactNode
  className?: string
}

export function LuxPageHeader({ title, subtitle, kicker, action, className }: LuxPageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div>
        {kicker && <p className="lux-kicker mb-2">{kicker}</p>}
        <h1 className="text-2xl font-black text-[var(--lux-text)] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-8 text-[var(--lux-text-muted)]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
