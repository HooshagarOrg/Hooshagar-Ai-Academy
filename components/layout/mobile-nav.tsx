'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, Users, Brain, BarChart3, Bell, BookOpen,
  Trophy, Target, MessageSquare, Settings,
} from 'lucide-react'

type MobileNavItem = { title: string; href: string; icon: React.ElementType }

const mobileNavs: Record<string, MobileNavItem[]> = {
  admin: [
    { title: 'خانه', href: '/admin', icon: Home },
    { title: 'کاربران', href: '/admin/users', icon: Users },
    { title: 'AI', href: '/admin/ai-models', icon: Brain },
    { title: 'گزارش', href: '/admin/reports', icon: BarChart3 },
    { title: 'اعلان', href: '/notifications', icon: Bell },
  ],
  teacher: [
    { title: 'خانه', href: '/teacher', icon: Home },
    { title: 'دانش‌آموزان', href: '/teacher/students', icon: Users },
    { title: 'آزمون', href: '/teacher/exam-generator', icon: Brain },
    { title: 'پیام', href: '/messages', icon: MessageSquare },
    { title: 'اعلان', href: '/notifications', icon: Bell },
  ],
  parent: [
    { title: 'خانه', href: '/parent', icon: Home },
    { title: 'گزارش', href: '/parent/reports', icon: BarChart3 },
    { title: 'حضور', href: '/parent/attendance', icon: BookOpen },
    { title: 'پیام', href: '/messages', icon: MessageSquare },
    { title: 'اعلان', href: '/notifications', icon: Bell },
  ],
  student: [
    { title: 'خانه', href: '/student', icon: Home },
    { title: 'درس', href: '/student/study-buddy', icon: BookOpen },
    { title: 'امتیاز', href: '/student/talent-garden', icon: Trophy },
    { title: 'آینده', href: '/student/field-selection', icon: Target },
    { title: 'اعلان', href: '/notifications', icon: Bell },
  ],
}

interface MobileNavProps {
  role: string
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname()
  const items = mobileNavs[role] || mobileNavs.admin

  return (
    <nav
      className="lg:hidden fixed bottom-0 right-0 left-0 z-50 bg-white border-t border-gray-100 shadow-lg"
      dir="rtl"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 flex-1 py-1 px-2 rounded-xl transition-all',
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                active ? 'bg-blue-50' : ''
              )}>
                <Icon className={cn('w-5 h-5', active ? 'text-blue-600' : '')} />
              </div>
              <span className={cn('text-[10px] font-medium', active ? 'text-blue-600' : '')}>
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
