'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ArcVariant = 'blue' | 'green' | 'amber' | 'pink' | 'red' | 'teal' | 'role'
type ArcSize = 'sm' | 'md' | 'lg' | 'xl'

interface GlassArcProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  /** رنگ border gradient — role از CSS var استفاده می‌کند */
  variant?: ArcVariant
  size?: ArcSize
  hover?: boolean
  glow?: boolean
  as?: 'div' | 'article' | 'section' | 'li'
}

const VARIANT_STYLES: Record<ArcVariant, string> = {
  blue:  '[--ga-r:59] [--ga-g:130] [--ga-b:246]',
  green: '[--ga-r:16]  [--ga-g:185] [--ga-b:129]',
  amber: '[--ga-r:245] [--ga-g:158] [--ga-b:11]',
  pink:  '[--ga-r:236] [--ga-g:72]  [--ga-b:153]',
  red:   '[--ga-r:239] [--ga-g:68]  [--ga-b:68]',
  teal:  '[--ga-r:20]  [--ga-g:184] [--ga-b:166]',
  role:  '',
}

const SIZE_RADIUS: Record<ArcSize, string> = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  xl: 'rounded-[2rem]',
}

/**
 * GlassArc — کارت شیشه‌ای با border gradient
 * variant=role → از --role-accent CSS var استفاده می‌کند
 */
export function GlassArc({
  children,
  className,
  style,
  variant = 'role',
  size = 'md',
  hover = true,
  glow = false,
  as: Tag = 'div',
}: GlassArcProps) {
  return (
    <Tag
      className={cn(
        'glass-arc',
        SIZE_RADIUS[size],
        variant !== 'role' && VARIANT_STYLES[variant],
        hover && 'transition-all duration-300',
        glow && 'glow-role-accent',
        className,
      )}
      style={{
        ...(variant !== 'role'
          ? { ['--role-accent-r' as string]: `var(--ga-r) var(--ga-g) var(--ga-b)` }
          : {}),
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

/** GlassArcHeader — بخش header کارت با رنگ accent */
export function GlassArcHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('px-5 pt-5 pb-4 border-b border-white/[0.06]', className)}
    >
      {children}
    </div>
  )
}

/** GlassArcBody */
export function GlassArcBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-5 py-4', className)}>{children}</div>
  )
}

/** StatPill — عدد بزرگ + label */
export function StatPill({
  value,
  label,
  trend,
  className,
}: {
  value: string | number
  label: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}) {
  const trendColor =
    trend === 'up' ? 'text-arc-green' : trend === 'down' ? 'text-arc-red' : 'text-white/40'

  return (
    <div className={cn('stat-pill', className)}>
      <span className="stat-pill-value">{value}</span>
      <div className="flex items-center gap-1">
        {trend && (
          <span className={cn('text-xs', trendColor)}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
        <span className="stat-pill-label">{label}</span>
      </div>
    </div>
  )
}
