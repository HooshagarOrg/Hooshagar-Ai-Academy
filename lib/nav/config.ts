import {
  Home, Users, Brain, BarChart3, Settings, Zap, BookOpen, MessageSquare,
  Sliders, Target, Award, Shield, ArrowUpCircle, FileText, Calendar,
  Activity, ClipboardCheck, DollarSign, Mail, Search, AlertCircle,
  Wrench, Bell, Send, GraduationCap, Building, Sparkles, Trophy, Compass,
  Gamepad2, Lightbulb, Heart, PenTool, HelpCircle, TrendingUp, CreditCard, Video,
  ArrowLeftRight, Palette,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | number
}

export type NavGroup = {
  title?: string
  items: NavItem[]
}

export const navConfig: Record<string, NavGroup[]> = {
  admin: [
    { items: [{ title: 'داشبورد', href: '/admin', icon: Home }] },
    {
      title: 'مدیریت',
      items: [
        { title: 'مدارس', href: '/admin/schools', icon: GraduationCap },
        { title: 'کاربران', href: '/admin/users', icon: Users },
        { title: 'واردسازی گروهی', href: '/admin/bulk-import', icon: FileText },
        { title: 'ارتقاء پایه', href: '/admin/progression', icon: ArrowUpCircle },
        { title: 'انتقال بین‌مدرسه‌ای', href: '/admin/transfers', icon: ArrowLeftRight },
        { title: 'کلاس مجازی', href: '/admin/virtual-classes', icon: Video },
      ],
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
      ],
    },
    {
      title: 'گزارش و ارتباط',
      items: [
        { title: 'گزارشات', href: '/admin/reports', icon: BarChart3 },
        { title: 'ارسال پیام گروهی', href: '/admin/broadcast', icon: Send },
        { title: 'نظرسنجی‌ها', href: '/admin/surveys', icon: MessageSquare },
        { title: 'هشدار زودهنگام', href: '/admin/early-warning', icon: AlertCircle },
      ],
    },
    {
      title: 'قرعه‌کشی',
      items: [
        { title: 'مدیریت قرعه‌کشی', href: '/admin/lottery', icon: Trophy },
        { title: 'ممیزی قرعه‌کشی', href: '/admin/lottery/audit', icon: Shield },
      ],
    },
    {
      title: 'نظارت سیستم',
      items: [
        { title: 'گزارش تحلیلی', href: '/admin/analytics', icon: BarChart3 },
        { title: 'جریان داده', href: '/admin/data-flow', icon: Activity },
        { title: 'امنیت', href: '/admin/security', icon: Shield },
      ],
    },
    {
      title: 'تنظیمات',
      items: [
        { title: 'قابلیت‌ها', href: '/admin/features-management', icon: Sliders },
        { title: 'سال تحصیلی', href: '/admin/academic-years', icon: Calendar },
        { title: 'شهریه', href: '/admin/tuition-settings', icon: DollarSign },
        { title: 'پلن‌های اشتراک', href: '/admin/subscriptions', icon: CreditCard },
        { title: 'ظرفیت و سهمیه', href: '/admin/quota-settings', icon: Sliders },
        { title: 'برندینگ مدرسه', href: '/admin/school-settings', icon: Palette },
        { title: 'تنظیمات', href: '/admin/settings', icon: Settings },
      ],
    },
  ],
  teacher: [
    { items: [{ title: 'داشبورد', href: '/teacher', icon: Home }] },
    {
      title: 'کلاس درس',
      items: [
        { title: 'دانش‌آموزان', href: '/teacher/students', icon: Users },
        { title: 'حضور و غیاب', href: '/teacher/attendance', icon: ClipboardCheck },
        { title: 'نمرات', href: '/teacher/grades', icon: GraduationCap },
        { title: 'رفتار دانش‌آموزان', href: '/teacher/behavior', icon: Heart },
        { title: 'گزارش هفتگی', href: '/teacher/weekly-report', icon: FileText },
        { title: 'کلاس مجازی', href: '/teacher#virtual-class', icon: Video },
      ],
    },
    {
      title: 'آزمون و محتوا',
      items: [
        { title: 'آزمون‌ها', href: '/teacher/exams', icon: ClipboardCheck },
        { title: 'آزمون‌ساز', href: '/teacher/exam-generator', icon: PenTool },
        { title: 'بانک سوال', href: '/teacher/question-bank', icon: BookOpen },
        { title: 'تولید محتوا (AI)', href: '/teacher/content-creator', icon: Sparkles },
        { title: 'سوالات شفاهی', href: '/teacher/oral-questions', icon: MessageSquare },
      ],
    },
    {
      title: 'ارتباط',
      items: [
        { title: 'پیام به والدین', href: '/teacher/parent-message', icon: Mail },
        { title: 'تحلیلگر هوشمند', href: '/teacher/analyzer', icon: Brain },
      ],
    },
  ],
  parent: [
    { items: [{ title: 'داشبورد', href: '/parent', icon: Home }] },
    {
      title: 'فرزندم',
      items: [
        { title: 'نمرات فرزند', href: '/parent/grades', icon: GraduationCap },
        { title: 'گزارشات', href: '/parent/reports', icon: BarChart3 },
        { title: 'حضور و غیاب', href: '/parent/attendance', icon: ClipboardCheck },
        { title: 'بهداشت', href: '/parent/health', icon: Heart },
        { title: 'مالی', href: '/parent/financials', icon: DollarSign },
      ],
    },
    {
      title: 'خدمات',
      items: [
        { title: 'کلاس مجازی', href: '/parent#virtual-class', icon: Video },
        { title: 'مشاوره', href: '/parent/counseling', icon: HelpCircle },
        { title: 'ثبت‌نام کلاس', href: '/parent/class-registration', icon: GraduationCap },
        { title: 'نظرسنجی', href: '/parent/survey', icon: MessageSquare },
        { title: 'اعلانات', href: '/parent/notifications', icon: Bell },
      ],
    },
  ],
  student: [
    { items: [{ title: 'داشبورد', href: '/student', icon: Home }] },
    {
      title: 'یادگیری',
      items: [
        { title: 'نمراتم', href: '/student/grades', icon: GraduationCap },
        { title: 'مسیر یادگیری', href: '/student/learning-journey', icon: Compass },
        { title: 'آزمون‌هایم', href: '/student/exams', icon: ClipboardCheck },
        { title: 'کلاس مجازی', href: '/student#virtual-class', icon: Video },
        { title: 'دستیار مطالعه', href: '/student/study-buddy', icon: BookOpen },
        { title: 'حل مسئله (OCR)', href: '/student/problem-solver', icon: Lightbulb },
      ],
    },
    {
      title: 'آینده',
      items: [
        { title: 'انتخاب رشته', href: '/student/field-selection', icon: Target },
        { title: 'کنکور', href: '/student/konkur', icon: Award },
        { title: 'نقشه راه کنکور', href: '/student/konkur-roadmap', icon: Compass },
        { title: 'قطب‌نمای آینده', href: '/student/future-compass', icon: Compass },
      ],
    },
    {
      title: 'ثبت‌نام',
      items: [{ title: 'ثبت‌نام کلاس', href: '/student/class-registration', icon: GraduationCap }],
    },
    {
      title: 'سرگرمی',
      items: [
        { title: 'باغ استعداد', href: '/student/talent-garden', icon: Trophy },
        { title: 'زمین بازی', href: '/student/practice-playground', icon: Gamepad2 },
        { title: 'نشان‌هایم', href: '/student/badges', icon: Award },
        { title: 'فروشگاه', href: '/student/shop', icon: Zap },
      ],
    },
  ],
  counselor: [
    { items: [{ title: 'داشبورد', href: '/counselor', icon: Home }] },
    {
      title: 'مشاوره',
      items: [
        { title: 'دانش‌آموزان', href: '/counselor/records', icon: Users },
        { title: 'پرونده جدید', href: '/counselor/records/new', icon: FileText },
        { title: 'گزارش‌ها', href: '/counselor/reports', icon: BarChart3 },
        { title: 'بینش خانواده', href: '/counselor/family-insight', icon: Heart },
      ],
    },
  ],
}

export const simpleNavs: Record<string, NavItem[]> = {
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
  financial_vp: [
    { title: 'داشبورد', href: '/financial-vp', icon: Home },
    { title: 'پرداخت‌ها', href: '/financial-vp/payments', icon: CreditCard },
    { title: 'پیامک', href: '/financial-vp/sms', icon: MessageSquare },
    { title: 'بدهکاران', href: '/financial-vp/reports/debtors', icon: DollarSign },
    { title: 'درآمد', href: '/financial-vp/reports/income', icon: TrendingUp },
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

export const commonItems: NavItem[] = [
  { title: 'پیام‌ها', href: '/messages', icon: MessageSquare },
  { title: 'اعلانات', href: '/notifications', icon: Bell },
]

export const mobileTabItems: Record<string, NavItem[]> = {
  admin: [
    { title: 'خانه', href: '/admin', icon: Home },
    { title: 'کاربران', href: '/admin/users', icon: Users },
    { title: 'AI', href: '/admin/ai-limits', icon: Brain },
    { title: 'تنظیمات', href: '/admin/settings', icon: Settings },
    { title: 'اعلان', href: '/notifications', icon: Bell },
  ],
  teacher: [
    { title: 'خانه', href: '/teacher', icon: Home },
    { title: 'کلاس', href: '/teacher/students', icon: Users },
    { title: 'آزمون', href: '/teacher/exam-generator', icon: PenTool },
    { title: 'پیام', href: '/messages', icon: MessageSquare },
    { title: 'اعلان', href: '/notifications', icon: Bell },
  ],
  parent: [
    { title: 'خانه', href: '/parent', icon: Home },
    { title: 'گزارش', href: '/parent/reports', icon: BarChart3 },
    { title: 'حضور', href: '/parent/attendance', icon: ClipboardCheck },
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
  counselor: [
    { title: 'خانه', href: '/counselor', icon: Home },
    { title: 'پرونده‌ها', href: '/counselor/records', icon: Users },
    { title: 'گزارش', href: '/counselor/reports', icon: BarChart3 },
    { title: 'پیام', href: '/messages', icon: MessageSquare },
    { title: 'اعلان', href: '/notifications', icon: Bell },
  ],
}

export function getArcColor(role: string): string {
  const map: Record<string, string> = {
    student: 'var(--arc-student)',
    parent: 'var(--arc-parent)',
    teacher: 'var(--arc-teacher)',
    admin: 'var(--arc-admin)',
    platform_admin: 'var(--arc-admin)',
    counselor: 'var(--arc-counselor)',
  }
  return map[role] ?? 'var(--lux-primary)'
}

export function getRoleLabel(role: string): string {
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
  return labels[role] ?? 'کاربر'
}

export function resolveNavGroups(role: string): NavGroup[] {
  const navRole = role === 'platform_admin' ? 'admin' : role
  if (navConfig[navRole]) return navConfig[navRole]
  const simple = simpleNavs[role]
  if (simple) return [{ items: simple }]
  return [{ items: [{ title: 'داشبورد', href: '/dashboard', icon: Home }] }]
}

export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  if (href === '/' || href === '/dashboard') return false
  return pathname.startsWith(`${href}/`)
}
