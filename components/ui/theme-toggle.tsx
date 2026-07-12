'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemePreference } from '@/hooks/use-theme-preference'

interface ThemeToggleProps {
  className?: string
  compact?: boolean
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, setTheme, saving } = useThemePreference()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn('h-9 w-[4.5rem] rounded-xl', className)} aria-hidden />
  }

  const isLight = theme === 'light'

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border p-0.5',
        'border-[var(--lux-border)] bg-[var(--lux-surface-strong)]',
        className,
      )}
      role="group"
      aria-label="انتخاب تم"
    >
      <button
        type="button"
        disabled={saving}
        onClick={() => setTheme('light')}
        className={cn(
          'lux-focus-ring flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors min-h-[36px]',
          isLight
            ? 'bg-[var(--lux-card)] text-[var(--lux-text)] shadow-sm'
            : 'text-[var(--lux-text-muted)] hover:text-[var(--lux-text)]',
        )}
        aria-pressed={isLight}
        aria-label="تم روشن"
      >
        <Sun className="h-3.5 w-3.5" />
        {!compact && <span>روشن</span>}
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => setTheme('dark')}
        className={cn(
          'lux-focus-ring flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors min-h-[36px]',
          !isLight
            ? 'bg-[var(--lux-card)] text-[var(--lux-text)] shadow-sm'
            : 'text-[var(--lux-text-muted)] hover:text-[var(--lux-text)]',
        )}
        aria-pressed={!isLight}
        aria-label="تم تیره"
      >
        <Moon className="h-3.5 w-3.5" />
        {!compact && <span>تیره</span>}
      </button>
    </div>
  )
}
