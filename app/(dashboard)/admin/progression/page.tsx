'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  ArrowRight,
  Users,
  UserPlus,
  History,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  Calendar,
  School,
  ChevronDown,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface Student {
  id: string
  name: string
  grade: number
  className: string
  avgGrade: number
  status: 'promoted' | 'retained'
}

interface ProgressionHistory {
  id: string
  studentName: string
  fromGrade: number
  toGrade: number
  progressionType: string
  date: string
  academicYear: string
}

// ============================================
// داده‌های نمونه
// ============================================
const sampleStudents: Student[] = [
  { id: '1', name: 'علی محمدی', grade: 1, className: 'اول الف', avgGrade: 18.5, status: 'promoted' },
  { id: '2', name: 'سارا رضایی', grade: 1, className: 'اول الف', avgGrade: 19.2, status: 'promoted' },
  { id: '3', name: 'محمد احمدی', grade: 1, className: 'اول ب', avgGrade: 11.5, status: 'retained' },
  { id: '4', name: 'زهرا کریمی', grade: 1, className: 'اول ب', avgGrade: 17.8, status: 'promoted' },
]

const sampleHistory: ProgressionHistory[] = [
  { id: '1', studentName: 'علی محمدی', fromGrade: 1, toGrade: 2, progressionType: 'normal', date: '۱۴۰۳/۰۳/۳۱', academicYear: '۱۴۰۲-۱۴۰۳' },
  { id: '2', studentName: 'سارا رضایی', fromGrade: 1, toGrade: 2, progressionType: 'lottery', date: '۱۴۰۳/۰۳/۳۱', academicYear: '۱۴۰۲-۱۴۰۳' },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function ProgressionPage() {
  const [activeTab, setActiveTab] = useState<'bulk' | 'manual' | 'history'>('bulk')
  const [selectedSchool, setSelectedSchool] = useState<string>('1')
  const [selectedGrade, setSelectedGrade] = useState<string>('1')
  const [minAvgGrade, setMinAvgGrade] = useState<string>('12')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // فرم افزودن دستی
  const [manualForm, setManualForm] = useState({
    fullName: '',
    nationalCode: '',
    dateOfBirth: '',
    schoolId: '',
    grade: '',
    classId: '',
    parentPhone: '',
    parentName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleBulkPromotion = async () => {
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setShowResults(true)
  }

  const handleManualSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setSubmitSuccess(true)
    setTimeout(() => {
      setSubmitSuccess(false)
      setManualForm({
        fullName: '',
        nationalCode: '',
        dateOfBirth: '',
        schoolId: '',
        grade: '',
        classId: '',
        parentPhone: '',
        parentName: '',
      })
    }, 2000)
  }

  const promotedCount = sampleStudents.filter(s => s.status === 'promoted').length
  const retainedCount = sampleStudents.filter(s => s.status === 'retained').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-purple-400" />
                مدیریت انتقال دانش‌آموزان
              </h1>
              <p className="text-white/60 mt-1">
                انتقال گروهی، افزودن دستی و مشاهده تاریخچه
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden mb-6">
          <div className="flex border-b border-white/10">
            {[
              { key: 'bulk', label: 'انتقال گروهی پایان سال', icon: Users },
              { key: 'manual', label: 'افزودن دستی دانش‌آموز', icon: UserPlus },
              { key: 'history', label: 'تاریخچه انتقال‌ها', icon: History },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all ${
                    activeTab === tab.key
                      ? 'bg-white/10 text-white border-b-2 border-purple-500'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="p-6">
            {/* ==================== انتقال گروهی ==================== */}
            {activeTab === 'bulk' && (
              <div className="space-y-6">
                {/* فیلترها */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">مدرسه</label>
                    <select
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="1" className="bg-slate-800">دبستان آزمایشی هوشاگر</option>
                      <option value="2" className="bg-slate-800">دبستان شهید بهشتی</option>
                      <option value="3" className="bg-slate-800">دبستان امام خمینی</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/70 text-sm mb-2 block">پایه تحصیلی</label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      {[1, 2, 3, 4, 5, 6].map(grade => (
                        <option key={grade} value={grade} className="bg-slate-800">
                          پایه {grade}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-white/70 text-sm mb-2 block">حداقل میانگین نمرات</label>
                    <input
                      type="number"
                      value={minAvgGrade}
                      onChange={(e) => setMinAvgGrade(e.target.value)}
                      min="10"
                      max="20"
                      step="0.5"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                {/* اطلاعات */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-200">
                      <p className="font-bold mb-1">⚠️ توجه:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-300">
                        <li>دانش‌آموزانی که میانگین کمتر از {minAvgGrade} دارند، در همان پایه می‌مانند</li>
                        <li>این عملیات برگشت‌پذیر نیست، قبل از اجرا مطمئن شوید</li>
                        <li>تاریخچه کامل در سیستم ذخیره می‌شود</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* دکمه اجرا */}
                {!showResults && (
                  <button
                    onClick={handleBulkPromotion}
                    disabled={isProcessing}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${
                      isProcessing
                        ? 'bg-white/20 text-white/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        در حال پردازش...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        اجرای انتقال گروهی
                      </>
                    )}
                  </button>
                )}

                {/* نتایج */}
                {showResults && (
                  <div className="space-y-4">
                    {/* آمار */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-5 h-5 text-blue-400" />
                          <span className="text-white/70 text-sm">کل دانش‌آموزان</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{sampleStudents.length}</p>
                      </div>
                      
                      <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-green-300 text-sm">قبول شده</span>
                        </div>
                        <p className="text-3xl font-bold text-green-400">{promotedCount}</p>
                      </div>
                      
                      <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="text-red-300 text-sm">باقی‌مانده</span>
                        </div>
                        <p className="text-3xl font-bold text-red-400">{retainedCount}</p>
                      </div>
                    </div>

                    {/* جدول نتایج */}
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                              <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">نام دانش‌آموز</th>
                              <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">کلاس</th>
                              <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">میانگین</th>
                              <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">وضعیت</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sampleStudents.map((student) => (
                              <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-white">{student.name}</td>
                                <td className="px-4 py-3 text-white/70">{student.className}</td>
                                <td className="px-4 py-3">
                                  <span className={`font-bold ${
                                    student.avgGrade >= parseFloat(minAvgGrade)
                                      ? 'text-green-400'
                                      : 'text-red-400'
                                  }`}>
                                    {student.avgGrade.toFixed(1)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {student.status === 'promoted' ? (
                                    <span className="flex items-center gap-2 text-green-400">
                                      <CheckCircle className="w-4 h-4" />
                                      به پایه {student.grade + 1}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-2 text-red-400">
                                      <XCircle className="w-4 h-4" />
                                      ماندن در پایه {student.grade}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* دکمه‌های اقدام */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowResults(false)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                        انتقال جدید
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all">
                        <Download className="w-4 h-4" />
                        دانلود گزارش
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== افزودن دستی ==================== */}
            {activeTab === 'manual' && (
              <div className="space-y-6">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <UserPlus className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-200">
                      <p className="font-bold mb-1">افزودن دانش‌آموز جدید به سیستم</p>
                      <p className="text-purple-300">
                        این فرم برای افزودن دانش‌آموزانی است که تازه وارد مدرسه شده‌اند (مثلاً از مدرسه دیگر)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* ستون چپ */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">نام و نام خانوادگی *</label>
                      <input
                        type="text"
                        value={manualForm.fullName}
                        onChange={(e) => setManualForm({...manualForm, fullName: e.target.value})}
                        placeholder="مثال: علی محمدی"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-2 block">کد ملی *</label>
                      <input
                        type="text"
                        value={manualForm.nationalCode}
                        onChange={(e) => setManualForm({...manualForm, nationalCode: e.target.value})}
                        placeholder="0123456789"
                        maxLength={10}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-2 block">تاریخ تولد *</label>
                      <input
                        type="text"
                        value={manualForm.dateOfBirth}
                        onChange={(e) => setManualForm({...manualForm, dateOfBirth: e.target.value})}
                        placeholder="۱۳۹۵/۰۵/۱۵"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-2 block">شماره موبایل ولی *</label>
                      <input
                        type="tel"
                        value={manualForm.parentPhone}
                        onChange={(e) => setManualForm({...manualForm, parentPhone: e.target.value})}
                        placeholder="09123456789"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>

                  {/* ستون راست */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">نام ولی *</label>
                      <input
                        type="text"
                        value={manualForm.parentName}
                        onChange={(e) => setManualForm({...manualForm, parentName: e.target.value})}
                        placeholder="مثال: محمد محمدی"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-2 block">مدرسه *</label>
                      <select
                        value={manualForm.schoolId}
                        onChange={(e) => setManualForm({...manualForm, schoolId: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      >
                        <option value="" className="bg-slate-800">انتخاب مدرسه...</option>
                        <option value="1" className="bg-slate-800">دبستان آزمایشی هوشاگر</option>
                        <option value="2" className="bg-slate-800">دبستان شهید بهشتی</option>
                        <option value="3" className="bg-slate-800">دبستان امام خمینی</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-2 block">پایه تحصیلی *</label>
                      <select
                        value={manualForm.grade}
                        onChange={(e) => setManualForm({...manualForm, grade: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      >
                        <option value="" className="bg-slate-800">انتخاب پایه...</option>
                        {[1, 2, 3, 4, 5, 6].map(grade => (
                          <option key={grade} value={grade} className="bg-slate-800">
                            پایه {grade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-2 block">کلاس (اختیاری)</label>
                      <select
                        value={manualForm.classId}
                        onChange={(e) => setManualForm({...manualForm, classId: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      >
                        <option value="" className="bg-slate-800">بدون کلاس (بعداً تخصیص)</option>
                        <option value="1" className="bg-slate-800">الف</option>
                        <option value="2" className="bg-slate-800">ب</option>
                        <option value="3" className="bg-slate-800">ج</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* دکمه افزودن */}
                <button
                  onClick={handleManualSubmit}
                  disabled={isSubmitting || !manualForm.fullName || !manualForm.nationalCode}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${
                    isSubmitting || !manualForm.fullName || !manualForm.nationalCode
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : submitSuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال افزودن...
                    </>
                  ) : submitSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      اضافه شد!
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      افزودن دانش‌آموز
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ==================== تاریخچه ==================== */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* فیلترها */}
                <div className="flex flex-wrap gap-3">
                  <select className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none">
                    <option className="bg-slate-800">همه مدارس</option>
                    <option className="bg-slate-800">دبستان آزمایشی هوشاگر</option>
                  </select>
                  
                  <select className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none">
                    <option className="bg-slate-800">همه پایه‌ها</option>
                    {[1, 2, 3, 4, 5, 6].map(g => (
                      <option key={g} className="bg-slate-800">پایه {g}</option>
                    ))}
                  </select>
                  
                  <select className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none">
                    <option className="bg-slate-800">همه انواع</option>
                    <option className="bg-slate-800">انتقال عادی</option>
                    <option className="bg-slate-800">قرعه‌کشی</option>
                    <option className="bg-slate-800">دستی</option>
                  </select>

                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all text-sm ml-auto">
                    <Download className="w-4 h-4" />
                    دانلود Excel
                  </button>
                </div>

                {/* جدول تاریخچه */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">نام دانش‌آموز</th>
                          <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">از پایه</th>
                          <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">به پایه</th>
                          <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">نوع انتقال</th>
                          <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">سال تحصیلی</th>
                          <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">تاریخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleHistory.map((record) => (
                          <tr key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-white">{record.studentName}</td>
                            <td className="px-4 py-3 text-white/70">پایه {record.fromGrade}</td>
                            <td className="px-4 py-3 text-green-400 font-bold">پایه {record.toGrade}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-lg text-xs ${
                                record.progressionType === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                                record.progressionType === 'lottery' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-orange-500/20 text-orange-400'
                              }`}>
                                {record.progressionType === 'normal' ? 'عادی' :
                                 record.progressionType === 'lottery' ? 'قرعه‌کشی' : 'دستی'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-white/70">{record.academicYear}</td>
                            <td className="px-4 py-3 text-white/70">{record.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm py-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}

