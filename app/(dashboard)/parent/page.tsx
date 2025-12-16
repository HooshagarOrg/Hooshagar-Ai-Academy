'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  BookOpen,
  MessageSquare,
  Bell,
  Settings,
  TrendingUp,
  Wallet,
  Calendar,
  FileText,
  Heart,
  Star,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Send,
  CreditCard,
  ClipboardList,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Mail,
  Megaphone,
  Users,
} from 'lucide-react'

// ============================================
// داده‌های نمونه (Mock Data)
// ============================================
const parentName = 'خانم کریمی'
const childName = 'علی کریمی'
const childGrade = 5
const childClass = 'پنجم الف'

// نمرات نمونه
const mockGrades = [
  { subject: 'ریاضی', score: 18.5, maxScore: 20, color: '#3B82F6' },
  { subject: 'فارسی', score: 17.0, maxScore: 20, color: '#10B981' },
  { subject: 'علوم', score: 19.0, maxScore: 20, color: '#8B5CF6' },
  { subject: 'اجتماعی', score: 16.5, maxScore: 20, color: '#F59E0B' },
  { subject: 'قرآن', score: 20.0, maxScore: 20, color: '#EC4899' },
  { subject: 'هنر', score: 18.0, maxScore: 20, color: '#06B6D4' },
]

// آخرین نمرات
const recentGrades = [
  { date: '۱۴۰۳/۰۹/۱۵', subject: 'ریاضی', type: 'آزمون', score: 18.5 },
  { date: '۱۴۰۳/۰۹/۱۲', subject: 'علوم', type: 'کلاسی', score: 19.0 },
  { date: '۱۴۰۳/۰۹/۱۰', subject: 'فارسی', type: 'تکلیف', score: 17.0 },
  { date: '۱۴۰۳/۰۹/۰۸', subject: 'قرآن', type: 'شفاهی', score: 20.0 },
]

// پیام‌ها
const mockMessages = [
  {
    id: '1',
    from: 'آقای احمدی (معلم کلاس)',
    title: 'گزارش هفتگی عملکرد',
    preview: 'عملکرد علی در این هفته بسیار خوب بوده...',
    date: '۲ ساعت پیش',
    isRead: false,
  },
  {
    id: '2',
    from: 'مدیریت مدرسه',
    title: 'جلسه اولیا و مربیان',
    preview: 'جلسه اولیا روز پنج‌شنبه ساعت ۱۶ برگزار...',
    date: 'دیروز',
    isRead: true,
  },
  {
    id: '3',
    from: 'معاونت آموزشی',
    title: 'برنامه امتحانات ترم اول',
    preview: 'برنامه امتحانات پایان ترم اول به پیوست...',
    date: '۳ روز پیش',
    isRead: true,
  },
]

// اطلاعیه‌ها
const mockAnnouncements = [
  { id: '1', title: 'تعطیلی مدرسه - روز دانش‌آموز', date: '۱۴۰۳/۰۹/۲۰' },
  { id: '2', title: 'اردوی علمی پارک فناوری', date: '۱۴۰۳/۰۹/۲۵' },
]

// یادآورها
const mockReminders = [
  { id: '1', title: 'مهلت پرداخت شهریه', date: '۱۴۰۳/۰۹/۳۰', type: 'financial', urgent: true },
  { id: '2', title: 'جلسه اولیا و مربیان', date: '۱۴۰۳/۰۹/۲۲', type: 'meeting', urgent: false },
  { id: '3', title: 'اردوی علمی', date: '۱۴۰۳/۰۹/۲۵', type: 'event', urgent: false },
]

// وضعیت مالی
const financialStatus = {
  totalTuition: 25000000,
  paid: 20000000,
  remaining: 5000000,
  dueDate: '۱۴۰۳/۰۹/۳۰',
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function ParentDashboardPage() {
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

  // فرمت پول
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
  }

  // میانگین نمرات
  const averageGrade = (mockGrades.reduce((sum, g) => sum + g.score, 0) / mockGrades.length).toFixed(2)

  // آمار کلی
  const stats = [
    { label: 'آخرین نمره', value: '18.5', icon: <Star className="w-6 h-6" />, color: 'bg-yellow-500', subtext: 'ریاضی' },
    { label: 'حضور ماه جاری', value: '95%', icon: <CheckCircle2 className="w-6 h-6" />, color: 'bg-green-500', subtext: '۱ غیبت' },
    { label: 'پیام‌های جدید', value: mockMessages.filter(m => !m.isRead).length, icon: <MessageSquare className="w-6 h-6" />, color: 'bg-blue-500', subtext: 'از مدرسه' },
    { label: 'بدهی شهریه', value: formatCurrency(financialStatus.remaining), icon: <Wallet className="w-6 h-6" />, color: 'bg-orange-500', subtext: `مهلت: ${financialStatus.dueDate}` },
  ]

  // دسترسی سریع
  const quickAccess = [
    { label: 'گزارش پیشرفت', href: '#', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
    { label: 'ارسال پیام به معلم', href: '#', icon: <Send className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
    { label: 'نظرسنجی', href: '#', icon: <ClipboardList className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
    { label: 'امور مالی', href: '#', icon: <CreditCard className="w-5 h-5" />, color: 'bg-orange-500', enabled: false },
    { label: 'پروفایل فرزندم', href: '#', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-pink-500', enabled: false },
    { label: 'آموزش هوشاگر', href: '/test-study-buddy', icon: <Sparkles className="w-5 h-5" />, color: 'bg-indigo-500', enabled: true },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                سلام، {parentName} 👋
              </h1>
              <p className="text-white/70">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm ml-2">
                  👨‍👩‍👧 ولی
                </span>
                <span className="bg-emerald-500/30 px-3 py-1 rounded-full text-sm ml-2">
                  فرزند: {childName} ({childClass})
                </span>
              </p>
              <p className="text-white/50 text-sm mt-2">{formatPersianDate()}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {mockMessages.filter(m => !m.isRead).length}
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
              <p className="text-white text-xl md:text-2xl font-bold">{stat.value}</p>
              <p className="text-white/40 text-xs mt-1">{stat.subtext}</p>
            </div>
          ))}
        </div>

        {/* ==================== Main Grid ==================== */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* ========== وضعیت تحصیلی فرزندم ========== */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                وضعیت تحصیلی {childName}
              </h2>
              <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm">
                معدل: {averageGrade}
              </div>
            </div>

            {/* نمودار میله‌ای نمرات */}
            <div className="mb-6">
              <h3 className="text-white/60 text-sm mb-3">نمرات به تفکیک درس</h3>
              <div className="space-y-3">
                {mockGrades.map((grade, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-white/70 text-sm w-16">{grade.subject}</span>
                    <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(grade.score / grade.maxScore) * 100}%`,
                          backgroundColor: grade.color,
                        }}
                      />
                    </div>
                    <span className="text-white font-bold w-12 text-left">{grade.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* آخرین نمرات */}
            <div className="mb-4">
              <h3 className="text-white/60 text-sm mb-3">آخرین نمرات ثبت شده</h3>
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-white/50 text-xs border-b border-white/10">
                      <th className="text-right p-3">تاریخ</th>
                      <th className="text-right p-3">درس</th>
                      <th className="text-center p-3">نوع</th>
                      <th className="text-center p-3">نمره</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGrades.map((grade, index) => (
                      <tr key={index} className="border-b border-white/5 last:border-0">
                        <td className="p-3 text-white/60 text-sm">{grade.date}</td>
                        <td className="p-3 text-white text-sm">{grade.subject}</td>
                        <td className="p-3 text-center">
                          <span className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded">
                            {grade.type}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-bold ${grade.score >= 17 ? 'text-green-400' : grade.score >= 14 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {grade.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button className="w-full bg-emerald-500/20 text-emerald-300 py-3 rounded-xl hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              مشاهده کارنامه کامل
            </button>
          </div>

          {/* ========== پیام‌ها و اطلاعیه‌ها ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                پیام‌ها
              </h2>
              {mockMessages.filter(m => !m.isRead).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {mockMessages.filter(m => !m.isRead).length} جدید
                </span>
              )}
            </div>

            {/* لیست پیام‌ها */}
            <div className="space-y-3 mb-4">
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  className={`bg-white/5 rounded-xl p-4 border transition-all hover:bg-white/10 cursor-pointer ${
                    message.isRead ? 'border-transparent' : 'border-blue-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      message.isRead ? 'bg-white/10' : 'bg-blue-500/20'
                    }`}>
                      <Mail className={`w-5 h-5 ${message.isRead ? 'text-white/50' : 'text-blue-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{message.title}</p>
                      <p className="text-white/50 text-xs truncate">{message.from}</p>
                      <p className="text-white/40 text-xs mt-1">{message.date}</p>
                    </div>
                    {!message.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full bg-blue-500/20 text-blue-300 py-2 rounded-xl hover:bg-blue-500/30 transition-all text-sm flex items-center justify-center gap-1">
              مشاهده همه پیام‌ها
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* اطلاعیه‌های مدرسه */}
            <div className="mt-6">
              <h3 className="text-white/60 text-sm mb-3 flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                اطلاعیه‌های مدرسه
              </h3>
              <div className="space-y-2">
                {mockAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
                  >
                    <p className="text-white text-sm">{announcement.title}</p>
                    <p className="text-yellow-400/70 text-xs mt-1">{announcement.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== دسترسی سریع و یادآورها ==================== */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* ========== دسترسی سریع ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              دسترسی سریع
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickAccess.map((item, index) => (
                <Link
                  key={index}
                  href={item.enabled ? item.href : '#'}
                  className={`bg-white/5 rounded-xl p-4 text-center transition-all group
                    ${item.enabled
                      ? 'hover:bg-white/10 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                    }`}
                  onClick={(e) => !item.enabled && e.preventDefault()}
                >
                  <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  {!item.enabled && (
                    <p className="text-white/40 text-xs mt-1">به زودی</p>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* ========== یادآورها ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-400" />
              یادآورها
            </h2>
            <div className="space-y-3">
              {mockReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`rounded-xl p-4 border flex items-center gap-3 ${
                    reminder.urgent
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    reminder.type === 'financial' ? 'bg-orange-500/20' :
                    reminder.type === 'meeting' ? 'bg-blue-500/20' :
                    'bg-purple-500/20'
                  }`}>
                    {reminder.type === 'financial' && <CreditCard className="w-5 h-5 text-orange-400" />}
                    {reminder.type === 'meeting' && <Users className="w-5 h-5 text-blue-400" />}
                    {reminder.type === 'event' && <Calendar className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{reminder.title}</p>
                    <p className="text-white/50 text-xs">{reminder.date}</p>
                  </div>
                  {reminder.urgent && (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== وضعیت مالی ==================== */}
        <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/30 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4 rounded-xl">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">وضعیت مالی</h3>
                <p className="text-white/60 text-sm">شهریه سال تحصیلی ۱۴۰۳-۱۴۰۴</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              <div className="text-center">
                <p className="text-white/60 text-xs">کل شهریه</p>
                <p className="text-white font-bold">{formatCurrency(financialStatus.totalTuition)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-xs">پرداخت شده</p>
                <p className="text-green-400 font-bold">{formatCurrency(financialStatus.paid)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-xs">مانده</p>
                <p className="text-orange-400 font-bold">{formatCurrency(financialStatus.remaining)}</p>
              </div>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              پرداخت آنلاین
            </button>
          </div>

          {/* نوار پیشرفت */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white/60 mb-1">
              <span>پیشرفت پرداخت</span>
              <span>{Math.round((financialStatus.paid / financialStatus.totalTuition) * 100)}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                style={{ width: `${(financialStatus.paid / financialStatus.totalTuition) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* ==================== ابزارهای آموزشی هوشاگر ==================== */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ابزارهای آموزشی هوشاگر</h3>
              <p className="text-white/60 text-sm">کمک به یادگیری بهتر فرزندتان</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/test-study-buddy" className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-white text-sm font-medium">دستیار مطالعه</p>
              <p className="text-white/40 text-xs">پاسخ به سوالات درسی</p>
            </Link>
            <Link href="/test-ocr" className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-white text-sm font-medium">حل مسئله</p>
              <p className="text-white/40 text-xs">با عکس از تکلیف</p>
            </Link>
            <Link href="/test-story" className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-pink-400" />
              </div>
              <p className="text-white text-sm font-medium">داستان‌ساز</p>
              <p className="text-white/40 text-xs">داستان‌های آموزنده</p>
            </Link>
            <Link href="/student/talent-garden" className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-white text-sm font-medium">باغ استعداد</p>
              <p className="text-white/40 text-xs">پیشرفت و امتیازات</p>
            </Link>
          </div>
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



















































