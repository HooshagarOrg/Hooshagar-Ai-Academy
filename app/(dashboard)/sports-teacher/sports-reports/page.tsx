'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Dumbbell,
  ArrowRight,
  User,
  Star,
  Save,
  Loader2,
  CheckCircle2,
  FileText,
  Target,
  Users,
  Shield,
  TrendingUp,
  Activity,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface Student {
  id: string
  name: string
  className: string
}

interface SportsReport {
  studentId: string
  activityType: string
  skills: {
    technical: number
    teamSpirit: number
    discipline: number
    progress: number
  }
  notes: string
}

// ============================================
// داده‌های نمونه
// ============================================
const students: Student[] = [
  { id: '1', name: 'علی محمدی', className: 'چهارم الف' },
  { id: '2', name: 'سارا رضایی', className: 'چهارم الف' },
  { id: '3', name: 'محمد احمدی', className: 'چهارم ب' },
  { id: '4', name: 'زهرا کریمی', className: 'پنجم الف' },
  { id: '5', name: 'امیر حسینی', className: 'پنجم ب' },
  { id: '6', name: 'فاطمه نوری', className: 'ششم الف' },
]

const sportsActivities = [
  { value: 'football', label: 'فوتبال', emoji: '⚽' },
  { value: 'basketball', label: 'بسکتبال', emoji: '🏀' },
  { value: 'volleyball', label: 'والیبال', emoji: '🏐' },
  { value: 'gymnastics', label: 'ژیمناستیک', emoji: '🤸' },
  { value: 'running', label: 'دو و میدانی', emoji: '🏃' },
  { value: 'swimming', label: 'شنا', emoji: '🏊' },
  { value: 'tabletennis', label: 'تنیس روی میز', emoji: '🏓' },
  { value: 'general', label: 'تمرینات عمومی', emoji: '🎯' },
]

const skills = [
  { key: 'technical', label: 'مهارت فنی', icon: Target },
  { key: 'teamSpirit', label: 'روحیه تیمی', icon: Users },
  { key: 'discipline', label: 'انضباط', icon: Shield },
  { key: 'progress', label: 'پیشرفت', icon: TrendingUp },
]

const recentReports = [
  { id: '1', studentName: 'امیر حسینی', activity: 'فوتبال', rating: 5, date: '۱۴۰۳/۰۹/۱۴' },
  { id: '2', studentName: 'علی محمدی', activity: 'بسکتبال', rating: 4, date: '۱۴۰۳/۰۹/۱۳' },
  { id: '3', studentName: 'محمد احمدی', activity: 'دو و میدانی', rating: 4, date: '۱۴۰۳/۰۹/۱۲' },
]

// ============================================
// کامپوننت Star Rating
// ============================================
interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  label: string
  icon: React.ComponentType<{ className?: string }>
}

function StarRating({ value, onChange, label, icon: Icon }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-green-400" />
        <span className="text-white font-medium">{label}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hovered || value)
                  ? 'text-green-400 fill-green-400'
                  : 'text-white/20'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function SportsReportsPage() {
  const [formData, setFormData] = useState<SportsReport>({
    studentId: '',
    activityType: '',
    skills: {
      technical: 0,
      teamSpirit: 0,
      discipline: 0,
      progress: 0,
    },
    notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const updateSkill = (skillKey: string, value: number): void => {
    setFormData({
      ...formData,
      skills: { ...formData.skills, [skillKey]: value }
    })
  }

  const handleSubmit = async (): Promise<void> => {
    if (!formData.studentId || !formData.activityType) {
      alert('لطفاً دانش‌آموز و نوع فعالیت را انتخاب کنید.')
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/sports-teacher"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Dumbbell className="w-8 h-8 text-green-400" />
                گزارش درس ورزش
              </h1>
              <p className="text-white/60 mt-1">
                ثبت ارزیابی مهارت‌های ورزشی دانش‌آموزان
              </p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ==================== فرم ==================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* انتخاب دانش‌آموز */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-400" />
                انتخاب دانش‌آموز
              </h2>
              <select
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="" className="bg-slate-800">انتخاب کنید...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-800">
                    {s.name} - {s.className}
                  </option>
                ))}
              </select>
            </div>

            {/* نوع فعالیت ورزشی */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                نوع فعالیت ورزشی
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sportsActivities.map((activity) => {
                  const isSelected = formData.activityType === activity.value
                  return (
                    <button
                      key={activity.value}
                      onClick={() => setFormData({ ...formData, activityType: activity.value })}
                      className={`p-4 rounded-xl border transition-all text-center ${
                        isSelected
                          ? 'bg-green-500/20 border-green-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-3xl block mb-2">{activity.emoji}</span>
                      <span className={`text-sm ${isSelected ? 'text-white' : 'text-white/60'}`}>
                        {activity.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ارزیابی مهارت‌ها */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                ارزیابی مهارت‌ها
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {skills.map((skill) => (
                  <StarRating
                    key={skill.key}
                    value={formData.skills[skill.key as keyof typeof formData.skills]}
                    onChange={(value) => updateSkill(skill.key, value)}
                    label={skill.label}
                    icon={skill.icon}
                  />
                ))}
              </div>
            </div>

            {/* توضیحات */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <label className="text-white/70 text-sm mb-2 block">توضیحات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="توضیحات تکمیلی درباره عملکرد ورزشی..."
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none leading-relaxed"
              />
            </div>

            {/* دکمه ثبت */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all
                ${isSubmitting
                  ? 'bg-white/20 text-white/50 cursor-not-allowed'
                  : isSubmitted
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30'
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  در حال ثبت...
                </>
              ) : isSubmitted ? (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  گزارش ثبت شد!
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  ثبت گزارش ورزش
                </>
              )}
            </button>
          </div>

          {/* ==================== گزارش‌های اخیر ==================== */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" />
                گزارش‌های اخیر
              </h2>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white/5 rounded-xl p-3 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{report.studentName}</span>
                      <div className="flex">
                        {[...Array(report.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-green-400 fill-green-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-1">{report.activity}</p>
                    <span className="text-white/50 text-xs">{report.date}</span>
                  </div>
                ))}
              </div>

              {/* آمار سریع */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-white/70 text-sm mb-3">آمار این هفته</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">۱۸</p>
                    <p className="text-white/50 text-xs">گزارش ثبت شده</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">۴.۲</p>
                    <p className="text-white/50 text-xs">میانگین امتیاز</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}







