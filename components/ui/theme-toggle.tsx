'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Sunrise } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemePreference } from '@/hooks/use-theme-preference'
import { UI_THEMES, UI_THEME_LABELS, type UiTheme } from '@/lib/theme/constants'

interface ThemeToggleProps {
  className?: string
  compact?: boolean
}

const THEME_ICONS: Record<UiTheme, typeof Sun> = {
  light: Sun,
  warm: Sunrise,
  dark: Moon,
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, setTheme, saving } = useThemePreference()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn('h-9 w-[9.5rem] rounded-xl', className)} aria-hidden />
  }

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
      {UI_THEMES.map((id) => {
        const Icon = THEME_ICONS[id]
        const active = theme === id
        return (
          <button
            key={id}
            type="button"
            disabled={saving}
            onClick={() => setTheme(id)}
            className={cn(
              'lux-focus-ring flex items-center gap-1 rounded-lg text-xs font-bold transition-colors min-h-[36px]',
              compact ? 'px-1.5 py-1.5' : 'px-2 py-1.5',
              active
                ? 'bg-[var(--lux-card)] text-[var(--lux-text)] shadow-sm'
                : 'text-[var(--lux-text-muted)] hover:text-[var(--lux-text)]',
            )}
            aria-pressed={active}
            aria-label={`تم ${UI_THEME_LABELS[id]}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {!compact && <span>{UI_THEME_LABELS[id]}</span>}
          </button>
        )
      })}
    </div>
  )
}
