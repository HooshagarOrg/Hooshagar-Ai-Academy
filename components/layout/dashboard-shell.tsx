'use client'

import { useState, useEffect } from 'react'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { MobileNav } from './mobile-nav'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  role: string
  userName: string
  schoolName?: string
  children: React.ReactNode
}

export function DashboardShell({ role, userName, schoolName, children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // بستن sidebar موبایل با کلیک خارج
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir="rtl">

      {/* ===== Overlay موبایل ===== */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ===== Sidebar دسکتاپ ===== */}
      <div className="hidden lg:flex flex-col h-full flex-shrink-0">
        <AppSidebar
          role={role}
          userName={userName}
          schoolName={schoolName}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      {/* ===== Sidebar موبایل (drawer) ===== */}
      <div
        data-sidebar
        className={cn(
          'lg:hidden fixed top-0 right-0 h-full z-50 transition-transform duration-300 ease-in-out',
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <AppSidebar
          role={role}
          userName={userName}
          schoolName={schoolName}
          collapsed={false}
          onCollapse={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* ===== محتوای اصلی ===== */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <AppHeader
          userName={userName}
          role={role}
          onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* محتوا */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Bottom Nav موبایل */}
        <MobileNav role={role} />
      </div>
    </div>
  )
}
