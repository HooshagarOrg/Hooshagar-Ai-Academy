'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  BookOpen,
  FileQuestion,
  Lightbulb,
  ArrowRight,
  Copy,
  Download,
  Save,
  Clock,
  Eye,
  CheckCircle2,
  Users,
  Wrench,
  Loader2,
  FileText,
  GraduationCap,
  Target,
  Timer,
  ListChecks,
  BarChart3,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'

// ============================================
// تایپ‌ها
// ============================================
interface ContentHistory {
  id: string
  type: 'lesson-plan' | 'exam-questions' | 'activity-idea'
  title: string
  date: string
  grade: string
  subject: string
  content: string
}

interface GeneratedContent {
  type: 'lesson-plan' | 'exam-questions' | 'activity-idea'
  content: string
  metadata?: {
    grade?: string
    subject?: string
    topic?: string
    model?: string
  }
}

const HISTORY_KEY = 'hooshagar:teacher-content-history'

const gradeOptions = [
  { value: '1', label: 'پایه اول' },
  { value: '2', label: 'پایه دوم' },
  { value: '3', label: 'پایه سوم' },
  { value: '4', label: 'پایه چهارم' },
  { value: '5', label: 'پایه پنجم' },
  { value: '6', label: 'پایه ششم' },
]

const questionTypeOptions = [
  { value: 'multiple-choice', label: 'تستی' },
  { value: 'descriptive', label: 'تشریحی' },
]

const difficultyOptions = [
  { value: 'easy', label: 'آسان' },
  { value: 'medium', label: 'متوسط' },
  { value: 'hard', label: 'سخت' },
]

function gradeLabel(value: string): string {
  return gradeOptions.find((g) => g.value === value)?.label ?? `پایه ${value}`
}

function todayFa(): string {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Date().toLocaleDateString('fa-IR')
  }
}

function loadHistory(): ContentHistory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ContentHistory[]
    return Array.isArray(parsed) ? parsed.slice(0, 30) : []
  } catch {
    return []
  }
}

function persistHistory(items: ContentHistory[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 30)))
  } catch {
    // ignore quota
  }
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
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent cursor-pointer"
      >
        <option value="" disabled className="bg-slate-800 text-white/50">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
        {icon}
      </div>
    </div>
  )
}

// ============================================
// کامپوننت Input سفارشی
// ============================================
interface CustomInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon?: React.ReactNode
  type?: string
}

function CustomInput({ value, onChange, placeholder, icon, type = 'text' }: CustomInputProps) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
      />
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
          {icon}
        </div>
      )}
    </div>
  )
}

// ============================================
// کامپوننت Checkbox سفارشی
// ============================================
interface CustomCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  icon?: React.ReactNode
}

function CustomCheckbox({ checked, onChange, label, icon }: CustomCheckboxProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
          ${checked
            ? 'bg-blue-500 border-blue-500'
            : 'bg-white/10 border-white/30 group-hover:border-blue-500/50'
          }`}
        onClick={() => onChange(!checked)}
      >
        {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
      </div>
      <span className="text-white/80 flex items-center gap-2">
        {icon}
        {label}
      </span>
    </label>
  )
}

// ============================================
// کامپوننت Skeleton Loading
// ============================================
function ContentSkeleton() {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white/10 rounded-xl" />
        <div className="h-6 w-32 bg-white/10 rounded-lg" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-white/10 rounded-lg w-full" />
        <div className="h-4 bg-white/10 rounded-lg w-5/6" />
        <div className="h-4 bg-white/10 rounded-lg w-4/6" />
        <div className="h-4 bg-white/10 rounded-lg w-full" />
        <div className="h-4 bg-white/10 rounded-lg w-3/4" />
      </div>
    </div>
  )
}

// ============================================
// کامپوننت نمایش نتیجه
// ============================================
interface ResultCardProps {
  content: GeneratedContent | null
  onCopy: () => void
  onDownload: () => void
  onSave: () => void
  copied: boolean
}

function ResultCard({ content, onCopy, onDownload, onSave, copied }: ResultCardProps) {
  if (!content) return null

  const getTypeInfo = (type: GeneratedContent['type']) => {
    switch (type) {
      case 'lesson-plan':
        return { label: 'طرح درس', icon: <BookOpen className="w-5 h-5" />, color: 'text-green-400' }
      case 'exam-questions':
        return { label: 'سوالات آزمون', icon: <FileQuestion className="w-5 h-5" />, color: 'text-yellow-400' }
      case 'activity-idea':
        return { label: 'ایده فعالیت', icon: <Lightbulb className="w-5 h-5" />, color: 'text-purple-400' }
    }
  }

  const typeInfo = getTypeInfo(content.type)

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${typeInfo.color}`}>{typeInfo.icon}</div>
          <h3 className="text-lg font-bold text-white">{typeInfo.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium
              ${copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'کپی شد!' : 'کپی'}
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            دانلود متن
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl transition-all text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            تاریخچه
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-5 border border-white/10 max-h-[500px] overflow-y-auto">
        <pre className="text-white/80 whitespace-pre-wrap font-sans text-sm leading-relaxed" dir="rtl">
          {content.content}
        </pre>
      </div>
    </GlassCard>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function ContentCreatorPage() {
  const [activeTab, setActiveTab] = useState('lesson-plan')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<ContentHistory[]>([])

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  // فرم طرح درس
  const [lessonGrade, setLessonGrade] = useState('')
  const [lessonSubject, setLessonSubject] = useState('')
  const [lessonTopic, setLessonTopic] = useState('')
  const [lessonDuration, setLessonDuration] = useState('')

  // فرم سوال آزمون
  const [examGrade, setExamGrade] = useState('')
  const [examSubject, setExamSubject] = useState('')
  const [examTopic, setExamTopic] = useState('')
  const [examType, setExamType] = useState('')
  const [examDifficulty, setExamDifficulty] = useState('')
  const [examCount, setExamCount] = useState('')

  // فرم ایده فعالیت
  const [activityGrade, setActivityGrade] = useState('')
  const [activitySubject, setActivitySubject] = useState('')
  const [activityTopic, setActivityTopic] = useState('')
  const [activityGroupWork, setActivityGroupWork] = useState(false)
  const [activityUseTools, setActivityUseTools] = useState(false)

  const generateContent = async (type: GeneratedContent['type']): Promise<void> => {
    let body: Record<string, unknown> | null = null

    if (type === 'lesson-plan') {
      if (!lessonGrade || !lessonSubject.trim() || !lessonTopic.trim()) {
        toast.error('پایه، نام درس و موضوع را کامل کنید')
        return
      }
      body = {
        type,
        grade: Number(lessonGrade),
        subject: lessonSubject.trim(),
        topic: lessonTopic.trim(),
        durationMinutes: lessonDuration ? Number(lessonDuration) : 45,
      }
    } else if (type === 'exam-questions') {
      if (!examGrade || !examSubject.trim() || !examTopic.trim() || !examType || !examDifficulty) {
        toast.error('همه فیلدهای سوال آزمون را پر کنید')
        return
      }
      body = {
        type,
        grade: Number(examGrade),
        subject: examSubject.trim(),
        topic: examTopic.trim(),
        questionType: examType,
        difficulty: examDifficulty,
        count: examCount ? Number(examCount) : 5,
      }
    } else {
      if (!activityGrade || !activitySubject.trim() || !activityTopic.trim()) {
        toast.error('پایه، نام درس و موضوع فعالیت را کامل کنید')
        return
      }
      body = {
        type,
        grade: Number(activityGrade),
        subject: activitySubject.trim(),
        topic: activityTopic.trim(),
        groupWork: activityGroupWork,
        useTools: activityUseTools,
      }
    }

    setIsLoading(true)
    setGeneratedContent(null)

    try {
      const res = await fetch('/api/teacher/content-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as {
        success?: boolean
        content?: string
        error?: string
        metadata?: GeneratedContent['metadata']
      }

      if (!res.ok || !data.success || !data.content) {
        toast.error(data.error || 'تولید محتوا ناموفق بود')
        return
      }

      const next: GeneratedContent = {
        type,
        content: data.content,
        metadata: {
          grade: String(body.grade),
          subject: String(body.subject),
          topic: String(body.topic),
          model: data.metadata?.model,
        },
      }
      setGeneratedContent(next)

      const titlePrefix =
        type === 'lesson-plan' ? 'طرح درس' : type === 'exam-questions' ? 'سوالات' : 'فعالیت'
      const entry: ContentHistory = {
        id: `${Date.now()}`,
        type,
        title: `${titlePrefix} ${String(body.subject)} — ${String(body.topic)}`,
        date: todayFa(),
        grade: gradeLabel(String(body.grade)),
        subject: String(body.subject),
        content: data.content,
      }
      const updated = [entry, ...history].slice(0, 30)
      setHistory(updated)
      persistHistory(updated)
      toast.success('محتوا با هوش مصنوعی تولید شد')
    } catch {
      toast.error('خطای شبکه. دوباره تلاش کنید.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (): Promise<void> => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent.content)
      setCopied(true)
      toast.success('کپی شد')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = (): void => {
    if (!generatedContent) return
    const blob = new Blob([generatedContent.content], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hooshagar-content-${generatedContent.type}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('فایل متنی دانلود شد')
  }

  const handleSave = (): void => {
    if (!generatedContent) {
      toast.error('ابتدا محتوا تولید کنید')
      return
    }
    toast.success('در تاریخچهٔ این دستگاه ذخیره است')
  }

  const openHistoryItem = (item: ContentHistory): void => {
    setGeneratedContent({
      type: item.type,
      content: item.content,
      metadata: { grade: item.grade, subject: item.subject },
    })
    toast.message('محتوای تاریخچه نمایش داده شد')
  }

  // آیکون تاریخچه
  const getHistoryIcon = (type: ContentHistory['type']) => {
    switch (type) {
      case 'lesson-plan':
        return <BookOpen className="w-4 h-4 text-green-400" />
      case 'exam-questions':
        return <FileQuestion className="w-4 h-4 text-yellow-400" />
      case 'activity-idea':
        return <Lightbulb className="w-4 h-4 text-purple-400" />
    }
  }

  return (
    <DashboardPage
      className="max-w-6xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-brand-yellow" />
          دستیار محتوای خلاق
        </span>
      }
      description="تولید واقعی طرح درس، سوالات و ایدهٔ فعالیت با هوش مصنوعی (سهمیه‌دار)"
      actions={
        <Link href="/teacher">
          <Button variant="outline" size="icon" className="glass-panel-quiet" aria-label="بازگشت">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      }
      animatedSections={false}
    >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full glass-panel rounded-2xl p-2 h-auto flex-wrap">
            <TabsTrigger
              value="lesson-plan"
              className="flex-1 min-w-[120px] data-[state=active]:bg-green-500 data-[state=active]:text-white text-white/70 rounded-xl py-3 gap-2 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              طرح درس
            </TabsTrigger>
            <TabsTrigger
              value="exam-questions"
              className="flex-1 min-w-[120px] data-[state=active]:bg-yellow-500 data-[state=active]:text-white text-white/70 rounded-xl py-3 gap-2 transition-all"
            >
              <FileQuestion className="w-5 h-5" />
              سوال آزمون
            </TabsTrigger>
            <TabsTrigger
              value="activity-idea"
              className="flex-1 min-w-[120px] data-[state=active]:bg-purple-500 data-[state=active]:text-white text-white/70 rounded-xl py-3 gap-2 transition-all"
            >
              <Lightbulb className="w-5 h-5" />
              ایده فعالیت
            </TabsTrigger>
          </TabsList>

          {/* ========== تب طرح درس ========== */}
          <TabsContent value="lesson-plan" className="mt-6">
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-400" />
                تولید طرح درس
              </h2>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    پایه تحصیلی
                  </label>
                  <CustomSelect
                    value={lessonGrade}
                    onChange={setLessonGrade}
                    options={gradeOptions}
                    placeholder="پایه را انتخاب کنید..."
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    نام درس
                  </label>
                  <CustomInput
                    value={lessonSubject}
                    onChange={setLessonSubject}
                    placeholder="مثال: ریاضی"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    موضوع درس
                  </label>
                  <CustomInput
                    value={lessonTopic}
                    onChange={setLessonTopic}
                    placeholder="مثال: کسرها"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    مدت زمان (دقیقه)
                  </label>
                  <CustomInput
                    value={lessonDuration}
                    onChange={setLessonDuration}
                    placeholder="مثال: ۴۵"
                    type="number"
                  />
                </div>
              </div>

              <button
                onClick={() => generateContent('lesson-plan')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال تولید...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    تولید طرح درس
                  </>
                )}
              </button>
            </GlassCard>
          </TabsContent>

          {/* ========== تب سوال آزمون ========== */}
          <TabsContent value="exam-questions" className="mt-6">
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-yellow-400" />
                تولید سوالات آزمون
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    پایه تحصیلی
                  </label>
                  <CustomSelect
                    value={examGrade}
                    onChange={setExamGrade}
                    options={gradeOptions}
                    placeholder="پایه را انتخاب کنید..."
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    نام درس
                  </label>
                  <CustomInput
                    value={examSubject}
                    onChange={setExamSubject}
                    placeholder="مثال: علوم"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    موضوع
                  </label>
                  <CustomInput
                    value={examTopic}
                    onChange={setExamTopic}
                    placeholder="مثال: دستگاه گوارش"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    نوع سوال
                  </label>
                  <CustomSelect
                    value={examType}
                    onChange={setExamType}
                    options={questionTypeOptions}
                    placeholder="نوع سوال..."
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    سطح دشواری
                  </label>
                  <CustomSelect
                    value={examDifficulty}
                    onChange={setExamDifficulty}
                    options={difficultyOptions}
                    placeholder="سطح دشواری..."
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    تعداد سوال
                  </label>
                  <CustomInput
                    value={examCount}
                    onChange={setExamCount}
                    placeholder="مثال: ۵"
                    type="number"
                  />
                </div>
              </div>

              <button
                onClick={() => generateContent('exam-questions')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال تولید...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    تولید سوالات
                  </>
                )}
              </button>
            </GlassCard>
          </TabsContent>

          {/* ========== تب ایده فعالیت ========== */}
          <TabsContent value="activity-idea" className="mt-6">
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                تولید ایده فعالیت
              </h2>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    پایه تحصیلی
                  </label>
                  <CustomSelect
                    value={activityGrade}
                    onChange={setActivityGrade}
                    options={gradeOptions}
                    placeholder="پایه را انتخاب کنید..."
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    نام درس
                  </label>
                  <CustomInput
                    value={activitySubject}
                    onChange={setActivitySubject}
                    placeholder="مثال: علوم"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    موضوع
                  </label>
                  <CustomInput
                    value={activityTopic}
                    onChange={setActivityTopic}
                    placeholder="مثال: دستگاه گوارش"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mb-6">
                <CustomCheckbox
                  checked={activityGroupWork}
                  onChange={setActivityGroupWork}
                  label="فعالیت گروهی"
                  icon={<Users className="w-4 h-4 text-blue-400" />}
                />
                <CustomCheckbox
                  checked={activityUseTools}
                  onChange={setActivityUseTools}
                  label="استفاده از ابزار"
                  icon={<Wrench className="w-4 h-4 text-orange-400" />}
                />
              </div>

              <button
                onClick={() => generateContent('activity-idea')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال تولید...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    تولید ایده
                  </>
                )}
              </button>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* ==================== نتیجه تولید شده ==================== */}
        {isLoading && (
          <div className="mb-6">
            <ContentSkeleton />
          </div>
        )}

        {generatedContent && !isLoading && (
          <div className="mb-6">
            <ResultCard
              content={generatedContent}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onSave={handleSave}
              copied={copied}
            />
          </div>
        )}

        {/* ==================== تاریخچه ==================== */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              تاریخچه محتوا
            </h2>
            <span className="text-white/50 text-sm">{history.length} مورد در این دستگاه</span>
          </div>

          {/* جدول در دسکتاپ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/60 text-sm border-b border-white/10">
                  <th className="text-right pb-4 font-medium">عنوان</th>
                  <th className="text-center pb-4 font-medium">نوع</th>
                  <th className="text-center pb-4 font-medium">پایه</th>
                  <th className="text-center pb-4 font-medium">درس</th>
                  <th className="text-center pb-4 font-medium">تاریخ</th>
                  <th className="text-center pb-4 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {getHistoryIcon(item.type)}
                        <span className="text-white font-medium">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                        ${item.type === 'lesson-plan' ? 'bg-green-500/20 text-green-400' :
                          item.type === 'exam-questions' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {item.type === 'lesson-plan' ? 'طرح درس' :
                          item.type === 'exam-questions' ? 'سوال' : 'فعالیت'}
                      </span>
                    </td>
                    <td className="py-4 text-center text-white/70">{item.grade}</td>
                    <td className="py-4 text-center text-white/70">{item.subject}</td>
                    <td className="py-4 text-center text-white/70">{item.date}</td>
                    <td className="py-4 text-center">
                      <button
                        type="button"
                        onClick={() => openHistoryItem(item)}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                        aria-label="نمایش محتوا"
                      >
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
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getHistoryIcon(item.type)}
                    <span className="text-white font-medium text-sm">{item.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openHistoryItem(item)}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                    aria-label="نمایش محتوا"
                  >
                    <Eye className="w-4 h-4 text-white/70" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-white/50 text-xs">
                  <span>{item.grade}</span>
                  <span>•</span>
                  <span>{item.subject}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>

          {history.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <p className="text-white/50">هنوز محتوایی تولید نشده است</p>
            </div>
          )}
        </GlassCard>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-muted-foreground text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
    </DashboardPage>
  )
}

















































