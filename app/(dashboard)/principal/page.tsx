'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  UserCheck,
  ClipboardList,
  Bell,
  Settings,
  ChevronLeft,
  BarChart3,
  Brain,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  GraduationCap,
  Award,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Star,
  Briefcase,
  CalendarDays,
  Megaphone,
} from 'lucide-react'

// ============================================
// داده‌های نمونه (Mock Data)
// ============================================
const principalName = 'آقای محمدی'
const schoolName = 'دبستان تلاش'

// آمار پایه‌های تحصیلی
const gradeStats = [
  { grade: 'پیش‌دبستانی', students: 18, teachers: 2, avgScore: 18.5, attendance: 95 },
  { grade: 'اول', students: 22, teachers: 2, avgScore: 17.8, attendance: 92 },
  { grade: 'دوم', students: 25, teachers: 2, avgScore: 18.2, attendance: 94 },
  { grade: 'سوم', students: 20, teachers: 2, avgScore: 17.5, attendance: 91 },
  { grade: 'چهارم', students: 18, teachers: 2, avgScore: 16.9, attendance: 93 },
  { grade: 'پنجم', students: 15, teachers: 2, avgScore: 17.2, attendance: 96 },
  { grade: 'ششم', students: 12, teachers: 2, avgScore: 18.0, attendance: 94 },
]

// کارکنان
const staffList = [
  { id: '1', name: 'آقای احمدی', role: 'معلم پایه پنجم', type: 'teacher', attendance: 'present' },
  { id: '2', name: 'خانم رضایی', role: 'معلم پایه سوم', type: 'teacher', attendance: 'present' },
  { id: '3', name: 'آقای کریمی', role: 'معلم ورزش', type: 'teacher', attendance: 'present' },
  { id: '4', name: 'خانم نوری', role: 'معلم هنر', type: 'teacher', attendance: 'late' },
  { id: '5', name: 'آقای صادقی', role: 'معلم قرآن', type: 'teacher', attendance: 'present' },
  { id: '6', name: 'خانم حسینی', role: 'معاون آموزشی', type: 'vp', attendance: 'present' },
  { id: '7', name: 'آقای فرهادی', role: 'معاون انضباطی', type: 'vp', attendance: 'present' },
  { id: '8', name: 'خانم عباسی', role: 'معاون مالی', type: 'vp', attendance: 'absent' },
]

// نظرسنجی‌ها
const surveys = [
  { id: '1', title: 'نظرسنجی کیفیت آموزش', responses: 45, total: 120, status: 'active' },
  { id: '2', title: 'رضایت والدین از امکانات', responses: 80, total: 120, status: 'completed' },
]

// رویدادها و یادآورها
const events = [
  { id: '1', title: 'جلسه شورای معلمان', date: 'امروز ساعت ۱۴:۰۰', type: 'meeting', urgent: true },
  { id: '2', title: 'جلسه اولیا و مربیان پایه پنجم', date: 'فردا ساعت ۱۶:۰۰', type: 'meeting', urgent: false },
  { id: '3', title: 'اردوی علمی دانش‌آموزان', date: 'پنج‌شنبه', type: 'event', urgent: false },
  { id: '4', title: 'مهلت ارسال کارنامه میان‌ترم', date: '۳ روز دیگر', type: 'deadline', urgent: true },
  { id: '5', title: 'جشن میلاد حضرت زهرا (س)', date: 'هفته آینده', type: 'event', urgent: false },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function PrincipalDashboardPage() {
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

  // محاسبه آمار کلی
  const totalStudents = gradeStats.reduce((sum, g) => sum + g.students, 0)
  const totalTeachers = staffList.filter(s => s.type === 'teacher').length
  const totalVPs = staffList.filter(s => s.type === 'vp').length
  const avgAttendance = Math.round(gradeStats.reduce((sum, g) => sum + g.attendance, 0) / gradeStats.length)
  const presentStaff = staffList.filter(s => s.attendance === 'present').length

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
        return { label: 'نامشخص', color: 'text-gray-400 bg-gray-500/20', icon: <AlertCircle className="w-4 h-4" /> }
    }
  }

  // آمار کارت‌ها
  const stats = [
    { 
      label: 'دانش‌آموزان', 
      value: totalStudents, 
      icon: <Users className="w-6 h-6" />, 
      color: 'bg-blue-500',
      subtext: `${gradeStats.length} پایه تحصیلی`
    },
    { 
      label: 'کارکنان', 
      value: totalTeachers + totalVPs, 
      icon: <UserCheck className="w-6 h-6" />, 
      color: 'bg-green-500',
      subtext: `${totalTeachers} معلم • ${totalVPs} معاون`
    },
    { 
      label: 'حضور امروز', 
      value: `${avgAttendance}%`, 
      icon: <CheckCircle2 className="w-6 h-6" />, 
      color: 'bg-purple-500',
      subtext: `${presentStaff} از ${staffList.length} کارکنان حاضر`
    },
    { 
      label: 'نظرسنجی‌های فعال', 
      value: surveys.filter(s => s.status === 'active').length, 
      icon: <ClipboardList className="w-6 h-6" />, 
      color: 'bg-orange-500',
      subtext: `${surveys.reduce((sum, s) => sum + s.responses, 0)} پاسخ جدید`
    },
  ]

  // دکمه‌های مدیریت سریع
  const quickActions = [
    { label: 'گزارش جامع', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
    { label: 'تحلیل‌های هوشمند', href: '/test-students-list', icon: <Brain className="w-5 h-5" />, color: 'bg-purple-500', enabled: true },
    { label: 'مدیریت دانش‌آموزان', href: '/test-students-list', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-green-500', enabled: true },
    { label: 'مدیریت کارکنان', href: '#', icon: <Briefcase className="w-5 h-5" />, color: 'bg-teal-500', enabled: false },
    { label: 'نظرسنجی‌ها', href: '#', icon: <ClipboardList className="w-5 h-5" />, color: 'bg-orange-500', enabled: false },
    { label: 'گزارش‌های مالی', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-pink-500', enabled: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                سلام، {principalName} 👋
              </h1>
              <p className="text-white/70">
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full text-sm ml-2">
                  🏫 مدیر دبستان
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {schoolName}
                </span>
              </p>
              <p className="text-white/50 text-sm mt-2">{formatPersianDate()}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {events.filter(e => e.urgent).length}
                </span>
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
              <p className="text-white/40 text-xs mt-1">{stat.subtext}</p>
            </div>
          ))}
        </div>

        {/* ==================== Main Grid ==================== */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* ========== آمار کلاس‌ها ========== */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                آمار پایه‌های تحصیلی
              </h2>
              <div className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-sm">
                {totalStudents} دانش‌آموز
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-white/50 text-sm border-b border-white/10">
                    <th className="text-right pb-3 font-medium">پایه</th>
                    <th className="text-center pb-3 font-medium">دانش‌آموز</th>
                    <th className="text-center pb-3 font-medium">معلم</th>
                    <th className="text-center pb-3 font-medium">میانگین نمره</th>
                    <th className="text-center pb-3 font-medium">حضور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {gradeStats.map((grade, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="text-white font-medium">{grade.grade}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center text-white">{grade.students}</td>
                      <td className="py-3 text-center text-white/70">{grade.teachers}</td>
                      <td className="py-3 text-center">
                        <span className={`font-bold ${
                          grade.avgScore >= 17 ? 'text-green-400' : 
                          grade.avgScore >= 15 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {grade.avgScore}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          grade.attendance >= 95 ? 'bg-green-500/20 text-green-400' :
                          grade.attendance >= 90 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {grade.attendance}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-amber-400 text-2xl font-bold">{totalStudents}</p>
                  <p className="text-white/60 text-xs">کل دانش‌آموزان</p>
                </div>
                <div>
                  <p className="text-green-400 text-2xl font-bold">
                    {(gradeStats.reduce((sum, g) => sum + g.avgScore, 0) / gradeStats.length).toFixed(1)}
                  </p>
                  <p className="text-white/60 text-xs">میانگین کل</p>
                </div>
                <div>
                  <p className="text-blue-400 text-2xl font-bold">{avgAttendance}%</p>
                  <p className="text-white/60 text-xs">حضور میانگین</p>
                </div>
              </div>
            </div>
          </div>

          {/* ========== رویدادها و یادآورها ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-orange-400" />
              رویدادها و یادآورها
            </h2>

            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-xl p-3 border transition-all ${
                    event.urgent 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      event.type === 'meeting' ? 'bg-blue-500/20' :
                      event.type === 'event' ? 'bg-purple-500/20' :
                      'bg-orange-500/20'
                    }`}>
                      {event.type === 'meeting' && <Users className="w-4 h-4 text-blue-400" />}
                      {event.type === 'event' && <Star className="w-4 h-4 text-purple-400" />}
                      {event.type === 'deadline' && <Clock className="w-4 h-4 text-orange-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{event.title}</p>
                      <p className="text-white/50 text-xs mt-1">{event.date}</p>
                    </div>
                    {event.urgent && (
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded">
                        مهم
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 bg-white/10 text-white py-2 rounded-xl hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-1">
              مشاهده تقویم کامل
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==================== کارکنان و مدیریت سریع ==================== */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* ========== کارکنان ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-400" />
                کارکنان
              </h2>
              <div className="flex items-center gap-2">
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                  {presentStaff} حاضر
                </span>
                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                  {staffList.filter(s => s.attendance === 'absent').length} غایب
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {staffList.map((staff) => {
                const attendance = getAttendanceStatus(staff.attendance)
                return (
                  <div
                    key={staff.id}
                    className="bg-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        staff.type === 'vp' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-br from-amber-400 to-orange-500'
                      }`}>
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{staff.name}</p>
                        <p className="text-white/50 text-xs">{staff.role}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${attendance.color}`}>
                      {attendance.icon}
                      {attendance.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <button className="w-full mt-4 bg-teal-500/20 text-teal-300 py-2 rounded-xl hover:bg-teal-500/30 transition-all text-sm flex items-center justify-center gap-1">
              مدیریت کارکنان
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* ========== مدیریت سریع ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              مدیریت سریع
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.enabled ? action.href : '#'}
                  className={`bg-white/5 rounded-xl p-4 text-center transition-all group
                    ${action.enabled
                      ? 'hover:bg-white/10 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                    }`}
                  onClick={(e) => !action.enabled && e.preventDefault()}
                >
                  <div className={`${action.color} w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <p className="text-white text-sm font-medium">{action.label}</p>
                  {!action.enabled && (
                    <p className="text-white/40 text-xs mt-1">به زودی</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== نظرسنجی‌ها ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-400" />
              نظرسنجی‌ها
            </h2>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-all text-sm">
              + نظرسنجی جدید
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className={`bg-white/5 rounded-xl p-4 border ${
                  survey.status === 'active' ? 'border-green-500/30' : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium">{survey.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    survey.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {survey.status === 'active' ? 'فعال' : 'پایان یافته'}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-white/60 mb-1">
                    <span>پاسخ‌ها</span>
                    <span>{survey.responses} از {survey.total}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      style={{ width: `${(survey.responses / survey.total) * 100}%` }}
                    />
                  </div>
                </div>
                <button className="w-full bg-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-1">
                  <Eye className="w-4 h-4" />
                  مشاهده نتایج
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ==================== دکمه‌های عملیاتی ==================== */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            href="/test-students-list"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30"
          >
            <Users className="w-5 h-5" />
            لیست دانش‌آموزان
          </Link>
          <button className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-500/30">
            <Brain className="w-5 h-5" />
            تحلیل هوشمند مدرسه
          </button>
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-500/30">
            <BarChart3 className="w-5 h-5" />
            گزارش عملکرد ماهانه
          </button>
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-4">
          <p>پنل مدیریت {schoolName} - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}



































