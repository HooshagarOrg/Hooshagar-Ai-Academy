'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ChromaticHeroProps {
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * ChromaticHero — بنر رنگی بالای هر داشبورد P0
 * از --role-accent استفاده می‌کند → بر اساس data-role خودکار رنگ می‌شود
 */
export function ChromaticHero({
  title,
  description,
  meta,
  actions,
  children,
  className,
}: ChromaticHeroProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={cn('hf-card relative mb-6 overflow-hidden rounded-[1.75rem]', className)}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* پس‌زمینه */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 55% at 85% 0%, rgba(var(--role-accent-r), 0.14), transparent 60%),
            radial-gradient(ellipse 50% 45% at 10% 100%, rgba(84,210,255,0.14), transparent 55%)
          `,
        }}
        aria-hidden
      />
      {/* خط رنگی بالا */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--role-accent), transparent)',
          opacity: 0.5,
        }}
        aria-hidden
      />

      <div className="relative z-10 px-6 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          {meta && (
            <p className="mb-1 text-xs font-bold tracking-wider text-[#8B7CFF]">{meta}</p>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {children && (
        <div className="relative z-10 px-6 pb-6">{children}</div>
      )}
    </motion.div>
  )
}
