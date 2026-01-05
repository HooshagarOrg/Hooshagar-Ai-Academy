'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Palette,
  ArrowRight,
  User,
  
  Star,
  Save,
  Loader2,
  CheckCircle2,
  FileText,
  Users,
  Lightbulb,
  Heart,
  Shield,
  Award,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
type ActivityType = 'cultural' | 'social' | 'artistic' | 'scientific'

interface Student {
  id: string
  name: string
  className: string
}

interface ActivityReport {
  studentId: string
  activityType: ActivityType
  title: string
  date: string
  skills: {
    creativity: number
    leadership: number
    teamwork: number
    responsibility: number
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

const activityTypes = [
  { value: 'cultural', label: 'فرهنگی', icon: Heart, color: 'red' },
  { value: 'social', label: 'اجتماعی', icon: Users, color: 'blue' },
  { value: 'artistic', label: 'هنری', icon: Palette, color: 'purple' },
  { value: 'scientific', label: 'علمی', icon: Lightbulb, color: 'green' },
]

const skills = [
  { key: 'creativity', label: 'خلاقیت', icon: Lightbulb },
  { key: 'leadership', label: 'رهبری', icon: Award },
  { key: 'teamwork', label: 'کار تیمی', icon: Users },
  { key: 'responsibility', label: 'مسئولیت‌پذیری', icon: Shield },
]

const recentActivities = [
  { id: '1', studentName: 'علی محمدی', title: 'مسابقه نقاشی', type: 'هنری', date: '۱۴۰۳/۰۹/۱۴' },
  { id: '2', studentName: 'سارا رضایی', title: 'کمک به همکلاسی', type: 'اجتماعی', date: '۱۴۰۳/۰۹/۱۳' },
  { id: '3', studentName: 'زهرا کریمی', title: 'نمایش صبحگاه', type: 'فرهنگی', date: '۱۴۰۳/۰۹/۱۲' },
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
        <Icon className="w-5 h-5 text-yellow-400" />
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
                  ? 'text-yellow-400 fill-yellow-400'
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
export default function ActivitiesPage() {
  const [formData, setFormData] = useState<ActivityReport>({
    studentId: '',
    activityType: 'cultural',
    title: '',
    date: '',
    skills: {
      creativity: 0,
      leadership: 0,
      teamwork: 0,
      responsibility: 0,
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
    if (!formData.studentId || !formData.title || !formData.date) {
      alert('لطفاً فیلدهای ضروری را پر کنید.')
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-700 to-rose-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/educational-vp"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Palette className="w-8 h-8 text-pink-400" />
                فعالیت‌های پرورشی
              </h1>
              <p className="text-white/60 mt-1">
                ثبت فعالیت‌های فرهنگی، اجتماعی، هنری و علمی
              </p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ==================== فرم ==================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* اطلاعات پایه */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-pink-400" />
                اطلاعات فعالیت
              </h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">انتخاب دانش‌آموز</label>
                    <select
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    >
                      <option value="" className="bg-slate-800">انتخاب کنید...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id} className="bg-slate-800">
                          {s.name} - {s.className}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">تاریخ فعالیت</label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="۱۴۰۳/۰۹/۱۵"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">عنوان فعالیت</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: مسابقه نقاشی، کمک به نیازمندان..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                </div>
              </div>
            </div>

            {/* نوع فعالیت */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4">نوع فعالیت</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {activityTypes.map((type) => {
                  const Icon = type.icon
                  const isSelected = formData.activityType === type.value
                  return (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, activityType: type.value as ActivityType })}
                      className={`p-4 rounded-xl border transition-all text-center ${
                        isSelected
                          ? 'bg-white/20 border-white/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${
                        isSelected ? 'text-white' : 'text-white/50'
                      }`} />
                      <span className={`text-sm ${isSelected ? 'text-white' : 'text-white/60'}`}>
                        {type.label}
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
                placeholder="توضیحات تکمیلی درباره فعالیت..."
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none leading-relaxed"
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
                    : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/30'
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
                  فعالیت ثبت شد!
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  ثبت فعالیت
                </>
              )}
            </button>
          </div>

          {/* ==================== فعالیت‌های اخیر ==================== */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-400" />
                فعالیت‌های اخیر
              </h2>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white/5 rounded-xl p-3 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{activity.studentName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300">
                        {activity.type}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-1">{activity.title}</p>
                    <span className="text-white/50 text-xs">{activity.date}</span>
                  </div>
                ))}
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

















































