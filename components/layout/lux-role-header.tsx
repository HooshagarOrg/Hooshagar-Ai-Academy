'use client'

import { Menu } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { getRoleExperienceLabel } from '@/lib/ui/role-tone'
import { getArcColor, getRoleLabel } from '@/lib/nav/config'

interface LuxRoleHeaderProps {
  userName: string
  role: string
  onMenuToggle?: () => void
}

export function LuxRoleHeader({ userName, role, onMenuToggle }: LuxRoleHeaderProps) {
  const arc = getArcColor(role)
  const title = getRoleExperienceLabel(role)

  return (
    <header
      className="sticky top-0 z-40 h-14 min-h-[3.5rem] flex items-center px-4 gap-3 pt-safe"
      style={{
        background: 'rgba(11,13,18,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(232,236,244,0.08)',
      }}
      dir="rtl"
    >
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden touch-target rounded-xl hover:bg-white/[0.06] text-[var(--lux-text-muted)] hover:text-[var(--lux-text)] transition-colors"
        aria-label="منو"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            color: arc,
            background: `color-mix(in srgb, ${arc} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${arc} 25%, transparent)`,
          }}
        >
          {getRoleLabel(role)}
        </span>
        <h1 className="text-sm font-bold text-[var(--lux-text)] truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-white/10"
          style={{ background: `color-mix(in srgb, ${arc} 35%, #1a1f2e)` }}
          title={userName}
        >
          {userName.charAt(0)}
        </div>
      </div>
    </header>
  )
}
