'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, Users, Brain, BarChart3, Settings, Zap, BookOpen, MessageSquare,
  Sliders, Target, Award, Shield, ArrowUpCircle, FileText, Calendar,
  Activity, ClipboardCheck, DollarSign, Mail, Search, AlertCircle,
  Wrench, Bell, Send, GraduationCap, Building, ChevronLeft, ChevronRight,
  Sparkles, Trophy, Compass, Gamepad2, Lightbulb, LogOut, User,
  Heart, PenTool, HelpCircle, Clock, TrendingUp, X, CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// ============================================
// تعریف منوهای هر نقش
// ============================================
type NavItem = {
  title: string
  href: string
  icon: React.ElementType
  badge?: string | number
  badgeColor?: string
}

type NavGroup = {
  title?: string
  items: NavItem[]
}

const navConfig: Record<string, NavGroup[]> = {
  admin: [
    {
      items: [
        { title: 'داشبورد', href: '/admin', icon: Home },
      ]
    },
    {
      title: 'مدیریت',
      items: [
        { title: 'مدارس', href: '/admin/schools', icon: GraduationCap },
        { title: 'کاربران', href: '/admin/users', icon: Users },
        { title: 'واردسازی گروهی', href: '/admin/bulk-import', icon: FileText },
        { title: 'انتقال دانش‌آموزان', href: '/admin/progression', icon: ArrowUpCircle },
      ]
    },
    {
      title: 'ثبت‌نام',
      items: [
        { title: 'قرعه‌کشی کلاس', href: '/admin/lottery', icon: GraduationCap },
        { title: 'ممیزی قرعه‌کشی', href: '/admin/lottery/audit', icon: Shield },
      ]
    },
    {
      title: 'هوش مصنوعی',
      items: [
        { title: 'مدل‌های AI', href: '/admin/ai-models', icon: Brain },
        { title: 'اعتبار AI', href: '/admin/ai-credits', icon: Zap },
        { title: 'محدودیت‌ها', href: '/admin/ai-limits', icon: Sliders },
        { title: 'کنترل دسترسی', href: '/admin/ai-access-control', icon: Shield },
        { title: 'مصرف AI', href: '/admin/ai-usage-dashboard', icon: BarChart3 },
        { title: 'تست AI', href: '/admin/ai-test', icon: HelpCircle },
      ]
    },
    {
      title: 'گزارش و ارتباط',
      items: [
        { title: 'گزارشات', href: '/admin/reports', icon: BarChart3 },
        { title: 'ارسال پیام گروهی', href: '/admin/broadcast', icon: Send },
        { title: 'نظرسنجی‌ها', href: '/admin/surveys', icon: MessageSquare },
        { title: 'هشدار زودهنگام', href: '/admin/early-warning', icon: AlertCircle },
      ]
    },
    {
      title: 'نظارت سیستم',
      items: [
        { title: 'گزارش تحلیلی', href: '/admin/analytics', icon: BarChart3 },
        { title: 'جریان داده', href: '/admin/data-flow', icon: Activity },
        { title: 'امنیت', href: '/admin/security', icon: Shield },
      ]
    },
    {
      title: 'تنظیمات',
      items: [
        { title: 'قابلیت‌ها', href: '/admin/features-management', icon: Sliders },
        { title: 'سال تحصیلی', href: '/admin/academic-years', icon: Calendar },
        { title: 'شهریه', href: '/admin/tuition-settings', icon: DollarSign },
        { title: 'پلن‌های اشتراک', href: '/admin/subscriptions', icon: CreditCard },
        { title: 'تنظیمات', href: '/admin/settings', icon: Settings },
      ]
    },
  ],
  teacher: [
    {
      items: [{ title: 'داشبورد', href: '/teacher', icon: Home }]
    },
    {
      title: 'کلاس درس',
      items: [
        { title: 'دانش‌آموزان', href: '/teacher/students', icon: Users },
        { title: 'حضور و غیاب', href: '/teacher/attendance', icon: ClipboardCheck },
        { title: 'نمرات', href: '/teacher/grades', icon: GraduationCap },
        { title: 'رفتار دانش‌آموزان', href: '/teacher/behavior', icon: Heart },
        { title: 'گزارش هفتگی', href: '/teacher/weekly-report', icon: FileText },
      ]
    },
    {
      title: 'آزمون و محتوا',
      items: [
        { title: 'آزمون‌ساز', href: '/teacher/exam-generator', icon: PenTool },
        { title: 'بانک سوال', href: '/teacher/question-bank', icon: BookOpen },
        { title: 'تولید محتوا (AI)', href: '/teacher/content-creator', icon: Sparkles },
        { title: 'سوالات شفاهی', href: '/teacher/oral-questions', icon: MessageSquare },
      ]
    },
    {
      title: 'ارتباط',
      items: [
        { title: 'پیام به والدین', href: '/teacher/parent-message', icon: Mail },
        { title: 'تحلیلگر هوشمند', href: '/teacher/analyzer', icon: Brain },
      ]
    },
  ],
  parent: [
    {
      items: [{ title: 'داشبورد', href: '/parent', icon: Home }]
    },
    {
      title: 'فرزندم',
      items: [
        { title: 'نمرات فرزند', href: '/parent/grades', icon: GraduationCap },
        { title: 'گزارشات', href: '/parent/reports', icon: BarChart3 },
        { title: 'حضور و غیاب', href: '/parent/attendance', icon: ClipboardCheck },
        { title: 'بهداشت', href: '/parent/health', icon: Heart },
        { title: 'مالی', href: '/parent/financials', icon: DollarSign },
      ]
    },
    {
      title: 'خدمات',
      items: [
        { title: 'مشاوره', href: '/parent/counseling', icon: HelpCircle },
        { title: 'ثبت‌نام کلاس', href: '/parent/class-registration', icon: GraduationCap },
        { title: 'نظرسنجی', href: '/parent/survey', icon: MessageSquare },
        { title: 'اعلانات', href: '/parent/notifications', icon: Bell },
      ]
    },
  ],
  student: [
    {
      items: [{ title: 'داشبورد', href: '/student', icon: Home }]
    },
    {
      title: 'یادگیری',
      items: [
        { title: 'نمراتم', href: '/student/grades', icon: GraduationCap },
        { title: 'آزمون‌هایم', href: '/student/exams', icon: ClipboardCheck },
        { title: 'دستیار مطالعه', href: '/student/study-buddy', icon: BookOpen },
        { title: 'حل مسئله (OCR)', href: '/student/problem-solver', icon: Lightbulb },
      ]
    },
    {
      title: 'آینده',
      items: [
        { title: 'انتخاب رشته', href: '/student/field-selection', icon: Target },
        { title: 'کنکور', href: '/student/konkur', icon: Award },
        { title: 'نقشه راه کنکور', href: '/student/konkur-roadmap', icon: Compass },
        { title: 'قطب‌نمای آینده', href: '/student/future-compass', icon: Compass },
      ]
    },
    {
      title: 'ثبت‌نام',
      items: [
        { title: 'ثبت‌نام کلاس', href: '/student/class-registration', icon: GraduationCap },
      ]
    },
    {
      title: 'سرگرمی',
      items: [
        { title: 'باغ استعداد', href: '/student/talent-garden', icon: Trophy },
        { title: 'زمین بازی', href: '/student/practice-playground', icon: Gamepad2 },
        { title: 'نشان‌هایم', href: '/student/badges', icon: Award },
        { title: 'فروشگاه', href: '/student/shop', icon: Zap },
      ]
    },
  ],
  counselor: [
    {
      items: [{ title: 'داشبورد', href: '/counselor', icon: Home }]
    },
    {
      title: 'مشاوره',
      items: [
        { title: 'دانش‌آموزان', href: '/counselor/records', icon: Users },
        { title: 'پرونده جدید', href: '/counselor/records/new', icon: FileText },
        { title: 'گزارش‌ها', href: '/counselor/reports', icon: BarChart3 },
        { title: 'بینش خانواده', href: '/counselor/family-insight', icon: Heart },
      ]
    },
  ],
  financial_vp: [
    {
      items: [{ title: 'داشبورد', href: '/financial-vp', icon: Home }]
    },
    {
      title: 'مالی',
      items: [
        { title: 'پرداخت‌ها', href: '/financial-vp/payments', icon: DollarSign },
        { title: 'ارسال SMS', href: '/financial-vp/sms', icon: MessageSquare },
        { title: 'بدهکاران', href: '/financial-vp/reports/debtors', icon: AlertCircle },
        { title: 'گزارش درآمد', href: '/financial-vp/reports/income', icon: TrendingUp },
      ]
    },
  ],
}

// نقش‌هایی که navConfig خاص ندارند
const simpleNavs: Record<string, NavItem[]> = {
  principal: [
    { title: 'داشبورد', href: '/principal', icon: Home },
    { title: 'مدیریت مدرسه', href: '/principal/overview', icon: Building },
  ],
  educational_vp: [
    { title: 'داشبورد', href: '/educational-vp', icon: Home },
    { title: 'برنامه‌ریزی', href: '/educational-vp/planning', icon: Calendar },
    { title: 'فعالیت‌ها', href: '/educational-vp/activities', icon: Activity },
  ],
  disciplinary_vp: [
    { title: 'داشبورد', href: '/discipline-vp', icon: Home },
    { title: 'حضور و غیاب', href: '/discipline-vp/attendance', icon: ClipboardCheck },
    { title: 'گزارش‌های انضباطی', href: '/discipline-vp/reports', icon: Shield },
  ],
  evaluation_vp: [
    { title: 'داشبورد', href: '/evaluation-vp', icon: Home },
    { title: 'ارزیابی معلمان', href: '/evaluation-vp/teacher-evaluation', icon: Award },
    { title: 'آمار', href: '/evaluation-vp/stats', icon: BarChart3 },
  ],
  health_vp: [
    { title: 'داشبورد', href: '/health-vp', icon: Home },
    { title: 'پرونده‌ها', href: '/health-vp/students', icon: Users },
    { title: 'گزارش‌ها', href: '/health-vp/reports', icon: FileText },
  ],
  art_teacher: [
    { title: 'داشبورد', href: '/art-teacher', icon: Home },
    { title: 'گزارشات هنری', href: '/art-teacher/art-reports', icon: FileText },
  ],
  sports_teacher: [
    { title: 'داشبورد', href: '/sports-teacher', icon: Home },
    { title: 'گزارشات ورزشی', href: '/sports-teacher/sports-reports', icon: FileText },
  ],
  secretary: [
    { title: 'داشبورد', href: '/secretary', icon: Home },
    { title: 'مکاتبات', href: '/secretary/correspondence', icon: Mail },
    { title: 'جلسات', href: '/secretary/meetings', icon: Calendar },
  ],
  librarian: [
    { title: 'داشبورد', href: '/librarian', icon: Home },
    { title: 'امانت کتاب', href: '/librarian/lending', icon: BookOpen },
    { title: 'جستجو', href: '/librarian/search', icon: Search },
  ],
  security: [
    { title: 'داشبورد', href: '/security', icon: Home },
    { title: 'ورود و خروج', href: '/security/entry-exit', icon: Users },
    { title: 'رخدادها', href: '/security/incidents', icon: AlertCircle },
  ],
  maintenance: [
    { title: 'داشبورد', href: '/maintenance', icon: Home },
    { title: 'درخواست تعمیر', href: '/maintenance/requests', icon: Wrench },
    { title: 'برنامه', href: '/maintenance/schedule', icon: Calendar },
  ],
}

// مسیرهای مشترک برای همه
const commonItems: NavItem[] = [
  { title: 'پیام‌ها', href: '/messages', icon: MessageSquare },
  { title: 'اعلانات', href: '/notifications', icon: Bell },
]

// ============================================
// Props
// ============================================
interface AppSidebarProps {
  role: string
  userName: string
  schoolName?: string
  avatarUrl?: string
  collapsed?: boolean
  onCollapse?: (v: boolean) => void
}

// ============================================
// کامپوننت اصلی
// ============================================
export function AppSidebar({
  role,
  userName,
  schoolName,
  avatarUrl,
  collapsed = false,
  onCollapse,
}: AppSidebarProps) {
  const pathname = usePathname()

  const groups: NavGroup[] = navConfig[role] || [
    { items: (simpleNavs[role] || [{ title: 'داشبورد', href: '/dashboard', icon: Home }]) }
  ]

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && href !== '/dashboard' && pathname.startsWith(href + '/'))

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'flex flex-col h-full bg-white border-l border-gray-100 shadow-sm transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64'
        )}
        dir="rtl"
      >
        {/* ===== لوگو و هدر ===== */}
        <div className={cn(
          'flex items-center border-b border-gray-100 transition-all',
          collapsed ? 'justify-center p-4' : 'justify-between px-4 py-4'
        )}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white text-sm font-bold">ه</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm">هوشاگر</span>
                {schoolName && (
                  <p className="text-xs text-gray-400 leading-tight truncate max-w-[120px]">{schoolName}</p>
                )}
              </div>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">ه</span>
              </div>
            </Link>
          )}
          {onCollapse && (
            <button
              onClick={() => onCollapse(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {collapsed
                ? <ChevronLeft className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />
              }
            </button>
          )}
        </div>

        {/* ===== پروفایل کاربر ===== */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  userName.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                <p className="text-xs text-gray-400">{getRoleLabel(role)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== منوی ناوبری ===== */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
              {!collapsed && group.title && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5 mb-0.5">
                  {group.title}
                </p>
              )}
              {collapsed && group.title && gi > 0 && (
                <div className="h-px bg-gray-100 mx-2 my-2" />
              )}
              {group.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return collapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all',
                          active
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        )}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group',
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    )}
                  >
                    <Icon className={cn(
                      'w-4 h-4 flex-shrink-0 transition-transform',
                      active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600',
                    )} />
                    <span className="font-medium truncate">{item.title}</span>
                    {item.badge !== undefined && (
                      <Badge
                        className={cn(
                          'mr-auto text-[10px] px-1.5 py-0 min-w-[18px] h-[18px]',
                          item.badgeColor || 'bg-red-500 text-white'
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* مسیرهای مشترک */}
          <div className="mt-3">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                عمومی
              </p>
            )}
            {collapsed && <div className="h-px bg-gray-100 mx-2 my-2" />}
            {commonItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href} className={cn(
                      'flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all',
                      active ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                    )}>
                      <Icon className="w-4.5 h-4.5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">{item.title}</TooltipContent>
                </Tooltip>
              ) : (
                <Link key={item.href} href={item.href} className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group',
                  active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                )}>
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-gray-400')} />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* ===== تنظیمات و خروج ===== */}
        <div className="border-t border-gray-100 p-2 space-y-0.5">
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/settings" className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-gray-400 hover:bg-gray-100 transition-all">
                    <Settings className="w-4.5 h-4.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">تنظیمات</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { window.location.href = '/api/auth/logout' }}
                    className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-red-400 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">خروج</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-all group">
                <Settings className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                <span className="font-medium">تنظیمات</span>
              </Link>
              <button
                onClick={() => { window.location.href = '/api/auth/logout' }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all group"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">خروج از حساب</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

// ============================================
// helper: برچسب فارسی نقش
// ============================================
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'مدیر پلتفرم',
    platform_admin: 'ادمین کل',
    principal: 'مدیر مدرسه',
    teacher: 'معلم',
    parent: 'والد',
    student: 'دانش‌آموز',
    counselor: 'مشاور',
    health_vp: 'معاون بهداشت',
    educational_vp: 'معاون پرورشی',
    financial_vp: 'معاون مالی',
    disciplinary_vp: 'معاون انضباطی',
    evaluation_vp: 'معاون ارزیابی',
    art_teacher: 'معلم هنر',
    sports_teacher: 'معلم ورزش',
    secretary: 'منشی',
    librarian: 'کتابدار',
    security: 'نگهبان',
    maintenance: 'تأسیسات',
  }
  return labels[role] || 'کاربر'
}
