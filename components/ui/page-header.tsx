import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)} dir="rtl">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn('p-2.5 rounded-xl flex-shrink-0 mt-0.5', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
