'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Bell,
  Settings,
  Trophy,
  Star,
  Clock,
  CheckCircle2,
  Circle,
  ChevronLeft,
  Sparkles,
  Brain,
  Lightbulb,
  Gamepad2,
  Calendar,
  Award,
  TrendingUp,
  Target,
  Zap,
  Medal,
  GraduationCap,
  FileText,
} from 'lucide-react'

// ============================================
// داده‌های نمونه (Mock Data)
// ============================================
const studentName = 'علی کریمی'
const studentGrade = 5
const studentClass = 'پنجم الف'
const studentAvatar = '🧑‍🎓'

// XP و Level
const xpData = {
  totalXp: 1250,
  level: 5,
  levelTitle: 'نابغه',
  xpForNextLevel: 250,
  xpInCurrentLevel: 150,
  rank: 3,
}

// تکالیف نمونه
const mockHomework = [
  { id: '1', subject: 'ریاضی', title: 'حل تمرینات صفحه ۴۵', dueDate: 'امروز', done: true },
  { id: '2', subject: 'فارسی', title: 'نوشتن انشا درباره طبیعت', dueDate: 'امروز', done: false },
  { id: '3', subject: 'علوم', title: 'خواندن فصل ۶', dueDate: 'فردا', done: false },
  { id: '4', subject: 'اجتماعی', title: 'تحقیق درباره جنگل‌های ایران', dueDate: 'فردا', done: false },
]

// نمرات اخیر
const recentGrades = [
  { id: '1', subject: 'ریاضی', score: 18.5, maxScore: 20, date: '۱۴۰۳/۰۹/۱۵', type: 'آزمون' },
  { id: '2', subject: 'علوم', score: 19.0, maxScore: 20, date: '۱۴۰۳/۰۹/۱۲', type: 'کلاسی' },
  { id: '3', subject: 'فارسی', score: 17.0, maxScore: 20, date: '۱۴۰۳/۰۹/۱۰', type: 'تکلیف' },
  { id: '4', subject: 'قرآن', score: 20.0, maxScore: 20, date: '۱۴۰۳/۰۹/۰۸', type: 'شفاهی' },
  { id: '5', subject: 'هنر', score: 18.0, maxScore: 20, date: '۱۴۰۳/۰۹/۰۵', type: 'پروژه' },
]

// برنامه کلاسی امروز
const todaySchedule = [
  { id: '1', subject: 'ریاضی', time: '۸:۰۰ - ۸:۴۵', teacher: 'آقای احمدی', icon: '🔢', color: 'bg-blue-500' },
  { id: '2', subject: 'فارسی', time: '۹:۰۰ - ۹:۴۵', teacher: 'خانم رضایی', icon: '📚', color: 'bg-green-500' },
  { id: '3', subject: 'ورزش', time: '۱۰:۰۰ - ۱۰:۴۵', teacher: 'آقای محمدی', icon: '⚽', color: 'bg-orange-500' },
  { id: '4', subject: 'علوم', time: '۱۱:۰۰ - ۱۱:۴۵', teacher: 'خانم کریمی', icon: '🔬', color: 'bg-purple-500' },
  { id: '5', subject: 'هنر', time: '۱۲:۰۰ - ۱۲:۴۵', teacher: 'خانم نوری', icon: '🎨', color: 'bg-pink-500' },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function StudentDashboardPage() {
  const [homework, setHomework] = useState(mockHomework)
  const [currentTime] = useState(new Date())

  // Toggle homework done status
  const toggleHomework = (id: string) => {
    setHomework(prev =>
      prev.map(hw =>
        hw.id === id ? { ...hw, done: !hw.done } : hw
      )
    )
  }

  // محاسبه پیشرفت تکالیف
  const homeworkProgress = Math.round(
    (homework.filter(hw => hw.done).length / homework.length) * 100
  )

  // محاسبه میانگین نمرات
  const averageGrade = (
    recentGrades.reduce((sum, g) => sum + g.score, 0) / recentGrades.length
  ).toFixed(1)

  // فرمت تاریخ شمسی
  const formatPersianDate = () => {
    return new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(currentTime)
  }

  // Get level progress percentage
  const levelProgress = Math.round(
    (xpData.xpInCurrentLevel / (xpData.xpInCurrentLevel + xpData.xpForNextLevel)) * 100
  )

  // ابزارهای یادگیری
  const learningTools = [
    { 
      label: 'دستیار مطالعه', 
      href: '/test-study-buddy', 
      icon: <Brain className="w-8 h-8" />, 
      color: 'from-purple-500 to-indigo-600',
      emoji: '🤖',
      description: 'سوالاتت رو بپرس!'
    },
    { 
      label: 'حل مسئله', 
      href: '/test-ocr', 
      icon: <Lightbulb className="w-8 h-8" />, 
      color: 'from-yellow-500 to-orange-600',
      emoji: '📸',
      description: 'عکس بگیر، جواب بگیر!'
    },
    { 
      label: 'داستان جادویی', 
      href: '/test-story', 
      icon: <Sparkles className="w-8 h-8" />, 
      color: 'from-pink-500 to-rose-600',
      emoji: '✨',
      description: 'داستان بساز!'
    },
    { 
      label: 'زمین بازی', 
      href: '#', 
      icon: <Gamepad2 className="w-8 h-8" />, 
      color: 'from-green-500 to-emerald-600',
      emoji: '🎮',
      description: 'به زودی...',
      disabled: true
    },
    { 
      label: 'باغ استعداد', 
      href: '/student/talent-garden', 
      icon: <Trophy className="w-8 h-8" />, 
      color: 'from-amber-500 to-yellow-600',
      emoji: '🏆',
      description: 'امتیاز جمع کن!'
    },
  ]

  // آمار کلی
  const stats = [
    { 
      label: 'امتیاز XP', 
      value: xpData.totalXp.toLocaleString('fa-IR'), 
      icon: <Zap className="w-6 h-6" />, 
      color: 'bg-yellow-500',
      subtext: `سطح ${xpData.level} - ${xpData.levelTitle}`,
      badge: `Lv.${xpData.level}`
    },
    { 
      label: 'میانگین نمرات', 
      value: averageGrade, 
      icon: <Star className="w-6 h-6" />, 
      color: 'bg-green-500',
      subtext: 'از ۲۰ نمره'
    },
    { 
      label: 'تکالیف امروز', 
      value: `${homework.filter(hw => hw.done).length}/${homework.filter(hw => hw.dueDate === 'امروز').length}`, 
      icon: <FileText className="w-6 h-6" />, 
      color: 'bg-blue-500',
      subtext: 'انجام شده'
    },
    { 
      label: 'رتبه در کلاس', 
      value: `#${xpData.rank}`, 
      icon: <Medal className="w-6 h-6" />, 
      color: 'bg-purple-500',
      subtext: 'از ۳۲ نفر'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg ring-4 ring-yellow-400/30">
                  {studentAvatar}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                  Lv.{xpData.level}
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  سلام، {studentName}! 👋
                </h1>
                <p className="text-white/70">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm ml-2">
                    🎓 {studentClass}
                  </span>
                  <span className="bg-purple-500/30 px-3 py-1 rounded-full text-sm">
                    پایه {studentGrade}
                  </span>
                </p>
                <p className="text-white/50 text-sm mt-2">{formatPersianDate()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* XP Mini Display */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl px-4 py-2 border border-yellow-500/30">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">{xpData.totalXp} XP</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full mt-1 w-24 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
              <button className="relative p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
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
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${stat.color} p-3 rounded-xl shadow-lg text-white group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                {stat.badge && (
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                    {stat.badge}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-white text-2xl md:text-3xl font-bold">{stat.value}</p>
              <p className="text-white/40 text-xs mt-1">{stat.subtext}</p>
            </div>
          ))}
        </div>

        {/* ==================== Main Grid ==================== */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* ========== تکالیف من ========== */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                تکالیف من
                <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                  {homework.length} تکلیف
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">{homeworkProgress}%</span>
                <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${homeworkProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {homework.map((hw) => (
                <div
                  key={hw.id}
                  className={`bg-white/5 rounded-xl p-4 border transition-all cursor-pointer hover:bg-white/10 ${
                    hw.done ? 'border-green-500/30' : 'border-white/10'
                  }`}
                  onClick={() => toggleHomework(hw.id)}
                >
                  <div className="flex items-center gap-3">
                    <button className="flex-shrink-0">
                      {hw.done ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-white/40" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${hw.done ? 'text-white/50 line-through' : 'text-white'}`}>
                          {hw.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded">
                          {hw.subject}
                        </span>
                        <span className={`text-xs ${hw.dueDate === 'امروز' ? 'text-orange-400' : 'text-white/50'}`}>
                          📅 {hw.dueDate}
                        </span>
                      </div>
                    </div>
                    {hw.done && (
                      <span className="text-green-400 text-sm">✓ انجام شد!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Summary */}
            <div className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">پیشرفت امروز</span>
                </div>
                <span className="text-green-400 font-bold text-lg">{homeworkProgress}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${homeworkProgress}%` }}
                />
              </div>
              <p className="text-white/50 text-xs mt-2">
                {homework.filter(hw => hw.done).length} از {homework.length} تکلیف انجام شده
              </p>
            </div>
          </div>

          {/* ========== برنامه امروز ========== */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-pink-400" />
              برنامه امروز
            </h2>

            <div className="space-y-3">
              {todaySchedule.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-all"
                >
                  <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{item.subject}</p>
                    <p className="text-white/50 text-xs">{item.teacher}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-white/70 text-sm font-mono">{item.time}</p>
                    {index === 0 && (
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded">
                        الان
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== نمرات اخیر ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              نمرات اخیر
            </h2>
            <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
              میانگین: {averageGrade}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/50 text-sm border-b border-white/10">
                  <th className="text-right pb-3 font-medium">درس</th>
                  <th className="text-center pb-3 font-medium">نوع</th>
                  <th className="text-center pb-3 font-medium">نمره</th>
                  <th className="text-center pb-3 font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <span className="text-white font-medium">{grade.subject}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded">
                        {grade.type}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-bold text-lg ${
                        grade.score >= 17 ? 'text-green-400' : 
                        grade.score >= 14 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {grade.score}
                      </span>
                      <span className="text-white/40 text-xs">/{grade.maxScore}</span>
                    </td>
                    <td className="py-3 text-center text-white/60 text-sm">{grade.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================== ابزارهای یادگیری ==================== */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl p-6 border border-purple-500/30 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">ابزارهای جادویی یادگیری ✨</h3>
              <p className="text-white/60 text-sm">با هوش مصنوعی بهتر یاد بگیر!</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {learningTools.map((tool, index) => (
              <Link
                key={index}
                href={tool.disabled ? '#' : tool.href}
                className={`bg-gradient-to-br ${tool.color} rounded-2xl p-4 text-center transition-all group relative overflow-hidden
                  ${tool.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl cursor-pointer'}
                `}
                onClick={(e) => tool.disabled && e.preventDefault()}
              >
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/30" />
                  <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-white/20" />
                </div>
                
                <div className="relative z-10">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                    {tool.emoji}
                  </div>
                  <p className="text-white font-bold text-sm mb-1">{tool.label}</p>
                  <p className="text-white/70 text-xs">{tool.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ==================== دکمه باغ استعداد ==================== */}
        <Link
          href="/student/talent-garden"
          className="block bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-6 mb-6 hover:shadow-2xl hover:shadow-orange-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                🏆
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">باغ استعداد</h3>
                <p className="text-white/80">امتیاز جمع کن، سطح بالا ببر، نشان بگیر!</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-white/80 text-sm">امتیاز فعلی</p>
              <p className="text-white text-3xl font-bold">{xpData.totalXp} XP</p>
              <div className="flex items-center gap-1 mt-1">
                <Award className="w-4 h-4 text-yellow-300" />
                <span className="text-yellow-300 text-sm">رتبه {xpData.rank}</span>
              </div>
            </div>
            <ChevronLeft className="w-8 h-8 text-white/50 group-hover:translate-x-[-4px] transition-transform" />
          </div>
        </Link>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-4">
          <p>🎓 یادگیری با هوشاگر، لذت‌بخش و هوشمند!</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}

