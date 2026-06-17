'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { GlassCard, type GlassCardProps } from '@/components/ui/glass-card'
import { cn } from '@/lib/utils'

interface TiltCardProps extends GlassCardProps {
  tilt?: boolean
}

/** کارت با عمق ۳D روی hover — الهام از کامپوننت‌های interactive در 21st.dev */
export function TiltCard({
  children,
  className,
  tilt = true,
  luxury = true,
  hover = true,
  ...props
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [rotate, setRotate] = useState({ x: 0, y: 0 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || reduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientY - rect.top - rect.height / 2) / 24
    const y = -(e.clientX - rect.left - rect.width / 2) / 24
    setRotate({ x, y })
  }

  const onLeave = () => setRotate({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX: rotate.x,
        rotateY: rotate.y,
        transformStyle: 'preserve-3d',
      }}
      className={cn('perspective-[900px]', className)}
    >
      <GlassCard luxury={luxury} hover={hover} {...props}>
        {children}
      </GlassCard>
    </motion.div>
  )
}
