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
      className={cn('hf-card rounded-[1.5rem] p-5', className)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {icon && (
          <div
            className={cn(
              'p-2.5 rounded-xl',
              'bg-[#EAF1FF] border border-[#DCE8FF]',
              accentClass,
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-[#64748B] mb-1">{label}</p>
      <p className="text-2xl font-black tabular-nums tracking-tight text-[#111827]">{value}</p>
      {hint && <p className="text-xs text-[#64748B] mt-1.5">{hint}</p>}
    </div>
  )
}
