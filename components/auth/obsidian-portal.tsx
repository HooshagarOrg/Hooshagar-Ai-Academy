'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MeridianOrb } from '@/components/motion/meridian-orb'
import { ObsidianCanvas } from '@/components/ui/obsidian-canvas'
import Link from 'next/link'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'

interface ObsidianPortalProps {
  children: React.ReactNode
}

/** پورتال ورود لاکچری — قاب ۳D چرخان + هسته مرکزی */
export function ObsidianPortal({ children }: ObsidianPortalProps) {
  const reduce = useReducedMotion()

  return (
    <div className="relative min-h-app flex flex-col items-center justify-center p-4 sm:p-8 pt-safe overflow-hidden">
      <ObsidianCanvas mode="immersive" />

      <div className="lg:hidden mb-6 relative z-10">
        <HooshagarLogo size="sm" href="/" showWordmark />
      </div>

      <div className="relative z-10 w-full max-w-lg perspective-[1400px]">
        {/* Orb پس‌زمینه */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 opacity-40 scale-75 pointer-events-none hidden sm:block">
          <MeridianOrb showLogo={false} />
        </div>

        <motion.div
          className="obsidian-portal-frame relative"
          animate={reduce ? undefined : { rotateY: [0, 3, 0, -3, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="obsidian-portal-ring obsidian-portal-ring-outer" aria-hidden />
          <div className="obsidian-portal-ring obsidian-portal-ring-inner" aria-hidden />

          <div className="obsidian-slab obsidian-slab-gold p-6 sm:p-8 relative z-[2]">
            {children}
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground/50 mt-8">
          <Link href="/" className="hover:text-amber-400/80 transition-colors">
            بازگشت به منظومه
          </Link>
        </p>
      </div>
    </div>
  )
}
