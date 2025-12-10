'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  ArrowRight,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Send,
  SendHorizontal,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  StickyNote,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  Settings,
  Bell,
  Check,
  Hash,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface StudentNote {
  id: string
  studentId: string
  date: string
  type: 'positive' | 'negative' | 'neutral'
  subject: string
  content: string
}

interface StudentReport {
  studentId: string
  studentName: string
  parentName: string
  summary: string
  positivePoints: string[]
  improvementPoints: string[]
  parentSuggestions: string[]
  notesCount: number
  sent: boolean
}

interface Student {
  id: string
  name: string
  parentName: string
  className: string
}

// ============================================
// داده‌های نمونه
// ============================================
const students: Student[] = [
  { id: '1', name: 'علی محمدی', parentName: 'آقای محمدی', className: 'چهارم الف' },
  { id: '2', name: 'سارا رضایی', parentName: 'خانم رضایی', className: 'چهارم الف' },
  { id: '3', name: 'محمد احمدی', parentName: 'آقای احمدی', className: 'چهارم الف' },
  { id: '4', name: 'زهرا کریمی', parentName: 'خانم کریمی', className: 'چهارم الف' },
  { id: '5', name: 'امیر حسینی', parentName: 'آقای حسینی', className: 'چهارم الف' },
  { id: '6', name: 'فاطمه نوری', parentName: 'خانم نوری', className: 'چهارم الف' },
  { id: '7', name: 'رضا صادقی', parentName: 'آقای صادقی', className: 'چهارم الف' },
  { id: '8', name: 'مریم جعفری', parentName: 'خانم جعفری', className: 'چهارم الف' },
  { id: '9', name: 'حسین موسوی', parentName: 'آقای موسوی', className: 'چهارم الف' },
  { id: '10', name: 'نرگس طاهری', parentName: 'خانم طاهری', className: 'چهارم الف' },
]

const sampleNotes: StudentNote[] = [
  { id: '1', studentId: '1', date: '۱۴۰۳/۰۹/۱۰', type: 'positive', subject: 'تحصیلی', content: 'عملکرد عالی در امتحان ریاضی' },
  { id: '2', studentId: '1', date: '۱۴۰۳/۰۹/۱۲', type: 'positive', subject: 'رفتاری', content: 'کمک به همکلاسی در درس علوم' },
  { id: '3', studentId: '1', date: '۱۴۰۳/۰۹/۱۴', type: 'neutral', subject: 'تکالیف', content: 'تکالیف با کمی تاخیر تحویل شد' },
  { id: '4', studentId: '2', date: '۱۴۰۳/۰۹/۱۱', type: 'positive', subject: 'تحصیلی', content: 'مشارکت فعال در کلاس' },
  { id: '5', studentId: '2', date: '۱۴۰۳/۰۹/۱۳', type: 'positive', subject: 'هنری', content: 'نقاشی بسیار زیبا کشید' },
  { id: '6', studentId: '3', date: '۱۴۰۳/۰۹/۱۰', type: 'negative', subject: 'رفتاری', content: 'بی‌توجهی در کلاس' },
  { id: '7', studentId: '3', date: '۱۴۰۳/۰۹/۱۲', type: 'positive', subject: 'تحصیلی', content: 'پیشرفت در درس فارسی' },
  { id: '8', studentId: '4', date: '۱۴۰۳/۰۹/۱۱', type: 'positive', subject: 'تحصیلی', content: 'نمره عالی در دیکته' },
  { id: '9', studentId: '4', date: '۱۴۰۳/۰۹/۱۴', type: 'positive', subject: 'رفتاری', content: 'رفتار بسیار مودبانه' },
  { id: '10', studentId: '5', date: '۱۴۰۳/۰۹/۱۰', type: 'negative', subject: 'تکالیف', content: 'تکالیف ناقص تحویل داده شد' },
  { id: '11', studentId: '5', date: '۱۴۰۳/۰۹/۱۳', type: 'positive', subject: 'ورزشی', content: 'عملکرد خوب در ورزش' },
  { id: '12', studentId: '6', date: '۱۴۰۳/۰۹/۱۲', type: 'positive', subject: 'تحصیلی', content: 'پرسیدن سوالات هوشمندانه' },
  { id: '13', studentId: '7', date: '۱۴۰۳/۰۹/۱۱', type: 'neutral', subject: 'حضور', content: 'یک روز غیبت با اطلاع قبلی' },
  { id: '14', studentId: '8', date: '۱۴۰۳/۰۹/۱۰', type: 'positive', subject: 'تحصیلی', content: 'بهترین نمره کلاس در علوم' },
  { id: '15', studentId: '8', date: '۱۴۰۳/۰۹/۱۴', type: 'positive', subject: 'رفتاری', content: 'کمک به معلم در کلاس' },
  { id: '16', studentId: '9', date: '۱۴۰۳/۰۹/۱۳', type: 'positive', subject: 'تحصیلی', content: 'تلاش برای بهبود خط' },
  { id: '17', studentId: '10', date: '۱۴۰۳/۰۹/۱۲', type: 'negative', subject: 'رفتاری', content: 'صحبت کردن در کلاس' },
  { id: '18', studentId: '10', date: '۱۴۰۳/۰۹/۱۴', type: 'positive', subject: 'تحصیلی', content: 'بهبود قابل توجه در ریاضی' },
]

const classes = [
  { id: '1', name: 'چهارم الف' },
  { id: '2', name: 'چهارم ب' },
  { id: '3', name: 'پنجم الف' },
]

// ============================================
// کامپوننت Accordion
// ============================================
interface AccordionItemProps {
  report: StudentReport
  isOpen: boolean
  onToggle: () => void
  onSend: () => void
}

function AccordionItem({ report, isOpen, onToggle, onSend }: AccordionItemProps) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {report.studentName.charAt(0)}
          </div>
          <div className="text-right">
            <h3 className="text-white font-medium">{report.studentName}</h3>
            <p className="text-white/50 text-sm">{report.notesCount} یادداشت</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report.sent && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">
              <CheckCircle2 className="w-3 h-3" />
              ارسال شده
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-white/50" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/50" />
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-4 pt-0 space-y-4">
          {/* خلاصه */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white/70 text-sm mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              خلاصه هفته
            </h4>
            <p className="text-white leading-relaxed">{report.summary}</p>
          </div>

          {/* نکات مثبت */}
          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
            <h4 className="text-green-400 text-sm mb-2 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              نکات مثبت
            </h4>
            <ul className="text-white/80 text-sm space-y-1">
              {report.positivePoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* نکات قابل بهبود */}
          <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
            <h4 className="text-orange-400 text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              نکات قابل بهبود
            </h4>
            <ul className="text-white/80 text-sm space-y-1">
              {report.improvementPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* پیشنهادات */}
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
            <h4 className="text-blue-400 text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              پیشنهادات برای والدین
            </h4>
            <ul className="text-white/80 text-sm space-y-1">
              {report.parentSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* دکمه ارسال */}
          {!report.sent && (
            <button
              onClick={onSend}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all"
            >
              <Send className="w-5 h-5" />
              ارسال به {report.parentName}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function WeeklyReportPage() {
  // State‌ها
  const [selectedClass, setSelectedClass] = useState('1')
  const [startDate, setStartDate] = useState('۱۴۰۳/۰۹/۱۰')
  const [endDate, setEndDate] = useState('۱۴۰۳/۰۹/۱۶')
  const [selectAll, setSelectAll] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<string[]>(students.map(s => s.id))
  const [isGenerating, setIsGenerating] = useState(false)
  const [reports, setReports] = useState<StudentReport[]>([])
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [autoSendEnabled, setAutoSendEnabled] = useState(false)
  const [autoSendTime, setAutoSendTime] = useState('14:00')
  const [sendingAll, setSendingAll] = useState(false)

  // آمار
  const stats = useMemo(() => {
    const studentsWithNotes = new Set(sampleNotes.map(n => n.studentId)).size
    const subjects = sampleNotes.reduce((acc, note) => {
      acc[note.subject] = (acc[note.subject] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topSubjects = Object.entries(subjects)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([subject, count]) => ({ subject, count }))

    return {
      totalNotes: sampleNotes.length,
      studentsWithNotes,
      topSubjects,
    }
  }, [])

  // Toggle دانش‌آموز
  const toggleStudent = (studentId: string): void => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
    setSelectAll(false)
  }

  // انتخاب همه
  const handleSelectAll = (): void => {
    if (selectAll) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.id))
    }
    setSelectAll(!selectAll)
  }

  // تولید گزارش‌ها
  const generateReports = async (): Promise<void> => {
    if (selectedStudents.length === 0) {
      alert('لطفاً حداقل یک دانش‌آموز انتخاب کنید.')
      return
    }

    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 3000))

    // تولید گزارش برای هر دانش‌آموز
    const generatedReports: StudentReport[] = selectedStudents.map(studentId => {
      const student = students.find(s => s.id === studentId)!
      const studentNotes = sampleNotes.filter(n => n.studentId === studentId)

      // داده‌های نمونه برای گزارش
      const summaries: Record<string, string> = {
        '1': 'این هفته علی عملکرد بسیار خوبی داشت. در امتحان ریاضی نمره عالی گرفت و به همکلاسی‌هایش کمک کرد. تکالیف با کمی تاخیر تحویل داده شد که نیاز به توجه دارد.',
        '2': 'سارا این هفته فعالانه در کلاس مشارکت داشت. نقاشی بسیار زیبایی کشید که نشان‌دهنده استعداد هنری اوست. رفتار و ادب ایشان قابل تقدیر است.',
        '3': 'محمد این هفته پیشرفت خوبی در درس فارسی نشان داد. با این حال، گاهی در کلاس بی‌توجه است که نیاز به تمرکز بیشتر دارد.',
        '4': 'زهرا در دیکته نمره عالی گرفت و رفتار بسیار مودبانه‌ای داشت. او یکی از بهترین دانش‌آموزان کلاس از نظر رفتاری است.',
        '5': 'امیر در ورزش عملکرد خوبی داشت اما تکالیف ناقص تحویل داده شد. نیاز است والدین بر انجام تکالیف نظارت بیشتری داشته باشند.',
        '6': 'فاطمه سوالات هوشمندانه‌ای در کلاس پرسید که نشان‌دهنده کنجکاوی و علاقه او به یادگیری است.',
        '7': 'رضا یک روز غیبت موجه داشت. در روزهای حضور، عملکرد قابل قبولی داشته است.',
        '8': 'مریم بهترین نمره کلاس در علوم را کسب کرد و به معلم در کلاس کمک کرد. او الگوی خوبی برای سایر دانش‌آموزان است.',
        '9': 'حسین تلاش خوبی برای بهبود خط خود انجام داده است. این پیشرفت قابل تقدیر است.',
        '10': 'نرگس بهبود قابل توجهی در ریاضی داشت اما گاهی در کلاس صحبت می‌کند که نیاز به توجه دارد.',
      }

      return {
        studentId,
        studentName: student.name,
        parentName: student.parentName,
        summary: summaries[studentId] || 'این هفته عملکرد خوبی داشته است.',
        positivePoints: [
          'مشارکت فعال در کلاس',
          'رفتار محترمانه با دیگران',
          'تلاش برای یادگیری',
        ],
        improvementPoints: studentNotes.some(n => n.type === 'negative')
          ? ['تمرکز بیشتر در کلاس', 'انجام به موقع تکالیف']
          : ['ادامه روند فعلی'],
        parentSuggestions: [
          'تشویق فرزند برای مطالعه روزانه',
          'ایجاد برنامه منظم برای انجام تکالیف',
          'صحبت درباره تجربیات روزانه مدرسه',
        ],
        notesCount: studentNotes.length,
        sent: false,
      }
    })

    setReports(generatedReports)
    setIsGenerating(false)
    if (generatedReports.length > 0) {
      setOpenAccordion(generatedReports[0].studentId)
    }
  }

  // ارسال یک گزارش
  const sendReport = (studentId: string): void => {
    setReports(prev =>
      prev.map(r =>
        r.studentId === studentId ? { ...r, sent: true } : r
      )
    )
  }

  // ارسال همه گزارش‌ها
  const sendAllReports = async (): Promise<void> => {
    setSendingAll(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setReports(prev => prev.map(r => ({ ...r, sent: true })))
    setSendingAll(false)
  }

  // تعداد ارسال نشده
  const unsentCount = reports.filter(r => !r.sent).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/teacher"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-400" />
                گزارش هفتگی والدین
              </h1>
              <p className="text-white/60 mt-1">
                خلاصه‌سازی یادداشت‌های هفته با هوش مصنوعی
              </p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ==================== ستون چپ: فیلتر و آمار ==================== */}
          <div className="lg:col-span-1 space-y-6">
            {/* فیلترها */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                انتخاب بازه زمانی
              </h2>

              <div className="space-y-4">
                {/* تاریخ شروع */}
                <div>
                  <label className="text-white/70 text-sm mb-1 block">از تاریخ</label>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {/* تاریخ پایان */}
                <div>
                  <label className="text-white/70 text-sm mb-1 block">تا تاریخ</label>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {/* انتخاب کلاس */}
                <div>
                  <label className="text-white/70 text-sm mb-1 block">کلاس</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id} className="bg-slate-800">
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* انتخاب همه */}
                <button
                  onClick={handleSelectAll}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
                    selectAll
                      ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    selectAll ? 'bg-purple-500 border-purple-500' : 'border-white/30'
                  }`}>
                    {selectAll && <Check className="w-3 h-3 text-white" />}
                  </div>
                  انتخاب همه دانش‌آموزان
                </button>

                {/* لیست دانش‌آموزان */}
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {students.map(student => (
                    <button
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${
                        selectedStudents.includes(student.id)
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedStudents.includes(student.id) ? 'bg-purple-500 border-purple-500' : 'border-white/30'
                      }`}>
                        {selectedStudents.includes(student.id) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {student.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* آمار */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-yellow-400" />
                پیش‌نمایش داده‌ها
              </h2>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Hash className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">یادداشت‌های ثبت شده</p>
                    <p className="text-white text-xl font-bold">{stats.totalNotes}</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">دانش‌آموزان دارای یادداشت</p>
                    <p className="text-white text-xl font-bold">{stats.studentsWithNotes}</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-sm mb-2">موضوعات پرتکرار</p>
                  <div className="space-y-2">
                    {stats.topSubjects.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.subject}</span>
                        <span className="text-purple-400 text-sm">{item.count} مورد</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* تنظیمات ارسال خودکار */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                ارسال خودکار
              </h2>

              <div className="space-y-4">
                <button
                  onClick={() => setAutoSendEnabled(!autoSendEnabled)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    autoSendEnabled
                      ? 'bg-green-500/20 border-green-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <span className="text-white text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    ارسال خودکار هر جمعه
                  </span>
                  <div className={`w-10 h-6 rounded-full p-1 transition-all ${
                    autoSendEnabled ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                      autoSendEnabled ? 'translate-x-0' : '-translate-x-4'
                    }`} />
                  </div>
                </button>

                {autoSendEnabled && (
                  <>
                    <div>
                      <label className="text-white/70 text-sm mb-1 block">ساعت ارسال</label>
                      <select
                        value={autoSendTime}
                        onChange={(e) => setAutoSendTime(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      >
                        <option value="10:00" className="bg-slate-800">۱۰:۰۰ صبح</option>
                        <option value="12:00" className="bg-slate-800">۱۲:۰۰ ظهر</option>
                        <option value="14:00" className="bg-slate-800">۱۴:۰۰ بعدازظهر</option>
                        <option value="16:00" className="bg-slate-800">۱۶:۰۰ عصر</option>
                        <option value="18:00" className="bg-slate-800">۱۸:۰۰ عصر</option>
                      </select>
                    </div>
                    <button className="w-full py-2 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 hover:bg-green-500/30 transition-all">
                      فعال‌سازی
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ==================== ستون راست: گزارش‌ها ==================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* دکمه تولید */}
            <button
              onClick={generateReports}
              disabled={isGenerating || selectedStudents.length === 0}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all
                ${isGenerating || selectedStudents.length === 0
                  ? 'bg-white/20 text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30'
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  در حال تولید گزارش‌ها...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  تولید گزارش‌های هفتگی
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">
                    {selectedStudents.length} دانش‌آموز
                  </span>
                </>
              )}
            </button>

            {/* گزارش‌ها */}
            {reports.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    گزارش‌های تولید شده
                    <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded-lg text-sm">
                      {reports.length} گزارش
                    </span>
                  </h2>

                  {unsentCount > 0 && (
                    <button
                      onClick={sendAllReports}
                      disabled={sendingAll}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all text-sm"
                    >
                      {sendingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          در حال ارسال...
                        </>
                      ) : (
                        <>
                          <SendHorizontal className="w-4 h-4" />
                          ارسال همه ({unsentCount})
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Accordion */}
                <div className="space-y-3">
                  {reports.map((report) => (
                    <AccordionItem
                      key={report.studentId}
                      report={report}
                      isOpen={openAccordion === report.studentId}
                      onToggle={() => setOpenAccordion(
                        openAccordion === report.studentId ? null : report.studentId
                      )}
                      onSend={() => sendReport(report.studentId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* راهنما */}
            {reports.length === 0 && !isGenerating && (
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  💡 راهنمای استفاده
                </h3>
                <ul className="text-white/70 text-sm space-y-2 leading-relaxed">
                  <li>• بازه زمانی مورد نظر را انتخاب کنید (معمولاً یک هفته)</li>
                  <li>• کلاس و دانش‌آموزان را انتخاب کنید</li>
                  <li>• دکمه "تولید گزارش‌های هفتگی" را بزنید</li>
                  <li>• هوش مصنوعی تمام یادداشت‌ها را خلاصه می‌کند</li>
                  <li>• گزارش‌ها را بررسی و به والدین ارسال کنید</li>
                  <li>• می‌توانید ارسال خودکار هر جمعه را فعال کنید</li>
                </ul>

                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-white/50 text-xs">
                    📊 تعداد یادداشت‌های هفته: {stats.totalNotes}
                    <br />
                    👥 دانش‌آموزان انتخاب شده: {selectedStudents.length}
                  </p>
                </div>
              </div>
            )}
          </div>
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




























