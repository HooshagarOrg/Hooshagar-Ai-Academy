'use client'

import { useState, useEffect } from 'react'
import { usePersianDateString } from '@/lib/hooks/use-persian-date'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PremiumPanel } from '@/components/ui/premium-panel'
import { StatCard } from '@/components/ui/stat-card'
import Link from 'next/link'
import { VirtualClassCard } from '@/components/virtual-class/virtual-class-card'
import {
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  Calendar,
  Bell,
  Settings,
  UserCheck,
  PenTool,
  Heart,
  Brain,
  Sparkles,
  AlertTriangle,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  BarChart3,
  Trophy,
  Lightbulb,
  HelpCircle,
  Eye,
  Plus,
  Loader2,
} from 'lucide-react'

// ============================================
// Types
// ============================================
interface DashboardData {
  teacher: {
    name: string;
    class: {
      id: string;
      name: string;
      grade: number;
      academicYear: string;
    } | null;
  };
  students: Array<{
    id: string;
    name: string;
    grade: number;
    lastScore: number | null;
    lastSubject: string | null;
    attendance: string;
    needsAttention: boolean;
  }>;
  stats: {
    totalStudents: number;
    presentToday: number;
    attendanceRate: number;
    averageGrade: number;
    upcomingExams: number;
  };
  recentGrades: Array<{
    id: string;
    studentName: string;
    subject: string;
    score: number;
    type: string;
    date: string;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    student: string;
    message: string;
    badgeText: string;
    badgeColor: string;
    borderColor: string;
    score?: number;
  }>;
}

// تکالیف نمونه (موقتی)
const mockHomework = [
  { id: '1', title: 'تکلیف ریاضی - فصل ۵', dueDate: 'امروز', pending: 8, total: 32 },
  { id: '2', title: 'انشا فارسی - موضوع آزاد', dueDate: 'فردا', pending: 15, total: 32 },
  { id: '3', title: 'تمرین علوم - آزمایش', dueDate: '۳ روز دیگر', pending: 28, total: 32 },
]

// آزمون‌های نمونه (موقتی)
const mockExams = [
  { id: '1', title: 'آزمون ریاضی فصل ۴', time: '۱۰:۰۰', status: 'upcoming' },
  { id: '2', title: 'کوییز علوم', time: '۱۴:۰۰', status: 'upcoming' },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function TeacherDashboardPage() {
  const persianDate = usePersianDateString()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // دریافت داده‌ها
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const res = await fetch('/api/teacher/dashboard')
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'خطا در دریافت داده‌ها')
        return
      }

      setDashboardData(data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError('خطای شبکه')
    } finally {
      setIsLoading(false)
    }
  }

  // وضعیت حضور
  const getAttendanceStatus = (status: string) => {
    switch (status) {
      case 'present':
        return { label: 'حاضر', color: 'text-green-400 bg-green-500/20', icon: <CheckCircle2 className="w-4 h-4" /> }
      case 'absent':
        return { label: 'غایب', color: 'text-red-400 bg-red-500/20', icon: <XCircle className="w-4 h-4" /> }
      case 'late':
        return { label: 'تأخیر', color: 'text-yellow-400 bg-yellow-500/20', icon: <Clock className="w-4 h-4" /> }
      default:
        return { label: 'نامشخص', color: 'text-gray-400 bg-gray-500/20', icon: <HelpCircle className="w-4 h-4" /> }
    }
  }

  // آیکون هشدار
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'grade_drop':
        return <TrendingDown className="w-5 h-5 text-red-400" />
      case 'absence':
        return <XCircle className="w-5 h-5 text-orange-400" />
      case 'behavior':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  // آمار کلی
  const stats = dashboardData ? [
    { label: 'دانش‌آموزان کلاس', value: dashboardData.stats.totalStudents, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500', trend: null },
    { label: 'آزمون‌های امروز', value: dashboardData.stats.upcomingExams, icon: <ClipboardCheck className="w-6 h-6" />, color: 'bg-green-500', trend: null },
    { label: 'تکالیف بررسی نشده', value: mockHomework.reduce((sum, h) => sum + h.pending, 0), icon: <FileText className="w-6 h-6" />, color: 'bg-orange-500', trend: null },
    { label: 'حضور امروز', value: `${dashboardData.stats.attendanceRate}%`, icon: <UserCheck className="w-6 h-6" />, color: 'bg-purple-500', trend: null },
  ] : []

  // ابزارهای معلم
  const tools = [
    { label: 'ثبت حضور و غیاب', href: '#', icon: <UserCheck className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
    { label: 'ثبت نمره', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
    { label: 'هدایت رفتاری', href: '/teacher/behavior', icon: <Heart className="w-5 h-5" />, color: 'bg-pink-500', enabled: true },
    { label: 'دفتر کلاسی', href: '#', icon: <BookOpen className="w-5 h-5" />, color: 'bg-indigo-500', enabled: false },
    { label: 'محتوای خلاق (AI)', href: '/teacher/content-creator', icon: <Sparkles className="w-5 h-5" />, color: 'bg-purple-500', enabled: true },
    { label: 'آزمون‌ساز تیزهوشان', href: '/teacher/exam-generator', icon: <HelpCircle className="w-5 h-5" />, color: 'bg-orange-500', enabled: true },
  ]

  // ابزارهای AI
  const aiTools = [
    { label: 'حل مسئله', href: '/test-ocr', icon: <Lightbulb className="w-6 h-6" />, color: 'text-yellow-400' },
    { label: 'داستان‌ساز', href: '/test-story', icon: <Sparkles className="w-6 h-6" />, color: 'text-pink-400' },
    { label: 'تحلیل دانش‌آموز', href: '/test-students-list', icon: <Brain className="w-6 h-6" />, color: 'text-purple-400' },
    { label: 'باغ استعداد', href: '/teacher/talent-garden', icon: <Trophy className="w-6 h-6" />, color: 'text-yellow-400' },
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center glass-panel-quiet p-8">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center glass-panel-quiet p-8 max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-bold mb-2">خطا در بارگذاری</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="bg-brand-cyan hover:opacity-90 text-space px-6 py-3 rounded-xl transition-all cursor-pointer"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  // No data
  if (!dashboardData) {
    return null
  }

  const teacherName = dashboardData.teacher.name
  const className = dashboardData.teacher.class?.name || 'بدون کلاس'
  const students = dashboardData.students
  const alerts = dashboardData.alerts

  return (
    <DashboardPage
      meta={persianDate}
      title={
        <>
          سلام، <span className="text-brand-cyan">{teacherName}</span>
        </>
      }
      description={
        <>
          کلاس {className}
          {alerts.length > 0 && (
            <span className="text-brand-orange"> · {alerts.length} هشدار</span>
          )}
        </>
      }
      animatedSections={false}
    >
        <VirtualClassCard />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              accentClass="text-brand-cyan"
            />
          ))}
        </div>

        {/* ==================== Main Grid ==================== */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* ========== دانش‌آموزانم ========== */}
          <PremiumPanel
            className="lg:col-span-2"
            title="دانش‌آموزانم"
            action={
              <Link
                href="/test-students-list"
                className="text-brand-cyan hover:text-brand-cyan/80 text-sm flex items-center gap-1 motion-interactive cursor-pointer"
              >
                مشاهده همه
                <ChevronLeft className="w-4 h-4" />
              </Link>
            }
          >

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-white/60 text-sm border-b border-white/10">
                    <th className="text-right pb-3 font-medium">نام</th>
                    <th className="text-center pb-3 font-medium">پایه</th>
                    <th className="text-center pb-3 font-medium">آخرین نمره</th>
                    <th className="text-center pb-3 font-medium">وضعیت</th>
                    <th className="text-center pb-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/50">
                        دانش‌آموزی در کلاس ثبت نشده است
                      </td>
                    </tr>
                  ) : (
                    students.slice(0, 5).map((student) => {
                      const attendance = getAttendanceStatus(student.attendance)
                      return (
                        <tr key={student.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                {student.name.charAt(0)}
                              </div>
                              <span className="text-white font-medium">
                                {student.name}
                                {student.needsAttention && (
                                  <span className="mr-2 text-yellow-400">⚠️</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-center text-white/70">{student.grade}</td>
                          <td className="py-3 text-center">
                            {student.lastScore !== null ? (
                              <span className={`font-bold ${student.lastScore >= 17 ? 'text-green-400' : student.lastScore >= 14 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {student.lastScore}
                              </span>
                            ) : (
                              <span className="text-white/40 text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${attendance.color}`}>
                              {attendance.icon}
                              {attendance.label}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <Link
                              href={`/teacher/students?id=${student.id}`}
                              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all inline-flex"
                            >
                              <Eye className="w-4 h-4 text-white/70" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </PremiumPanel>

          {/* ========== کارهای امروز ========== */}
          <PremiumPanel
            title={
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-green" />
                کارهای امروز
              </span>
            }
          >

            {/* آزمون‌ها */}
            <div className="mb-4">
              <h3 className="text-white/60 text-sm mb-2 flex items-center gap-1">
                <ClipboardCheck className="w-4 h-4" />
                آزمون‌ها
              </h3>
              <div className="space-y-2">
                {mockExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white/5 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{exam.title}</p>
                      <p className="text-white/50 text-xs">ساعت {exam.time}</p>
                    </div>
                    <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                      پیش‌رو
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* تکالیف */}
            <div className="mb-4">
              <h3 className="text-white/60 text-sm mb-2 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                تکالیف منتظر بررسی
              </h3>
              <div className="space-y-2">
                {mockHomework.map((hw) => (
                  <div
                    key={hw.id}
                    className="bg-white/5 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white text-sm font-medium">{hw.title}</p>
                      <span className="text-orange-400 text-xs">{hw.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                          style={{ width: `${((hw.total - hw.pending) / hw.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-white/50 text-xs">
                        {hw.total - hw.pending}/{hw.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* یادآورها */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                یادآور: جلسه اولیا امروز ساعت ۱۶:۰۰
              </p>
            </div>
          </PremiumPanel>
        </div>

        {/* ==================== ابزارها و هشدارها ==================== */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <PremiumPanel
            title={
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-purple" />
                ابزارهای من
              </span>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tools.map((tool, index) => (
                <Link
                  key={index}
                  href={tool.enabled ? tool.href : '#'}
                  className={`bg-white/5 rounded-xl p-4 text-center transition-all group
                    ${tool.enabled
                      ? 'hover:bg-white/10 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                    }`}
                  onClick={(e) => !tool.enabled && e.preventDefault()}
                >
                  <div className={`${tool.color} w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-110 transition-transform`}>
                    {tool.icon}
                  </div>
                  <p className="text-white text-sm font-medium">{tool.label}</p>
                  {!tool.enabled && (
                    <p className="text-white/40 text-xs mt-1">به زودی</p>
                  )}
                </Link>
              ))}
            </div>
          </PremiumPanel>

          <PremiumPanel
            title={
              <span className="flex items-center gap-2 flex-wrap">
                <AlertTriangle className="w-5 h-5 text-brand-yellow" />
                دانش‌آموزان نیازمند توجه
                {alerts.length > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </span>
            }
          >
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl p-4 border-2 ${alert.borderColor} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{alert.student}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${alert.badgeColor}`}>
                          {alert.badgeText}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm">{alert.message}</p>
                    </div>
                    <Link
                      href={`/teacher/students?id=${alert.id}`}
                      className="flex items-center gap-1 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      مشاهده پروفایل
                    </Link>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8">
                  <div className="bg-green-500/10 rounded-2xl p-6 border border-green-500/30">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-green-400" />
                    <p className="text-green-400 text-lg font-bold">🎉 همه دانش‌آموزان در وضعیت خوبی هستند!</p>
                    <p className="text-white/50 text-sm mt-2">هیچ هشداری برای نمایش وجود ندارد</p>
                  </div>
                </div>
              )}
            </div>
          </PremiumPanel>
        </div>

        {/* ==================== ابزارهای هوشمند AI ==================== */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ابزارهای هوشمند AI</h3>
              <p className="text-white/60 text-sm">قدرت هوش مصنوعی در اختیار شما</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {aiTools.map((tool, index) => (
              <Link
                key={index}
                href={tool.href}
                className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/20 transition-all group"
              >
                <div className={`${tool.color} mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                  {tool.icon}
                </div>
                <p className="text-white text-sm font-medium">{tool.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ==================== دکمه‌های عملیاتی ==================== */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-500/30">
            <Plus className="w-5 h-5" />
            ثبت حضور و غیاب امروز
          </button>
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30">
            <PenTool className="w-5 h-5" />
            ثبت نمره جدید
          </button>
          <Link
            href="/test-students-list"
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-500/30"
          >
            <BarChart3 className="w-5 h-5" />
            تحلیل هوشمند کلاس
          </Link>
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-muted-foreground text-sm py-4">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
    </DashboardPage>
  )
}



