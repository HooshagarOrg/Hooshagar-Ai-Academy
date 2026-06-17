import * as React from 'react'
import { cn } from '@/lib/utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  quiet?: boolean
  luxury?: boolean
  glow?: 'pink' | 'cyan' | 'gold' | 'scholar' | 'none'
  hover?: boolean
}

export function GlassCard({
  className,
  elevated = false,
  quiet = false,
  luxury = false,
  glow = 'none',
  hover = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        luxury
          ? 'glass-panel-luxury'
          : elevated
            ? 'glass-panel-elevated'
            : quiet
              ? 'glass-panel-quiet'
              : 'glass-panel',
        glow === 'pink' && 'glow-pink',
        glow === 'cyan' && 'glow-cyan',
        glow === 'gold' && 'glow-gold',
        glow === 'scholar' && 'glow-scholar',
        hover && 'luxury-card-hover cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
