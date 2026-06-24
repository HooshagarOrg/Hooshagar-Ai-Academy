import { cn } from '@/lib/utils'

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
  accentClass = 'text-role-accent',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn('glass-arc p-5', className)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {icon && (
          <div
            className={cn(
              'p-2.5 rounded-xl',
              'bg-[rgba(var(--role-accent-r),0.1)] border border-[rgba(var(--role-accent-r),0.18)]',
              accentClass,
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-xs text-white/45 mb-1">{label}</p>
      <p className="stat-pill-value text-2xl">{value}</p>
      {hint && <p className="text-xs text-white/35 mt-1.5">{hint}</p>}
    </div>
  )
}
