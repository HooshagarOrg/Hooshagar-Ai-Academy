'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GripVertical, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarChatPanel } from './avatar-chat-panel'
import { HooshiarCharacter } from './hooshiar-character'

type FabCorner = 'bl' | 'br' | 'tl' | 'tr'

const STORAGE_KEY = 'hooshiar-fab-corner'

const CORNER_CLASS: Record<FabCorner, string> = {
  bl: 'bottom-[calc(5.5rem+var(--safe-bottom))] left-3 sm:left-6 sm:bottom-6',
  br: 'bottom-[calc(5.5rem+var(--safe-bottom))] right-3 sm:right-6 sm:bottom-6',
  tl: 'top-[calc(4.25rem+var(--safe-top))] left-3 sm:left-6',
  tr: 'top-[calc(4.25rem+var(--safe-top))] right-3 sm:right-6',
}

const CORNER_CYCLE: FabCorner[] = ['br', 'bl', 'tr', 'tl']

function readStoredCorner(fallback: FabCorner): FabCorner {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'bl' || raw === 'br' || raw === 'tl' || raw === 'tr') return raw
  } catch {
    /* ignore */
  }
  return fallback
}

interface AvatarFabProps {
  className?: string
  /** گوشه پیش‌فرض وقتی کاربر هنوز جابجا نکرده */
  defaultCorner?: FabCorner
}

/**
 * دکمه شناور آواتار هوشیار — قابل جابجایی بین چهار گوشه
 */
export function AvatarFab({ className, defaultCorner = 'br' }: AvatarFabProps) {
  const [open, setOpen] = useState(false)
  const [corner, setCorner] = useState<FabCorner>(defaultCorner)
  const [mounted, setMounted] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const movedCorner = useRef(false)

  useEffect(() => {
    setCorner(readStoredCorner(defaultCorner))
    setMounted(true)
  }, [defaultCorner])

  const persistCorner = useCallback((next: FabCorner) => {
    setCorner(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const cycleCorner = useCallback(() => {
    const idx = CORNER_CYCLE.indexOf(corner)
    const next = CORNER_CYCLE[(idx + 1) % CORNER_CYCLE.length]
    persistCorner(next)
  }, [corner, persistCorner])

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const onPointerDown = () => {
    movedCorner.current = false
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      movedCorner.current = true
      cycleCorner()
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(12)
      }
    }, 480)
  }

  const onPointerUp = () => {
    clearLongPress()
  }

  const onClick = () => {
    if (movedCorner.current) {
      movedCorner.current = false
      return
    }
    setOpen(true)
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      <div className={cn('fixed z-50', CORNER_CLASS[corner], className)}>
        <button
          type="button"
          onClick={onClick}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
          className={cn(
            'flex items-center gap-2',
            'rounded-full pl-2 pr-3 py-2',
            'bg-gradient-to-l from-[#8B7CFF] to-[#54D2FF]',
            'text-white shadow-lg shadow-[#8B7CFF]/30',
            'border border-white/20',
            'motion-interactive hover:scale-105 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CFF]',
            'touch-manipulation select-none',
          )}
          aria-label="باز کردن هوشیار — نگه‌داشتن برای جابجایی"
          title="برای جابجایی دکمه را نگه دارید"
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <HooshiarCharacter mood="idle" size="sm" className="h-8 w-8" />
            <Sparkles className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 text-[#FFD166]" />
          </span>
          <span className="text-sm font-semibold hidden sm:inline">هوشیار</span>
          <GripVertical className="h-3.5 w-3.5 opacity-70 sm:hidden" aria-hidden />
        </button>
      </div>

      <AvatarChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
