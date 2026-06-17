'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Float3DProps {
  children: React.ReactNode
  className?: string
  depth?: 'subtle' | 'hero'
}

/** شناور سه‌بعدی ملایم — بدون چرخش (لوگو و المان‌های hero) */
export function Float3D({ children, className, depth = 'subtle' }: Float3DProps) {
  const reduce = useReducedMotion()
  const y = depth === 'hero' ? 12 : 6

  return (
    <div className={cn('perspective-[1400px]', className)}>
      <motion.div
        className="[transform-style:preserve-3d]"
        animate={reduce ? undefined : { y: [0, -y, 0] }}
        transition={{
          duration: depth === 'hero' ? 6 : 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className={cn(
            depth === 'hero' &&
              'drop-shadow-[0_32px_64px_rgba(201,169,98,0.18)]',
            depth === 'subtle' &&
              'drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]',
          )}
        >
          {children}
        </div>
      </motion.div>
    </div>
  )
}
