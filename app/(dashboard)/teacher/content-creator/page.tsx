'use client'

import { useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
}

interface GeneratedContent {
  type: 'lesson-plan' | 'exam-questions' | 'activity-idea'
  content: string
  metadata?: {
    grade?: string
    subject?: string
    topic?: string
  }
}

// ============================================
// داده‌های نمونه
// ============================================
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

const mockHistory: ContentHistory[] = [
  {
    id: '1',
    type: 'lesson-plan',
    title: 'طرح درس ریاضی - کسرها',
    date: '۱۴۰۳/۰۹/۱۵',
    grade: 'پایه پنجم',
    subject: 'ریاضی',
  },
  {
    id: '2',
    type: 'exam-questions',
    title: 'سوالات علوم - دستگاه گوارش',
    date: '۱۴۰۳/۰۹/۱۴',
    grade: 'پایه ششم',
    subject: 'علوم',
  },
  {
    id: '3',
    type: 'activity-idea',
    title: 'فعالیت گروهی فارسی',
    date: '۱۴۰۳/۰۹/۱۳',
    grade: 'پایه چهارم',
    subject: 'فارسی',
  },
  {
    id: '4',
    type: 'lesson-plan',
    title: 'طرح درس علوم - آهنربا',
    date: '۱۴۰۳/۰۹/۱۲',
    grade: 'پایه سوم',
    subject: 'علوم',
  },
  {
    id: '5',
    type: 'exam-questions',
    title: 'سوالات ریاضی - ضرب اعداد',
    date: '۱۴۰۳/۰۹/۱۱',
    grade: 'پایه چهارم',
    subject: 'ریاضی',
  },
]

// محتوای نمونه
const sampleLessonPlan = `📚 طرح درس: کسرها

🎯 اهداف آموزشی:
۱. دانش‌آموز بتواند مفهوم کسر را توضیح دهد
۲. دانش‌آموز بتواند کسرهای مساوی را شناسایی کند
۳. دانش‌آموز بتواند کسرها را با هم مقایسه کند

⏰ مراحل تدریس:

📍 مرحله اول - آمادگی (۵ دقیقه):
• مرور درس قبل
• طرح سوال برانگیزاننده: "اگر یک پیتزا را به ۴ قسمت مساوی تقسیم کنیم..."

📍 مرحله دوم - ارائه مفهوم (۱۵ دقیقه):
• نمایش عملی با کاغذ رنگی
• رسم شکل روی تخته
• توضیح صورت و مخرج کسر

📍 مرحله سوم - تمرین (۱۵ دقیقه):
• حل مثال‌های گروهی
• فعالیت با کاردستی

📍 مرحله چهارم - ارزیابی (۱۰ دقیقه):
• پرسش و پاسخ
• تکلیف منزل

🛠️ وسایل مورد نیاز:
• کاغذ رنگی
• قیچی
• تخته وایت‌برد

✨ نکات تکمیلی:
• از مثال‌های روزمره مانند پیتزا و کیک استفاده شود
• به دانش‌آموزان ضعیف‌تر توجه ویژه شود`

const sampleExamQuestions = `📝 سوالات آزمون علوم - دستگاه گوارش

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 سوال ۱ (تستی - آسان):
کدام عضو وظیفه خرد کردن غذا را دارد؟

الف) معده
ب) دندان ✓
ج) روده
د) کبد

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 سوال ۲ (تستی - متوسط):
غذا پس از معده به کدام قسمت می‌رود؟

الف) مری
ب) دهان
ج) روده کوچک ✓
د) روده بزرگ

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 سوال ۳ (تستی - سخت):
کدام ماده در معده ترشح می‌شود و به هضم پروتئین کمک می‌کند؟

الف) صفرا
ب) آب دهان
ج) اسید معده ✓
د) آنزیم لیپاز

━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 پاسخنامه:
۱- ب | ۲- ج | ۳- ج

💡 بارم‌بندی:
هر سوال ۱ نمره - جمع: ۳ نمره`

const sampleActivityIdea = `🎨 ایده فعالیت: کارگاه ساخت مدل دستگاه گوارش

👥 نوع فعالیت: گروهی (۴-۵ نفره)

⏱️ مدت زمان: ۴۵ دقیقه

🎯 هدف:
• درک بهتر ساختار دستگاه گوارش
• تقویت کار گروهی
• یادگیری عملی

📦 مواد مورد نیاز:
• مقوا و کاغذ رنگی
• چسب و قیچی
• ماژیک رنگی
• نخ و نوار چسب

📋 مراحل اجرا:

گام ۱ - آماده‌سازی (۵ دقیقه):
• تقسیم گروه‌ها
• توزیع وسایل

گام ۲ - طراحی (۱۰ دقیقه):
• هر گروه طرح اولیه را روی کاغذ بکشد
• مشورت با معلم

گام ۳ - ساخت (۲۰ دقیقه):
• برش و چسباندن قطعات
• رنگ‌آمیزی و نام‌گذاری اعضا

گام ۴ - ارائه (۱۰ دقیقه):
• هر گروه مدل خود را معرفی کند
• توضیح عملکرد هر بخش

⭐ امتیازدهی:
• دقت علمی: ۵ امتیاز
• خلاقیت: ۳ امتیاز
• کار گروهی: ۲ امتیاز

🏆 جایزه: گروه برتر ستاره طلایی می‌گیرد!`

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
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
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
            PDF
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl transition-all text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            ذخیره
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-5 border border-white/10 max-h-[500px] overflow-y-auto">
        <pre className="text-white/80 whitespace-pre-wrap font-sans text-sm leading-relaxed" dir="rtl">
          {content.content}
        </pre>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function ContentCreatorPage() {
  // State ها
  const [activeTab, setActiveTab] = useState('lesson-plan')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [copied, setCopied] = useState(false)

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

  // تولید محتوا (شبیه‌سازی)
  const generateContent = async (type: GeneratedContent['type']): Promise<void> => {
    setIsLoading(true)
    setGeneratedContent(null)

    // شبیه‌سازی درخواست API
    await new Promise(resolve => setTimeout(resolve, 2000))

    let content = ''
    switch (type) {
      case 'lesson-plan':
        content = sampleLessonPlan
        break
      case 'exam-questions':
        content = sampleExamQuestions
        break
      case 'activity-idea':
        content = sampleActivityIdea
        break
    }

    setGeneratedContent({ type, content })
    setIsLoading(false)
  }

  // کپی محتوا
  const handleCopy = async (): Promise<void> => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // دانلود PDF (شبیه‌سازی)
  const handleDownload = (): void => {
    alert('در نسخه نهایی، فایل PDF دانلود خواهد شد.')
  }

  // ذخیره در بانک (شبیه‌سازی)
  const handleSave = (): void => {
    alert('محتوا در بانک سوالات ذخیره شد!')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-4 md:p-6 lg:p-8" dir="rtl">
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
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                  دستیار محتوای خلاق
                </h1>
                <p className="text-white/60 mt-1">
                  تولید طرح درس، سوالات آزمون و ایده‌های فعالیت با هوش مصنوعی
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ==================== Tabs ==================== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20 h-auto flex-wrap">
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
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
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
            </div>
          </TabsContent>

          {/* ========== تب سوال آزمون ========== */}
          <TabsContent value="exam-questions" className="mt-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
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
            </div>
          </TabsContent>

          {/* ========== تب ایده فعالیت ========== */}
          <TabsContent value="activity-idea" className="mt-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
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
            </div>
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              تاریخچه محتوا
            </h2>
            <span className="text-white/50 text-sm">۵ مورد اخیر</span>
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
                {mockHistory.map((item) => (
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
            {mockHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getHistoryIcon(item.type)}
                    <span className="text-white font-medium text-sm">{item.title}</span>
                  </div>
                  <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
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

          {mockHistory.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <p className="text-white/50">هنوز محتوایی تولید نشده است</p>
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
























