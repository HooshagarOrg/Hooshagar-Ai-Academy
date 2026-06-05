'use client'

import { PageHeader } from '@/components/layout/page-header'
import { DashboardFrame, DashboardSection } from '@/components/motion/dashboard-frame'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

type DashboardPageProps = {
  title: React.ReactNode
  description?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
  /** بخش‌های داخلی با انیمیشن scroll */
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
  const body = animatedSections ? (
    <DashboardSection className={cn('space-y-6', className)}>{children}</DashboardSection>
  ) : (
    <div className={cn('space-y-6', className)}>{children}</div>
  )

  return (
    <DashboardFrame>
      <PageHeader
        title={title}
        description={description}
        meta={meta}
        actions={actions}
        className={headerClassName}
      />
      {body}
    </DashboardFrame>
  )
}

export function DashboardSectionBlock({
  children,
  className,
  ...props
}: ComponentProps<typeof DashboardSection>) {
  return (
    <DashboardSection className={className} {...props}>
      {children}
    </DashboardSection>
  )
}
