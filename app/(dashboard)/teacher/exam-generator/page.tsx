'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Brain,
  Upload,
  FileText,
  X,
  ArrowRight,
  Sparkles,
  Settings,
  Hash,
  ListChecks,
  BarChart3,
  Loader2,
  Copy,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Target,
  Lightbulb,
  Trophy,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface Question {
  id: number
  text: string
  options: string[]
  correctAnswer: number // index of correct option
  explanation?: string
}

interface AnalysisResult {
  style: string[]
  topics: string[]
  difficulty: string
  totalQuestions: number
}

// ============================================
// داده‌های نمونه
// ============================================
const questionTypeOptions = [
  { value: '4-choice', label: 'چهار گزینه‌ای' },
  { value: '5-choice', label: 'پنج گزینه‌ای' },
]

const difficultyOptions = [
  { value: 'similar', label: 'مشابه اصلی' },
  { value: 'easier', label: 'آسان‌تر' },
  { value: 'harder', label: 'سخت‌تر' },
]

const sampleAnalysis: AnalysisResult = {
  style: ['استدلالی', 'مفهومی', 'تحلیلی'],
  topics: ['ریاضی', 'هوش و استعداد', 'علوم'],
  difficulty: 'متوسط تا سخت',
  totalQuestions: 25,
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    text: 'اگر عدد ۱۲۳۴ را از راست به چپ بخوانیم، عدد ۴۳۲۱ به دست می‌آید. مجموع این دو عدد کدام است؟',
    options: ['۵۵۵۵', '۵۶۵۵', '۶۵۵۵', '۵۵۶۵'],
    correctAnswer: 0,
    explanation: 'مجموع ۱۲۳۴ + ۴۳۲۱ = ۵۵۵۵',
  },
  {
    id: 2,
    text: 'در دنباله ۲، ۵، ۱۰، ۱۷، ۲۶، ... عدد بعدی کدام است؟',
    options: ['۳۵', '۳۶', '۳۷', '۳۸'],
    correctAnswer: 2,
    explanation: 'تفاضل‌ها: ۳، ۵، ۷، ۹، ۱۱ → عدد بعدی ۲۶ + ۱۱ = ۳۷',
  },
  {
    id: 3,
    text: 'یک مخزن آب در ۶ ساعت پر می‌شود. اگر نصف مخزن پر باشد، چند ساعت طول می‌کشد تا پر شود؟',
    options: ['۲ ساعت', '۳ ساعت', '۴ ساعت', '۶ ساعت'],
    correctAnswer: 1,
    explanation: 'نصف باقی‌مانده = نصف ۶ ساعت = ۳ ساعت',
  },
  {
    id: 4,
    text: 'کدام شکل از نظر منطقی با بقیه تفاوت دارد؟ مربع، مستطیل، لوزی، دایره',
    options: ['مربع', 'مستطیل', 'لوزی', 'دایره'],
    correctAnswer: 3,
    explanation: 'دایره تنها شکل بدون زاویه است',
  },
  {
    id: 5,
    text: 'اگر قیمت یک کالا ۲۰٪ افزایش یابد و سپس ۲۰٪ کاهش یابد، قیمت نهایی چند درصد قیمت اولیه است؟',
    options: ['۹۶٪', '۱۰۰٪', '۹۸٪', '۱۰۴٪'],
    correctAnswer: 0,
    explanation: '۱.۲ × ۰.۸ = ۰.۹۶ = ۹۶٪',
  },
  {
    id: 6,
    text: 'در یک کلاس ۳۰ نفره، ۱۸ نفر فوتبال و ۱۵ نفر والیبال دوست دارند. اگر ۵ نفر هیچکدام را دوست نداشته باشند، چند نفر هر دو را دوست دارند؟',
    options: ['۶ نفر', '۸ نفر', '۱۰ نفر', '۱۲ نفر'],
    correctAnswer: 1,
    explanation: 'با استفاده از اصل شمول و عدم شمول: ۱۸ + ۱۵ - x = ۳۰ - ۵ → x = ۸',
  },
  {
    id: 7,
    text: 'عقربه دقیقه‌شمار در ۲۰ دقیقه چند درجه می‌چرخد؟',
    options: ['۶۰°', '۹۰°', '۱۲۰°', '۱۸۰°'],
    correctAnswer: 2,
    explanation: 'هر دقیقه ۶ درجه → ۲۰ × ۶ = ۱۲۰°',
  },
  {
    id: 8,
    text: 'کدام کسر بین ½ و ¾ قرار دارد؟',
    options: ['⅓', '⅖', '⅗', '⅘'],
    correctAnswer: 2,
    explanation: '½ = 0.5 و ¾ = 0.75 → ⅗ = 0.6 بین این دو است',
  },
]

// ============================================
// کامپوننت Select سفارشی
// ============================================
interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}

function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent cursor-pointer"
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
    </div>
  )
}

// ============================================
// کامپوننت آپلود فایل
// ============================================
interface FileUploadProps {
  file: File | null
  onFileSelect: (file: File | null) => void
  error: string | null
}

function FileUpload({ file, onFileSelect, error }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }, [])

  const validateAndSetFile = (selectedFile: File): void => {
    // Check file type
    if (selectedFile.type !== 'application/pdf') {
      onFileSelect(null)
      return
    }

    // Check file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      onFileSelect(null)
      return
    }

    onFileSelect(selectedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const handleRemoveFile = (): void => {
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-white/30 bg-white/5 hover:border-orange-500/50 hover:bg-white/10'
            }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-2xl transition-all ${isDragging ? 'bg-orange-500/20' : 'bg-white/10'}`}>
              <Upload className={`w-10 h-10 ${isDragging ? 'text-orange-400' : 'text-white/50'}`} />
            </div>
            <div>
              <p className="text-white font-medium mb-1">
                فایل PDF را اینجا بکشید و رها کنید
              </p>
              <p className="text-white/50 text-sm">
                یا کلیک کنید برای انتخاب فایل
              </p>
            </div>
            <div className="flex items-center gap-4 text-white/40 text-xs">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                فقط PDF
              </span>
              <span>•</span>
              <span>حداکثر ۵ مگابایت</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-white/50 text-sm">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all"
            >
              <X className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}

// ============================================
// کامپوننت کارت سوال
// ============================================
interface QuestionCardProps {
  question: Question
  showAnswer: boolean
}

function QuestionCard({ question, showAnswer }: QuestionCardProps) {
  const optionLabels = ['الف', 'ب', 'ج', 'د', 'ه']

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {question.id}
        </div>
        <p className="text-white font-medium leading-relaxed">{question.text}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mr-11">
        {question.options.map((option, index) => {
          const isCorrect = index === question.correctAnswer
          return (
            <div
              key={index}
              className={`flex items-center gap-2 p-3 rounded-xl transition-all
                ${showAnswer && isCorrect
                  ? 'bg-green-500/20 border-2 border-green-500/50'
                  : 'bg-white/5 border border-white/10'
                }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${showAnswer && isCorrect
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white/60'
                }`}
              >
                {optionLabels[index]}
              </span>
              <span className={`text-sm ${showAnswer && isCorrect ? 'text-green-400 font-medium' : 'text-white/70'}`}>
                {option}
              </span>
              {showAnswer && isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-green-400 mr-auto" />
              )}
            </div>
          )
        })}
      </div>

      {showAnswer && question.explanation && (
        <div className="mt-4 mr-11 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
          <p className="text-blue-400 text-sm flex items-start gap-2">
            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{question.explanation}</span>
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function ExamGeneratorPage() {
  // State ها
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState('10')
  const [questionType, setQuestionType] = useState('4-choice')
  const [difficulty, setDifficulty] = useState('similar')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [showAnswers, setShowAnswers] = useState(true)
  const [copied, setCopied] = useState(false)

  // هندل انتخاب فایل
  const handleFileSelect = (selectedFile: File | null): void => {
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setFileError('فقط فایل‌های PDF مجاز هستند')
        setFile(null)
        return
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setFileError('حجم فایل نباید بیشتر از ۵ مگابایت باشد')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setFileError(null)
    } else {
      setFile(null)
    }
  }

  // تولید سوالات
  const handleGenerate = async (): Promise<void> => {
    if (!file) {
      setFileError('لطفاً یک فایل PDF آپلود کنید')
      return
    }

    setIsLoading(true)
    setShowResults(false)

    // شبیه‌سازی مراحل پردازش
    const steps = [
      'در حال خواندن فایل PDF...',
      'در حال استخراج متن...',
      'در حال تحلیل سبک سوالات...',
      'در حال تولید سوالات جدید...',
      'در حال بررسی کیفیت...',
    ]

    for (const step of steps) {
      setLoadingStep(step)
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    setIsLoading(false)
    setShowResults(true)
  }

  // کپی سوالات
  const handleCopy = async (): Promise<void> => {
    const text = sampleQuestions
      .slice(0, parseInt(questionCount) || 10)
      .map((q, i) => {
        const options = q.options.map((opt, idx) => `${['الف', 'ب', 'ج', 'د', 'ه'][idx]}) ${opt}`).join('\n')
        return `${i + 1}. ${q.text}\n${options}\nپاسخ: ${['الف', 'ب', 'ج', 'د', 'ه'][q.correctAnswer]}`
      })
      .join('\n\n')

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // دانلود PDF
  const handleDownload = (): void => {
    alert('در نسخه نهایی، فایل PDF آزمون دانلود خواهد شد.')
  }

  // چاپ
  const handlePrint = (): void => {
    window.print()
  }

  // تعداد سوالات برای نمایش
  const displayedQuestions = sampleQuestions.slice(0, Math.min(parseInt(questionCount) || 10, sampleQuestions.length))

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
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
                  <Trophy className="w-8 h-8 text-yellow-300" />
                  آزمون‌ساز تیزهوشان
                </h1>
                <p className="text-white/70 mt-1">
                  تولید سوال بر اساس نمونه سوالات گذشته پایه ششم
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500/30 text-yellow-100 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                هوش مصنوعی Gemini
              </span>
            </div>
          </div>
        </header>

        {/* ==================== بخش آپلود و تنظیمات ==================== */}
        <div className="grid lg:grid-cols-5 gap-6 mb-6">
          {/* آپلود فایل */}
          <div className="lg:col-span-3 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-300" />
              آپلود فایل نمونه سوالات
            </h2>
            <p className="text-white/60 text-sm mb-4">
              فایل PDF نمونه سوالات تیزهوشان را آپلود کنید تا سبک و ساختار آن تحلیل شود.
            </p>
            <FileUpload
              file={file}
              onFileSelect={handleFileSelect}
              error={fileError}
            />
          </div>

          {/* تنظیمات */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-300" />
              تنظیمات
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  تعداد سوال
                </label>
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="۵ تا ۲۰ سوال"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  نوع سوال
                </label>
                <CustomSelect
                  value={questionType}
                  onChange={setQuestionType}
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
                  value={difficulty}
                  onChange={setDifficulty}
                  options={difficultyOptions}
                  placeholder="سطح دشواری..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== دکمه تولید ==================== */}
        <div className="mb-6">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !file}
            className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all shadow-lg
              ${isLoading || !file
                ? 'bg-white/20 text-white/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50'
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {loadingStep}
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                تحلیل و تولید سوالات
              </>
            )}
          </button>
        </div>

        {/* ==================== نتایج ==================== */}
        {showResults && (
          <>
            {/* کارت تحلیل */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 mb-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                نتیجه تحلیل
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/60 text-sm mb-1">سبک سوالات</p>
                  <div className="flex flex-wrap gap-2">
                    {sampleAnalysis.style.map((s, i) => (
                      <span key={i} className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded-lg text-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/60 text-sm mb-1">موضوعات</p>
                  <div className="flex flex-wrap gap-2">
                    {sampleAnalysis.topics.map((t, i) => (
                      <span key={i} className="bg-blue-500/30 text-blue-300 px-2 py-1 rounded-lg text-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/60 text-sm mb-1">سطح دشواری</p>
                  <p className="text-white font-bold">{sampleAnalysis.difficulty}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/60 text-sm mb-1">تعداد سوالات منبع</p>
                  <p className="text-white font-bold">{sampleAnalysis.totalQuestions} سوال</p>
                </div>
              </div>
            </div>

            {/* سوالات تولید شده */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileQuestion className="w-5 h-5 text-yellow-400" />
                  سوالات تولید شده
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                    {displayedQuestions.length} سوال
                  </span>
                </h2>

                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAnswers}
                      onChange={(e) => setShowAnswers(e.target.checked)}
                      className="w-4 h-4 rounded accent-orange-500"
                    />
                    نمایش پاسخ‌ها
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
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
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl transition-all text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl transition-all text-sm font-medium"
                    >
                      <Printer className="w-4 h-4" />
                      چاپ
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {displayedQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    showAnswer={showAnswers}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}
























