'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { HooshiarCharacter, type HooshiarMood } from '@/components/avatar/hooshiar-character'
import { AvatarChatPanel } from '@/components/avatar/avatar-chat-panel'

interface HooshiarOrbProps {
  size?: number
  mood?: HooshiarMood
  className?: string
  showChatOnClick?: boolean
}

export function HooshiarOrb({
  size = 48,
  mood = 'idle',
  className,
  showChatOnClick = true,
}: HooshiarOrbProps) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.button
        type="button"
        onClick={() => showChatOnClick && setOpen(true)}
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'border border-[var(--lux-primary)]/30 bg-[var(--lux-glass)]',
          'shadow-[0_0_24px_rgba(139,124,255,0.25)]',
          className,
        )}
        style={{ width: size, height: size }}
        aria-label="باز کردن هوشیار"
        animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <HooshiarCharacter mood={mood} size="sm" className="h-9 w-9" />
      </motion.button>
      {showChatOnClick && <AvatarChatPanel open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
