'use client'

import { useState } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'

// ============================================
// داده‌های نمونه (Mock Data)
// ============================================
const teacherName = 'آقای احمدی'
const className = 'کلاس پنجم الف'

// دانش‌آموزان نمونه
const mockStudents = [
  { id: '1', name: 'علی محمدی', grade: 5, lastScore: 18.5, attendance: 'present', needsAttention: false },
  { id: '2', name: 'زهرا حسینی', grade: 5, lastScore: 19.0, attendance: 'present', needsAttention: false },
  { id: '3', name: 'محمد رضایی', grade: 5, lastScore: 14.5, attendance: 'absent', needsAttention: true },
  { id: '4', name: 'فاطمه کریمی', grade: 5, lastScore: 17.0, attendance: 'present', needsAttention: false },
  { id: '5', name: 'امیر صادقی', grade: 5, lastScore: 12.0, attendance: 'late', needsAttention: true },
  { id: '6', name: 'مریم نوری', grade: 5, lastScore: 20.0, attendance: 'present', needsAttention: false },
]

// تکالیف نمونه
const mockHomework = [
  { id: '1', title: 'تکلیف ریاضی - فصل ۵', dueDate: 'امروز', pending: 8, total: 32 },
  { id: '2', title: 'انشا فارسی - موضوع آزاد', dueDate: 'فردا', pending: 15, total: 32 },
  { id: '3', title: 'تمرین علوم - آزمایش', dueDate: '۳ روز دیگر', pending: 28, total: 32 },
]

// آزمون‌های نمونه
const mockExams = [
  { id: '1', title: 'آزمون ریاضی فصل ۴', time: '۱۰:۰۰', status: 'upcoming' },
  { id: '2', title: 'کوییز علوم', time: '۱۴:۰۰', status: 'upcoming' },
]

// هشدارها
const mockAlerts = [
  { id: '1', type: 'attendance', student: 'محمد رضایی', message: '۳ جلسه غیبت متوالی', severity: 'high' },
  { id: '2', type: 'grade', student: 'امیر صادقی', message: 'افت ۳ نمره‌ای در ماه اخیر', severity: 'medium' },
  { id: '3', type: 'behavior', student: 'علی محمدی', message: 'نیاز به جلسه مشاوره', severity: 'low' },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function TeacherDashboardPage() {
  const [currentTime] = useState(new Date())

  // فرمت تاریخ شمسی
  const formatPersianDate = () => {
    return new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(currentTime)
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

  // شدت هشدار
  const getAlertSeverity = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500/50 bg-red-500/10'
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10'
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10'
      default:
        return 'border-gray-500/50 bg-gray-500/10'
    }
  }

  // آمار کلی
  const stats = [
    { label: 'دانش‌آموزان کلاس', value: mockStudents.length, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500', trend: null },
    { label: 'آزمون‌های امروز', value: mockExams.length, icon: <ClipboardCheck className="w-6 h-6" />, color: 'bg-green-500', trend: null },
    { label: 'تکالیف بررسی نشده', value: mockHomework.reduce((sum, h) => sum + h.pending, 0), icon: <FileText className="w-6 h-6" />, color: 'bg-orange-500', trend: null },
    { label: 'حضور امروز', value: `${Math.round((mockStudents.filter(s => s.attendance === 'present').length / mockStudents.length) * 100)}%`, icon: <UserCheck className="w-6 h-6" />, color: 'bg-purple-500', trend: null },
  ]

  // ابزارهای معلم
  const tools = [
    { label: 'ثبت حضور و غیاب', href: '#', icon: <UserCheck className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
    { label: 'ثبت نمره', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
    { label: 'هدایت رفتاری', href: '#', icon: <Heart className="w-5 h-5" />, color: 'bg-pink-500', enabled: false },
    { label: 'دفتر کلاسی', href: '#', icon: <BookOpen className="w-5 h-5" />, color: 'bg-indigo-500', enabled: false },
    { label: 'محتوای خلاق (AI)', href: '/test-story', icon: <Sparkles className="w-5 h-5" />, color: 'bg-purple-500', enabled: true },
    { label: 'بانک سوالات', href: '#', icon: <HelpCircle className="w-5 h-5" />, color: 'bg-teal-500', enabled: false },
  ]

  // ابزارهای AI
  const aiTools = [
    { label: 'حل مسئله', href: '/test-ocr', icon: <Lightbulb className="w-6 h-6" />, color: 'text-yellow-400' },
    { label: 'داستان‌ساز', href: '/test-story', icon: <Sparkles className="w-6 h-6" />, color: 'text-pink-400' },
    { label: 'تحلیل دانش‌آموز', href: '/test-students-list', icon: <Brain className="w-6 h-6" />, color: 'text-purple-400' },
    { label: 'باغ استعداد', href: '/teacher/talent-garden', icon: <Trophy className="w-6 h-6" />, color: 'text-yellow-400' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                سلام، {teacherName} 👋
              </h1>
              <p className="text-white/70">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm ml-2">
                  🧑‍🏫 معلم
                </span>
                <span className="bg-blue-500/30 px-3 py-1 rounded-full text-sm ml-2">
                  {className}
                </span>
                {formatPersianDate()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                <Bell className="w-5 h-5 text-white" />
                {mockAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {mockAlerts.length}
                  </span>
                )}
              </button>
              <Link
                href="/test-session"
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <Settings className="w-5 h-5 text-white" />
              </Link>
            </div>
          </div>
        </header>

        {/* ==================== Stats Cards ==================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${stat.color} p-3 rounded-xl shadow-lg text-white`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-white text-2xl md:text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ==================== Main Grid ==================== */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* ========== دانش‌آموزانم ========== */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                دانش‌آموزانم
              </h2>
              <Link
                href="/test-students-list"
                className="text-blue-300 hover:text-blue-200 text-sm flex items-center gap-1"
              >
                مشاهده همه
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

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
                  {mockStudents.slice(0, 5).map((student) => {
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
                          <span className={`font-bold ${student.lastScore >= 17 ? 'text-green-400' : student.lastScore >= 14 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {student.lastScore}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${attendance.color}`}>
                            {attendance.icon}
                            {attendance.label}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <Link
                            href="/test-students-list"
                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all inline-flex"
                          >
                            <Eye className="w-4 h-4 text-white/70" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========== کارهای امروز ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-green-400" />
              کارهای امروز
            </h2>

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
          </div>
        </div>

        {/* ==================== ابزارها و هشدارها ==================== */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* ========== ابزارهای من ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              ابزارهای من
            </h2>
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
          </div>

          {/* ========== هشدارها ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              هشدارها
              {mockAlerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {mockAlerts.length}
                </span>
              )}
            </h2>
            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl p-4 border ${getAlertSeverity(alert.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {alert.type === 'attendance' && <XCircle className="w-5 h-5 text-red-400" />}
                      {alert.type === 'grade' && <TrendingDown className="w-5 h-5 text-yellow-400" />}
                      {alert.type === 'behavior' && <Heart className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{alert.student}</p>
                      <p className="text-white/60 text-sm">{alert.message}</p>
                    </div>
                    <Link
                      href="/test-students-list"
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                    >
                      <Eye className="w-4 h-4 text-white/70" />
                    </Link>
                  </div>
                </div>
              ))}
              {mockAlerts.length === 0 && (
                <div className="text-center py-8 text-white/50">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <p>هشداری وجود ندارد</p>
                </div>
              )}
            </div>
          </div>
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
        <footer className="text-center text-white/40 text-sm py-4">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}

