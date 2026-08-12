'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  MessageSquareText,
  ArrowRight,
  User,
  Send,
  Copy,
  Edit3,
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText,
  ThumbsUp,
  AlertCircle,
  Bell,
  Calendar,
  BookOpen,
  Users,
  Clock,
  ClipboardList,
  Lightbulb,
  Check,
} from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'

// ============================================
// تایپ‌ها
// ============================================
type MessageType = 'positive' | 'critical' | 'informational' | 'meeting'

interface Student {
  id: string
  name: string
  className: string
  parentName: string
  parentId: string | null
}

interface MessageTemplate {
  id: string
  title: string
  type: MessageType
  preview: string
  content: string
}

// ============================================
// الگوهای آماده (متن ثابت، نه دادهٔ دانش‌آموز نمونه)
// ============================================
const messageTemplates: MessageTemplate[] = [
  {
    id: '1',
    title: 'تشویق پیشرفت تحصیلی',
    type: 'positive',
    preview: 'پیام تشویقی برای عملکرد درخشان...',
    content: `والدین محترم،

با سلام و احترام،

امیدوارم از سلامتی و شادکامی برخوردار باشید.

با کمال خوشحالی به اطلاع می‌رسانم که فرزند گرامی‌تان در هفته گذشته عملکرد بسیار درخشانی داشته‌اند. مشارکت فعال ایشان در کلاس و تلاش مستمر برای یادگیری قابل تقدیر است.

این موفقیت نتیجه همکاری شما خانواده محترم و تلاش فرزندتان است. از شما بابت این همراهی صمیمانه سپاسگزاریم.

با احترام،
معلم کلاس`,
  },
  {
    id: '2',
    title: 'یادآوری تکالیف',
    type: 'informational',
    preview: 'اطلاع‌رسانی درباره تکالیف...',
    content: `والدین محترم،

با سلام و احترام،

احتراماً به استحضار می‌رساند که تکالیف درس ریاضی این هفته تا روز شنبه باید تحویل داده شود.

لطفاً فرزند عزیزتان را در انجام به موقع تکالیف یاری فرمایید.

با تشکر از همکاری شما،
معلم کلاس`,
  },
  {
    id: '3',
    title: 'دعوت به جلسه',
    type: 'meeting',
    preview: 'دعوتنامه جلسه اولیا و مربیان...',
    content: `والدین محترم،

با سلام و احترام،

بدینوسیله از شما دعوت می‌شود تا در جلسه اولیا و مربیان که روز پنجشنبه ساعت ۱۰ صبح برگزار می‌گردد، شرکت فرمایید.

موضوعات مورد بحث:
- بررسی عملکرد تحصیلی
- برنامه‌های آموزشی ترم آینده
- پرسش و پاسخ

حضور شما برای ما بسیار ارزشمند است.

با احترام،
معلم کلاس`,
  },
  {
    id: '4',
    title: 'گزارش رفتاری',
    type: 'critical',
    preview: 'گزارش رفتار نیازمند توجه...',
    content: `والدین محترم،

با سلام و احترام،

امیدوارم این پیام شما را در کمال سلامتی بیابد.

می‌خواستم در مورد موضوعی با شما صحبت کنم که نیاز به توجه مشترک ما دارد. فرزند عزیزتان دانش‌آموز با استعدادی است، اما اخیراً در برخی موارد نیاز به راهنمایی بیشتری دارد.

پیشنهاد می‌کنم جلسه‌ای حضوری یا تلفنی داشته باشیم تا با همکاری یکدیگر بهترین راه‌حل را بیابیم.

با احترام،
معلم کلاس`,
  },
  {
    id: '5',
    title: 'تبریک موفقیت',
    type: 'positive',
    preview: 'تبریک کسب رتبه برتر...',
    content: `والدین محترم،

با سلام و صمیمانه‌ترین تبریکات،

با افتخار اعلام می‌کنم که فرزند گرامی‌تان در مسابقات علمی مدرسه رتبه برتر را کسب کرده‌اند! 🏆

این موفقیت حاصل تلاش و پشتکار ایشان و البته حمایت‌های شما خانواده محترم است.

از طرف خودم و کادر آموزشی مدرسه، صمیمانه این موفقیت را تبریک می‌گویم.

با احترام فراوان،
معلم کلاس`,
  },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function ParentMessagePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [messageType, setMessageType] = useState<MessageType>('positive')
  const [subjects, setSubjects] = useState<string[]>([])
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    void fetch('/api/teacher/class-students')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data.students)) return
        setStudents(
          data.students.map(
            (s: {
              id: string
              name: string
              className?: string
              parentName?: string
              parentId?: string | null
            }) => ({
              id: s.id,
              name: s.name,
              className: s.className || '',
              parentName: s.parentName || 'والد',
              parentId: s.parentId || null,
            })
          )
        )
      })
      .catch(() => toast.error('خطا در دریافت دانش‌آموزان'))
  }, [])

  // موضوعات پیام
  const messageSubjects = [
    { id: 'academic', label: 'عملکرد تحصیلی', icon: BookOpen },
    { id: 'behavior', label: 'رفتار کلاسی', icon: Users },
    { id: 'attendance', label: 'حضور و غیاب', icon: Clock },
    { id: 'homework', label: 'تکالیف', icon: ClipboardList },
    { id: 'activities', label: 'فعالیت‌های گروهی', icon: Lightbulb },
    { id: 'other', label: 'سایر', icon: FileText },
  ]

  // انواع پیام
  const messageTypes = [
    { value: 'positive', label: 'مثبت (تشویقی)', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
    { value: 'critical', label: 'انتقادی (با احترام)', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' },
    { value: 'informational', label: 'اطلاع‌رسانی', icon: Bell, color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
    { value: 'meeting', label: 'دعوت به جلسه', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30' },
  ]

  // Toggle موضوع
  const toggleSubject = (subjectId: string): void => {
    setSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    )
  }

  // تولید پیام
  const generateMessage = async (): Promise<void> => {
    if (!selectedStudent || subjects.length === 0) {
      toast.error('لطفاً دانش‌آموز و حداقل یک موضوع را انتخاب کنید.')
      return
    }

    const student = students.find((s) => s.id === selectedStudent)
    if (!student) {
      toast.error('دانش‌آموز یافت نشد')
      return
    }

    setIsGenerating(true)
    setSent(false)
    try {
      const res = await fetch('/api/teacher/parent-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: student.name,
          parent_name: student.parentName,
          class_name: student.className,
          message_type: messageType,
          subjects,
          extra_notes: additionalNotes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'تولید پیام ناموفق بود')
        return
      }
      setGeneratedMessage(data.content)
      setEditedMessage(data.content)
    } catch {
      toast.error('خطای شبکه')
    } finally {
      setIsGenerating(false)
    }
  }

  // کپی پیام
  const copyMessage = async (): Promise<void> => {
    const textToCopy = isEditing ? editedMessage : generatedMessage
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // استفاده از الگو
  const applyTemplate = (template: MessageTemplate): void => {
    setGeneratedMessage(template.content)
    setEditedMessage(template.content)
    setMessageType(template.type)
  }

  // ارسال پیام
  const sendMessage = async (): Promise<void> => {
    const student = students.find((s) => s.id === selectedStudent)
    const text = (isEditing ? editedMessage : generatedMessage).trim()
    if (!text) {
      toast.error('متن پیام خالی است')
      return
    }
    if (!student?.parentId) {
      toast.error('برای این دانش‌آموز والد ثبت نشده؛ پیام را کپی کنید یا از صفحه پیام‌ها بفرستید')
      return
    }

    setIsSending(true)
    try {
      const typeLabel = messageTypes.find((t) => t.value === messageType)?.label || 'پیام معلم'
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: student.parentId,
          subject: typeLabel,
          content: text,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'ارسال ناموفق بود')
        return
      }
      setSent(true)
      toast.success('پیام برای والد ارسال شد')
      setTimeout(() => setSent(false), 3000)
    } catch {
      toast.error('خطای شبکه')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <DashboardPage
      className="max-w-5xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <MessageSquareText className="w-8 h-8 text-brand-cyan" />
          دستیار ارتباط با والدین
        </span>
      }
      description="پیش‌نویس پیام‌های حرفه‌ای برای ارتباط با خانواده‌ها"
      actions={
        <Link href="/teacher">
          <Button variant="outline" size="icon" className="glass-panel-quiet" aria-label="بازگشت">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      }
      animatedSections={false}
    >
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ==================== فرم ورودی ==================== */}
          <div className="space-y-6">
            {/* انتخاب دانش‌آموز */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                انتخاب دانش‌آموز
              </h2>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="" className="bg-slate-800">یک دانش‌آموز انتخاب کنید...</option>
                {students.map(student => (
                  <option key={student.id} value={student.id} className="bg-slate-800">
                    {student.name} - {student.className}
                    {!student.parentId ? ' (بدون والد)' : ''}
                  </option>
                ))}
              </select>
            </GlassCard>

            {/* نوع پیام */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4">نوع پیام</h2>
              <div className="grid grid-cols-2 gap-3">
                {messageTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => setMessageType(type.value as MessageType)}
                      className={`p-4 rounded-xl border transition-all text-right ${
                        messageType === type.value
                          ? type.bg
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${type.color}`} />
                      <span className="text-white text-sm">{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </GlassCard>

            {/* موضوع پیام */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4">موضوع پیام</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {messageSubjects.map((subject) => {
                  const Icon = subject.icon
                  const isSelected = subjects.includes(subject.id)
                  return (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/30'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <Icon className="w-4 h-4 text-white/60" />
                      <span className="text-white text-sm">{subject.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* توضیحات اضافی */}
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="توضیحات اضافی (اختیاری)..."
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none leading-relaxed"
              />
            </GlassCard>

            {/* دکمه تولید */}
            <button
              onClick={generateMessage}
              disabled={isGenerating || !selectedStudent || subjects.length === 0}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all
                ${isGenerating || !selectedStudent || subjects.length === 0
                  ? 'bg-white/20 text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30'
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  در حال تولید پیام...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  تولید پیش‌نویس
                </>
              )}
            </button>
          </div>

          {/* ==================== نمایش پیام و الگوها ==================== */}
          <div className="space-y-6">
            {/* پیام تولید شده */}
            {generatedMessage && (
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    پیام تولید شده
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`p-2 rounded-lg transition-all ${
                      isEditing ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    rows={12}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none leading-relaxed font-['Vazir']"
                  />
                ) : (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-h-80 overflow-y-auto">
                    <pre className="text-white/90 whitespace-pre-wrap leading-relaxed font-['Vazir'] text-sm">
                      {generatedMessage}
                    </pre>
                  </div>
                )}

                {/* دکمه‌های عملیات */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={copyMessage}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        کپی شد!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        کپی
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => void sendMessage()}
                    disabled={isSending || sent}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : sent ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        ارسال شد!
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        ارسال به والد
                      </>
                    )}
                  </button>
                </div>
              </GlassCard>
            )}

            {/* الگوهای آماده */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                الگوهای آماده
              </h2>
              <div className="space-y-3">
                {messageTemplates.map((template) => {
                  const typeInfo = messageTypes.find(t => t.value === template.type)
                  return (
                    <div
                      key={template.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${typeInfo?.bg}`}>
                              {typeInfo?.label}
                            </span>
                            <h3 className="text-white font-medium">{template.title}</h3>
                          </div>
                          <p className="text-white/50 text-sm">{template.preview}</p>
                        </div>
                        <button
                          onClick={() => applyTemplate(template)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all whitespace-nowrap"
                        >
                          استفاده
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>

            {!generatedMessage && (
              <GlassCard className="p-6 border-brand-cyan/25 bg-gradient-to-bl from-brand-cyan/15 via-card/90 to-brand-purple/10">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  💡 راهنمای استفاده
                </h3>
                <ul className="text-muted-foreground text-sm space-y-2 leading-relaxed">
                  <li>• ابتدا دانش‌آموز مورد نظر را انتخاب کنید</li>
                  <li>• نوع پیام را مشخص کنید (تشویقی، انتقادی، ...)</li>
                  <li>• حداقل یک موضوع پیام را انتخاب کنید</li>
                  <li>• در صورت نیاز توضیحات اضافی بنویسید</li>
                  <li>• دکمه «تولید پیش‌نویس» را بزنید</li>
                  <li>• پیام را ویرایش کنید و برای والد داخل سامانه بفرستید</li>
                </ul>
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

















































