'use client'

import { useEffect, useState } from 'react'
import { Menu, Flame } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { HooshiarOrb } from '@/components/lux/hooshiar-orb'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { PersianDateDisplay } from '@/components/ui/persian-date-display'
import { LUX_EASE } from '@/components/lux/lux-motion'

interface LuxStudentHeaderProps {
  userName: string
  onMenuToggle?: () => void
}

type XpPayload = {
  xp: number
  level: number
  current_streak: number
  xp_progress: { current: number; needed: number }
}

export function LuxStudentHeader({ userName, onMenuToggle }: LuxStudentHeaderProps) {
  const reduce = useReducedMotion()
  const [xpData, setXpData] = useState<XpPayload>({
    xp: 0,
    level: 1,
    current_streak: 0,
    xp_progress: { current: 0, needed: 100 },
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    fetch('/api/xp/balance')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setXpData(d)
      })
      .catch(() => {})
      .finally(() => setMounted(true))
  }, [])

  const pct =
    xpData.xp_progress.needed > 0
      ? Math.round((xpData.xp_progress.current / xpData.xp_progress.needed) * 100)
      : 0

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--lux-surface)] bg-[var(--lux-body)]/95 px-4 py-3 pt-safe backdrop-blur-md"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="touch-target lux-focus-ring rounded-xl p-2 text-[var(--lux-text-muted)] hover:bg-[var(--lux-surface)] hover:text-[var(--lux-text)] lg:hidden"
          aria-label="منو"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[var(--lux-text)]">{userName}</p>
          <div className="mt-1.5">
            <div className="mb-1 flex justify-between text-[10px] font-bold text-[var(--lux-text-muted)]">
              <span>سطح {xpData.level}</span>
              <span className="tabular-nums text-[var(--lux-gold)]">
                {xpData.xp_progress.current.toLocaleString('fa-IR')} /{' '}
                {xpData.xp_progress.needed.toLocaleString('fa-IR')} XP
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--lux-surface)]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--lux-gold)' }}
                initial={{ width: 0 }}
                animate={{ width: mounted ? `${pct}%` : 0 }}
                transition={{ duration: 0.64, ease: LUX_EASE }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <PersianDateDisplay variant="compact" className="hidden sm:inline-flex" />
          <ThemeToggle compact />
          <div className="flex items-center gap-1 rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/12 px-2.5 py-1.5">
            <Flame className="h-4 w-4 text-[#FF6B35]" />
            <span className="text-sm font-black tabular-nums text-[var(--lux-text)]">
              {xpData.current_streak.toLocaleString('fa-IR')}
            </span>
          </div>
          <HooshiarOrb size={48} />
        </div>
      </div>
    </header>
  )
}
