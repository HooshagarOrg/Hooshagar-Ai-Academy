'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { PersianDateDisplay } from '@/components/ui/persian-date-display'
import { getRoleExperienceLabel } from '@/lib/ui/role-tone'
import { getArcColor, getRoleLabel } from '@/lib/nav/config'
import { getPageTitleFromPath } from '@/lib/nav/page-title'

interface LuxRoleHeaderProps {
  userName: string
  role: string
  onMenuToggle?: () => void
}

export function LuxRoleHeader({ userName, role, onMenuToggle }: LuxRoleHeaderProps) {
  const pathname = usePathname()
  const arc = getArcColor(role)
  const experienceLabel = getRoleExperienceLabel(role)
  const pageTitle = getPageTitleFromPath(pathname)
  const isHome =
    pathname === '/admin' ||
    pathname === '/teacher' ||
    pathname === '/parent' ||
    pathname === '/student' ||
    pathname === '/counselor'

  return (
    <header
      className="sticky top-0 z-40 flex h-14 min-h-[3.5rem] items-center gap-3 border-b border-[var(--lux-border)] bg-[var(--lux-header-bg)] px-4 pt-safe backdrop-blur-md"
      dir="rtl"
    >
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden touch-target lux-focus-ring rounded-xl text-[var(--lux-text-muted)] transition-colors hover:bg-[var(--lux-surface)] hover:text-[var(--lux-text)]"
        aria-label="منو"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        <span
          className="hidden items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold sm:inline-flex"
          style={{
            color: arc,
            background: `color-mix(in srgb, ${arc} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${arc} 25%, transparent)`,
          }}
        >
          {getRoleLabel(role)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--lux-text)]">
            {pageTitle && !isHome ? pageTitle : experienceLabel}
          </p>
          {pageTitle && !isHome && (
            <p className="truncate text-[11px] text-[var(--lux-text-muted)]">{experienceLabel}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <PersianDateDisplay variant="compact" className="hidden md:inline-flex" />
        <ThemeToggle compact />
        <NotificationBell />
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ring-2 ring-white/10"
          style={{ background: `color-mix(in srgb, ${arc} 35%, #1a1f2e)` }}
          title={userName}
          aria-label={`پروفایل ${userName}`}
          role="img"
        >
          {userName.charAt(0)}
        </div>
      </div>
    </header>
  )
}
