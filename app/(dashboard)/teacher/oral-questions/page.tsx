'use client'

import { useEffect, useState } from 'react'
import {
  Mic,
  FileText,
  Sparkles,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Target,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

type Difficulty = 'easy' | 'medium' | 'hard'
type QuestionType = 'definition' | 'process' | 'comparison' | 'cause-effect' | 'application' | 'evaluation'
type QuestionStyle = 'formal' | 'friendly' | 'motivational'

interface GeneratedQuestion {
  id: string
  text: string
  difficulty: Difficulty
  type: QuestionType
  keyAnswer: string
}

const SUBJECTS = [
  { id: 'science', name: 'علوم' },
  { id: 'persian', name: 'فارسی' },
  { id: 'social', name: 'مطالعات اجتماعی' },
  { id: 'math', name: 'ریاضی' },
  { id: 'quran', name: 'قرآن' },
]

const GRADES_LIST = [
  { id: '4', name: 'چهارم' },
  { id: '5', name: 'پنجم' },
  { id: '6', name: 'ششم' },
]

const QUESTION_TYPES: { id: QuestionType; name: string; description: string }[] = [
  { id: 'definition', name: 'تعریف مفاهیم', description: 'پرسش درباره تعریف واژه‌ها' },
  { id: 'process', name: 'توضیح فرآیندها', description: 'شرح مراحل یک فرآیند' },
  { id: 'comparison', name: 'مقایسه و تضاد', description: 'تفاوت‌ها و شباهت‌ها' },
  { id: 'cause-effect', name: 'علت و معلول', description: 'دلایل و نتایج' },
  { id: 'application', name: 'کاربرد در زندگی', description: 'استفاده عملی مفاهیم' },
  { id: 'evaluation', name: 'نقد و ارزیابی', description: 'قضاوت و نظردهی' },
]

function isQuestionType(value: string): value is QuestionType {
  return QUESTION_TYPES.some((t) => t.id === value)
}

function isDifficulty(value: string): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard'
}

function QuestionCard({
  question,
  index,
  onCopy,
  onDelete,
}: {
  question: GeneratedQuestion
  index: number
  onCopy: (text: string) => void
  onDelete: (id: string) => void
}) {
  const difficultyInfo = {
    easy: { label: 'آسان', color: 'bg-green-100 text-green-700' },
    medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-700' },
    hard: { label: 'سخت', color: 'bg-red-100 text-red-700' },
  }
  const typeLabel = QUESTION_TYPES.find((t) => t.id === question.type)?.name || question.type

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="w-8 h-8 bg-[var(--lux-primary)]/15 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {index + 1}
            </span>
            <div className="flex-1">
              <p className="text-[var(--lux-text)] font-medium leading-relaxed">{question.text}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={difficultyInfo[question.difficulty].color}>
                  {difficultyInfo[question.difficulty].label}
                </Badge>
                <Badge variant="outline">{typeLabel}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onCopy(question.text)} aria-label="کپی سوال">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(question.id)} aria-label="حذف سوال">
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="answer" className="border-t">
          <AccordionTrigger className="px-4 py-2 text-sm text-[var(--lux-text-muted)] hover:no-underline">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              پاسخ کلیدی
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
              {question.keyAnswer}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default function OralQuestionsPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [lesson, setLesson] = useState('')
  const [text, setText] = useState('')
  const [questionCount, setQuestionCount] = useState(8)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['definition', 'process', 'cause-effect'])
  const [style, setStyle] = useState<QuestionStyle>('friendly')
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [studentCount, setStudentCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/teacher/class-students')
      .then((r) => r.json())
      .then((d: { students?: unknown[] }) => {
        setStudentCount(Array.isArray(d.students) ? d.students.length : 0)
      })
      .catch(() => setStudentCount(null))
  }, [])

  const charCount = text.length

  const handleTypeToggle = (type: QuestionType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('متن درس را وارد کنید')
      return
    }
    if (selectedTypes.length === 0) {
      toast.error('حداقل یک نوع سوال انتخاب کنید')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/teacher/oral-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          subject: subject || null,
          grade: grade ? Number(grade) : null,
          lesson: lesson.trim() || null,
          questionCount,
          difficulty,
          selectedTypes,
          style,
        }),
      })
      const data = (await res.json()) as {
        success?: boolean
        error?: string
        questions?: Array<{
          id: string
          text: string
          difficulty: string
          type: string
          keyAnswer: string
        }>
      }

      if (!res.ok || !data.success || !data.questions?.length) {
        toast.error(data.error || 'تولید سوالات ناموفق بود')
        return
      }

      const generated: GeneratedQuestion[] = data.questions.map((q, index) => ({
        id: q.id || String(index + 1),
        text: q.text,
        difficulty: isDifficulty(q.difficulty) ? q.difficulty : difficulty,
        type: isQuestionType(q.type) ? q.type : selectedTypes[0] ?? 'definition',
        keyAnswer: q.keyAnswer,
      }))
      setQuestions(generated)
      setCurrentStep(3)
      toast.success(`${generated.length} سوال تولید شد`)
    } catch {
      toast.error('خطای شبکه. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyQuestion = (questionText: string) => {
    void navigator.clipboard.writeText(questionText)
    toast.success('سوال کپی شد')
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleCopyAll = () => {
    const blob = questions
      .map((q, i) => `${i + 1}. ${q.text}\nپاسخ کلیدی: ${q.keyAnswer}`)
      .join('\n\n')
    void navigator.clipboard.writeText(blob)
    toast.success('همه سوالات کپی شد')
  }

  return (
    <DashboardPage
      className="max-w-6xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <Mic className="w-8 h-8 text-brand-purple" />
          تولید سوالات شفاهی
        </span>
      }
      description="تولید سوال از متن درس با هوش مصنوعی — بدون تاریخچهٔ نمونه"
      animatedSections={false}
    >
      {studentCount === 0 && (
        <p className="text-sm text-muted-foreground">
          دانش‌آموزی در کلاس شما ثبت نشده است. می‌توانید همچنان سوال تولید کنید.
        </p>
      )}

      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'انتخاب متن', icon: FileText },
            { step: 2, label: 'تنظیمات تولید', icon: Target },
            { step: 3, label: 'سوالات تولید شده', icon: HelpCircle },
          ].map((item, index) => {
            const StepIcon = item.icon
            return (
              <div key={item.step} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => {
                    if (item.step < 3 || questions.length > 0) setCurrentStep(item.step)
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                    currentStep === item.step
                      ? 'bg-purple-100 text-purple-700'
                      : currentStep > item.step
                        ? 'text-green-600'
                        : 'text-[var(--lux-text-muted)]'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      currentStep === item.step
                        ? 'bg-purple-600 text-white'
                        : currentStep > item.step
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-[var(--lux-text-muted)]'
                    )}
                  >
                    {currentStep > item.step ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className="font-medium hidden sm:inline">{item.label}</span>
                </button>
                {index < 2 && (
                  <div className="flex-1 h-1 bg-white/10 mx-2 rounded">
                    <div
                      className={cn(
                        'h-full rounded transition-all',
                        currentStep > item.step ? 'bg-green-500 w-full' : 'bg-white/10 w-0'
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>

      {currentStep === 1 && (
        <div className="glass-panel rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-[var(--lux-text)] flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            مرحله ۱: متن درس
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>درس</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب درس..." />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>پایه</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب پایه..." />
                </SelectTrigger>
                <SelectContent>
                  {GRADES_LIST.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>فصل / موضوع</Label>
              <Input
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                placeholder="مثال: فتوسنتز"
                maxLength={120}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>متن درس</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="متن درس را اینجا وارد کنید..."
              className="min-h-[200px]"
              maxLength={5000}
            />
            <div className="flex items-center justify-between text-sm">
              <span className={cn('text-[var(--lux-text-muted)]', charCount > 4500 && 'text-orange-500')}>
                {charCount.toLocaleString('fa-IR')} / ۵٬۰۰۰ کاراکتر
              </span>
              <Progress value={(charCount / 5000) * 100} className="w-32 h-2" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep(2)} disabled={!text.trim()} className="gap-2">
              مرحله بعد
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="glass-panel rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-[var(--lux-text)] flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            مرحله ۲: تنظیمات تولید
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>تعداد سوال</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value, 10) || 1)}
                    className="w-24"
                  />
                  <span className="text-sm text-[var(--lux-text-muted)]">سوال (۱ تا ۲۰)</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>سطح سختی</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">آسان</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">سخت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>سبک سوال</Label>
                <Select value={style} onValueChange={(v) => setStyle(v as QuestionStyle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">رسمی</SelectItem>
                    <SelectItem value="friendly">صمیمی</SelectItem>
                    <SelectItem value="motivational">انگیزشی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <Label>انواع سوال</Label>
              <div className="space-y-3">
                {QUESTION_TYPES.map((type) => (
                  <div
                    key={type.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer',
                      selectedTypes.includes(type.id) ? 'bg-purple-50 border-purple-300' : 'hover:bg-[var(--lux-surface)]'
                    )}
                    onClick={() => handleTypeToggle(type.id)}
                  >
                    <Checkbox
                      checked={selectedTypes.includes(type.id)}
                      onCheckedChange={() => handleTypeToggle(type.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{type.name}</p>
                      <p className="text-xs text-[var(--lux-text-muted)]">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
              <ChevronRight className="w-4 h-4" />
              مرحله قبل
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || selectedTypes.length === 0}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال تولید...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  تولید سوالات
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--lux-text)] flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              سوالات تولید شده ({questions.length} سوال)
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
                <Target className="w-4 h-4" />
                تولید مجدد
              </Button>
              <Button onClick={handleCopyAll} disabled={questions.length === 0} className="gap-2">
                <Copy className="w-4 h-4" />
                کپی همه
              </Button>
            </div>
          </div>
          {questions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">سوالی تولید نشده است.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  onCopy={handleCopyQuestion}
                  onDelete={handleDeleteQuestion}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardPage>
  )
}
