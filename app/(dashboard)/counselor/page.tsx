'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  Brain,
  Send,
  Clock,
  Heart,
  AlertTriangle,
  Eye,
  User,
  BookOpen,
  Home,
  TrendingDown,
  MessageCircle,
  CalendarDays,
  ClipboardList,
  UserCheck,
  PenTool,
} from 'lucide-react'

// ============================================
// داده‌های نمونه (Mock Data)
// ============================================
const counselorName = 'خانم رحیمی'
const schoolName = 'دبستان تلاش'

// پیام‌های دریافتی از والدین
const messages = [
  {
    id: '1',
    from: 'مادر علی کریمی',
    studentName: 'علی کریمی',
    subject: 'درخواست جلسه مشاوره',
    preview: 'سلام، می‌خواستم برای بررسی وضعیت تحصیلی علی جلسه‌ای تنظیم کنیم...',
    time: '۳۰ دقیقه پیش',
    isRead: false,
    priority: 'high'
  },
  {
    id: '2',
    from: 'پدر زهرا حسینی',
    studentName: 'زهرا حسینی',
    subject: 'سوال درباره رفتار فرزندم',
    preview: 'با سلام، اخیراً زهرا در منزل کمی بی‌حوصله شده و...',
    time: '۲ ساعت پیش',
    isRead: false,
    priority: 'medium'
  },
  {
    id: '3',
    from: 'مادر محمد رضایی',
    studentName: 'محمد رضایی',
    subject: 'تشکر از راهنمایی‌ها',
    preview: 'سپاسگزارم از جلسه مشاوره هفته گذشته. محمد بهتر شده...',
    time: 'دیروز',
    isRead: true,
    priority: 'low'
  },
  {
    id: '4',
    from: 'پدر امیر صادقی',
    studentName: 'امیر صادقی',
    subject: 'مشکلات خانوادگی',
    preview: 'با احترام، می‌خواستم در مورد تأثیر شرایط خانوادگی بر امیر صحبت کنم...',
    time: 'دیروز',
    isRead: true,
    priority: 'high'
  },
]

// دانش‌آموزان نیازمند توجه
const studentsNeedingAttention = [
  {
    id: '1',
    name: 'محمد رضایی',
    grade: 'پنجم',
    issue: 'تحصیلی',
    description: 'افت شدید نمرات در ۲ ماه اخیر',
    severity: 'high',
    lastSession: '۱۰ روز پیش'
  },
  {
    id: '2',
    name: 'امیر صادقی',
    grade: 'چهارم',
    issue: 'خانوادگی',
    description: 'مشکلات خانوادگی - نیاز به پیگیری',
    severity: 'high',
    lastSession: '۳ روز پیش'
  },
  {
    id: '3',
    name: 'فاطمه نوری',
    grade: 'سوم',
    issue: 'رفتاری',
    description: 'کمبود اعتماد به نفس',
    severity: 'medium',
    lastSession: '۱ هفته پیش'
  },
]

// جلسات امروز
const todaySessions = [
  {
    id: '1',
    time: '۱۰:۰۰',
    studentName: 'علی کریمی',
    grade: 'پنجم',
    topic: 'بررسی وضعیت تحصیلی',
    status: 'upcoming'
  },
  {
    id: '2',
    time: '۱۱:۳۰',
    studentName: 'زهرا حسینی',
    grade: 'سوم',
    topic: 'جلسه پیگیری رفتاری',
    status: 'upcoming'
  },
  {
    id: '3',
    time: '۱۴:۰۰',
    studentName: 'امیر صادقی',
    grade: 'چهارم',
    topic: 'جلسه با والدین',
    status: 'upcoming'
  },
]

// گزارش‌های اخیر
const recentReports = 5

// ============================================
// کامپوننت اصلی
// ============================================
export default function CounselorDashboardPage() {
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

  // آمار کارت‌ها
  const stats = [
    { 
      label: 'پیام‌های جدید', 
      value: messages.filter(m => !m.isRead).length, 
      icon: <MessageSquare className="w-6 h-6" />, 
      color: 'bg-blue-500',
      subtext: 'از خانواده‌ها'
    },
    { 
      label: 'نیازمند توجه', 
      value: studentsNeedingAttention.length, 
      icon: <AlertTriangle className="w-6 h-6" />, 
      color: 'bg-red-500',
      subtext: 'دانش‌آموز'
    },
    { 
      label: 'جلسات امروز', 
      value: todaySessions.length, 
      icon: <Calendar className="w-6 h-6" />, 
      color: 'bg-green-500',
      subtext: 'جلسه مشاوره'
    },
    { 
      label: 'گزارش‌های هفته', 
      value: recentReports, 
      icon: <FileText className="w-6 h-6" />, 
      color: 'bg-purple-500',
      subtext: 'ثبت شده'
    },
  ]

  // ابزارها
  const tools = [
    { label: 'ثبت گزارش مشاوره', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
    { label: 'تحلیل دانش‌آموزان', href: '/test-students-list', icon: <Brain className="w-5 h-5" />, color: 'bg-purple-500', enabled: true },
    { label: 'ارسال پیام', href: '#', icon: <Send className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
    { label: 'برنامه جلسات', href: '#', icon: <CalendarDays className="w-5 h-5" />, color: 'bg-orange-500', enabled: false },
    { label: 'گزارش‌های رفتاری', href: '#', icon: <ClipboardList className="w-5 h-5" />, color: 'bg-pink-500', enabled: false },
    { label: 'پروفایل دانش‌آموزان', href: '/test-students-list', icon: <UserCheck className="w-5 h-5" />, color: 'bg-teal-500', enabled: true },
  ]

  // Get issue badge color
  const getIssueBadge = (issue: string) => {
    switch (issue) {
      case 'تحصیلی':
        return { color: 'bg-blue-500/20 text-blue-400', icon: <BookOpen className="w-3 h-3" /> }
      case 'رفتاری':
        return { color: 'bg-orange-500/20 text-orange-400', icon: <Heart className="w-3 h-3" /> }
      case 'خانوادگی':
        return { color: 'bg-purple-500/20 text-purple-400', icon: <Home className="w-3 h-3" /> }
      default:
        return { color: 'bg-gray-500/20 text-gray-400', icon: <AlertTriangle className="w-3 h-3" /> }
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500/50'
      case 'medium': return 'border-yellow-500/50'
      case 'low': return 'border-green-500/50'
      default: return 'border-gray-500/50'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                سلام، {counselorName} 👋
              </h1>
              <p className="text-white/70">
                <span className="bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 rounded-full text-sm ml-2">
                  💬 مشاور
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
                  {messages.filter(m => !m.isRead).length}
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
          {/* ========== پیام‌های دریافتی ========== */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                پیام‌های دریافتی
                {messages.filter(m => !m.isRead).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {messages.filter(m => !m.isRead).length} جدید
                  </span>
                )}
              </h2>
              <button className="text-rose-300 hover:text-rose-200 text-sm flex items-center gap-1">
                مشاهده همه
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`bg-white/5 rounded-xl p-4 border transition-all hover:bg-white/10 ${
                    message.isRead ? 'border-white/10' : 'border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Priority indicator */}
                    <div className={`w-1 h-full min-h-[60px] rounded-full ${getPriorityColor(message.priority)}`} />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{message.from}</span>
                          {!message.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <span className="text-white/40 text-xs">{message.time}</span>
                      </div>
                      <p className="text-rose-300 text-sm mb-1">{message.subject}</p>
                      <p className="text-white/50 text-xs line-clamp-1">{message.preview}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white/40 text-xs">
                          دانش‌آموز: {message.studentName}
                        </span>
                        <button className="flex items-center gap-1 bg-rose-500/20 text-rose-300 px-3 py-1 rounded-lg hover:bg-rose-500/30 transition-all text-xs">
                          <MessageCircle className="w-3 h-3" />
                          پاسخ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========== جلسات امروز ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-green-400" />
              جلسات امروز
            </h2>

            <div className="space-y-3">
              {todaySessions.map((session, index) => (
                <div
                  key={session.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-br from-rose-400 to-pink-500 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{session.studentName}</p>
                      <p className="text-white/50 text-xs">پایه {session.grade}</p>
                    </div>
                    <div className="mr-auto text-left">
                      <p className="text-rose-300 font-mono font-bold">{session.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">{session.topic}</span>
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded">
                      پیش‌رو
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 bg-green-500/20 text-green-300 py-2 rounded-xl hover:bg-green-500/30 transition-all text-sm flex items-center justify-center gap-1">
              + افزودن جلسه جدید
            </button>
          </div>
        </div>

        {/* ==================== دانش‌آموزان نیازمند توجه و ابزارها ==================== */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* ========== دانش‌آموزان نیازمند توجه ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                دانش‌آموزان نیازمند توجه
              </h2>
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                {studentsNeedingAttention.length} نفر
              </span>
            </div>

            <div className="space-y-3">
              {studentsNeedingAttention.map((student) => {
                const badge = getIssueBadge(student.issue)
                return (
                  <div
                    key={student.id}
                    className={`bg-white/5 rounded-xl p-4 border-r-4 ${getSeverityColor(student.severity)} hover:bg-white/10 transition-all`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{student.name}</p>
                          <p className="text-white/50 text-xs">پایه {student.grade}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${badge.color}`}>
                        {badge.icon}
                        {student.issue}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm mb-2">{student.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        آخرین جلسه: {student.lastSession}
                      </span>
                      <Link
                        href="/test-students-list"
                        className="flex items-center gap-1 bg-rose-500/20 text-rose-300 px-3 py-1 rounded-lg hover:bg-rose-500/30 transition-all text-xs"
                      >
                        <Eye className="w-3 h-3" />
                        مشاهده پروفایل
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ========== ابزارهای من ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-400" />
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
        </div>

        {/* ==================== تحلیل هوشمند ==================== */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">تحلیل هوشمند دانش‌آموزان</h3>
                <p className="text-white/60 text-sm">شناسایی زودهنگام دانش‌آموزان نیازمند کمک با هوش مصنوعی</p>
              </div>
            </div>
            <Link
              href="/test-students-list"
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
            >
              <Brain className="w-5 h-5" />
              شروع تحلیل
            </Link>
          </div>
        </div>

        {/* ==================== دکمه‌های عملیاتی ==================== */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30">
            <PenTool className="w-5 h-5" />
            ثبت گزارش جدید
          </button>
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-500/30">
            <CalendarDays className="w-5 h-5" />
            تنظیم جلسه جدید
          </button>
          <Link
            href="/test-students-list"
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-rose-500/30"
          >
            <Users className="w-5 h-5" />
            لیست دانش‌آموزان
          </Link>
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-4">
          <p>پنل مشاوره {schoolName} - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}






























