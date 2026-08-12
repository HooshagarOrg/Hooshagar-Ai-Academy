'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
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
  StickyNote,
  TrendingUp,
  Lightbulb,
  ThumbsUp,
  Settings,
  Check,
  Hash,
} from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'

interface StudentReport {
  id: string
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
  classId: string
  className: string
}

interface ClassItem {
  id: string
  name: string
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function isoMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

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
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [behaviorCount, setBehaviorCount] = useState(0)
  const [selectedClass, setSelectedClass] = useState('')
  const [startDate, setStartDate] = useState(isoMonday())
  const [endDate, setEndDate] = useState(isoToday())
  const [selectAll, setSelectAll] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [reports, setReports] = useState<StudentReport[]>([])
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [sendingAll, setSendingAll] = useState(false)

  useEffect(() => {
    void Promise.all([
      fetch('/api/teacher/class-students').then((r) => r.json()),
      fetch('/api/teacher/behavior').then((r) => r.json()),
      fetch('/api/teacher/weekly-reports').then((r) => r.json()),
    ])
      .then(([st, bh, wr]) => {
        const classList: ClassItem[] = Array.isArray(st.classes)
          ? st.classes.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
          : []
        const studentList: Student[] = Array.isArray(st.students)
          ? st.students.map(
              (s: {
                id: string
                name: string
                parentName?: string
                classId?: string
                className?: string
              }) => ({
                id: s.id,
                name: s.name,
                parentName: s.parentName || 'والد',
                classId: s.classId || '',
                className: s.className || '',
              })
            )
          : []
        setClasses(classList)
        setAllStudents(studentList)
        const firstClass = classList[0]?.id || ''
        setSelectedClass(firstClass)
        const initial = firstClass
          ? studentList.filter((s) => s.classId === firstClass).map((s) => s.id)
          : studentList.map((s) => s.id)
        setSelectedStudents(initial)
        if (Array.isArray(bh.reports)) setBehaviorCount(bh.reports.length)
        if (Array.isArray(wr.reports)) {
          setReports(
            wr.reports.map(
              (r: {
                id: string
                studentId: string
                studentName: string
                summary: string
                positivePoints: string[]
                improvementPoints: string[]
                parentSuggestions: string[]
                sent: boolean
              }) => ({
                id: r.id,
                studentId: r.studentId,
                studentName: r.studentName,
                parentName: studentList.find((s) => s.id === r.studentId)?.parentName || 'والد',
                summary: r.summary,
                positivePoints: r.positivePoints || [],
                improvementPoints: r.improvementPoints || [],
                parentSuggestions: r.parentSuggestions || [],
                notesCount: 0,
                sent: r.sent,
              })
            )
          )
        }
      })
      .catch(() => toast.error('خطا در دریافت داده‌ها'))
  }, [])

  const students = useMemo(
    () => (selectedClass ? allStudents.filter((s) => s.classId === selectedClass) : allStudents),
    [allStudents, selectedClass]
  )

  const stats = useMemo(
    () => ({
      totalNotes: behaviorCount,
      studentsWithNotes: students.length,
    }),
    [behaviorCount, students.length]
  )

  const toggleStudent = (studentId: string): void => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
    setSelectAll(false)
  }

  const handleSelectAll = (): void => {
    if (selectAll) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map((s) => s.id))
    }
    setSelectAll(!selectAll)
  }

  const generateReports = async (): Promise<void> => {
    if (selectedStudents.length === 0) {
      toast.error('لطفاً حداقل یک دانش‌آموز انتخاب کنید.')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/teacher/weekly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_ids: selectedStudents,
          week_start: startDate,
          week_end: endDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'تولید گزارش ناموفق بود')
        return
      }
      const generated: StudentReport[] = (data.reports || []).map(
        (r: {
          id: string
          studentId: string
          studentName: string
          summary: string
          positivePoints: string[]
          improvementPoints: string[]
          parentSuggestions: string[]
          notesCount: number
          sent: boolean
        }) => ({
          ...r,
          parentName: students.find((s) => s.id === r.studentId)?.parentName || 'والد',
        })
      )
      setReports(generated)
      if (generated[0]) setOpenAccordion(generated[0].id)
      toast.success(`${generated.length} گزارش تولید شد`)
    } catch {
      toast.error('خطای شبکه')
    } finally {
      setIsGenerating(false)
    }
  }

  const sendReport = async (reportId: string): Promise<void> => {
    try {
      const res = await fetch('/api/teacher/weekly-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'ارسال ناموفق بود')
        return
      }
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, sent: true } : r)))
      toast.success('گزارش برای والد علامت‌گذاری شد')
    } catch {
      toast.error('خطای شبکه')
    }
  }

  const sendAllReports = async (): Promise<void> => {
    setSendingAll(true)
    try {
      const pending = reports.filter((r) => !r.sent)
      for (const report of pending) {
        await fetch('/api/teacher/weekly-reports', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_id: report.id }),
        })
      }
      setReports((prev) => prev.map((r) => ({ ...r, sent: true })))
      toast.success('همه گزارش‌ها ارسال شدند')
    } catch {
      toast.error('خطای شبکه')
    } finally {
      setSendingAll(false)
    }
  }

  // تعداد ارسال نشده
  const unsentCount = reports.filter(r => !r.sent).length

  return (
    <DashboardPage
      className="max-w-5xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-brand-purple" />
          گزارش هفتگی والدین
        </span>
      }
      description="خلاصه‌سازی یادداشت‌های هفته با هوش مصنوعی"
      actions={
        <Link href="/teacher">
          <Button variant="outline" size="icon" className="glass-panel-quiet" aria-label="بازگشت">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      }
      animatedSections={false}
    >
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ==================== ستون چپ: فیلتر و آمار ==================== */}
          <div className="lg:col-span-1 space-y-6">
            {/* فیلترها */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                انتخاب بازه زمانی
              </h2>

              <div className="space-y-4">
                {/* تاریخ شروع */}
                <div>
                  <label className="text-white/70 text-sm mb-1 block">از تاریخ</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {/* تاریخ پایان */}
                <div>
                  <label className="text-white/70 text-sm mb-1 block">تا تاریخ</label>
                  <input
                    type="date"
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
                    onChange={(e) => {
                      const next = e.target.value
                      setSelectedClass(next)
                      const ids = allStudents.filter((s) => s.classId === next).map((s) => s.id)
                      setSelectedStudents(ids)
                      setSelectAll(true)
                    }}
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
            </GlassCard>

            {/* آمار */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-yellow-400" />
                پیش‌نمایش داده‌ها
              </h2>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Hash className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">گزارش‌های رفتاری ثبت‌شده</p>
                    <p className="text-white text-xl font-bold">{stats.totalNotes}</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">دانش‌آموزان این کلاس</p>
                    <p className="text-white text-xl font-bold">{stats.studentsWithNotes}</p>
                  </div>
                </div>

                <p className="text-white/60 text-sm leading-relaxed">
                  گزارش هفتگی از ثبت رفتار همین بازه ساخته می‌شود. اگر رفتاری ثبت نشده باشد، متن کلی و محترمانه تولید می‌شود.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                ارسال به والدین
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                پس از تولید، هر گزارش را جداگانه یا همه را یکجا برای والد علامت‌گذاری کنید. ارسال خودکار جمعه هنوز فعال نیست.
              </p>
            </GlassCard>
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
              <GlassCard className="p-6">
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
                      key={report.id}
                      report={report}
                      isOpen={openAccordion === report.id}
                      onToggle={() => setOpenAccordion(
                        openAccordion === report.id ? null : report.id
                      )}
                      onSend={() => void sendReport(report.id)}
                    />
                  ))}
                </div>
              </GlassCard>
            )}

            {/* راهنما */}
            {reports.length === 0 && !isGenerating && (
              <GlassCard className="p-6 border-brand-purple/25 bg-gradient-to-bl from-brand-purple/15 via-card/90 to-brand-pink/10">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  💡 راهنمای استفاده
                </h3>
                <ul className="text-muted-foreground text-sm space-y-2 leading-relaxed">
                  <li>• بازه زمانی مورد نظر را انتخاب کنید (معمولاً یک هفته)</li>
                  <li>• کلاس و دانش‌آموزان را انتخاب کنید</li>
                  <li>• دکمه «تولید گزارش‌های هفتگی» را بزنید</li>
                  <li>• هوش مصنوعی تمام یادداشت‌ها را خلاصه می‌کند</li>
                  <li>• گزارش‌ها را بررسی و برای والدین علامت‌گذاری کنید</li>
                </ul>

                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-muted-foreground text-xs">
                    📊 تعداد یادداشت‌های هفته: {stats.totalNotes}
                    <br />
                    👥 دانش‌آموزان انتخاب شده: {selectedStudents.length}
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>

        <footer className="text-center text-muted-foreground text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
    </DashboardPage>
  )
}

















































