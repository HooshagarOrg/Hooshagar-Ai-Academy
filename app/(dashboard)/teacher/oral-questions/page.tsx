'use client'

import { useState, useMemo } from 'react'
import {
  Mic,
  FileText,
  Upload,
  Sparkles,
  Copy,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Users,
  BookOpen,
  BarChart3,
  HelpCircle,
  Save,
  Send,
  Loader2,
  Eye,
  Timer,
  Award,
  Target,
  MessageSquare,
  X,
  Check,
  AlertCircle,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

type Difficulty = 'easy' | 'medium' | 'hard'
type QuestionType = 'definition' | 'process' | 'comparison' | 'cause-effect' | 'application' | 'evaluation'
type QuestionStyle = 'formal' | 'friendly' | 'motivational'
type AnswerGrade = 'excellent' | 'good' | 'average' | 'weak'

interface GeneratedQuestion {
  id: string
  text: string
  difficulty: Difficulty
  type: QuestionType
  keyAnswer: string
  isEditing?: boolean
}

interface StudentAnswer {
  questionId: string
  grade: AnswerGrade
  note: string
}

interface AssessmentSession {
  id: string
  date: string
  subject: string
  lesson: string
  questionsCount: number
  students: string[]
  averageScore: number
}

interface Student {
  id: string
  name: string
  className: string
}

// ============================================
// داده‌های ثابت
// ============================================

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

const LESSONS = {
  science: [
    { id: 'sc1', name: 'فصل 1: زمین، خانه ما' },
    { id: 'sc2', name: 'فصل 2: سرگذشت زمین' },
    { id: 'sc3', name: 'فصل 3: انرژی' },
    { id: 'sc4', name: 'فصل 4: گردش مواد' },
  ],
  persian: [
    { id: 'pe1', name: 'درس 1: ستایش' },
    { id: 'pe2', name: 'درس 2: پنجره' },
    { id: 'pe3', name: 'درس 3: دانش و فرهنگ' },
  ],
  social: [
    { id: 'so1', name: 'درس 1: دوستی' },
    { id: 'so2', name: 'درس 2: آداب معاشرت' },
    { id: 'so3', name: 'درس 3: خانواده' },
  ],
  math: [
    { id: 'ma1', name: 'فصل 1: اعداد' },
    { id: 'ma2', name: 'فصل 2: کسرها' },
    { id: 'ma3', name: 'فصل 3: هندسه' },
  ],
  quran: [
    { id: 'qu1', name: 'درس 1: سوره حمد' },
    { id: 'qu2', name: 'درس 2: سوره توحید' },
  ],
}

const QUESTION_TYPES: { id: QuestionType; name: string; description: string }[] = [
  { id: 'definition', name: 'تعریف مفاهیم', description: 'پرسش درباره تعریف واژه‌ها' },
  { id: 'process', name: 'توضیح فرآیندها', description: 'شرح مراحل یک فرآیند' },
  { id: 'comparison', name: 'مقایسه و تضاد', description: 'تفاوت‌ها و شباهت‌ها' },
  { id: 'cause-effect', name: 'علت و معلول', description: 'دلایل و نتایج' },
  { id: 'application', name: 'کاربرد در زندگی', description: 'استفاده عملی مفاهیم' },
  { id: 'evaluation', name: 'نقد و ارزیابی', description: 'قضاوت و نظردهی' },
]

const STUDENTS: Student[] = [
  { id: '1', name: 'علی محمدی', className: 'ششم الف' },
  { id: '2', name: 'مریم احمدی', className: 'ششم الف' },
  { id: '3', name: 'حسین رضایی', className: 'ششم الف' },
  { id: '4', name: 'زهرا کریمی', className: 'ششم الف' },
  { id: '5', name: 'محمد حسینی', className: 'ششم الف' },
]

const SAMPLE_TEXT = `فتوسنتز فرآیندی است که گیاهان سبز برای تولید غذا انجام می‌دهند. در این فرآیند، گیاهان از نور خورشید، آب و دی‌اکسید کربن استفاده می‌کنند تا گلوکز (قند) و اکسیژن تولید کنند.

برگ‌های گیاهان حاوی ماده‌ای به نام کلروفیل هستند که رنگ سبز به آن‌ها می‌دهد. کلروفیل انرژی نور خورشید را جذب می‌کند و این انرژی برای تبدیل آب و دی‌اکسید کربن به گلوکز استفاده می‌شود.

گلوکز تولید شده به عنوان غذا در گیاه ذخیره می‌شود یا برای رشد و نمو استفاده می‌شود. اکسیژن تولید شده از طریق روزنه‌های برگ به هوا آزاد می‌شود. این اکسیژن برای تنفس انسان‌ها و حیوانات ضروری است.

فتوسنتز در روز و در حضور نور انجام می‌شود. در شب، گیاهان مانند جانوران تنفس می‌کنند و اکسیژن مصرف کرده و دی‌اکسید کربن تولید می‌کنند.`

const SAMPLE_QUESTIONS: GeneratedQuestion[] = [
  {
    id: '1',
    text: 'فتوسنتز چیست؟ به زبان ساده توضیح بده.',
    difficulty: 'easy',
    type: 'definition',
    keyAnswer: 'فتوسنتز فرآیندی است که گیاهان برای تولید غذا انجام می‌دهند. آن‌ها از نور خورشید، آب و دی‌اکسید کربن استفاده می‌کنند و گلوکز و اکسیژن تولید می‌کنند.',
  },
  {
    id: '2',
    text: 'کلروفیل چه نقشی در فتوسنتز دارد؟',
    difficulty: 'medium',
    type: 'process',
    keyAnswer: 'کلروفیل ماده‌ای سبز رنگ در برگ‌هاست که انرژی نور خورشید را جذب می‌کند. این انرژی برای تبدیل آب و دی‌اکسید کربن به گلوکز استفاده می‌شود.',
  },
  {
    id: '3',
    text: 'مراحل فتوسنتز را به ترتیب توضیح بده.',
    difficulty: 'medium',
    type: 'process',
    keyAnswer: '۱) جذب نور توسط کلروفیل ۲) جذب آب از ریشه ۳) جذب دی‌اکسید کربن از هوا ۴) تبدیل به گلوکز ۵) آزادسازی اکسیژن',
  },
  {
    id: '4',
    text: 'چرا فتوسنتز برای انسان‌ها مهم است؟',
    difficulty: 'medium',
    type: 'cause-effect',
    keyAnswer: 'فتوسنتز اکسیژن تولید می‌کند که برای تنفس انسان‌ها ضروری است. همچنین گیاهان غذای انسان‌ها و حیوانات را تأمین می‌کنند.',
  },
  {
    id: '5',
    text: 'تفاوت فعالیت گیاه در روز و شب چیست؟',
    difficulty: 'hard',
    type: 'comparison',
    keyAnswer: 'در روز گیاهان فتوسنتز انجام می‌دهند و اکسیژن تولید می‌کنند. در شب فقط تنفس می‌کنند و اکسیژن مصرف کرده و دی‌اکسید کربن تولید می‌کنند.',
  },
  {
    id: '6',
    text: 'اگر در یک اتاق بسته گیاه بگذاریم، چه اتفاقی می‌افتد؟',
    difficulty: 'hard',
    type: 'application',
    keyAnswer: 'در روز گیاه اکسیژن تولید می‌کند و هوا تازه می‌شود. اما در شب اکسیژن مصرف می‌کند، پس بهتر است در اتاق خواب گیاه نباشد یا تهویه داشته باشد.',
  },
  {
    id: '7',
    text: 'چرا برگ‌ها سبز هستند؟',
    difficulty: 'easy',
    type: 'cause-effect',
    keyAnswer: 'چون برگ‌ها حاوی کلروفیل هستند که رنگ سبز دارد.',
  },
  {
    id: '8',
    text: 'گلوکز تولید شده در فتوسنتز چه می‌شود؟',
    difficulty: 'medium',
    type: 'process',
    keyAnswer: 'گلوکز به عنوان غذا ذخیره می‌شود یا برای رشد و نمو گیاه مصرف می‌شود.',
  },
]

const SAMPLE_SESSIONS: AssessmentSession[] = [
  {
    id: '1',
    date: '1403/08/20',
    subject: 'علوم',
    lesson: 'فتوسنتز',
    questionsCount: 8,
    students: ['علی محمدی', 'مریم احمدی', 'حسین رضایی'],
    averageScore: 75,
  },
  {
    id: '2',
    date: '1403/08/15',
    subject: 'فارسی',
    lesson: 'درک مطلب',
    questionsCount: 10,
    students: ['زهرا کریمی', 'محمد حسینی'],
    averageScore: 82,
  },
  {
    id: '3',
    date: '1403/08/10',
    subject: 'مطالعات',
    lesson: 'خانواده',
    questionsCount: 6,
    students: ['علی محمدی', 'زهرا کریمی', 'مریم احمدی', 'محمد حسینی'],
    averageScore: 70,
  },
]

// ============================================
// کامپوننت‌های کمکی
// ============================================

function QuestionCard({
  question,
  index,
  onEdit,
  onCopy,
  onDelete,
  onAddToBank,
}: {
  question: GeneratedQuestion
  index: number
  onEdit: (id: string) => void
  onCopy: (text: string) => void
  onDelete: (id: string) => void
  onAddToBank: (question: GeneratedQuestion) => void
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
            <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {index + 1}
            </span>
            <div className="flex-1">
              <p className="text-gray-800 font-medium leading-relaxed">{question.text}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={difficultyInfo[question.difficulty].color}>
                  {difficultyInfo[question.difficulty].label}
                </Badge>
                <Badge variant="outline">{typeLabel}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onEdit(question.id)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onCopy(question.text)}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onAddToBank(question)}>
              <Plus className="w-4 h-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(question.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible>
        <AccordionItem value="answer" className="border-t">
          <AccordionTrigger className="px-4 py-2 text-sm text-gray-600 hover:no-underline">
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

function GradeButton({
  grade,
  selected,
  onClick,
  label,
  color,
}: {
  grade: AnswerGrade
  selected: boolean
  onClick: () => void
  label: string
  color: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 py-3 rounded-lg border-2 transition-all font-medium',
        selected ? `${color} border-transparent` : 'bg-white border-gray-200 hover:border-gray-300'
      )}
    >
      {label}
    </button>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function OralQuestionsPage() {
  // Wizard Step
  const [currentStep, setCurrentStep] = useState(1)

  // Input State
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [lesson, setLesson] = useState('')
  const [text, setText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Settings State
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['definition', 'process', 'cause-effect'])
  const [style, setStyle] = useState<QuestionStyle>('friendly')

  // Generated Questions
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Assessment Dialog
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<StudentAnswer[]>([])
  const [currentGrade, setCurrentGrade] = useState<AnswerGrade | null>(null)
  const [currentNote, setCurrentNote] = useState('')
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [assessmentComplete, setAssessmentComplete] = useState(false)

  // Sessions
  const [sessions] = useState<AssessmentSession[]>(SAMPLE_SESSIONS)
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<AssessmentSession | null>(null)

  // Available lessons based on subject
  const availableLessons = subject ? (LESSONS as Record<string, { id: string; name: string }[]>)[subject] || [] : []

  // Character count
  const charCount = text.length

  // Stats
  const stats = useMemo(() => {
    return {
      totalSessions: sessions.length,
      totalQuestions: sessions.reduce((sum, s) => sum + s.questionsCount, 0) + questions.length,
      averageScore: Math.round(sessions.reduce((sum, s) => sum + s.averageScore, 0) / sessions.length) || 0,
      topSubject: 'علوم',
    }
  }, [sessions, questions])

  // ============================================
  // Handlers
  // ============================================

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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Use sample questions (in real app, this would come from AI)
      const generated = SAMPLE_QUESTIONS.slice(0, questionCount)
      setQuestions(generated)
      setCurrentStep(3)
      toast.success(`${generated.length} سوال تولید شد`)
    } catch (error) {
      toast.error('خطا در تولید سوالات')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyQuestion = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('سوال کپی شد')
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
    toast.success('سوال حذف شد')
  }

  const handleAddToBank = (question: GeneratedQuestion) => {
    toast.success('سوال به بانک اضافه شد')
  }

  const handleEditQuestion = (id: string) => {
    toast.info('قابلیت ویرایش در حال توسعه')
  }

  const handleStartAssessment = () => {
    if (questions.length === 0) {
      toast.error('ابتدا سوالات را تولید کنید')
      return
    }
    setSelectedStudent('')
    setCurrentQuestionIndex(0)
    setAnswers([])
    setCurrentGrade(null)
    setCurrentNote('')
    setTimerSeconds(0)
    setAssessmentComplete(false)
    setAssessmentOpen(true)
  }

  const handleSaveAnswer = () => {
    if (!currentGrade) {
      toast.error('امتیاز پاسخ را انتخاب کنید')
      return
    }

    const newAnswer: StudentAnswer = {
      questionId: questions[currentQuestionIndex].id,
      grade: currentGrade,
      note: currentNote,
    }

    setAnswers([...answers, newAnswer])
    setCurrentGrade(null)
    setCurrentNote('')

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setTimerSeconds(0)
    } else {
      setAssessmentComplete(true)
    }
  }

  const handleFinishAssessment = () => {
    toast.success('ارزیابی ذخیره شد')
    setAssessmentOpen(false)
  }

  const calculateFinalScore = () => {
    const gradeScores: Record<AnswerGrade, number> = {
      excellent: 100,
      good: 75,
      average: 50,
      weak: 25,
    }
    const total = answers.reduce((sum, a) => sum + gradeScores[a.grade], 0)
    return Math.round(total / answers.length) || 0
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      toast.success(`فایل ${file.name} بارگذاری شد`)
    }
  }

  const loadSampleText = () => {
    setText(SAMPLE_TEXT)
    setSubject('science')
    setGrade('6')
    setLesson('sc3')
    toast.success('متن نمونه بارگذاری شد')
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Mic className="w-8 h-8 text-purple-600" />
              تولید سوالات شفاهی
            </h1>
            <p className="text-gray-600 mt-1">تولید هوشمند سوال از متن درس</p>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center min-w-[90px]">
              <p className="text-2xl font-bold text-purple-600">{stats.totalSessions}</p>
              <p className="text-xs text-gray-500">جلسه</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center min-w-[90px]">
              <p className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</p>
              <p className="text-xs text-gray-500">سوال</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center min-w-[90px]">
              <p className="text-2xl font-bold text-green-600">{stats.averageScore}%</p>
              <p className="text-xs text-gray-500">میانگین</p>
            </div>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'انتخاب متن', icon: FileText },
              { step: 2, label: 'تنظیمات تولید', icon: Target },
              { step: 3, label: 'سوالات تولید شده', icon: HelpCircle },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(item.step)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                    currentStep === item.step
                      ? 'bg-purple-100 text-purple-700'
                      : currentStep > item.step
                      ? 'text-green-600'
                      : 'text-gray-400'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      currentStep === item.step
                        ? 'bg-purple-600 text-white'
                        : currentStep > item.step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {currentStep > item.step ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <item.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="font-medium hidden sm:inline">{item.label}</span>
                </button>
                {index < 2 && (
                  <div className="flex-1 h-1 bg-gray-200 mx-2 rounded">
                    <div
                      className={cn(
                        'h-full rounded transition-all',
                        currentStep > item.step ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Text Input */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              مرحله ۱: انتخاب متن درس
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
                <Label>فصل/درس</Label>
                <Select value={lesson} onValueChange={setLesson} disabled={!subject}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب فصل..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLessons.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>متن درس</Label>
                <Button variant="ghost" size="sm" onClick={loadSampleText}>
                  بارگذاری متن نمونه
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="متن درس را اینجا وارد کنید یا از فایل بارگذاری کنید..."
                className="min-h-[200px]"
                maxLength={5000}
              />
              <div className="flex items-center justify-between text-sm">
                <span className={cn('text-gray-500', charCount > 4500 && 'text-orange-500')}>
                  {charCount.toLocaleString('fa-IR')} / ۵٬۰۰۰ کاراکتر
                </span>
                <Progress value={(charCount / 5000) * 100} className="w-32 h-2" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-gray-400 text-sm">یا</span>
              <Separator className="flex-1" />
            </div>

            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  {uploadedFile ? uploadedFile.name : 'آپلود فایل (PDF, DOCX)'}
                </p>
                <p className="text-sm text-gray-400 mt-1">حداکثر 5MB</p>
              </label>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!text.trim()}
                className="gap-2"
              >
                مرحله بعد
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Settings */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
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
                      onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">سوال (۱ تا ۲۰)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>سطح سختی</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          آسان (یادآوری مستقیم)
                        </span>
                      </SelectItem>
                      <SelectItem value="medium">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          متوسط (درک و تحلیل)
                        </span>
                      </SelectItem>
                      <SelectItem value="hard">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          سخت (استنباط و نقد)
                        </span>
                      </SelectItem>
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
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        selectedTypes.includes(type.id)
                          ? 'bg-purple-50 border-purple-300'
                          : 'hover:bg-gray-50'
                      )}
                      onClick={() => handleTypeToggle(type.id)}
                    >
                      <Checkbox
                        checked={selectedTypes.includes(type.id)}
                        onCheckedChange={() => handleTypeToggle(type.id)}
                      />
                      <div>
                        <p className="font-medium text-sm">{type.name}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
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

        {/* Step 3: Generated Questions */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                  سوالات تولید شده ({questions.length} سوال)
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
                    <Target className="w-4 h-4" />
                    تولید مجدد
                  </Button>
                  <Button onClick={handleStartAssessment} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4" />
                    شروع ارزیابی
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    onEdit={handleEditQuestion}
                    onCopy={handleCopyQuestion}
                    onDelete={handleDeleteQuestion}
                    onAddToBank={handleAddToBank}
                  />
                ))}
              </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-gray-600" />
                تاریخچه جلسات ارزیابی
              </h3>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>درس</TableHead>
                    <TableHead>موضوع</TableHead>
                    <TableHead>تعداد سوال</TableHead>
                    <TableHead>شرکت‌کنندگان</TableHead>
                    <TableHead>میانگین</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.date}</TableCell>
                      <TableCell>{session.subject}</TableCell>
                      <TableCell>{session.lesson}</TableCell>
                      <TableCell>{session.questionsCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          {session.students.length} نفر
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          session.averageScore >= 80 ? 'bg-green-100 text-green-700' :
                          session.averageScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {session.averageScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSession(session)
                            setSessionDetailOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Assessment Dialog */}
      <Dialog open={assessmentOpen} onOpenChange={setAssessmentOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-purple-600" />
              ارزیابی شفاهی
            </DialogTitle>
          </DialogHeader>

          {!assessmentComplete ? (
            <div className="space-y-6">
              {/* Student Selection */}
              {!selectedStudent ? (
                <div className="space-y-4">
                  <Label>انتخاب دانش‌آموز</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {STUDENTS.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student.id)}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-right"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.className}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Progress */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        سوال {currentQuestionIndex + 1} از {questions.length}
                      </span>
                      <Progress
                        value={((currentQuestionIndex + 1) / questions.length) * 100}
                        className="w-32 h-2"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Timer className="w-4 h-4" />
                      <span className="font-mono">{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* Current Question */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                        {currentQuestionIndex + 1}
                      </span>
                      <Badge className={cn(
                        questions[currentQuestionIndex]?.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        questions[currentQuestionIndex]?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {questions[currentQuestionIndex]?.difficulty === 'easy' ? 'آسان' :
                         questions[currentQuestionIndex]?.difficulty === 'medium' ? 'متوسط' : 'سخت'}
                      </Badge>
                    </div>
                    <p className="text-xl font-medium text-gray-800 leading-relaxed">
                      {questions[currentQuestionIndex]?.text}
                    </p>
                  </div>

                  {/* Key Answer (Collapsed) */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="answer">
                      <AccordionTrigger className="text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          مشاهده پاسخ کلیدی
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
                          {questions[currentQuestionIndex]?.keyAnswer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Grade Selection */}
                  <div className="space-y-3">
                    <Label>امتیاز پاسخ</Label>
                    <div className="flex gap-3">
                      <GradeButton
                        grade="excellent"
                        selected={currentGrade === 'excellent'}
                        onClick={() => setCurrentGrade('excellent')}
                        label="عالی"
                        color="bg-green-500 text-white"
                      />
                      <GradeButton
                        grade="good"
                        selected={currentGrade === 'good'}
                        onClick={() => setCurrentGrade('good')}
                        label="خوب"
                        color="bg-blue-500 text-white"
                      />
                      <GradeButton
                        grade="average"
                        selected={currentGrade === 'average'}
                        onClick={() => setCurrentGrade('average')}
                        label="متوسط"
                        color="bg-yellow-500 text-white"
                      />
                      <GradeButton
                        grade="weak"
                        selected={currentGrade === 'weak'}
                        onClick={() => setCurrentGrade('weak')}
                        label="ضعیف"
                        color="bg-red-500 text-white"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label>یادداشت (اختیاری)</Label>
                    <Textarea
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      placeholder="نکات قابل توجه در پاسخ دانش‌آموز..."
                      className="min-h-[60px]"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Assessment Complete */
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">ارزیابی تمام شد!</h3>
                <p className="text-gray-600 mt-1">
                  {STUDENTS.find((s) => s.id === selectedStudent)?.name}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-6 inline-block">
                <p className="text-5xl font-bold text-purple-600">{calculateFinalScore()}</p>
                <p className="text-gray-600">نمره کل از ۱۰۰</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => toast.success('گزارش ارسال شد')} className="gap-2">
                  <Send className="w-4 h-4" />
                  ارسال به والدین
                </Button>
                <Button onClick={handleFinishAssessment} className="gap-2">
                  <Save className="w-4 h-4" />
                  ذخیره و بستن
                </Button>
              </div>
            </div>
          )}

          {!assessmentComplete && selectedStudent && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedStudent('')}
              >
                تغییر دانش‌آموز
              </Button>
              <Button onClick={handleSaveAnswer} disabled={!currentGrade} className="gap-2">
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    سوال بعدی
                    <ChevronLeft className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    پایان ارزیابی
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Session Detail Dialog */}
      <Dialog open={sessionDetailOpen} onOpenChange={setSessionDetailOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>جزئیات جلسه ارزیابی</DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">تاریخ</p>
                  <p className="font-medium">{selectedSession.date}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">درس</p>
                  <p className="font-medium">{selectedSession.subject} - {selectedSession.lesson}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">تعداد سوال</p>
                  <p className="font-medium">{selectedSession.questionsCount}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">میانگین نمره</p>
                  <p className="font-medium text-lg">{selectedSession.averageScore}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">شرکت‌کنندگان</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.students.map((name, i) => (
                    <Badge key={i} variant="secondary">{name}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDetailOpen(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
































