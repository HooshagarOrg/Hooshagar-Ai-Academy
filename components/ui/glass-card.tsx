import * as React from 'react'
import { cn } from '@/lib/utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  quiet?: boolean
  glow?: 'pink' | 'cyan' | 'none'
  hover?: boolean
}

export function GlassCard({
  className,
  elevated = false,
  quiet = false,
  glow = 'none',
  hover = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        elevated ? 'glass-panel-elevated' : quiet ? 'glass-panel-quiet' : 'glass-panel',
        glow === 'pink' && 'glow-pink',
        glow === 'cyan' && 'glow-cyan',
        hover &&
          'motion-interactive hover:border-white/[0.14] hover:shadow-glass cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
