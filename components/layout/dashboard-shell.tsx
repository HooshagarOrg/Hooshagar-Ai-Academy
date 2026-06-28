'use client'

import { useState, useEffect } from 'react'
import { LuxNav, LuxMobileNav } from './lux-nav'
import { LuxRoleHeader } from './lux-role-header'
import { LuxStudentHeader } from '@/components/lux/lux-student-header'
import { DashboardFrame } from '@/components/motion/dashboard-frame'
import { ChromaticCanvas } from '@/components/ui/chromatic-canvas'
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
  const isStudent = role === 'student'

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
    return () => { document.body.style.overflow = '' }
  }, [mobileSidebarOpen])

  return (
    <div
      className="relative flex h-app overflow-hidden"
      dir="rtl"
      data-role={role}
    >
      <ChromaticCanvas mode="static" variant={isStudent ? 'dark' : 'light'} />

      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="hidden lg:flex flex-col h-full flex-shrink-0 z-20">
        <LuxNav
          role={role}
          userName={userName}
          schoolName={schoolName}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      <div
        data-sidebar
        className={cn(
          'lg:hidden fixed top-0 right-0 h-app z-50 transition-transform duration-300 will-change-transform',
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <LuxNav
          role={role}
          userName={userName}
          schoolName={schoolName}
          collapsed={false}
          onCollapse={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden z-10">
        {isStudent ? (
          <LuxStudentHeader
            userName={userName}
            onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          />
        ) : (
          <LuxRoleHeader
            userName={userName}
            role={role}
            onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          />
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain lg:pb-0 pb-[calc(4.75rem+var(--safe-bottom))]">
          <div
            className={cn(
              'ui-canvas min-h-full',
              isStudent && 'lux-student-canvas',
            )}
            data-role={role}
          >
            <div className="p-4 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full px-safe premium-content">
              <DashboardFrame>{children}</DashboardFrame>
            </div>
          </div>
        </main>

        <LuxMobileNav role={role} />
        <AvatarFab />
      </div>
    </div>
  )
}
