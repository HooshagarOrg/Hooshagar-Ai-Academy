'use client'

import { motion, useReducedMotion } from 'framer-motion'

export const LUX_EASE = [0.16, 1, 0.3, 1] as const

export function LuxFadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: LUX_EASE }}
    >
      {children}
    </motion.div>
  )
}

export function LuxStagger({
  children,
  className,
  stagger = 0.1,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function LuxStaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: LUX_EASE } },
      }}
    >
      {children}
    </motion.div>
  )
}
