'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  Users,
  Calendar,
  ChevronDown,
  Check,
  X,
  Eye,
  ArrowRight,
  ThumbsUp,
  AlertTriangle,
  FileText,
  Sparkles,
  Save,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface Student {
  id: string
  name: string
  grade: number
  className: string
}

interface BehaviorItem {
  id: string
  label: string
  checked: boolean
}

interface BehaviorReport {
  id: string
  studentId: string
  studentName: string
  date: string
  positiveCount: number
  negativeCount: number
  description: string
}

// ============================================
// داده‌های نمونه
// ============================================
const mockStudents: Student[] = [
  { id: '1', name: 'علی محمدی', grade: 5, className: 'پنجم الف' },
  { id: '2', name: 'زهرا حسینی', grade: 5, className: 'پنجم الف' },
  { id: '3', name: 'محمد رضایی', grade: 5, className: 'پنجم الف' },
  { id: '4', name: 'فاطمه کریمی', grade: 5, className: 'پنجم الف' },
  { id: '5', name: 'امیر صادقی', grade: 5, className: 'پنجم الف' },
  { id: '6', name: 'مریم نوری', grade: 5, className: 'پنجم الف' },
]

const mockReports: BehaviorReport[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'علی محمدی',
    date: '۱۴۰۳/۰۹/۱۵',
    positiveCount: 5,
    negativeCount: 1,
    description: 'مشارکت فعال در کلاس داشت اما یکبار بدون اجازه صحبت کرد.',
  },
  {
    id: '2',
    studentId: '3',
    studentName: 'محمد رضایی',
    date: '۱۴۰۳/۰۹/۱۴',
    positiveCount: 2,
    negativeCount: 3,
    description: 'نیاز به توجه بیشتر در زمینه رفتار با همکلاسی‌ها دارد.',
  },
  {
    id: '3',
    studentId: '2',
    studentName: 'زهرا حسینی',
    date: '۱۴۰۳/۰۹/۱۳',
    positiveCount: 8,
    negativeCount: 0,
    description: 'عملکرد عالی و رفتار نمونه در تمام زمینه‌ها.',
  },
]

// رفتارهای مثبت
const initialPositiveBehaviors: BehaviorItem[] = [
  { id: 'positive-1', label: 'تعامل مثبت با همکلاسی‌ها', checked: false },
  { id: 'positive-2', label: 'رفتار و بیان مؤدبانه', checked: false },
  { id: 'positive-3', label: 'رعایت قوانین مدرسه', checked: false },
  { id: 'positive-4', label: 'رعایت ادب و احترام', checked: false },
  { id: 'positive-5', label: 'رعایت بهداشت فردی', checked: false },
  { id: 'positive-6', label: 'رعایت آراستگی', checked: false },
  { id: 'positive-7', label: 'خلاقیت و نوآوری', checked: false },
  { id: 'positive-8', label: 'رفتارهای همکاری‌جویانه', checked: false },
  { id: 'positive-9', label: 'رعایت نظم وسایل', checked: false },
  { id: 'positive-10', label: 'رعایت نظم کلاسی', checked: false },
  { id: 'positive-11', label: 'مشارکت فعال در کلاس', checked: false },
  { id: 'positive-12', label: 'کمک به دیگران', checked: false },
]

// رفتارهای نیازمند بهبود
const initialNegativeBehaviors: BehaviorItem[] = [
  { id: 'negative-1', label: 'عدم مشارکت و تعامل در کلاس', checked: false },
  { id: 'negative-2', label: 'بی‌ادبی و بی‌احترامی', checked: false },
  { id: 'negative-3', label: 'استفاده از الفاظ نامناسب', checked: false },
  { id: 'negative-4', label: 'آسیب رساندن به همکلاسی‌ها', checked: false },
  { id: 'negative-5', label: 'آسیب رساندن به اموال مدرسه', checked: false },
  { id: 'negative-6', label: 'تقلب در امتحانات', checked: false },
  { id: 'negative-7', label: 'تأخیر غیرموجه در ورود به کلاس', checked: false },
  { id: 'negative-8', label: 'اذیت و آزار همکلاسی‌ها', checked: false },
  { id: 'negative-9', label: 'نقض قوانین و مقررات مدرسه', checked: false },
  { id: 'negative-10', label: 'استفاده نامناسب از فناوری', checked: false },
  { id: 'negative-11', label: 'عدم آراستگی و نظم', checked: false },
  { id: 'negative-12', label: 'رفتارهای خارج از شئون اجتماعی', checked: false },
]

// ============================================
// کامپوننت Checkbox سفارشی
// ============================================
interface CustomCheckboxProps {
  id: string
  label: string
  checked: boolean
  onChange: (id: string) => void
  variant: 'positive' | 'negative'
}

function CustomCheckbox({ id, label, checked, onChange, variant }: CustomCheckboxProps) {
  const baseClasses = 'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group'
  const variantClasses = {
    positive: checked
      ? 'bg-green-500/20 border-2 border-green-500/50 hover:bg-green-500/30'
      : 'bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-green-500/30',
    negative: checked
      ? 'bg-red-500/20 border-2 border-red-500/50 hover:bg-red-500/30'
      : 'bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-red-500/30',
  }

  const checkboxClasses = {
    positive: checked
      ? 'bg-green-500 border-green-500'
      : 'bg-white/10 border-white/30 group-hover:border-green-500/50',
    negative: checked
      ? 'bg-red-500 border-red-500'
      : 'bg-white/10 border-white/30 group-hover:border-red-500/50',
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={() => onChange(id)}
    >
      <div
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${checkboxClasses[variant]}`}
      >
        {checked && <Check className="w-4 h-4 text-white" />}
      </div>
      <span className={`text-sm font-medium ${checked ? 'text-white' : 'text-white/70'}`}>
        {label}
      </span>
    </div>
  )
}

// ============================================
// کامپوننت Select سفارشی
// ============================================
interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  icon?: React.ReactNode
}

function CustomSelect({ value, onChange, options, placeholder, icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white hover:bg-white/15 transition-all"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className={selectedOption ? 'text-white' : 'text-white/50'}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/20 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-right px-4 py-3 hover:bg-white/10 transition-colors flex items-center justify-between
                  ${value === option.value ? 'bg-white/10 text-white' : 'text-white/70'}
                  ${option.value === options[0]?.value ? 'rounded-t-xl' : ''}
                  ${option.value === options[options.length - 1]?.value ? 'rounded-b-xl' : ''}
                `}
              >
                {option.label}
                {value === option.value && <Check className="w-4 h-4 text-green-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function BehaviorGuidancePage() {
  // State
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [positiveBehaviors, setPositiveBehaviors] = useState<BehaviorItem[]>(initialPositiveBehaviors)
  const [negativeBehaviors, setNegativeBehaviors] = useState<BehaviorItem[]>(initialNegativeBehaviors)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // فرمت تاریخ امروز
  const getTodayPersian = (): string => {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }

  // تغییر وضعیت checkbox مثبت
  const handlePositiveChange = (id: string): void => {
    setPositiveBehaviors(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  // تغییر وضعیت checkbox منفی
  const handleNegativeChange = (id: string): void => {
    setNegativeBehaviors(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  // شمارش موارد انتخاب شده
  const positiveCount = positiveBehaviors.filter(b => b.checked).length
  const negativeCount = negativeBehaviors.filter(b => b.checked).length

  // ریست فرم
  const resetForm = (): void => {
    setSelectedStudent('')
    setSelectedDate('')
    setPositiveBehaviors(initialPositiveBehaviors.map(b => ({ ...b, checked: false })))
    setNegativeBehaviors(initialNegativeBehaviors.map(b => ({ ...b, checked: false })))
    setDescription('')
  }

  // ثبت گزارش
  const handleSubmit = async (): Promise<void> => {
    if (!selectedStudent) {
      alert('لطفاً یک دانش‌آموز انتخاب کنید.')
      return
    }

    if (positiveCount === 0 && negativeCount === 0) {
      alert('لطفاً حداقل یک مورد رفتاری انتخاب کنید.')
      return
    }

    setIsSubmitting(true)

    // شبیه‌سازی ارسال به سرور
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setShowSuccess(true)

    // نمایش پیام موفقیت و ریست فرم
    setTimeout(() => {
      setShowSuccess(false)
      resetForm()
    }, 2000)
  }

  // آپشن‌های دانش‌آموزان
  const studentOptions = mockStudents.map(s => ({
    value: s.id,
    label: `${s.name} - ${s.className}`,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-600 via-rose-700 to-red-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/teacher"
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <Heart className="w-8 h-8 text-pink-300" />
                  ثبت هدایت رفتاری
                </h1>
                <p className="text-white/60 mt-1">
                  ارزیابی و ثبت رفتار دانش‌آموزان
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ==================== فرم اصلی ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          {/* انتخاب دانش‌آموز و تاریخ */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                انتخاب دانش‌آموز
              </label>
              <CustomSelect
                value={selectedStudent}
                onChange={setSelectedStudent}
                options={studentOptions}
                placeholder="دانش‌آموز را انتخاب کنید..."
                icon={<Users className="w-5 h-5 text-white/50" />}
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                تاریخ
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedDate || getTodayPersian()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  placeholder="تاریخ را وارد کنید..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent"
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              </div>
            </div>
          </div>

          {/* ==================== رفتارهای مثبت و منفی ==================== */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* رفتارهای مثبت */}
            <div className="bg-green-500/10 rounded-2xl p-5 border border-green-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-400" />
                  رفتارهای مثبت
                </h2>
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                  {positiveCount} مورد
                </span>
              </div>
              <div className="grid gap-2">
                {positiveBehaviors.map((behavior) => (
                  <CustomCheckbox
                    key={behavior.id}
                    id={behavior.id}
                    label={behavior.label}
                    checked={behavior.checked}
                    onChange={handlePositiveChange}
                    variant="positive"
                  />
                ))}
              </div>
            </div>

            {/* رفتارهای نیازمند بهبود */}
            <div className="bg-red-500/10 rounded-2xl p-5 border border-red-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  رفتارهای نیازمند بهبود
                </h2>
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                  {negativeCount} مورد
                </span>
              </div>
              <div className="grid gap-2">
                {negativeBehaviors.map((behavior) => (
                  <CustomCheckbox
                    key={behavior.id}
                    id={behavior.id}
                    label={behavior.label}
                    checked={behavior.checked}
                    onChange={handleNegativeChange}
                    variant="negative"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ==================== توضیحات ==================== */}
          <div className="mt-6">
            <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              توضیحات تکمیلی
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات اضافی در مورد رفتار دانش‌آموز را اینجا بنویسید..."
              rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent resize-none leading-relaxed"
            />
          </div>

          {/* ==================== دکمه‌ها ==================== */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold transition-all shadow-lg
                ${isSubmitting
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30 hover:shadow-green-500/50'
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال ثبت...
                </>
              ) : showSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  ثبت شد!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  ثبت گزارش
                </>
              )}
            </button>
            <button
              onClick={resetForm}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all border border-white/20"
            >
              <X className="w-5 h-5" />
              انصراف
            </button>
          </div>
        </div>

        {/* ==================== گزارش‌های اخیر ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              گزارش‌های اخیر
            </h2>
            <span className="text-white/50 text-sm">
              ۵ گزارش آخر
            </span>
          </div>

          {/* جدول در دسکتاپ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/60 text-sm border-b border-white/10">
                  <th className="text-right pb-4 font-medium">دانش‌آموز</th>
                  <th className="text-center pb-4 font-medium">تاریخ</th>
                  <th className="text-center pb-4 font-medium">موارد مثبت</th>
                  <th className="text-center pb-4 font-medium">موارد منفی</th>
                  <th className="text-center pb-4 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockReports.map((report) => (
                  <tr key={report.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold">
                          {report.studentName.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{report.studentName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center text-white/70">{report.date}</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                        <ThumbsUp className="w-3 h-3" />
                        {report.positiveCount}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        {report.negativeCount}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                        <Eye className="w-4 h-4 text-white/70" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* کارت‌ها در موبایل */}
          <div className="md:hidden space-y-3">
            {mockReports.map((report) => (
              <div
                key={report.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold">
                      {report.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{report.studentName}</p>
                      <p className="text-white/50 text-sm">{report.date}</p>
                    </div>
                  </div>
                  <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                    <Eye className="w-4 h-4 text-white/70" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                    <ThumbsUp className="w-3 h-3" />
                    {report.positiveCount} مثبت
                  </span>
                  <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    {report.negativeCount} منفی
                  </span>
                </div>
                {report.description && (
                  <p className="mt-3 text-white/60 text-sm leading-relaxed border-t border-white/10 pt-3">
                    {report.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {mockReports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <p className="text-white/50">هنوز گزارشی ثبت نشده است</p>
            </div>
          )}
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}


















