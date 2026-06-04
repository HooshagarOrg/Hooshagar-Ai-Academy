import { createElement, isValidElement, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type EmptyStateIcon = ReactNode | LucideIcon

function renderIcon(icon: EmptyStateIcon) {
  if (isValidElement(icon)) return icon
  return createElement(icon as LucideIcon, {
    className: 'h-7 w-7',
    'aria-hidden': true,
  })
}

interface EmptyStateProps {
  icon?: EmptyStateIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02]',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 p-3 rounded-2xl bg-muted/80 text-muted-foreground">
          {renderIcon(icon)}
        </div>
      )}
      <p className="font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
