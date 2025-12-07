'use client'

import { useState } from 'react'
import Link from 'next/link'
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

// ============================================
// تایپ‌ها
// ============================================
type MessageType = 'positive' | 'critical' | 'informational' | 'meeting'

interface Student {
  id: string
  name: string
  className: string
  parentName: string
}

interface MessageTemplate {
  id: string
  title: string
  type: MessageType
  preview: string
  content: string
}

// ============================================
// داده‌های نمونه
// ============================================
const students: Student[] = [
  { id: '1', name: 'علی محمدی', className: 'کلاس چهارم الف', parentName: 'آقای محمدی' },
  { id: '2', name: 'سارا رضایی', className: 'کلاس چهارم الف', parentName: 'خانم رضایی' },
  { id: '3', name: 'محمد احمدی', className: 'کلاس چهارم الف', parentName: 'آقای احمدی' },
  { id: '4', name: 'زهرا کریمی', className: 'کلاس چهارم الف', parentName: 'خانم کریمی' },
  { id: '5', name: 'امیر حسینی', className: 'کلاس چهارم الف', parentName: 'آقای حسینی' },
]

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
  // State‌ها
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
      alert('لطفاً دانش‌آموز و حداقل یک موضوع را انتخاب کنید.')
      return
    }

    setIsGenerating(true)
    setSent(false)

    // شبیه‌سازی تولید با AI
    await new Promise(resolve => setTimeout(resolve, 2500))

    const student = students.find(s => s.id === selectedStudent)
    const selectedSubjects = subjects.map(s => messageSubjects.find(ms => ms.id === s)?.label).join('، ')

    // تولید پیام بر اساس نوع
    let messageContent = ''

    if (messageType === 'positive') {
      messageContent = `${student?.parentName} گرامی،

با سلام و احترام،

امیدوارم از سلامتی و شادکامی برخوردار باشید.

با کمال خوشحالی می‌خواهم درباره ${student?.name} عزیز با شما صحبت کنم. فرزند گرامی‌تان در زمینه ${selectedSubjects} عملکرد بسیار خوبی داشته‌اند.

نقاط قوت:
• مشارکت فعال در کلاس و پرسیدن سوالات هوشمندانه
• انجام به موقع تکالیف با دقت بالا
• رفتار محترمانه با همکلاسی‌ها و معلم
• پیشرفت چشمگیر در یادگیری مطالب جدید

${additionalNotes ? `توضیحات تکمیلی:\n${additionalNotes}\n` : ''}
این موفقیت‌ها نتیجه تلاش ${student?.name} و البته حمایت‌های شما خانواده محترم است. از همکاری و توجه شما صمیمانه سپاسگزاریم.

با احترام فراوان،
معلم کلاس ${student?.className}`
    } else if (messageType === 'critical') {
      messageContent = `${student?.parentName} گرامی،

با سلام و احترام،

امیدوارم این پیام شما را در کمال سلامتی و آرامش بیابد.

می‌خواستم در مورد ${student?.name} عزیز با شما صحبتی داشته باشم. فرزند گرامی‌تان دانش‌آموز با استعدادی است و من به پتانسیل بالای ایشان ایمان دارم.

با این حال، اخیراً در زمینه ${selectedSubjects} به توجه بیشتری نیاز داریم:
• نیاز به تمرکز بیشتر در کلاس
• اهمیت انجام منظم تکالیف
• تقویت مهارت‌های سازماندهی

${additionalNotes ? `توضیحات تکمیلی:\n${additionalNotes}\n` : ''}
پیشنهادات:
✓ برنامه‌ریزی روزانه برای مطالعه
✓ ایجاد محیط آرام برای انجام تکالیف
✓ تشویق و حمایت مستمر

من مطمئنم با همکاری شما، ${student?.name} می‌تواند به بهترین نسخه از خودش تبدیل شود. در صورت تمایل، می‌توانیم جلسه‌ای حضوری یا تلفنی داشته باشیم.

با احترام،
معلم کلاس ${student?.className}`
    } else if (messageType === 'informational') {
      messageContent = `${student?.parentName} گرامی،

با سلام و احترام،

بدینوسیله به استحضار می‌رسانم که در زمینه ${selectedSubjects} اطلاعاتی به شرح زیر وجود دارد:

📌 نکات مهم:
• برنامه درسی هفته آینده شامل مباحث جدید است
• تکالیف باید تا پایان هفته تحویل داده شوند
• آزمون میان‌ترم در تاریخ اعلام شده برگزار می‌گردد

${additionalNotes ? `توضیحات تکمیلی:\n${additionalNotes}\n` : ''}
لطفاً ${student?.name} عزیز را در آمادگی برای این موارد یاری فرمایید.

در صورت داشتن هرگونه سوال، در خدمت شما هستم.

با تشکر از همکاری شما،
معلم کلاس ${student?.className}`
    } else {
      messageContent = `${student?.parentName} گرامی،

با سلام و احترام،

بدینوسیله از شما دعوت می‌شود تا در جلسه‌ای درباره ${selectedSubjects} شرکت فرمایید.

📅 زمان پیشنهادی: روز پنجشنبه، ساعت ۱۰ صبح
📍 مکان: دفتر مدرسه

موضوعات مورد بحث:
• بررسی وضعیت تحصیلی ${student?.name}
• برنامه‌ریزی برای پیشرفت بیشتر
• پاسخ به سوالات شما

${additionalNotes ? `توضیحات تکمیلی:\n${additionalNotes}\n` : ''}
حضور شما برای ما بسیار ارزشمند است و به بهبود کیفیت آموزش فرزندتان کمک شایانی خواهد کرد.

لطفاً در صورت امکان، حضور یا عدم حضور خود را اطلاع دهید.

با احترام فراوان،
معلم کلاس ${student?.className}`
    }

    setGeneratedMessage(messageContent)
    setEditedMessage(messageContent)
    setIsGenerating(false)
  }

  // کپی پیام
  const copyMessage = async (): Promise<void> => {
    const textToCopy = isEditing ? editedMessage : generatedMessage
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // استفاده از الگو
  const useTemplate = (template: MessageTemplate): void => {
    setGeneratedMessage(template.content)
    setEditedMessage(template.content)
    setMessageType(template.type)
  }

  // ارسال پیام
  const sendMessage = async (): Promise<void> => {
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-4 md:p-6 lg:p-8" dir="rtl">
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
                <MessageSquareText className="w-8 h-8 text-blue-400" />
                دستیار ارتباط با والدین
              </h1>
              <p className="text-white/60 mt-1">
                پیش‌نویس پیام‌های حرفه‌ای برای ارتباط با خانواده‌ها
              </p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ==================== فرم ورودی ==================== */}
          <div className="space-y-6">
            {/* انتخاب دانش‌آموز */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
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
                  </option>
                ))}
              </select>
            </div>

            {/* نوع پیام */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4">نوع پیام</h2>
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
            </div>

            {/* موضوع پیام */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4">موضوع پیام</h2>
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
            </div>

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
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
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
                    onClick={sendMessage}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/20"
                  >
                    {sent ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        ارسال شد!
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        ارسال مستقیم
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* الگوهای آماده */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
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
                          onClick={() => useTemplate(template)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all whitespace-nowrap"
                        >
                          استفاده
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* راهنما */}
            {!generatedMessage && (
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  💡 راهنمای استفاده
                </h3>
                <ul className="text-white/70 text-sm space-y-2 leading-relaxed">
                  <li>• ابتدا دانش‌آموز مورد نظر را انتخاب کنید</li>
                  <li>• نوع پیام را مشخص کنید (تشویقی، انتقادی، ...)</li>
                  <li>• حداقل یک موضوع پیام را انتخاب کنید</li>
                  <li>• در صورت نیاز توضیحات اضافی بنویسید</li>
                  <li>• دکمه "تولید پیش‌نویس" را بزنید</li>
                  <li>• پیام را ویرایش کرده و ارسال کنید</li>
                </ul>
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

















