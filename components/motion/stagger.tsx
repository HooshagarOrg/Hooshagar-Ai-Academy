'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp, motionTransition, staggerContainer } from '@/lib/motion/premium'
import { cn } from '@/lib/utils'

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} variants={fadeUp} transition={motionTransition()}>
      {children}
    </motion.div>
  )
}
