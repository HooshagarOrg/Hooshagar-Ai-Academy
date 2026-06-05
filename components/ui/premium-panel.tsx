import { GlassCard } from '@/components/ui/glass-card'
import { cn } from '@/lib/utils'

interface PremiumPanelProps {
  children: React.ReactNode
  className?: string
  quiet?: boolean
  elevated?: boolean
  hover?: boolean
  title?: React.ReactNode
  action?: React.ReactNode
}

/** جایگزین پنل‌های legacy `bg-white/10` */
export function PremiumPanel({
  children,
  className,
  quiet,
  elevated,
  hover,
  title,
  action,
}: PremiumPanelProps) {
  return (
    <GlassCard
      quiet={quiet}
      elevated={elevated}
      hover={hover}
      className={cn('p-5 sm:p-6', className)}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="text-lg font-bold text-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </GlassCard>
  )
}
