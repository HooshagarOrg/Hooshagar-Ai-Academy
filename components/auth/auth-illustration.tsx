'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { HooshiarCharacter } from '@/components/avatar/hooshiar-character'
import { cn } from '@/lib/utils'

const ARCS = [
  { color: '#3B82F6', delay: 0 },
  { color: '#10B981', delay: 0.4 },
  { color: '#F59E0B', delay: 0.8 },
  { color: '#EC4899', delay: 1.2 },
  { color: '#EF4444', delay: 1.6 },
]

interface AuthIllustrationProps {
  className?: string
  compact?: boolean
}

/**
 * Illustration ورود — هوشیار + قوس‌های رنگی لوگو
 */
export function AuthIllustration({ className, compact = false }: AuthIllustrationProps) {
  const reduce = useReducedMotion()
  const size = compact ? 200 : 280

  return (
    <div
      className={cn('relative mx-auto flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {ARCS.map((arc, i) => (
        <motion.div
          key={arc.color}
          className="absolute rounded-full border"
          style={{
            width: `${55 + i * 14}%`,
            height: `${55 + i * 14}%`,
            borderColor: `${arc.color}33`,
            boxShadow: `0 0 24px ${arc.color}18`,
          }}
          animate={
            reduce
              ? undefined
              : {
                  rotate: [0, 6, 0, -6, 0],
                  scale: [1, 1.02, 1],
                }
          }
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: arc.delay,
          }}
        />
      ))}

      <motion.div
        className="relative z-10 flex flex-col items-center gap-3"
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="flex items-center justify-center rounded-[2rem] p-4"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(139,124,255,0.15) 55%, rgba(84,210,255,0.1) 80%)',
            boxShadow: '0 24px 60px rgba(139,124,255,0.2)',
          }}
        >
          <HooshiarCharacter size={compact ? 'md' : 'lg'} mood="happy" />
        </div>
        <p className="text-center text-sm font-black text-[#111827]">هوشیار همراه یادگیری شماست</p>
        <p className="max-w-[200px] text-center text-xs leading-6 text-[#64748B]">
          مسیر شخصی، تمرین هوشمند و کشف استعداد
        </p>
      </motion.div>
    </div>
  )
}
