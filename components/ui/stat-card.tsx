import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: React.ReactNode
  accentClass?: string
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accentClass = 'text-brand-cyan',
  className,
}: StatCardProps) {
  return (
    <GlassCard className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        {icon && (
          <div
            className={cn(
              'p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08]',
              accentClass,
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </GlassCard>
  )
}
