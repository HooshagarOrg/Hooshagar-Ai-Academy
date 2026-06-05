'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp, motionTransition } from '@/lib/motion/premium'
import { cn } from '@/lib/utils'

type RevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'article'
}

export function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
}: RevealProps) {
  const reduce = useReducedMotion()
  const Component = motion[as]

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <Component
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      transition={motionTransition(delay)}
    >
      {children}
    </Component>
  )
}
