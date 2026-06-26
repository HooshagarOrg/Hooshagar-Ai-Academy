'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarChatPanel } from './avatar-chat-panel'
import { HooshiarCharacter } from './hooshiar-character'

interface AvatarFabProps {
  className?: string
}

/**
 * دکمه شناور آواتار هوشیار — همه داشبوردها
 */
export function AvatarFab({ className }: AvatarFabProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed z-50 flex items-center gap-2',
          'bottom-[calc(5.5rem+var(--safe-bottom))] left-4',
          'sm:bottom-6 sm:left-6',
          'lg:bottom-8',
          'rounded-full pl-2 pr-4 py-2',
          'bg-gradient-to-l from-[#8B7CFF] to-[#54D2FF]',
          'text-white shadow-lg shadow-[#8B7CFF]/30',
          'border border-white/20',
          'motion-interactive hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CFF]',
          className
        )}
        aria-label="باز کردن هوشیار"
      >
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <HooshiarCharacter mood="idle" size="sm" className="h-8 w-8" />
          <Sparkles className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 text-[#FFD166]" />
        </span>
        <span className="text-sm font-semibold hidden sm:inline">هوشیار</span>
      </button>

      <AvatarChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
