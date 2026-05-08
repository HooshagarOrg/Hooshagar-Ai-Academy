import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode | { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null
    if (typeof action === 'object' && 'label' in action && 'onClick' in action) {
      return (
        <Button onClick={(action as { label: string; onClick: () => void }).onClick} className="mt-4" size="sm">
          {(action as { label: string; onClick: () => void }).label}
        </Button>
      )
    }
    return <div className="mt-4">{action as ReactNode}</div>
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-xs">{description}</p>
      )}
      {renderAction()}
    </div>
  )
}
