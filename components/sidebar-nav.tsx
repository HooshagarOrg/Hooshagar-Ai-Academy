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
  Target,
  Award,
  Shield,
  ArrowUpCircle,
  Building,
  FileText,
  Calendar,
  Activity,
  ClipboardCheck,
  DollarSign,
  Mail,
  Search,
  AlertCircle,
  Wrench,
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
    icon: ArrowUpCircle,
  },
  {
    title: 'ممیزی قرعه‌کشی',
    href: '/admin/lottery/audit',
    icon: Shield,
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
    title: 'قطب‌نمای آینده',
    href: '/student/ai-guidance',
    icon: Brain,
  },
  {
    title: 'انتخاب رشته',
    href: '/student/field-selection',
    icon: Target,
  },
  {
    title: 'برنامه‌ریزی کنکور',
    href: '/student/konkur',
    icon: Award,
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

const principalNavItems = [
  { title: 'داشبورد', href: '/principal', icon: Home },
  { title: 'مدیریت مدرسه', href: '/principal/overview', icon: Building },
]

const counselorNavItems = [
  { title: 'داشبورد', href: '/counselor', icon: Home },
  { title: 'لیست دانش‌آموزان', href: '/counselor/students', icon: Users },
  { title: 'گزارش‌ها', href: '/counselor/reports', icon: FileText },
]

const educationalVpNavItems = [
  { title: 'داشبورد', href: '/educational-vp', icon: Home },
  { title: 'برنامه‌ریزی آموزشی', href: '/educational-vp/planning', icon: Calendar },
  { title: 'فعالیت‌ها', href: '/educational-vp/activities', icon: Activity },
]

const disciplinaryVpNavItems = [
  { title: 'داشبورد', href: '/discipline-vp', icon: Home },
  { title: 'حضور و غیاب', href: '/discipline-vp/attendance', icon: ClipboardCheck },
  { title: 'گزارش‌های انضباطی', href: '/discipline-vp/reports', icon: Shield },
]

const evaluationVpNavItems = [
  { title: 'داشبورد', href: '/evaluation-vp', icon: Home },
  { title: 'ارزیابی معلمان', href: '/evaluation-vp/teacher-evaluation', icon: Award },
  { title: 'آمار و گزارش', href: '/evaluation-vp/stats', icon: BarChart3 },
]

const financialVpNavItems = [
  { title: 'داشبورد', href: '/financial-vp', icon: Home },
  { title: 'پرداخت‌ها', href: '/financial-vp/payments', icon: DollarSign },
  { title: 'گزارش‌های مالی', href: '/financial-vp/reports', icon: FileText },
]

const healthcareNavItems = [
  { title: 'داشبورد', href: '/health-vp', icon: Home },
  { title: 'پرونده‌های بهداشتی', href: '/health-vp/students', icon: Users },
  { title: 'گزارش‌ها', href: '/health-vp/reports', icon: FileText },
]

const secretaryNavItems = [
  { title: 'داشبورد', href: '/secretary', icon: Home },
  { title: 'مکاتبات', href: '/secretary/correspondence', icon: Mail },
  { title: 'مدیریت جلسات', href: '/secretary/meetings', icon: Calendar },
]

const librarianNavItems = [
  { title: 'داشبورد', href: '/librarian', icon: Home },
  { title: 'امانت کتاب', href: '/librarian/lending', icon: BookOpen },
  { title: 'جستجو', href: '/librarian/search', icon: Search },
]

const securityNavItems = [
  { title: 'داشبورد', href: '/security', icon: Home },
  { title: 'ورود و خروج', href: '/security/entry-exit', icon: Users },
  { title: 'گزارش رخدادها', href: '/security/incidents', icon: AlertCircle },
]

const maintenanceNavItems = [
  { title: 'داشبورد', href: '/maintenance', icon: Home },
  { title: 'درخواست‌های تعمیر', href: '/maintenance/requests', icon: Wrench },
  { title: 'برنامه تعمیرات', href: '/maintenance/schedule', icon: Calendar },
]

interface SidebarNavProps {
  role: 'admin' | 'teacher' | 'parent' | 'student' | 'principal' | 'counselor' | 
        'educational_vp' | 'disciplinary_vp' | 'evaluation_vp' | 'financial_vp' | 
        'healthcare' | 'secretary' | 'librarian' | 'security' | 'maintenance'
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()

  const navItems = {
    admin: adminNavItems,
    teacher: teacherNavItems,
    parent: parentNavItems,
    student: studentNavItems,
    principal: principalNavItems,
    counselor: counselorNavItems,
    educational_vp: educationalVpNavItems,
    disciplinary_vp: disciplinaryVpNavItems,
    evaluation_vp: evaluationVpNavItems,
    financial_vp: financialVpNavItems,
    healthcare: healthcareNavItems,
    secretary: secretaryNavItems,
    librarian: librarianNavItems,
    security: securityNavItems,
    maintenance: maintenanceNavItems,
  }[role] || adminNavItems

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

