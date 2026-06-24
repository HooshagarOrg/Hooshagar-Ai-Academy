'use client'

import { useState, useEffect } from 'react'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { MobileNav } from './mobile-nav'
import { DashboardFrame } from '@/components/motion/dashboard-frame'
import { ChromaticCanvas } from '@/components/ui/chromatic-canvas'
import { getUiTone } from '@/lib/ui/role-tone'
import { cn } from '@/lib/utils'
import { AvatarFab } from '@/components/avatar/avatar-fab'

interface DashboardShellProps {
  role: string
  userName: string
  schoolName?: string
  children: React.ReactNode
}

export function DashboardShell({ role, userName, schoolName, children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const tone = getUiTone(role)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (mobileSidebarOpen && !target.closest('[data-sidebar]')) {
        setMobileSidebarOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileSidebarOpen])

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileSidebarOpen])

  return (
    <div
      className="relative flex h-app overflow-hidden"
      dir="rtl"
      data-ui-tone={tone}
      data-role={role}
    >
      <ChromaticCanvas mode="static" />

      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm motion-overlay motion-interactive"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="hidden lg:flex flex-col h-full flex-shrink-0 z-20">
        <AppSidebar
          role={role}
          tone={tone}
          userName={userName}
          schoolName={schoolName}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      <div
        data-sidebar
        className={cn(
          'lg:hidden fixed top-0 right-0 h-app z-50 motion-drawer will-change-transform',
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <AppSidebar
          role={role}
          tone={tone}
          userName={userName}
          schoolName={schoolName}
          collapsed={false}
          onCollapse={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden z-10">
        <AppHeader
          userName={userName}
          role={role}
          tone={tone}
          onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain lg:pb-0 pb-[calc(4.75rem+var(--safe-bottom))]">
          <div className="ui-canvas min-h-full" data-ui-tone={tone}>
            <div className="p-4 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full px-safe premium-content premium-legacy-bridge">
              <DashboardFrame>{children}</DashboardFrame>
            </div>
          </div>
        </main>

        <MobileNav role={role} tone={tone} />

        <AvatarFab />
      </div>
    </div>
  )
}
