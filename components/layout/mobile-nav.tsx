'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UiTone } from '@/lib/ui/role-tone'
import {
  Home,
  Users,
  Brain,
  BarChart3,
  Bell,
  BookOpen,
  Trophy,
  Target,
  MessageSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type MobileNavItem = { title: string; href: string; icon: LucideIcon }

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
    { title: 'کلاس', href: '/teacher/students', icon: Users },
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
    { title: 'یادگیری', href: '/student/study-buddy', icon: BookOpen },
    { title: 'استعداد', href: '/student/talent-garden', icon: Trophy },
    { title: 'آینده', href: '/student/field-selection', icon: Target },
    { title: 'اعلان', href: '/notifications', icon: Bell },
  ],
}

interface MobileNavProps {
  role: string
  tone?: UiTone
}

export function MobileNav({ role, tone = 'balanced' }: MobileNavProps) {
  const pathname = usePathname()
  const items = mobileNavs[role] || mobileNavs.admin
  const activeAccent =
    tone === 'calm'
      ? 'text-brand-cyan'
      : tone === 'vivid'
        ? 'text-brand-pink'
        : 'text-brand-purple'
  const activeBg =
    tone === 'calm'
      ? 'bg-brand-cyan/12'
      : tone === 'vivid'
        ? 'bg-brand-pink/12'
        : 'bg-brand-purple/12'

  return (
    <nav
      className="lg:hidden fixed bottom-0 right-0 left-0 z-50 pt-1 pb-safe px-safe motion-interactive"
      dir="rtl"
      aria-label="ناوبری اصلی"
    >
      <div className="glass-panel-quiet flex items-center justify-around h-16 min-h-[4rem] px-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 flex-1 py-1 rounded-xl motion-interactive cursor-pointer focus-ring min-h-[3rem]',
                active ? activeAccent : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <div
                className={cn(
                  'touch-target w-11 h-11 rounded-xl flex items-center justify-center motion-interactive',
                  active && activeBg,
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn('text-[10px] font-medium', active && activeAccent)}>
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
