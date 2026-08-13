'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Brain,
  ArrowRight,
  Sparkles,
  Settings,
  Hash,
  ListChecks,
  BarChart3,
  Loader2,
  Copy,
  Printer,
  CheckCircle2,
  FileQuestion,
  Target,
  Lightbulb,
  Trophy,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'

interface Question {
  id: number
  text: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface AnalysisResult {
  style: string[]
  topics: string[]
  difficulty: string
  totalQuestions: number
}

const gradeOptions = [
  { value: '1', label: 'پایه اول' },
  { value: '2', label: 'پایه دوم' },
  { value: '3', label: 'پایه سوم' },
  { value: '4', label: 'پایه چهارم' },
  { value: '5', label: 'پایه پنجم' },
  { value: '6', label: 'پایه ششم' },
  { value: '7', label: 'پایه هفتم' },
  { value: '8', label: 'پایه هشتم' },
  { value: '9', label: 'پایه نهم' },
]

const questionTypeOptions = [
  { value: '4-choice', label: 'چهار گزینه‌ای' },
  { value: '5-choice', label: 'پنج گزینه‌ای' },
]

const difficultyOptions = [
  { value: 'similar', label: 'مشابه / متوسط' },
  { value: 'easier', label: 'آسان‌تر' },
  { value: 'harder', label: 'سخت‌تر' },
]

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}

function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
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
  )
}

interface QuestionCardProps {
  question: Question
  showAnswer: boolean
}

function QuestionCard({ question, showAnswer }: QuestionCardProps) {
  const optionLabels = ['الف', 'ب', 'ج', 'د', 'ه']

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
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
              className={`flex items-center gap-2 p-3 rounded-xl
                ${showAnswer && isCorrect
                  ? 'bg-green-500/20 border-2 border-green-500/50'
                  : 'bg-white/5 border border-white/10'
                }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${showAnswer && isCorrect ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'}`}
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

export default function ExamGeneratorPage() {
  const [grade, setGrade] = useState('6')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [questionCount, setQuestionCount] = useState('10')
  const [questionType, setQuestionType] = useState('4-choice')
  const [difficulty, setDifficulty] = useState('similar')
  const [isLoading, setIsLoading] = useState(false)
  const [showAnswers, setShowAnswers] = useState(true)
  const [copied, setCopied] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  const handleGenerate = async (): Promise<void> => {
    if (!subject.trim() || !topic.trim()) {
      toast.error('نام درس و موضوع را وارد کنید')
      return
    }

    const count = Number(questionCount)
    if (!Number.isFinite(count) || count < 5 || count > 20) {
      toast.error('تعداد سوال باید بین ۵ تا ۲۰ باشد')
      return
    }

    setIsLoading(true)
    setAnalysis(null)
    setQuestions([])

    try {
      const res = await fetch('/api/teacher/exam-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: Number(grade),
          subject: subject.trim(),
          topic: topic.trim(),
          questionCount: count,
          questionType,
          difficulty,
          sourceText: sourceText.trim() || null,
        }),
      })
      const data = (await res.json()) as {
        success?: boolean
        error?: string
        analysis?: AnalysisResult
        questions?: Question[]
      }

      if (!res.ok || !data.success || !data.questions?.length) {
        toast.error(data.error || 'تولید سوال ناموفق بود')
        return
      }

      setAnalysis(data.analysis ?? null)
      setQuestions(data.questions)
      toast.success(`${data.questions.length} سوال تولید شد`)
    } catch {
      toast.error('خطای شبکه. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (): Promise<void> => {
    const labels = ['الف', 'ب', 'ج', 'د', 'ه']
    const text = questions
      .map((q) => {
        const options = q.options.map((opt, idx) => `${labels[idx]}) ${opt}`).join('\n')
        return `${q.id}. ${q.text}\n${options}\nپاسخ: ${labels[q.correctAnswer] ?? ''}`
      })
      .join('\n\n')

    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('سوالات کپی شد')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardPage
      className="max-w-5xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-brand-yellow" />
          آزمون‌ساز
        </span>
      }
      description="تولید سوال با هوش مصنوعی بر اساس درس و موضوع کلاس"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/teacher"
            className="p-2 rounded-xl glass-panel-quiet hover:border-white/[0.12] transition-colors"
            aria-label="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="glass-panel-quiet px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-brand-yellow">
            <Brain className="w-4 h-4" />
            هوش مصنوعی
          </span>
        </div>
      }
      animatedSections={false}
    >
      <div className="grid lg:grid-cols-5 gap-6 mb-6">
        <GlassCard className="lg:col-span-3 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-300" />
            موضوع آزمون
          </h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">پایه</label>
                <CustomSelect
                  value={grade}
                  onChange={setGrade}
                  options={gradeOptions}
                  placeholder="پایه..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">نام درس</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full glass-panel-quiet rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  placeholder="مثال: ریاضی"
                  maxLength={80}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">موضوع</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full glass-panel-quiet rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                placeholder="مثال: کسرها و اعداد مخلوط"
                maxLength={160}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                متن منبع (اختیاری)
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="w-full min-h-[120px] glass-panel-quiet rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                placeholder="اگر نمونه سوال یا متن درس دارید اینجا بچسبانید. آپلود PDF هنوز فعال نیست."
                maxLength={8000}
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-300" />
            تنظیمات
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                <Hash className="w-4 h-4" />
                تعداد سوال
              </label>
              <input
                type="number"
                min="5"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="w-full glass-panel-quiet rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
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
              <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
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
        </GlassCard>
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all shadow-lg
            ${isLoading
              ? 'bg-white/20 text-white/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 text-white shadow-orange-500/30'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              در حال تولید سوالات...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              تولید سوالات
            </>
          )}
        </button>
      </div>

      {analysis && (
        <GlassCard className="p-6 border-brand-purple/25 bg-gradient-to-bl from-brand-purple/15 via-card/90 to-brand-pink/10 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            خلاصه تولید
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel-quiet rounded-xl p-4">
              <p className="text-muted-foreground text-sm mb-1">سبک سوالات</p>
              <div className="flex flex-wrap gap-2">
                {analysis.style.length === 0 ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  analysis.style.map((s) => (
                    <span key={s} className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded-lg text-sm">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="glass-panel-quiet rounded-xl p-4">
              <p className="text-muted-foreground text-sm mb-1">موضوعات</p>
              <div className="flex flex-wrap gap-2">
                {analysis.topics.map((t) => (
                  <span key={t} className="bg-blue-500/30 text-blue-300 px-2 py-1 rounded-lg text-sm">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="glass-panel-quiet rounded-xl p-4">
              <p className="text-muted-foreground text-sm mb-1">سطح دشواری</p>
              <p className="font-bold">{analysis.difficulty}</p>
            </div>
            <div className="glass-panel-quiet rounded-xl p-4">
              <p className="text-muted-foreground text-sm mb-1">تعداد سوال</p>
              <p className="font-bold">{analysis.totalQuestions} سوال</p>
            </div>
          </div>
        </GlassCard>
      )}

      {questions.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-yellow-400" />
              سوالات تولید شده
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                {questions.length} سوال
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
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'کپی شد!' : 'کپی'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                چاپ
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} showAnswer={showAnswers} />
            ))}
          </div>
        </GlassCard>
      )}
    </DashboardPage>
  )
}
