'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Menu, Search, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/NotificationBell'

interface BreadcrumbItem {
  title: string
  href?: string
}

interface AppHeaderProps {
  userName: string
  role: string
  onMenuToggle?: () => void
  breadcrumbs?: BreadcrumbItem[]
}

const roleTitles: Record<string, string> = {
  admin: 'پنل مدیریت',
  platform_admin: 'پنل ادمین کل',
  principal: 'پنل مدیر مدرسه',
  teacher: 'پنل معلم',
  parent: 'پنل والدین',
  student: 'پنل دانش‌آموز',
  counselor: 'پنل مشاور',
  financial_vp: 'پنل معاون مالی',
  educational_vp: 'پنل معاون پرورشی',
  disciplinary_vp: 'پنل معاون انضباطی',
  health_vp: 'پنل معاون بهداشت',
}

export function AppHeader({ userName, role, onMenuToggle, breadcrumbs }: AppHeaderProps) {
  const pathname = usePathname()
  const pageTitle = roleTitles[role] || 'هوشاگر'

  return (
    <header
      className="sticky top-0 z-40 h-14 border-b border-gray-100 bg-white/95 backdrop-blur-sm flex items-center px-4 gap-3"
      dir="rtl"
    >
      {/* دکمه منو موبایل */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* عنوان صفحه / Breadcrumb */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronLeft className="w-3.5 h-3.5 text-gray-300" />}
                {crumb.href && i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 transition-colors truncate">
                    {crumb.title}
                  </Link>
                ) : (
                  <span className={cn(
                    'font-medium truncate',
                    i === breadcrumbs.length - 1 ? 'text-gray-800' : 'text-gray-400'
                  )}>
                    {crumb.title}
                  </span>
                )}
              </div>
            ))}
          </nav>
        ) : (
          <h1 className="text-sm font-semibold text-gray-700 truncate">{pageTitle}</h1>
        )}
      </div>

      {/* سمت چپ: جستجو + اعلانات */}
      <div className="flex items-center gap-1.5">
        {/* دکمه جستجو */}
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors hidden sm:flex">
          <Search className="w-4 h-4" />
        </button>

        {/* اعلانات */}
        <NotificationBell />

        {/* آواتار کاربر */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
          {userName.charAt(0)}
        </div>
      </div>
    </header>
  )
}
