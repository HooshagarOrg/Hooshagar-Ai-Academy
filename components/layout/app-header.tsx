'use client'

import Link from 'next/link'
import { Menu, Search, ChevronLeft, Sparkles, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/NotificationBell'
import type { UiTone } from '@/lib/ui/role-tone'
import { getRoleExperienceLabel } from '@/lib/ui/role-tone'

interface BreadcrumbItem {
  title: string
  href?: string
}

interface AppHeaderProps {
  userName: string
  role: string
  tone?: UiTone
  onMenuToggle?: () => void
  breadcrumbs?: BreadcrumbItem[]
}

export function AppHeader({
  userName,
  role,
  tone = 'balanced',
  onMenuToggle,
  breadcrumbs,
}: AppHeaderProps) {
  const pageTitle = getRoleExperienceLabel(role)

  return (
    <header
      className="sticky top-0 z-40 h-14 min-h-[3.5rem] border-b border-white/[0.06] bg-card/75 backdrop-blur-xl flex items-center px-4 gap-3 pt-safe motion-interactive"
      dir="rtl"
    >
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden touch-target rounded-xl hover:bg-white/[0.06] text-muted-foreground hover:text-foreground motion-interactive focus-ring"
        aria-label="منو"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        {tone === 'vivid' && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-pink/12 border border-brand-pink/20 text-[10px] text-brand-pink font-medium">
            <Sparkles className="w-3 h-3" />
            AI Companion
          </span>
        )}
        {tone === 'calm' && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-[10px] text-brand-cyan font-medium">
            <Shield className="w-3 h-3" />
            کنترل مرکزی
          </span>
        )}
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1 text-sm" aria-label="مسیر">
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/50" />}
                {crumb.href && i < breadcrumbs.length - 1 ? (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {crumb.title}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'font-medium truncate',
                      i === breadcrumbs.length - 1 ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {crumb.title}
                  </span>
                )}
              </div>
            ))}
          </nav>
        ) : (
          <h1 className="text-sm font-semibold text-foreground truncate">{pageTitle}</h1>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="p-2 rounded-xl hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors hidden sm:flex cursor-pointer focus-ring"
          aria-label="جستجو"
        >
          <Search className="w-4 h-4" />
        </button>

        <NotificationBell />

        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-white/10',
            tone === 'calm' && 'bg-gradient-to-br from-brand-cyan to-brand-purple',
            tone === 'vivid' && 'bg-gradient-to-br from-brand-pink to-brand-orange',
            tone === 'balanced' && 'bg-gradient-to-br from-brand-purple to-brand-cyan',
          )}
          title={userName}
        >
          {userName.charAt(0)}
        </div>
      </div>
    </header>
  )
}
