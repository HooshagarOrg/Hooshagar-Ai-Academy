import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: number; label?: string }
  variant?: 'default' | 'gradient' | 'outline'
  className?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend,
  variant = 'default',
  className,
  onClick,
}: StatCardProps) {
  const TrendIcon = trend
    ? trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus
    : null

  const trendColor = trend
    ? trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-500' : 'text-gray-400'
    : ''

  return (
    <div
      className={cn(
        'rounded-2xl p-5 transition-all duration-200',
        variant === 'default' && 'bg-white border border-gray-100 shadow-sm hover:shadow-md',
        variant === 'outline' && 'bg-transparent border-2 border-gray-200 hover:border-blue-200',
        variant === 'gradient' && 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          'p-2.5 rounded-xl',
          variant === 'gradient' ? 'bg-white/20' : iconBg
        )}>
          <Icon className={cn('w-5 h-5', variant === 'gradient' ? 'text-white' : iconColor)} />
        </div>
        {trend && TrendIcon && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            variant === 'gradient' ? 'text-white/80' : trendColor
          )}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <p className={cn(
        'text-xs font-medium mb-1',
        variant === 'gradient' ? 'text-white/70' : 'text-gray-500'
      )}>
        {title}
      </p>

      <p className={cn(
        'text-2xl font-bold leading-tight',
        variant === 'gradient' ? 'text-white' : 'text-gray-900'
      )}>
        {value}
      </p>

      {subtitle && (
        <p className={cn(
          'text-xs mt-1',
          variant === 'gradient' ? 'text-white/60' : 'text-gray-400'
        )}>
          {subtitle}
        </p>
      )}

      {trend?.label && (
        <p className={cn(
          'text-xs mt-1',
          variant === 'gradient' ? 'text-white/60' : trendColor
        )}>
          {trend.label}
        </p>
      )}
    </div>
  )
}
