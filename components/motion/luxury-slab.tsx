'use client'

import { useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LuxurySlabProps {
  children: ReactNode
  className?: string
  depth?: number
  glow?: 'gold' | 'sapphire' | 'none'
}

/** تختهٔ شیشه‌ای لاکچری با عمق ۳D و حاشیه طلایی */
export function LuxurySlab({
  children,
  className,
  depth = 1,
  glow = 'gold',
}: LuxurySlabProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    setTilt({
      x: (e.clientY - r.top - r.height / 2) / 28,
      y: -(e.clientX - r.left - r.width / 2) / 28,
    })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className={cn('perspective-[1200px]', className)}
      style={{ zIndex: depth }}
      whileHover={reduce ? undefined : { scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div
        className={cn(
          'obsidian-slab relative rounded-2xl p-6 sm:p-8 [transform-style:preserve-3d] transition-transform duration-300',
          glow === 'gold' && 'obsidian-slab-gold',
          glow === 'sapphire' && 'obsidian-slab-sapphire',
        )}
        style={{
          transform: `translateZ(${depth * 12}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="obsidian-slab-shine pointer-events-none" aria-hidden />
        <div className="relative z-[1]">{children}</div>
      </div>
    </motion.div>
  )
}
