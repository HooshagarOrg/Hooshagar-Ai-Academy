'use client'

import { PageHeader } from '@/components/layout/page-header'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type DashboardPageProps = {
  title: React.ReactNode
  description?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
  /** بخش‌های داخلی با LuxStagger */
  animatedSections?: boolean
}

export function DashboardPage({
  title,
  description,
  meta,
  actions,
  children,
  className,
  headerClassName,
  animatedSections = true,
}: DashboardPageProps) {
  const showHeader = title !== '' || meta !== '' || description !== undefined || actions !== undefined

  const body = animatedSections ? (
    <LuxStagger className={cn('space-y-6', className)} stagger={0.08}>
      {children}
    </LuxStagger>
  ) : (
    <div className={cn('space-y-6', className)}>{children}</div>
  )

  return (
    <div className="space-y-6" dir="rtl">
      {showHeader && (
        <LuxFadeUp>
          <PageHeader
            title={title}
            description={description}
            meta={meta}
            actions={actions}
            className={headerClassName}
          />
        </LuxFadeUp>
      )}
      {body}
    </div>
  )
}

export function DashboardSectionBlock({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <LuxStaggerItem className={className}>{children}</LuxStaggerItem>
}
