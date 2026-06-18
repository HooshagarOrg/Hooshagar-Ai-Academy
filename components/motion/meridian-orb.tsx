'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'

interface MeridianOrbProps {
  className?: string
  showLogo?: boolean
}

/** هستهٔ سه‌بعدی لاکچری — مرکز بصری لندینگ و ورود */
export function MeridianOrb({ className, showLogo = true }: MeridianOrbProps) {
  const reduce = useReducedMotion()

  return (
    <div className={cn('relative perspective-[1400px]', className)}>
      <motion.div
        className="relative w-[min(72vw,380px)] h-[min(72vw,380px)] mx-auto [transform-style:preserve-3d]"
        animate={reduce ? undefined : { rotateY: [0, 8, 0, -8, 0], rotateX: [0, -4, 0, 4, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* حلقه‌های مداری */}
        {!reduce && (
          <>
            <div className="meridian-orbit meridian-orbit-1" />
            <div className="meridian-orbit meridian-orbit-2" />
            <div className="meridian-orbit meridian-orbit-3" />
          </>
        )}

        {/* کره مرکزی */}
        <div className="absolute inset-[12%] rounded-full meridian-core">
          <div className="absolute inset-0 rounded-full meridian-core-glow" />
          {showLogo && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <HooshagarLogo size="hero" href="/" showWordmark={false} priority />
            </div>
          )}
        </div>

        {/* ذرات شناور */}
        {!reduce &&
          [0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/60 shadow-[0_0_12px_rgba(212,175,55,0.8)]"
              style={{
                left: `${20 + i * 14}%`,
                top: `${15 + (i % 3) * 22}%`,
              }}
              animate={{ y: [0, -14, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
      </motion.div>
    </div>
  )
}
