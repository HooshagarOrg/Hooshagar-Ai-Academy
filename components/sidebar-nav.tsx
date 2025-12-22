'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Users,
  GraduationCap,
  BarChart3,
  Settings,
  Zap,
  Brain,
  BookOpen,
  MessageSquare,
  Sliders,
} from 'lucide-react'

// آیتم‌های منوی admin
const adminNavItems = [
  {
    title: 'داشبورد',
    href: '/admin',
    icon: Home,
  },
  {
    title: 'مدیریت مدارس',
    href: '/admin/schools',
    icon: GraduationCap,
  },
  {
    title: 'مدیریت کاربران',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'قرعه‌کشی کلاس',
    href: '/admin/lottery',
    icon: GraduationCap,
  },
  {
    title: 'انتقال دانش‌آموزان',
    href: '/admin/progression',
    icon: Users,
  },
  {
    title: 'مدیریت اعتبار AI',
    href: '/admin/ai-credits',
    icon: Zap,
  },
  {
    title: 'مدیریت قابلیت‌ها',
    href: '/admin/features-management',
    icon: Sliders,
  },
  {
    title: 'گزارشات',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    title: 'تنظیمات',
    href: '/admin/settings',
    icon: Settings,
  },
]

// آیتم‌های منوی معلم
const teacherNavItems = [
  {
    title: 'داشبورد',
    href: '/teacher',
    icon: Home,
  },
  {
    title: 'دانش‌آموزان',
    href: '/teacher/students',
    icon: Users,
  },
  {
    title: 'تحلیلگر هوشمند',
    href: '/teacher/analyzer',
    icon: Brain,
  },
  {
    title: 'گزارشات',
    href: '/teacher/reports',
    icon: BarChart3,
  },
]

// آیتم‌های منوی والد
const parentNavItems = [
  {
    title: 'داشبورد',
    href: '/parent',
    icon: Home,
  },
  {
    title: 'فرزندان من',
    href: '/parent/children',
    icon: Users,
  },
  {
    title: 'گزارشات',
    href: '/parent/reports',
    icon: BarChart3,
  },
]

// آیتم‌های منوی دانش‌آموز
const studentNavItems = [
  {
    title: 'داشبورد',
    href: '/student',
    icon: Home,
  },
  {
    title: 'باغ استعداد',
    href: '/student/talent-garden',
    icon: GraduationCap,
  },
  {
    title: 'دستیار مطالعه',
    href: '/student/study-buddy',
    icon: BookOpen,
  },
  {
    title: 'حل‌کننده سوال',
    href: '/student/problem-solver',
    icon: MessageSquare,
  },
]

interface SidebarNavProps {
  role: 'admin' | 'teacher' | 'parent' | 'student'
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()

  const navItems = {
    admin: adminNavItems,
    teacher: teacherNavItems,
    parent: parentNavItems,
    student: studentNavItems,
  }[role]

  return (
    <nav className="space-y-1" dir="rtl">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export { adminNavItems, teacherNavItems, parentNavItems, studentNavItems }

