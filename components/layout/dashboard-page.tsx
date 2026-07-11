'use client'

import { PageHeader } from '@/components/layout/page-header'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type DashboardPageProps = {
  title: React.ReactNode
  description?: React.ReactNode
  meta?: React.ReactNode
  kicker?: string
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
  kicker,
  actions,
  children,
  className,
  headerClassName,
  animatedSections = true,
}: DashboardPageProps) {
  const showHeader =
    title !== '' ||
    meta !== '' ||
    description !== undefined ||
    actions !== undefined ||
    kicker !== undefined

  const titleText = typeof title === 'string' ? title : undefined

  const body = animatedSections ? (
    <LuxStagger className={cn('space-y-6', className)} stagger={0.06}>
      {children}
    </LuxStagger>
  ) : (
    <div className={cn('space-y-6', className)}>{children}</div>
  )

  return (
    <div className="space-y-6" dir="rtl">
      {showHeader &&
        (kicker || titleText ? (
          <LuxPageHeader
            kicker={kicker ?? (typeof meta === 'string' ? meta : undefined)}
            title={titleText ?? String(title)}
            subtitle={typeof description === 'string' ? description : undefined}
            action={actions}
            className={headerClassName}
          />
        ) : (
          <PageHeader
            title={title}
            description={description}
            meta={meta}
            actions={actions}
            className={headerClassName}
          />
        ))}
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
