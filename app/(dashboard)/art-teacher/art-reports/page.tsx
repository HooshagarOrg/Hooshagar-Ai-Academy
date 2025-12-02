'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Brush,
  ArrowRight,
  User,
  Star,
  Save,
  Loader2,
  CheckCircle2,
  FileText,
  Upload,
  X,
  Image as ImageIcon,
  Palette,
  Lightbulb,
  Target,
  Focus,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface Student {
  id: string
  name: string
  className: string
}

interface ArtReport {
  studentId: string
  topic: string
  skills: {
    colorUsage: number
    creativity: number
    precision: number
    focus: number
  }
  artworkImage: string | null
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

const artTopics = [
  'نقاشی با آبرنگ',
  'نقاشی با مداد رنگی',
  'کاردستی',
  'طراحی',
  'خوشنویسی',
  'کلاژ',
  'سفالگری',
  'اوریگامی',
]

const skills = [
  { key: 'colorUsage', label: 'استفاده از رنگ', icon: Palette },
  { key: 'creativity', label: 'خلاقیت', icon: Lightbulb },
  { key: 'precision', label: 'دقت در کار', icon: Target },
  { key: 'focus', label: 'تمرکز', icon: Focus },
]

const recentReports = [
  { id: '1', studentName: 'سارا رضایی', topic: 'نقاشی با آبرنگ', rating: 5, date: '۱۴۰۳/۰۹/۱۴' },
  { id: '2', studentName: 'زهرا کریمی', topic: 'کاردستی', rating: 4, date: '۱۴۰۳/۰۹/۱۳' },
  { id: '3', studentName: 'فاطمه نوری', topic: 'طراحی', rating: 5, date: '۱۴۰۳/۰۹/۱۲' },
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
        <Icon className="w-5 h-5 text-orange-400" />
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
                  ? 'text-orange-400 fill-orange-400'
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
export default function ArtReportsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<ArtReport>({
    studentId: '',
    topic: '',
    skills: {
      colorUsage: 0,
      creativity: 0,
      precision: 0,
      focus: 0,
    },
    artworkImage: null,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, artworkImage: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (): void => {
    setFormData({ ...formData, artworkImage: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (!formData.studentId || !formData.topic) {
      alert('لطفاً دانش‌آموز و موضوع درس را انتخاب کنید.')
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-600 to-pink-700 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/art-teacher"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Brush className="w-8 h-8 text-orange-300" />
                گزارش درس هنر
              </h1>
              <p className="text-white/60 mt-1">
                ثبت ارزیابی مهارت‌های هنری دانش‌آموزان
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
                <User className="w-5 h-5 text-orange-300" />
                اطلاعات پایه
              </h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">انتخاب دانش‌آموز</label>
                    <select
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
                    <label className="text-white/70 text-sm mb-2 block">موضوع درس</label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      <option value="" className="bg-slate-800">انتخاب کنید...</option>
                      {artTopics.map(topic => (
                        <option key={topic} value={topic} className="bg-slate-800">
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ارزیابی مهارت‌ها */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-400" />
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

            {/* آپلود نمونه کار */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-300" />
                نمونه کار
              </h2>

              {formData.artworkImage ? (
                <div className="relative">
                  <img
                    src={formData.artworkImage}
                    alt="نمونه کار"
                    className="w-full max-h-64 object-contain rounded-xl"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 left-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-all"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400/50 hover:bg-white/5 transition-all"
                >
                  <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/60">کلیک کنید یا تصویر را بکشید</p>
                  <p className="text-white/40 text-sm mt-1">PNG, JPG تا 5MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* توضیحات */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <label className="text-white/70 text-sm mb-2 block">توضیحات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="توضیحات تکمیلی درباره کار هنری..."
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none leading-relaxed"
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
                    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/30'
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
                  ثبت گزارش هنر
                </>
              )}
            </button>
          </div>

          {/* ==================== گزارش‌های اخیر ==================== */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-300" />
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
                          <Star key={i} className="w-3 h-3 text-orange-400 fill-orange-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-1">{report.topic}</p>
                    <span className="text-white/50 text-xs">{report.date}</span>
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










