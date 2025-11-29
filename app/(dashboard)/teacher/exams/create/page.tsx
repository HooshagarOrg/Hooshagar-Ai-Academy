'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  Save,
  Send,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  HelpCircle,
  ToggleLeft,
  Shuffle,
  Minus,
  GripVertical,
  Copy,
  Loader2,
  Calendar,
  Users,
  Target,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

interface MultipleChoiceQuestion {
  id: string
  type: 'multiple'
  text: string
  options: string[]
  correctOption: number
  score: number
  difficulty: 'easy' | 'medium' | 'hard'
}

interface DescriptiveQuestion {
  id: string
  type: 'descriptive'
  text: string
  score: number
  difficulty: 'easy' | 'medium' | 'hard'
  keyAnswer?: string
}

interface TrueFalseQuestion {
  id: string
  type: 'trueFalse'
  text: string
  isTrue: boolean
  score: number
}

interface MatchingQuestion {
  id: string
  type: 'matching'
  columnA: string[]
  columnB: string[]
  answers: number[] // index of columnB for each columnA
  score: number
}

type Question = MultipleChoiceQuestion | DescriptiveQuestion | TrueFalseQuestion | MatchingQuestion

interface ExamData {
  title: string
  subject: string
  grade: string
  classId: string
  date: string
  startTime: string
  duration: number
  totalScore: number
  questions: Question[]
  settings: {
    showScoreImmediately: boolean
    allowReview: boolean
    randomizeQuestions: boolean
    randomizeOptions: boolean
    negativeScore: number
  }
}

type WizardStep = 'info' | 'questions' | 'settings' | 'preview'

// ============================================
// داده نمونه
// ============================================

const SUBJECTS = [
  { id: 'math', name: 'ریاضی' },
  { id: 'persian', name: 'فارسی' },
  { id: 'science', name: 'علوم' },
  { id: 'social', name: 'مطالعات اجتماعی' },
  { id: 'quran', name: 'قرآن' },
  { id: 'english', name: 'زبان انگلیسی' },
]

const GRADES = [
  { id: '1', name: 'اول' },
  { id: '2', name: 'دوم' },
  { id: '3', name: 'سوم' },
  { id: '4', name: 'چهارم' },
  { id: '5', name: 'پنجم' },
  { id: '6', name: 'ششم' },
]

const CLASSES = [
  { id: '1', name: 'ششم الف', grade: '6' },
  { id: '2', name: 'ششم ب', grade: '6' },
  { id: '3', name: 'پنجم الف', grade: '5' },
  { id: '4', name: 'پنجم ب', grade: '5' },
]

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: '1',
    type: 'multiple',
    text: 'حاصل عبارت 24 × 5 چقدر است؟',
    options: ['100', '120', '125', '115'],
    correctOption: 1,
    score: 1,
    difficulty: 'easy',
  },
  {
    id: '2',
    type: 'multiple',
    text: 'کدام عدد بر 3 و 5 بخش‌پذیر است؟',
    options: ['20', '30', '25', '35'],
    correctOption: 1,
    score: 1,
    difficulty: 'medium',
  },
  {
    id: '3',
    type: 'multiple',
    text: 'مساحت مربعی با ضلع 7 سانتی‌متر چقدر است؟',
    options: ['14 سانتی‌متر مربع', '28 سانتی‌متر مربع', '49 سانتی‌متر مربع', '56 سانتی‌متر مربع'],
    correctOption: 2,
    score: 1,
    difficulty: 'easy',
  },
  {
    id: '4',
    type: 'descriptive',
    text: 'مفهوم کسر را با ذکر یک مثال توضیح دهید.',
    score: 3,
    difficulty: 'medium',
    keyAnswer: 'کسر نشان‌دهنده بخشی از یک کل است. مثال: اگر یک پیتزا را به 4 قسمت مساوی تقسیم کنیم و 1 قسمت را بخوریم، 1/4 پیتزا خورده‌ایم.',
  },
  {
    id: '5',
    type: 'trueFalse',
    text: 'هر عدد زوج بر 2 بخش‌پذیر است.',
    isTrue: true,
    score: 0.5,
  },
]

// ============================================
// کامپوننت اصلی
// ============================================

export default function CreateExamPage() {
  // Wizard Step
  const [currentStep, setCurrentStep] = useState<WizardStep>('info')
  const steps: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: 'اطلاعات پایه', icon: <FileText className="w-5 h-5" /> },
    { id: 'questions', label: 'سوالات', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'settings', label: 'تنظیمات', icon: <ToggleLeft className="w-5 h-5" /> },
    { id: 'preview', label: 'پیش‌نمایش', icon: <Eye className="w-5 h-5" /> },
  ]

  // Exam Data
  const [examData, setExamData] = useState<ExamData>({
    title: '',
    subject: '',
    grade: '',
    classId: '',
    date: '',
    startTime: '08:00',
    duration: 60,
    totalScore: 20,
    questions: SAMPLE_QUESTIONS,
    settings: {
      showScoreImmediately: false,
      allowReview: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      negativeScore: 0,
    },
  })

  // Question Tab
  const [activeQuestionTab, setActiveQuestionTab] = useState('multiple')

  // New Question States
  const [newMultiple, setNewMultiple] = useState<Omit<MultipleChoiceQuestion, 'id'>>({
    type: 'multiple',
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    score: 1,
    difficulty: 'medium',
  })

  const [newDescriptive, setNewDescriptive] = useState<Omit<DescriptiveQuestion, 'id'>>({
    type: 'descriptive',
    text: '',
    score: 2,
    difficulty: 'medium',
    keyAnswer: '',
  })

  const [newTrueFalse, setNewTrueFalse] = useState<Omit<TrueFalseQuestion, 'id'>>({
    type: 'trueFalse',
    text: '',
    isTrue: true,
    score: 0.5,
  })

  const [newMatching, setNewMatching] = useState<Omit<MatchingQuestion, 'id'>>({
    type: 'matching',
    columnA: ['', '', '', '', ''],
    columnB: ['', '', '', '', ''],
    answers: [0, 1, 2, 3, 4],
    score: 2,
  })

  // UI States
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  // ============================================
  // محاسبات
  // ============================================

  const multipleCount = examData.questions.filter((q) => q.type === 'multiple').length
  const descriptiveCount = examData.questions.filter((q) => q.type === 'descriptive').length
  const trueFalseCount = examData.questions.filter((q) => q.type === 'trueFalse').length
  const matchingCount = examData.questions.filter((q) => q.type === 'matching').length

  const totalQuestionScore = examData.questions.reduce((sum, q) => sum + q.score, 0)
  const estimatedTime = Math.ceil(
    multipleCount * 1 + descriptiveCount * 5 + trueFalseCount * 0.5 + matchingCount * 3
  )

  // ============================================
  // Handlers
  // ============================================

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

  const addMultipleQuestion = () => {
    if (!newMultiple.text.trim()) {
      toast.error('متن سوال را وارد کنید')
      return
    }
    if (newMultiple.options.some((o) => !o.trim())) {
      toast.error('همه گزینه‌ها را پر کنید')
      return
    }

    const question: MultipleChoiceQuestion = {
      ...newMultiple,
      id: generateId(),
    }

    setExamData((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }))

    setNewMultiple({
      type: 'multiple',
      text: '',
      options: ['', '', '', ''],
      correctOption: 0,
      score: 1,
      difficulty: 'medium',
    })

    toast.success('سوال تستی اضافه شد')
  }

  const addDescriptiveQuestion = () => {
    if (!newDescriptive.text.trim()) {
      toast.error('متن سوال را وارد کنید')
      return
    }

    const question: DescriptiveQuestion = {
      ...newDescriptive,
      id: generateId(),
    }

    setExamData((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }))

    setNewDescriptive({
      type: 'descriptive',
      text: '',
      score: 2,
      difficulty: 'medium',
      keyAnswer: '',
    })

    toast.success('سوال تشریحی اضافه شد')
  }

  const addTrueFalseQuestion = () => {
    if (!newTrueFalse.text.trim()) {
      toast.error('متن گزاره را وارد کنید')
      return
    }

    const question: TrueFalseQuestion = {
      ...newTrueFalse,
      id: generateId(),
    }

    setExamData((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }))

    setNewTrueFalse({
      type: 'trueFalse',
      text: '',
      isTrue: true,
      score: 0.5,
    })

    toast.success('گزاره صحیح/غلط اضافه شد')
  }

  const addMatchingQuestion = () => {
    if (newMatching.columnA.some((a) => !a.trim()) || newMatching.columnB.some((b) => !b.trim())) {
      toast.error('همه آیتم‌های ستون‌ها را پر کنید')
      return
    }

    const question: MatchingQuestion = {
      ...newMatching,
      id: generateId(),
    }

    setExamData((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }))

    setNewMatching({
      type: 'matching',
      columnA: ['', '', '', '', ''],
      columnB: ['', '', '', '', ''],
      answers: [0, 1, 2, 3, 4],
      score: 2,
    })

    toast.success('سوال جورکردنی اضافه شد')
  }

  const deleteQuestion = (id: string) => {
    setExamData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }))
    toast.success('سوال حذف شد')
  }

  const duplicateQuestion = (question: Question) => {
    const newQuestion = { ...question, id: generateId() }
    setExamData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))
    toast.success('سوال کپی شد')
  }

  const handleSaveDraft = async () => {
    if (!examData.title.trim()) {
      toast.error('عنوان آزمون را وارد کنید')
      return
    }

    setIsSaving(true)
    try {
      // TODO: API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('پیش‌نویس ذخیره شد')
    } catch (error) {
      toast.error('خطا در ذخیره')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!examData.title || !examData.subject || !examData.grade || !examData.classId) {
      toast.error('اطلاعات پایه را کامل کنید')
      setCurrentStep('info')
      return
    }

    if (examData.questions.length === 0) {
      toast.error('حداقل یک سوال اضافه کنید')
      setCurrentStep('questions')
      return
    }

    setIsPublishing(true)
    try {
      // TODO: API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('آزمون با موفقیت منتشر شد')
    } catch (error) {
      toast.error('خطا در انتشار')
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const goToNextStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const goToPrevStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/teacher" className="hover:text-blue-600">داشبورد</Link>
          <ChevronLeft className="w-4 h-4" />
          <Link href="/teacher/exams" className="hover:text-blue-600">آزمون‌ها</Link>
          <ChevronLeft className="w-4 h-4" />
          <span className="text-gray-800 font-medium">ایجاد آزمون</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              ایجاد آزمون جدید
            </h1>
            <p className="text-gray-600 mt-1">آزمون خود را طراحی و منتشر کنید</p>
          </div>

          {/* Summary Box */}
          <div className="bg-white rounded-xl shadow-lg p-4 min-w-[280px]">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              خلاصه آزمون
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">تستی:</span>
                <span className="font-bold">{multipleCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">تشریحی:</span>
                <span className="font-bold">{descriptiveCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">صحیح/غلط:</span>
                <span className="font-bold">{trueFalseCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">جورکردنی:</span>
                <span className="font-bold">{matchingCount}</span>
              </div>
              <Separator className="col-span-2 my-1" />
              <div className="flex justify-between text-blue-600">
                <span>مجموع نمرات:</span>
                <span className="font-bold">{totalQuestionScore}</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>زمان تخمینی:</span>
                <span className="font-bold">{estimatedTime} دقیقه</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                    currentStep === step.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {step.icon}
                  </div>
                  <span className="font-medium hidden md:inline">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 bg-gray-200 mx-2 rounded">
                    <div
                      className={cn(
                        'h-full bg-blue-600 rounded transition-all',
                        steps.findIndex((s) => s.id === currentStep) > index ? 'w-full' : 'w-0'
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px]">
          {/* Step 1: Info */}
          {currentStep === 'info' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                اطلاعات پایه آزمون
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>عنوان آزمون *</Label>
                  <Input
                    value={examData.title}
                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                    placeholder="مثال: آزمون میان‌ترم ریاضی"
                  />
                </div>

                <div className="space-y-2">
                  <Label>درس *</Label>
                  <Select
                    value={examData.subject}
                    onValueChange={(v) => setExamData({ ...examData, subject: v })}
                  >
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
                  <Label>پایه تحصیلی *</Label>
                  <Select
                    value={examData.grade}
                    onValueChange={(v) => setExamData({ ...examData, grade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب پایه..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>کلاس *</Label>
                  <Select
                    value={examData.classId}
                    onValueChange={(v) => setExamData({ ...examData, classId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کلاس..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.filter((c) => !examData.grade || c.grade === examData.grade).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>تاریخ برگزاری</Label>
                  <Input
                    type="date"
                    value={examData.date}
                    onChange={(e) => setExamData({ ...examData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ساعت شروع</Label>
                  <Input
                    type="time"
                    value={examData.startTime}
                    onChange={(e) => setExamData({ ...examData, startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>مدت آزمون (دقیقه)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={180}
                    value={examData.duration}
                    onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 60 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>نمره کل آزمون</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={examData.totalScore}
                    onChange={(e) => setExamData({ ...examData, totalScore: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 'questions' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                سوالات آزمون
              </h2>

              <Tabs value={activeQuestionTab} onValueChange={setActiveQuestionTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="multiple" className="gap-2">
                    تستی
                    <Badge variant="secondary">{multipleCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="descriptive" className="gap-2">
                    تشریحی
                    <Badge variant="secondary">{descriptiveCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="trueFalse" className="gap-2">
                    صحیح/غلط
                    <Badge variant="secondary">{trueFalseCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="matching" className="gap-2">
                    جورکردنی
                    <Badge variant="secondary">{matchingCount}</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Multiple Choice */}
                <TabsContent value="multiple" className="space-y-6 mt-6">
                  {/* New Question Form */}
                  <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-blue-800">افزودن سوال تستی جدید</h3>

                    <div className="space-y-2">
                      <Label>متن سوال</Label>
                      <Textarea
                        value={newMultiple.text}
                        onChange={(e) => setNewMultiple({ ...newMultiple, text: e.target.value })}
                        placeholder="متن سوال را وارد کنید..."
                        className="bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {newMultiple.options.map((option, index) => (
                        <div key={index} className="space-y-1">
                          <Label className="text-sm">گزینه {index + 1}</Label>
                          <div className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...newMultiple.options]
                                newOptions[index] = e.target.value
                                setNewMultiple({ ...newMultiple, options: newOptions })
                              }}
                              className="bg-white"
                              placeholder={`گزینه ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant={newMultiple.correctOption === index ? 'default' : 'outline'}
                              size="icon"
                              onClick={() => setNewMultiple({ ...newMultiple, correctOption: index })}
                              className={newMultiple.correctOption === index ? 'bg-green-600' : ''}
                            >
                              {newMultiple.correctOption === index ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <div className="space-y-1">
                        <Label>نمره</Label>
                        <Input
                          type="number"
                          min={0.25}
                          max={10}
                          step={0.25}
                          value={newMultiple.score}
                          onChange={(e) => setNewMultiple({ ...newMultiple, score: parseFloat(e.target.value) || 1 })}
                          className="w-24 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>سطح سختی</Label>
                        <Select
                          value={newMultiple.difficulty}
                          onValueChange={(v) => setNewMultiple({ ...newMultiple, difficulty: v as 'easy' | 'medium' | 'hard' })}
                        >
                          <SelectTrigger className="w-32 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">آسان</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="hard">سخت</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1" />
                      <Button onClick={addMultipleQuestion} className="self-end gap-2">
                        <Plus className="w-4 h-4" />
                        افزودن سوال
                      </Button>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-3">
                    {examData.questions
                      .filter((q): q is MultipleChoiceQuestion => q.type === 'multiple')
                      .map((question, index) => (
                        <div key={question.id} className="bg-white border rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                                  {index + 1}
                                </span>
                                <Badge variant="outline">
                                  {question.difficulty === 'easy' ? 'آسان' : question.difficulty === 'medium' ? 'متوسط' : 'سخت'}
                                </Badge>
                                <Badge>{question.score} نمره</Badge>
                              </div>
                              <p className="text-gray-800 mb-3">{question.text}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {question.options.map((opt, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      'p-2 rounded text-sm',
                                      question.correctOption === i
                                        ? 'bg-green-100 text-green-800 font-medium'
                                        : 'bg-gray-50 text-gray-600'
                                    )}
                                  >
                                    {i + 1}) {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => duplicateQuestion(question)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                {/* Tab: Descriptive */}
                <TabsContent value="descriptive" className="space-y-6 mt-6">
                  <div className="bg-green-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-green-800">افزودن سوال تشریحی جدید</h3>

                    <div className="space-y-2">
                      <Label>متن سوال</Label>
                      <Textarea
                        value={newDescriptive.text}
                        onChange={(e) => setNewDescriptive({ ...newDescriptive, text: e.target.value })}
                        placeholder="متن سوال را وارد کنید..."
                        className="bg-white min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>پاسخ کلیدی (اختیاری)</Label>
                      <Textarea
                        value={newDescriptive.keyAnswer}
                        onChange={(e) => setNewDescriptive({ ...newDescriptive, keyAnswer: e.target.value })}
                        placeholder="پاسخ صحیح برای راهنمای تصحیح..."
                        className="bg-white"
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="space-y-1">
                        <Label>نمره</Label>
                        <Input
                          type="number"
                          min={0.5}
                          max={20}
                          step={0.5}
                          value={newDescriptive.score}
                          onChange={(e) => setNewDescriptive({ ...newDescriptive, score: parseFloat(e.target.value) || 2 })}
                          className="w-24 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>سطح سختی</Label>
                        <Select
                          value={newDescriptive.difficulty}
                          onValueChange={(v) => setNewDescriptive({ ...newDescriptive, difficulty: v as 'easy' | 'medium' | 'hard' })}
                        >
                          <SelectTrigger className="w-32 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">آسان</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="hard">سخت</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1" />
                      <Button onClick={addDescriptiveQuestion} className="self-end gap-2 bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4" />
                        افزودن سوال
                      </Button>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-3">
                    {examData.questions
                      .filter((q): q is DescriptiveQuestion => q.type === 'descriptive')
                      .map((question, index) => (
                        <div key={question.id} className="bg-white border rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm">
                                  {index + 1}
                                </span>
                                <Badge variant="outline">
                                  {question.difficulty === 'easy' ? 'آسان' : question.difficulty === 'medium' ? 'متوسط' : 'سخت'}
                                </Badge>
                                <Badge>{question.score} نمره</Badge>
                              </div>
                              <p className="text-gray-800 mb-2">{question.text}</p>
                              {question.keyAnswer && (
                                <div className="bg-green-50 p-2 rounded text-sm text-green-700">
                                  <strong>کلید:</strong> {question.keyAnswer}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => duplicateQuestion(question)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                {/* Tab: True/False */}
                <TabsContent value="trueFalse" className="space-y-6 mt-6">
                  <div className="bg-orange-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-orange-800">افزودن گزاره صحیح/غلط</h3>

                    <div className="space-y-2">
                      <Label>متن گزاره</Label>
                      <Textarea
                        value={newTrueFalse.text}
                        onChange={(e) => setNewTrueFalse({ ...newTrueFalse, text: e.target.value })}
                        placeholder="گزاره‌ای که باید صحیح یا غلط بودنش مشخص شود..."
                        className="bg-white"
                      />
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="space-y-2">
                        <Label>پاسخ صحیح</Label>
                        <RadioGroup
                          value={newTrueFalse.isTrue ? 'true' : 'false'}
                          onValueChange={(v) => setNewTrueFalse({ ...newTrueFalse, isTrue: v === 'true' })}
                          className="flex gap-4"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="true" id="tf-true" />
                            <Label htmlFor="tf-true" className="text-green-600">صحیح</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="false" id="tf-false" />
                            <Label htmlFor="tf-false" className="text-red-600">غلط</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-1">
                        <Label>نمره</Label>
                        <Input
                          type="number"
                          min={0.25}
                          max={5}
                          step={0.25}
                          value={newTrueFalse.score}
                          onChange={(e) => setNewTrueFalse({ ...newTrueFalse, score: parseFloat(e.target.value) || 0.5 })}
                          className="w-24 bg-white"
                        />
                      </div>
                      <div className="flex-1" />
                      <Button onClick={addTrueFalseQuestion} className="gap-2 bg-orange-600 hover:bg-orange-700">
                        <Plus className="w-4 h-4" />
                        افزودن گزاره
                      </Button>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-3">
                    {examData.questions
                      .filter((q): q is TrueFalseQuestion => q.type === 'trueFalse')
                      .map((question, index) => (
                        <div key={question.id} className="bg-white border rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center font-bold text-sm">
                                  {index + 1}
                                </span>
                                <Badge className={question.isTrue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                  {question.isTrue ? 'صحیح' : 'غلط'}
                                </Badge>
                                <Badge>{question.score} نمره</Badge>
                              </div>
                              <p className="text-gray-800">{question.text}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => duplicateQuestion(question)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                {/* Tab: Matching */}
                <TabsContent value="matching" className="space-y-6 mt-6">
                  <div className="bg-purple-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-purple-800">افزودن سوال جورکردنی</h3>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="font-bold">ستون الف</Label>
                        {newMatching.columnA.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-200 text-purple-800 rounded text-sm flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <Input
                              value={item}
                              onChange={(e) => {
                                const newColumnA = [...newMatching.columnA]
                                newColumnA[index] = e.target.value
                                setNewMatching({ ...newMatching, columnA: newColumnA })
                              }}
                              className="bg-white"
                              placeholder={`آیتم ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <Label className="font-bold">ستون ب</Label>
                        {newMatching.columnB.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-200 text-purple-800 rounded text-sm flex items-center justify-center font-bold">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <Input
                              value={item}
                              onChange={(e) => {
                                const newColumnB = [...newMatching.columnB]
                                newColumnB[index] = e.target.value
                                setNewMatching({ ...newMatching, columnB: newColumnB })
                              }}
                              className="bg-white"
                              placeholder={`آیتم ${String.fromCharCode(65 + index)}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="space-y-1">
                        <Label>نمره کل</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={newMatching.score}
                          onChange={(e) => setNewMatching({ ...newMatching, score: parseFloat(e.target.value) || 2 })}
                          className="w-24 bg-white"
                        />
                      </div>
                      <div className="flex-1" />
                      <Button onClick={addMatchingQuestion} className="gap-2 bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4" />
                        افزودن سوال
                      </Button>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-3">
                    {examData.questions
                      .filter((q): q is MatchingQuestion => q.type === 'matching')
                      .map((question, index) => (
                        <div key={question.id} className="bg-white border rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                                  {index + 1}
                                </span>
                                <Badge>{question.score} نمره</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  {question.columnA.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <span className="w-5 h-5 bg-purple-100 rounded text-xs flex items-center justify-center font-bold">
                                        {i + 1}
                                      </span>
                                      {item}
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-1">
                                  {question.columnB.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <span className="w-5 h-5 bg-purple-100 rounded text-xs flex items-center justify-center font-bold">
                                        {String.fromCharCode(65 + i)}
                                      </span>
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => duplicateQuestion(question)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ToggleLeft className="w-6 h-6 text-blue-600" />
                تنظیمات پیشرفته
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-700">نمایش نتیجه</h3>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="showScore"
                      checked={examData.settings.showScoreImmediately}
                      onCheckedChange={(checked) =>
                        setExamData({
                          ...examData,
                          settings: { ...examData.settings, showScoreImmediately: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="showScore">نمایش نمره بلافاصله بعد از آزمون</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="allowReview"
                      checked={examData.settings.allowReview}
                      onCheckedChange={(checked) =>
                        setExamData({
                          ...examData,
                          settings: { ...examData.settings, allowReview: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="allowReview">امکان بازنگری پاسخ‌ها</Label>
                  </div>
                </div>

                <div className="space-y-4 bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-700">ترتیب سوالات</h3>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="randomQuestions"
                      checked={examData.settings.randomizeQuestions}
                      onCheckedChange={(checked) =>
                        setExamData({
                          ...examData,
                          settings: { ...examData.settings, randomizeQuestions: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="randomQuestions" className="flex items-center gap-2">
                      <Shuffle className="w-4 h-4" />
                      ترتیب تصادفی سوالات
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="randomOptions"
                      checked={examData.settings.randomizeOptions}
                      onCheckedChange={(checked) =>
                        setExamData({
                          ...examData,
                          settings: { ...examData.settings, randomizeOptions: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="randomOptions" className="flex items-center gap-2">
                      <Shuffle className="w-4 h-4" />
                      ترتیب تصادفی گزینه‌ها
                    </Label>
                  </div>
                </div>

                <div className="space-y-4 bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-700">نمره‌دهی</h3>

                  <div className="space-y-2">
                    <Label htmlFor="negativeScore" className="flex items-center gap-2">
                      <Minus className="w-4 h-4 text-red-500" />
                      نمره منفی برای هر پاسخ اشتباه
                    </Label>
                    <Input
                      id="negativeScore"
                      type="number"
                      min={0}
                      max={1}
                      step={0.25}
                      value={examData.settings.negativeScore}
                      onChange={(e) =>
                        setExamData({
                          ...examData,
                          settings: { ...examData.settings, negativeScore: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-32"
                    />
                    <p className="text-xs text-gray-500">0 یعنی بدون نمره منفی</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Eye className="w-6 h-6 text-blue-600" />
                پیش‌نمایش آزمون
              </h2>

              {/* Exam Header Preview */}
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{examData.title || 'عنوان آزمون'}</h2>
                  <p className="text-gray-600 mt-1">
                    {SUBJECTS.find((s) => s.id === examData.subject)?.name || 'درس'} -{' '}
                    {GRADES.find((g) => g.id === examData.grade)?.name || 'پایه'}
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {examData.duration} دقیقه
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {totalQuestionScore} نمره
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-4 h-4" />
                      {examData.questions.length} سوال
                    </span>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Questions Preview */}
                <div className="space-y-6">
                  {examData.questions.map((question, index) => (
                    <div key={question.id} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          {question.type === 'multiple' && (
                            <>
                              <p className="font-medium mb-3">{question.text}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {question.options.map((opt, i) => (
                                  <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                                    {i + 1}) {opt}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {question.type === 'descriptive' && (
                            <>
                              <p className="font-medium mb-3">{question.text}</p>
                              <div className="h-24 border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400">
                                فضای پاسخ تشریحی
                              </div>
                            </>
                          )}
                          {question.type === 'trueFalse' && (
                            <>
                              <p className="font-medium mb-3">{question.text}</p>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                  <input type="radio" name={`tf-${question.id}`} disabled />
                                  صحیح
                                </label>
                                <label className="flex items-center gap-2">
                                  <input type="radio" name={`tf-${question.id}`} disabled />
                                  غلط
                                </label>
                              </div>
                            </>
                          )}
                          {question.type === 'matching' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="font-medium text-sm text-gray-600">ستون الف</p>
                                {question.columnA.map((item, i) => (
                                  <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                                    {i + 1}. {item}
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <p className="font-medium text-sm text-gray-600">ستون ب</p>
                                {question.columnB.map((item, i) => (
                                  <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                                    {String.fromCharCode(65 + i)}. {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-400">({question.score} نمره)</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation & Actions */}
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={goToPrevStep}
              disabled={currentStep === 'info'}
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              مرحله قبل
            </Button>
            <Button
              onClick={goToNextStep}
              disabled={currentStep === 'preview'}
              className="gap-2"
            >
              مرحله بعد
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              ذخیره پیش‌نویس
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              چاپ
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              دانلود PDF
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              انتشار آزمون
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}



