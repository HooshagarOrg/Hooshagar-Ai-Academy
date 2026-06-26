import { cn } from '@/lib/utils'

interface LuxCardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
  gradientBorder?: boolean
}

export function LuxCard({ children, className, interactive = false, gradientBorder = false }: LuxCardProps) {
  return (
    <div
      className={cn(
        'lux-dash-card p-5 sm:p-6',
        interactive && 'lux-dash-card-interactive cursor-pointer',
        gradientBorder && 'lux-card-gradient-border',
        className,
      )}
    >
      {children}
    </div>
  )
}
