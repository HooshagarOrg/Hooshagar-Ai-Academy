'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import PersianDate from '@/components/PersianDate'
import { SidebarNav } from '@/components/sidebar-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'teacher' | 'parent' | 'student' | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // دریافت اطلاعات کاربر
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setRole(data.user.role)
          setUserName(data.user.full_name || data.user.email)
        } else {
          router.push('/login')
        }
      })
      .catch(() => {
        router.push('/login')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!role) {
    return null
  }

  // صفحات بدون sidebar (full page)
  const isFullPage = typeof window !== 'undefined' && (
    window.location.pathname === '/student' ||
    window.location.pathname === '/admin' ||
    window.location.pathname === '/teacher' ||
    window.location.pathname === '/parent' ||
    window.location.pathname === '/principal'
  )

  if (isFullPage) {
    return <>{children}</>
  }

  // اگر role هنوز تعیین نشده، loading نشان بده
  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <PersianDate className="text-gray-700" showIcon={true} />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-700">{userName}</div>
            <div className="text-xs text-gray-500">سیستم هوشاگر</div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-[57px] right-0 h-[calc(100vh-57px)] w-64 bg-white border-l border-gray-200 overflow-y-auto transition-transform duration-300 z-40 ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4">
            <SidebarNav role={role} />
          </div>
        </aside>

        {/* Overlay برای موبایل */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}


