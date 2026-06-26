import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LuxEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function LuxEmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: LuxEmptyStateProps) {
  const action =
    actionLabel &&
    (actionHref ? (
      <Link href={actionHref} className="lux-btn-accent mt-4 inline-flex min-h-10 px-5 text-sm">
        {actionLabel}
      </Link>
    ) : onAction ? (
      <button type="button" onClick={onAction} className="lux-btn-accent mt-4 inline-flex min-h-10 px-5 text-sm">
        {actionLabel}
      </button>
    ) : null)

  return (
    <div className={cn('lux-empty', className)}>
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--lux-surface)] text-[var(--lux-primary)]">
          {icon}
        </div>
      )}
      <p className="font-bold text-[var(--lux-text)]">{title}</p>
      {description && <p className="mt-1 text-sm leading-7 text-[var(--lux-text-muted)]">{description}</p>}
      {action}
    </div>
  )
}
