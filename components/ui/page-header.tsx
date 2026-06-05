import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description?: string
  meta?: ReactNode
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  actions?: ReactNode
  className?: string
}

/** هدر یکپارچه داشبورد — تم تیره پریمیوم (RTL) */
export function PageHeader({
  title,
  description,
  meta,
  icon: Icon,
  iconColor = 'text-brand-cyan',
  iconBg = 'bg-brand-purple/15 border border-brand-purple/20',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6',
        className,
      )}
      dir="rtl"
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className={cn('p-2.5 rounded-xl flex-shrink-0 mt-0.5', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          {meta && <div className="text-sm text-muted-foreground">{meta}</div>}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground text-balance leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  )
}
