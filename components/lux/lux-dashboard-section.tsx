'use client'

import type { ReactNode } from 'react'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import { cn } from '@/lib/utils'

interface LuxDashboardSectionProps {
  children: ReactNode
  className?: string
  stagger?: number
  header?: ReactNode
}

/** wrapper مشترک برای صفحات dashboard — fade-up هدر + stagger کارت‌ها */
export function LuxDashboardSection({
  children,
  className,
  stagger = 0.1,
  header,
}: LuxDashboardSectionProps) {
  return (
    <div className={cn('space-y-6', className)} dir="rtl">
      {header ? <LuxFadeUp>{header}</LuxFadeUp> : null}
      <LuxStagger className="space-y-6" stagger={stagger}>
        {children}
      </LuxStagger>
    </div>
  )
}

export function LuxSectionBlock({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <LuxStaggerItem className={className}>{children}</LuxStaggerItem>
}
