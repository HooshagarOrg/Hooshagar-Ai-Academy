'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  ArrowRight,
  User,
  Calendar,
  Eye,
  Ear,
  Smile,
  AlertCircle,
  Save,
  Loader2,
  CheckCircle2,
  FileText,
  Check,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface Student {
  id: string
  name: string
  className: string
}

interface HealthReport {
  studentId: string
  examDate: string
  vision: {
    rightEye: string
    leftEye: string
    needsGlasses: boolean
  }
  hearing: {
    rightEar: 'normal' | 'weak'
    leftEar: 'normal' | 'weak'
  }
  dental: {
    status: 'healthy' | 'decay' | 'needsTreatment'
    decayedTeeth: number
  }
  hairScalp: {
    status: 'healthy' | 'lice' | 'other'
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

const recentReports = [
  { id: '1', studentName: 'علی محمدی', date: '۱۴۰۳/۰۹/۱۵', status: 'سالم' },
  { id: '2', studentName: 'سارا رضایی', date: '۱۴۰۳/۰۹/۱۴', status: 'نیاز به پیگیری' },
  { id: '3', studentName: 'محمد احمدی', date: '۱۴۰۳/۰۹/۱۳', status: 'سالم' },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function HealthReportsPage() {
  const [formData, setFormData] = useState<HealthReport>({
    studentId: '',
    examDate: '',
    vision: { rightEye: '', leftEye: '', needsGlasses: false },
    hearing: { rightEar: 'normal', leftEar: 'normal' },
    dental: { status: 'healthy', decayedTeeth: 0 },
    hairScalp: { status: 'healthy' },
    notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (): Promise<void> => {
    if (!formData.studentId || !formData.examDate) {
      alert('لطفاً دانش‌آموز و تاریخ را انتخاب کنید.')
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/health-vp"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Stethoscope className="w-8 h-8 text-teal-400" />
                گزارش بهداشت دانش‌آموزان
              </h1>
              <p className="text-white/60 mt-1">
                ثبت معاینات و وضعیت بهداشتی
              </p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ==================== فرم ==================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* انتخاب دانش‌آموز و تاریخ */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-400" />
                اطلاعات پایه
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">انتخاب دانش‌آموز</label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
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
                  <label className="text-white/70 text-sm mb-2 block">تاریخ معاینه</label>
                  <input
                    type="text"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    placeholder="۱۴۰۳/۰۹/۱۵"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              </div>
            </div>

            {/* بینایی‌سنجی */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                بینایی‌سنجی
              </h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">چشم راست</label>
                  <input
                    type="text"
                    value={formData.vision.rightEye}
                    onChange={(e) => setFormData({
                      ...formData,
                      vision: { ...formData.vision, rightEye: e.target.value }
                    })}
                    placeholder="مثال: 10/10"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">چشم چپ</label>
                  <input
                    type="text"
                    value={formData.vision.leftEye}
                    onChange={(e) => setFormData({
                      ...formData,
                      vision: { ...formData.vision, leftEye: e.target.value }
                    })}
                    placeholder="مثال: 10/10"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <button
                onClick={() => setFormData({
                  ...formData,
                  vision: { ...formData.vision, needsGlasses: !formData.vision.needsGlasses }
                })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  formData.vision.needsGlasses
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                    : 'bg-white/5 border-white/10 text-white/60'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  formData.vision.needsGlasses ? 'bg-blue-500 border-blue-500' : 'border-white/30'
                }`}>
                  {formData.vision.needsGlasses && <Check className="w-3 h-3 text-white" />}
                </div>
                نیاز به عینک
              </button>
            </div>

            {/* شنوایی‌سنجی */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Ear className="w-5 h-5 text-purple-400" />
                شنوایی‌سنجی
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">گوش راست</label>
                  <div className="flex gap-2">
                    {(['normal', 'weak'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setFormData({
                          ...formData,
                          hearing: { ...formData.hearing, rightEar: option }
                        })}
                        className={`flex-1 py-2 px-4 rounded-xl border transition-all ${
                          formData.hearing.rightEar === option
                            ? option === 'normal'
                              ? 'bg-green-500/20 border-green-500/30 text-green-300'
                              : 'bg-red-500/20 border-red-500/30 text-red-300'
                            : 'bg-white/5 border-white/10 text-white/60'
                        }`}
                      >
                        {option === 'normal' ? 'عادی' : 'ضعیف'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">گوش چپ</label>
                  <div className="flex gap-2">
                    {(['normal', 'weak'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setFormData({
                          ...formData,
                          hearing: { ...formData.hearing, leftEar: option }
                        })}
                        className={`flex-1 py-2 px-4 rounded-xl border transition-all ${
                          formData.hearing.leftEar === option
                            ? option === 'normal'
                              ? 'bg-green-500/20 border-green-500/30 text-green-300'
                              : 'bg-red-500/20 border-red-500/30 text-red-300'
                            : 'bg-white/5 border-white/10 text-white/60'
                        }`}
                      >
                        {option === 'normal' ? 'عادی' : 'ضعیف'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* معاینه دندان */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Smile className="w-5 h-5 text-yellow-400" />
                معاینه دندان
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">وضعیت</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { value: 'healthy', label: 'سالم', color: 'green' },
                      { value: 'decay', label: 'پوسیدگی', color: 'yellow' },
                      { value: 'needsTreatment', label: 'نیاز به درمان', color: 'red' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({
                          ...formData,
                          dental: { ...formData.dental, status: option.value }
                        })}
                        className={`py-2 px-4 rounded-xl border transition-all ${
                          formData.dental.status === option.value
                            ? `bg-${option.color}-500/20 border-${option.color}-500/30 text-${option.color}-300`
                            : 'bg-white/5 border-white/10 text-white/60'
                        }`}
                        style={{
                          backgroundColor: formData.dental.status === option.value
                            ? option.color === 'green' ? 'rgba(34, 197, 94, 0.2)'
                              : option.color === 'yellow' ? 'rgba(234, 179, 8, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)'
                            : undefined,
                          borderColor: formData.dental.status === option.value
                            ? option.color === 'green' ? 'rgba(34, 197, 94, 0.3)'
                              : option.color === 'yellow' ? 'rgba(234, 179, 8, 0.3)'
                                : 'rgba(239, 68, 68, 0.3)'
                            : undefined,
                          color: formData.dental.status === option.value
                            ? option.color === 'green' ? '#86efac'
                              : option.color === 'yellow' ? '#fde047'
                                : '#fca5a5'
                            : undefined,
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {formData.dental.status !== 'healthy' && (
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">تعداد دندان پوسیده</label>
                    <input
                      type="number"
                      min="0"
                      max="32"
                      value={formData.dental.decayedTeeth}
                      onChange={(e) => setFormData({
                        ...formData,
                        dental: { ...formData.dental, decayedTeeth: parseInt(e.target.value) || 0 }
                      })}
                      className="w-32 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* معاینه سر و مو */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                معاینه سر و مو
              </h2>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'healthy', label: 'سالم' },
                  { value: 'lice', label: 'شپش' },
                  { value: 'other', label: 'سایر' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({
                      ...formData,
                      hairScalp: { status: option.value }
                    })}
                    className={`py-2 px-4 rounded-xl border transition-all ${
                      formData.hairScalp.status === option.value
                        ? option.value === 'healthy'
                          ? 'bg-green-500/20 border-green-500/30 text-green-300'
                          : 'bg-red-500/20 border-red-500/30 text-red-300'
                        : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* توضیحات */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <label className="text-white/70 text-sm mb-2 block">توضیحات تکمیلی</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="توضیحات اضافی..."
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none leading-relaxed"
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
                    : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/30'
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
                  ثبت گزارش بهداشت
                </>
              )}
            </button>
          </div>

          {/* ==================== گزارش‌های اخیر ==================== */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
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
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${
                        report.status === 'سالم'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {report.status}
                      </span>
                    </div>
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







