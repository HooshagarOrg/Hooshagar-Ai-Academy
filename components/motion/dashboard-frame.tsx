'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp, motionTransition } from '@/lib/motion/premium'

export function DashboardFrame({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition(0)}
      className="space-y-6"
    >
      {children}
    </motion.div>
  )
}

export function DashboardSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <section className={className}>{children}</section>
  }

  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-24px' }}
      variants={fadeUp}
      transition={motionTransition(0)}
    >
      {children}
    </motion.section>
  )
}
