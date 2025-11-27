'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  UserCheck,
  Brain,
  Bell,
  Settings,
  Plus,
  ChevronLeft,
  BarChart3,
  FileText,
  Upload,
  AlertTriangle,
  Shield,
  Activity,
  TrendingUp,
  Server,
  Database,
  Cpu,
  Eye,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  PieChart,
  LineChart,
} from 'lucide-react'

// ============================================
// داده‌های نمونه (Mock Data)
// ============================================
const adminName = 'آقای مدیری'

// مدارس نمونه
const mockSchools = [
  { 
    id: '1', 
    name: 'دبستان تلاش', 
    city: 'تهران',
    students: 45, 
    staff: 12, 
    status: 'active',
    type: 'دبستان',
    aiUsageToday: 5
  },
  { 
    id: '2', 
    name: 'دبستان امیدان تلاش', 
    city: 'تهران',
    students: 38, 
    staff: 10, 
    status: 'active',
    type: 'دبستان',
    aiUsageToday: 4
  },
  { 
    id: '3', 
    name: 'دبستان پیوند ۲', 
    city: 'تهران',
    students: 25, 
    staff: 8, 
    status: 'active',
    type: 'دبستان',
    aiUsageToday: 3
  },
  { 
    id: '4', 
    name: 'پیش‌دبستانی تلاش', 
    city: 'تهران',
    students: 12, 
    staff: 5, 
    status: 'active',
    type: 'پیش‌دبستان',
    aiUsageToday: 3
  },
]

// آمار تحلیل‌های AI - 7 روز اخیر
const weeklyAIStats = [
  { day: 'شنبه', analyses: 12, stories: 8, ocr: 5 },
  { day: 'یکشنبه', analyses: 15, stories: 10, ocr: 7 },
  { day: 'دوشنبه', analyses: 18, stories: 12, ocr: 8 },
  { day: 'سه‌شنبه', analyses: 14, stories: 9, ocr: 6 },
  { day: 'چهارشنبه', analyses: 20, stories: 14, ocr: 10 },
  { day: 'پنج‌شنبه', analyses: 8, stories: 5, ocr: 3 },
  { day: 'جمعه', analyses: 5, stories: 3, ocr: 2 },
]

// هشدارها
const mockAlerts = [
  { id: '1', type: 'technical', title: 'مشکل اتصال به سرور AI', message: 'تأخیر در پاسخ‌دهی Gemini API', severity: 'high', time: '۱۰ دقیقه پیش' },
  { id: '2', type: 'support', title: 'درخواست پشتیبانی جدید', message: 'مدرسه فردوسی - مشکل در ثبت نمرات', severity: 'medium', time: '۳۰ دقیقه پیش' },
  { id: '3', type: 'report', title: 'گزارش ماهانه آماده است', message: 'گزارش عملکرد شهریور ماه', severity: 'low', time: '۲ ساعت پیش' },
]

// آمار استفاده از ابزارها
const toolUsageStats = [
  { name: 'تحلیل دانش‌آموز', value: 35, color: '#3B82F6' },
  { name: 'حل مسئله (OCR)', value: 25, color: '#10B981' },
  { name: 'داستان‌ساز', value: 20, color: '#F59E0B' },
  { name: 'دستیار مطالعه', value: 15, color: '#8B5CF6' },
  { name: 'باغ استعداد', value: 5, color: '#EC4899' },
]

// وضعیت سرویس‌ها
const serviceStatus = [
  { name: 'Gemini API', status: 'operational', latency: '120ms' },
  { name: 'Supabase DB', status: 'operational', latency: '45ms' },
  { name: 'Auth Service', status: 'operational', latency: '30ms' },
  { name: 'Storage (Arvan)', status: 'degraded', latency: '250ms' },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function AdminDashboardPage() {
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

  // آمار کلی
  const totalStudents = mockSchools.reduce((sum, s) => sum + s.students, 0)
  const totalStaff = mockSchools.reduce((sum, s) => sum + s.staff, 0)
  const totalAIToday = mockSchools.reduce((sum, s) => sum + s.aiUsageToday, 0)

  const stats = [
    { 
      label: 'مدارس فعال', 
      value: mockSchools.filter(s => s.status === 'active').length, 
      total: mockSchools.length,
      icon: <Building2 className="w-6 h-6" />, 
      color: 'bg-blue-500',
      trend: '+2 این ماه'
    },
    { 
      label: 'کل دانش‌آموزان', 
      value: totalStudents.toLocaleString('fa-IR'), 
      icon: <Users className="w-6 h-6" />, 
      color: 'bg-green-500',
      trend: '+۱۲۰ این ماه'
    },
    { 
      label: 'کل کارکنان', 
      value: totalStaff.toLocaleString('fa-IR'), 
      icon: <UserCheck className="w-6 h-6" />, 
      color: 'bg-purple-500',
      trend: '+۸ این ماه'
    },
    { 
      label: 'تحلیل‌های AI امروز', 
      value: totalAIToday.toLocaleString('fa-IR'), 
      icon: <Brain className="w-6 h-6" />, 
      color: 'bg-orange-500',
      trend: '+۱۵% نسبت به دیروز'
    },
  ]

  // دکمه‌های مدیریت سریع
  const quickActions = [
    { label: 'مدیریت مدارس', href: '#', icon: <Building2 className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
    { label: 'مدیریت کاربران', href: '#', icon: <Users className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
    { label: 'گزارش‌های جامع', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
    { label: 'تنظیمات پلتفرم', href: '#', icon: <Settings className="w-5 h-5" />, color: 'bg-slate-500', enabled: false },
    { label: 'تحلیل‌های هوشمند', href: '/test-students-list', icon: <Brain className="w-5 h-5" />, color: 'bg-orange-500', enabled: true },
    { label: 'آپلود گروهی', href: '#', icon: <Upload className="w-5 h-5" />, color: 'bg-teal-500', enabled: false },
  ]

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500/50 bg-red-500/10 text-red-400'
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
      case 'low': return 'border-blue-500/50 bg-blue-500/10 text-blue-400'
      default: return 'border-gray-500/50 bg-gray-500/10 text-gray-400'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-400 bg-green-500/20'
      case 'degraded': return 'text-yellow-400 bg-yellow-500/20'
      case 'down': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'عملیاتی'
      case 'degraded': return 'کاهش سرعت'
      case 'down': return 'قطع'
      default: return 'نامشخص'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                پنل مدیریت پلتفرم 🎛️
              </h1>
              <p className="text-white/70">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 rounded-full text-sm ml-2">
                  👨‍💼 مدیر کل پلتفرم
                </span>
                {adminName}
              </p>
              <p className="text-white/50 text-sm mt-2">{formatPersianDate()}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Service Status Indicator */}
              <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white/70 text-sm">سیستم عملیاتی</span>
              </div>
              <button className="relative p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {mockAlerts.length}
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
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${stat.color} p-3 rounded-xl shadow-lg text-white`}>
                  {stat.icon}
                </div>
                {stat.total && (
                  <span className="text-white/40 text-sm">از {stat.total}</span>
                )}
              </div>
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-white text-2xl md:text-3xl font-bold">{stat.value}</p>
              <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.trend}
              </p>
            </div>
          ))}
        </div>

        {/* ==================== Main Grid ==================== */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* ========== مدارس من ========== */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                مدارس تحت پوشش
              </h2>
              <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all text-sm">
                <Plus className="w-4 h-4" />
                افزودن مدرسه
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {mockSchools.map((school) => (
                <div
                  key={school.id}
                  className={`bg-white/5 rounded-xl p-4 border transition-all hover:bg-white/10 ${
                    school.status === 'active' ? 'border-green-500/30' : 'border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold">{school.name}</h3>
                      <p className="text-white/50 text-sm">{school.city} • {school.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      school.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {school.status === 'active' ? 'فعال' : 'در انتظار'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white font-bold">{school.students}</p>
                      <p className="text-white/50 text-xs">دانش‌آموز</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white font-bold">{school.staff}</p>
                      <p className="text-white/50 text-xs">کارکنان</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-orange-400 font-bold">{school.aiUsageToday}</p>
                      <p className="text-white/50 text-xs">AI امروز</p>
                    </div>
                  </div>

                  <button className="w-full bg-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" />
                    مشاهده جزئیات
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ========== وضعیت سرویس‌ها ========== */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-green-400" />
              وضعیت سرویس‌ها
            </h2>

            <div className="space-y-3 mb-6">
              {serviceStatus.map((service, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'operational' ? 'bg-green-500' :
                      service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-white text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-xs font-mono">{service.latency}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(service.status)}`}>
                      {getStatusText(service.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* System Resources */}
            <h3 className="text-white/60 text-sm mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              منابع سیستم
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">CPU</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Memory</span>
                  <span className="text-white">62%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Storage</span>
                  <span className="text-white">28%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '28%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== آمار عملکرد ==================== */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* ========== نمودار تحلیل‌های AI ========== */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <LineChart className="w-5 h-5 text-blue-400" />
              روند استفاده از AI (۷ روز اخیر)
            </h2>

            {/* Simple Bar Chart - 7 Days */}
            <div className="space-y-3">
              {weeklyAIStats.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">{item.day}</span>
                    <span className="text-white">{(item.analyses + item.stories + item.ocr).toLocaleString('fa-IR')}</span>
                  </div>
                  <div className="h-6 bg-white/10 rounded-lg overflow-hidden flex">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(item.analyses / 25) * 40}%` }}
                      title={`تحلیل: ${item.analyses}`}
                    />
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(item.stories / 25) * 30}%` }}
                      title={`داستان: ${item.stories}`}
                    />
                    <div 
                      className="h-full bg-orange-500 transition-all"
                      style={{ width: `${(item.ocr / 25) * 20}%` }}
                      title={`OCR: ${item.ocr}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-white/60">تحلیل</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-white/60">داستان</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-white/60">OCR</span>
              </div>
            </div>
          </div>

          {/* ========== استفاده از ابزارها ========== */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-400" />
              سهم ابزارهای مختلف
            </h2>

            {/* Simple Percentage Bars */}
            <div className="space-y-4">
              {toolUsageStats.map((tool, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{tool.name}</span>
                    <span className="text-white/70">{tool.value}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${tool.value}%`, backgroundColor: tool.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total API Calls Today */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">درخواست‌های API امروز</span>
                </div>
                <span className="text-purple-400 font-bold text-2xl">{totalAIToday.toLocaleString('fa-IR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== مدیریت سریع و هشدارها ==================== */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* ========== مدیریت سریع ========== */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-400" />
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

          {/* ========== هشدارها ========== */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              هشدارها و اعلان‌ها
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {mockAlerts.length}
              </span>
            </h2>
            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl p-4 border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {alert.type === 'technical' && <Server className="w-5 h-5" />}
                      {alert.type === 'support' && <MessageSquare className="w-5 h-5" />}
                      {alert.type === 'report' && <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{alert.title}</p>
                      <p className="text-white/60 text-xs mt-1">{alert.message}</p>
                      <p className="text-white/40 text-xs mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.time}
                      </p>
                    </div>
                    <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                      <Eye className="w-4 h-4 text-white/70" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 bg-white/10 text-white py-2 rounded-xl hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-1">
              مشاهده همه اعلان‌ها
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==================== دکمه‌های عملیاتی ==================== */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30">
            <Building2 className="w-5 h-5" />
            افزودن مدرسه جدید
          </button>
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-500/30">
            <Upload className="w-5 h-5" />
            آپلود گروهی کاربران
          </button>
          <button className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-500/30">
            <BarChart3 className="w-5 h-5" />
            دانلود گزارش ماهانه
          </button>
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-4">
          <p>پنل مدیریت پلتفرم هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰ | آخرین بروزرسانی: {formatPersianDate()}</p>
        </footer>
      </div>
    </div>
  )
}

