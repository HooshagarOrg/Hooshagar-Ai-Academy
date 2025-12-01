'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ClipboardList,
  Settings,
  BookOpen,
  Eye,
  Shuffle,
  Calculator,
  Clock,
  Target,
  Award,
  Loader2,
  Plus,
  Minus,
  CheckCircle2,
  Circle,
  Search,
  Filter,
  Sparkles,
  GraduationCap,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  DifficultyLevel,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  SUBJECTS,
  GRADES,
  DEFAULT_EXAM_CONFIG,
  QuestionBankItem
} from '@/lib/types/exam.types'

// ═══════════════════════════════════════
// داده‌های نمونه بانک سوالات
// ═══════════════════════════════════════

const sampleQuestionBank: QuestionBankItem[] = [
  // سوالات آسان
  { id: 'q1', school_id: null, question_text: 'حاصل 5 + 3 کدام است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 1', topic: 'جمع', difficulty: 'easy', options: [{ id: 'a', text: '7', is_correct: false }, { id: 'b', text: '8', is_correct: true }, { id: 'c', text: '9', is_correct: false }, { id: 'd', text: '10', is_correct: false }], correct_answer: 'b', correct_answers: null, points: 1, explanation: '5 + 3 = 8', hint: null, attachments: null, tags: ['جمع', 'ساده'], usage_count: 15, correct_rate: 95, avg_time_seconds: 30, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'q2', school_id: null, question_text: 'کدام عدد زوج است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 1', topic: 'اعداد', difficulty: 'easy', options: [{ id: 'a', text: '13', is_correct: false }, { id: 'b', text: '27', is_correct: false }, { id: 'c', text: '36', is_correct: true }, { id: 'd', text: '49', is_correct: false }], correct_answer: 'c', correct_answers: null, points: 1, explanation: '36 بر 2 بخش‌پذیر است', hint: null, attachments: null, tags: ['زوج', 'اعداد'], usage_count: 20, correct_rate: 90, avg_time_seconds: 25, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-02', updated_at: '2024-01-02' },
  { id: 'q3', school_id: null, question_text: 'حاصل 100 ÷ 4 برابر چند است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 2', topic: 'تقسیم', difficulty: 'easy', options: [{ id: 'a', text: '20', is_correct: false }, { id: 'b', text: '25', is_correct: true }, { id: 'c', text: '30', is_correct: false }, { id: 'd', text: '35', is_correct: false }], correct_answer: 'b', correct_answers: null, points: 1, explanation: '100 ÷ 4 = 25', hint: null, attachments: null, tags: ['تقسیم'], usage_count: 18, correct_rate: 88, avg_time_seconds: 35, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-03', updated_at: '2024-01-03' },
  { id: 'q4', school_id: null, question_text: 'مساحت مربع با ضلع 5 کدام است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 4', topic: 'هندسه', difficulty: 'easy', options: [{ id: 'a', text: '10', is_correct: false }, { id: 'b', text: '20', is_correct: false }, { id: 'c', text: '25', is_correct: true }, { id: 'd', text: '30', is_correct: false }], correct_answer: 'c', correct_answers: null, points: 1, explanation: '5 × 5 = 25', hint: null, attachments: null, tags: ['مساحت', 'مربع'], usage_count: 22, correct_rate: 85, avg_time_seconds: 40, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-04', updated_at: '2024-01-04' },
  { id: 'q5', school_id: null, question_text: 'عدد 7 اول است.', question_type: 'true_false', subject: 'math', grade_level: 6, chapter: 'فصل 1', topic: 'اعداد', difficulty: 'easy', options: null, correct_answer: 'true', correct_answers: null, points: 0.5, explanation: '7 فقط بر 1 و خودش بخش‌پذیر است', hint: null, attachments: null, tags: ['اول'], usage_count: 25, correct_rate: 92, avg_time_seconds: 20, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-05', updated_at: '2024-01-05' },
  { id: 'q6', school_id: null, question_text: '1/2 + 1/4 برابر چند است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 3', topic: 'کسر', difficulty: 'easy', options: [{ id: 'a', text: '2/6', is_correct: false }, { id: 'b', text: '3/4', is_correct: true }, { id: 'c', text: '1/6', is_correct: false }, { id: 'd', text: '2/4', is_correct: false }], correct_answer: 'b', correct_answers: null, points: 1, explanation: '2/4 + 1/4 = 3/4', hint: null, attachments: null, tags: ['کسر', 'جمع'], usage_count: 16, correct_rate: 78, avg_time_seconds: 50, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-06', updated_at: '2024-01-06' },
  // سوالات متوسط
  { id: 'q7', school_id: null, question_text: 'اگر x + 5 = 12 باشد، x برابر چند است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 5', topic: 'معادله', difficulty: 'medium', options: [{ id: 'a', text: '5', is_correct: false }, { id: 'b', text: '7', is_correct: true }, { id: 'c', text: '12', is_correct: false }, { id: 'd', text: '17', is_correct: false }], correct_answer: 'b', correct_answers: null, points: 2, explanation: 'x = 12 - 5 = 7', hint: 'از هر دو طرف 5 کم کنید', attachments: null, tags: ['معادله'], usage_count: 12, correct_rate: 72, avg_time_seconds: 60, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-07', updated_at: '2024-01-07' },
  { id: 'q8', school_id: null, question_text: 'محیط مستطیل با طول 8 و عرض 5 چقدر است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 4', topic: 'هندسه', difficulty: 'medium', options: [{ id: 'a', text: '13', is_correct: false }, { id: 'b', text: '26', is_correct: true }, { id: 'c', text: '40', is_correct: false }, { id: 'd', text: '52', is_correct: false }], correct_answer: 'b', correct_answers: null, points: 2, explanation: '2 × (8 + 5) = 26', hint: 'محیط = 2 × (طول + عرض)', attachments: null, tags: ['محیط', 'مستطیل'], usage_count: 14, correct_rate: 68, avg_time_seconds: 55, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-08', updated_at: '2024-01-08' },
  { id: 'q9', school_id: null, question_text: 'ک.م.م اعداد 4 و 6 چیست؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 2', topic: 'بخش‌پذیری', difficulty: 'medium', options: [{ id: 'a', text: '2', is_correct: false }, { id: 'b', text: '12', is_correct: true }, { id: 'c', text: '24', is_correct: false }, { id: 'd', text: '6', is_correct: false }], correct_answer: 'b', correct_answers: null, points: 2, explanation: 'کوچکترین مضرب مشترک 4 و 6 برابر 12 است', hint: null, attachments: null, tags: ['ک.م.م'], usage_count: 10, correct_rate: 65, avg_time_seconds: 70, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-09', updated_at: '2024-01-09' },
  { id: 'q10', school_id: null, question_text: 'قیمت یک کالا 20% افزایش یافت. اگر قیمت جدید 120 تومان باشد، قیمت اولیه چند بود؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 6', topic: 'درصد', difficulty: 'medium', options: [{ id: 'a', text: '96', is_correct: false }, { id: 'b', text: '100', is_correct: true }, { id: 'c', text: '110', is_correct: false }, { id: 'd', text: '140', is_correct: false }], correct_answer: 'b', correct_answers: null, points: 2, explanation: '120 ÷ 1.2 = 100', hint: 'قیمت جدید = قیمت اولیه × 1.2', attachments: null, tags: ['درصد'], usage_count: 8, correct_rate: 58, avg_time_seconds: 90, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-10', updated_at: '2024-01-10' },
  { id: 'q11', school_id: null, question_text: 'نسبت 15 به 25 کدام است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 3', topic: 'نسبت', difficulty: 'medium', options: [{ id: 'a', text: '3/5', is_correct: true }, { id: 'b', text: '2/5', is_correct: false }, { id: 'c', text: '5/3', is_correct: false }, { id: 'd', text: '4/5', is_correct: false }], correct_answer: 'a', correct_answers: null, points: 2, explanation: '15/25 = 3/5', hint: 'ساده کنید', attachments: null, tags: ['نسبت'], usage_count: 11, correct_rate: 62, avg_time_seconds: 65, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-11', updated_at: '2024-01-11' },
  { id: 'q12', school_id: null, question_text: 'مجموع زوایای داخلی مثلث چند درجه است؟', question_type: 'short_answer', subject: 'math', grade_level: 6, chapter: 'فصل 4', topic: 'هندسه', difficulty: 'medium', options: null, correct_answer: '180', correct_answers: ['180', '۱۸۰'], points: 1.5, explanation: 'مجموع زوایای داخلی هر مثلث 180 درجه است', hint: null, attachments: null, tags: ['مثلث', 'زاویه'], usage_count: 20, correct_rate: 75, avg_time_seconds: 45, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-12', updated_at: '2024-01-12' },
  // سوالات سخت
  { id: 'q13', school_id: null, question_text: 'در یک کلاس 30 نفره، 18 نفر فوتبال و 15 نفر والیبال دوست دارند. اگر 5 نفر هیچکدام را دوست نداشته باشند، چند نفر هر دو را دوست دارند؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 7', topic: 'مجموعه', difficulty: 'hard', options: [{ id: 'a', text: '6', is_correct: false }, { id: 'b', text: '8', is_correct: true }, { id: 'c', text: '10', is_correct: false }, { id: 'd', text: '12', is_correct: false }], correct_answer: 'b', correct_answers: null, points: 3, explanation: '18 + 15 - x = 25 → x = 8', hint: 'از اصل شمول و عدم شمول استفاده کنید', attachments: null, tags: ['مجموعه', 'اشتراک'], usage_count: 5, correct_rate: 42, avg_time_seconds: 120, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-13', updated_at: '2024-01-13' },
  { id: 'q14', school_id: null, question_text: 'اگر قیمت کالایی 25% کاهش و سپس 20% افزایش یابد، قیمت نهایی چند درصد قیمت اولیه است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 6', topic: 'درصد', difficulty: 'hard', options: [{ id: 'a', text: '90%', is_correct: true }, { id: 'b', text: '95%', is_correct: false }, { id: 'c', text: '100%', is_correct: false }, { id: 'd', text: '105%', is_correct: false }], correct_answer: 'a', correct_answers: null, points: 3, explanation: '0.75 × 1.2 = 0.9 = 90%', hint: null, attachments: null, tags: ['درصد', 'پیشرفته'], usage_count: 4, correct_rate: 35, avg_time_seconds: 150, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-14', updated_at: '2024-01-14' },
  { id: 'q15', school_id: null, question_text: 'حاصل عبارت 2³ × 3² برابر چند است؟', question_type: 'multiple_choice', subject: 'math', grade_level: 6, chapter: 'فصل 2', topic: 'توان', difficulty: 'hard', options: [{ id: 'a', text: '36', is_correct: false }, { id: 'b', text: '54', is_correct: false }, { id: 'c', text: '72', is_correct: true }, { id: 'd', text: '108', is_correct: false }], correct_answer: 'c', correct_answers: null, points: 3, explanation: '8 × 9 = 72', hint: 'ابتدا توان‌ها را محاسبه کنید', attachments: null, tags: ['توان'], usage_count: 6, correct_rate: 48, avg_time_seconds: 100, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-15', updated_at: '2024-01-15' },
  { id: 'q16', school_id: null, question_text: 'مفهوم کسر را با یک مثال توضیح دهید.', question_type: 'essay', subject: 'math', grade_level: 6, chapter: 'فصل 3', topic: 'کسر', difficulty: 'hard', options: null, correct_answer: null, correct_answers: null, points: 4, explanation: 'کسر نشان‌دهنده بخشی از یک کل است', hint: null, attachments: null, tags: ['کسر', 'تشریحی'], usage_count: 3, correct_rate: null, avg_time_seconds: 300, is_verified: true, is_active: true, created_by: null, created_at: '2024-01-16', updated_at: '2024-01-16' },
]

// ═══════════════════════════════════════
// کامپوننت Stepper
// ═══════════════════════════════════════

interface StepperProps {
  currentStep: number
  steps: { title: string; icon: React.ReactNode }[]
}

function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
              index < currentStep
                ? "bg-green-500 border-green-500 text-white"
                : index === currentStep
                ? "bg-blue-500 border-blue-500 text-white"
                : "border-gray-300 dark:border-gray-600 text-gray-400"
            )}
          >
            {index < currentStep ? (
              <Check className="w-6 h-6" />
            ) : (
              step.icon
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-16 h-1 mx-2 rounded transition-all",
                index < currentStep
                  ? "bg-green-500"
                  : "bg-gray-300 dark:bg-gray-600"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════
// کامپوننت اصلی
// ═══════════════════════════════════════

export default function CreateExamPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Step 1: Basic Info
  const [examTitle, setExamTitle] = useState('')
  const [examDescription, setExamDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [examDate, setExamDate] = useState('')
  const [duration, setDuration] = useState(60)

  // Step 1: Difficulty Distribution
  const [easyCount, setEasyCount] = useState(6)
  const [mediumCount, setMediumCount] = useState(10)
  const [hardCount, setHardCount] = useState(4)

  // Step 2: Selected Questions
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'all'>('all')

  // Step 3: Config
  const [config, setConfig] = useState(DEFAULT_EXAM_CONFIG)

  const steps = [
    { title: 'مشخصات', icon: <ClipboardList className="w-5 h-5" /> },
    { title: 'انتخاب سوالات', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'بررسی نهایی', icon: <Eye className="w-5 h-5" /> }
  ]

  const totalQuestions = easyCount + mediumCount + hardCount

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return sampleQuestionBank.filter(q => {
      if (subject && q.subject !== subject) return false
      if (gradeLevel && q.grade_level !== parseInt(gradeLevel)) return false
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
      if (searchQuery && !q.question_text.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [subject, gradeLevel, filterDifficulty, searchQuery])

  // Group by difficulty
  const questionsByDifficulty = useMemo(() => {
    const easy = filteredQuestions.filter(q => q.difficulty === 'easy')
    const medium = filteredQuestions.filter(q => q.difficulty === 'medium')
    const hard = filteredQuestions.filter(q => q.difficulty === 'hard')
    return { easy, medium, hard }
  }, [filteredQuestions])

  // Selected questions by difficulty
  const selectedByDifficulty = useMemo(() => {
    const selected = Array.from(selectedQuestions)
    return {
      easy: selected.filter(id => sampleQuestionBank.find(q => q.id === id)?.difficulty === 'easy').length,
      medium: selected.filter(id => sampleQuestionBank.find(q => q.id === id)?.difficulty === 'medium').length,
      hard: selected.filter(id => sampleQuestionBank.find(q => q.id === id)?.difficulty === 'hard').length
    }
  }, [selectedQuestions])

  // Calculate total points
  const totalPoints = useMemo(() => {
    return Array.from(selectedQuestions).reduce((sum, id) => {
      const q = sampleQuestionBank.find(q => q.id === id)
      return sum + (q?.points || 0)
    }, 0)
  }, [selectedQuestions])

  const handleAutoGenerate = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Auto-select questions based on distribution
    const newSelected = new Set<string>()
    
    // Select easy questions
    questionsByDifficulty.easy.slice(0, easyCount).forEach(q => newSelected.add(q.id))
    // Select medium questions
    questionsByDifficulty.medium.slice(0, mediumCount).forEach(q => newSelected.add(q.id))
    // Select hard questions
    questionsByDifficulty.hard.slice(0, hardCount).forEach(q => newSelected.add(q.id))

    setSelectedQuestions(newSelected)
    setIsGenerating(false)
  }

  const toggleQuestion = (id: string) => {
    const newSet = new Set(selectedQuestions)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedQuestions(newSet)
  }

  const handleCreate = async () => {
    setIsCreating(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    router.push('/teacher/exams')
  }

  const canProceedStep1 = examTitle && subject && gradeLevel && examDate && totalQuestions > 0
  const canProceedStep2 = selectedQuestions.size >= totalQuestions

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Link
              href="/teacher"
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <GraduationCap className="w-7 h-7 text-blue-500" />
                ایجاد امتحان جدید
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                با استفاده از بانک سوالات، امتحان خود را بسازید
              </p>
            </div>
          </div>
        </header>

        {/* Stepper */}
        <div className="mb-6">
          <Stepper currentStep={currentStep} steps={steps} />
          <p className="text-center text-gray-600 dark:text-gray-400 font-medium">
            {steps[currentStep].title}
          </p>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Step 1: Basic Info */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>عنوان امتحان *</Label>
                    <Input
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="مثال: امتحان میان‌ترم ریاضی"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاریخ برگزاری *</Label>
                    <Input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>درس *</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب درس..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>پایه تحصیلی *</Label>
                    <Select value={gradeLevel} onValueChange={setGradeLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب پایه..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(g => (
                          <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>توضیحات (اختیاری)</Label>
                  <Textarea
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    placeholder="توضیحات امتحان..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>مدت زمان (دقیقه): {duration}</Label>
                  <Slider
                    value={[duration]}
                    onValueChange={(v) => setDuration(v[0])}
                    min={15}
                    max={180}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>15 دقیقه</span>
                    <span>180 دقیقه</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    توزیع سطح دشواری
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-700 dark:text-green-400">آسان</span>
                        <span className="text-green-600 font-bold">{easyCount} سوال</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setEasyCount(Math.max(0, easyCount - 1))}
                          className="h-8 w-8"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={easyCount}
                          onChange={(e) => setEasyCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="text-center h-8"
                          min={0}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setEasyCount(easyCount + 1)}
                          className="h-8 w-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">متوسط</span>
                        <span className="text-yellow-600 font-bold">{mediumCount} سوال</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setMediumCount(Math.max(0, mediumCount - 1))}
                          className="h-8 w-8"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={mediumCount}
                          onChange={(e) => setMediumCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="text-center h-8"
                          min={0}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setMediumCount(mediumCount + 1)}
                          className="h-8 w-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-red-700 dark:text-red-400">سخت</span>
                        <span className="text-red-600 font-bold">{hardCount} سوال</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setHardCount(Math.max(0, hardCount - 1))}
                          className="h-8 w-8"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={hardCount}
                          onChange={(e) => setHardCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="text-center h-8"
                          min={0}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setHardCount(hardCount + 1)}
                          className="h-8 w-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-center mt-4 font-bold">
                    مجموع: {totalQuestions} سوال
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Select Questions */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Auto Generate Button */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Button
                    onClick={handleAutoGenerate}
                    disabled={isGenerating}
                    className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    تولید خودکار
                  </Button>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجو..."
                        className="pr-10 w-48"
                      />
                    </div>
                    <Select value={filterDifficulty} onValueChange={(v) => setFilterDifficulty(v as DifficultyLevel | 'all')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه سطوح</SelectItem>
                        <SelectItem value="easy">آسان</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="hard">سخت</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Progress */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <p className="text-sm text-green-600">آسان</p>
                    <p className="font-bold text-green-700">{selectedByDifficulty.easy} / {easyCount}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                    <p className="text-sm text-yellow-600">متوسط</p>
                    <p className="font-bold text-yellow-700">{selectedByDifficulty.medium} / {mediumCount}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                    <p className="text-sm text-red-600">سخت</p>
                    <p className="font-bold text-red-700">{selectedByDifficulty.hard} / {hardCount}</p>
                  </div>
                </div>

                <Progress value={(selectedQuestions.size / totalQuestions) * 100} className="h-2" />
                <p className="text-center text-sm text-gray-500">
                  {selectedQuestions.size} از {totalQuestions} سوال انتخاب شده
                </p>

                {/* Questions Tabs */}
                <Tabs defaultValue="easy">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="easy" className="gap-2">
                      آسان
                      <Badge variant="secondary" className="text-xs">
                        {questionsByDifficulty.easy.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="medium" className="gap-2">
                      متوسط
                      <Badge variant="secondary" className="text-xs">
                        {questionsByDifficulty.medium.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="hard" className="gap-2">
                      سخت
                      <Badge variant="secondary" className="text-xs">
                        {questionsByDifficulty.hard.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map(diff => (
                    <TabsContent key={diff} value={diff} className="mt-4">
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {questionsByDifficulty[diff].map((q, index) => (
                          <div
                            key={q.id}
                            onClick={() => toggleQuestion(q.id)}
                            className={cn(
                              "p-4 rounded-xl border-2 cursor-pointer transition-all",
                              selectedQuestions.has(q.id)
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                                selectedQuestions.has(q.id)
                                  ? "bg-blue-500 text-white"
                                  : "border-2 border-gray-300"
                              )}>
                                {selectedQuestions.has(q.id) ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium line-clamp-2">{q.question_text}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge className={DIFFICULTY_COLORS[q.difficulty]}>
                                    {DIFFICULTY_LABELS[q.difficulty]}
                                  </Badge>
                                  <Badge variant="outline">{q.points} نمره</Badge>
                                  {q.topic && (
                                    <Badge variant="secondary">{q.topic}</Badge>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    استفاده: {q.usage_count} بار
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-500" />
                        خلاصه امتحان
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">عنوان:</span>
                        <span className="font-medium">{examTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">درس:</span>
                        <span className="font-medium">{SUBJECTS.find(s => s.id === subject)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">پایه:</span>
                        <span className="font-medium">{GRADES.find(g => g.id === parseInt(gradeLevel))?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">تاریخ:</span>
                        <span className="font-medium">{examDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">مدت:</span>
                        <span className="font-medium">{duration} دقیقه</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-gray-500">تعداد سوالات:</span>
                        <span className="font-bold text-blue-600">{selectedQuestions.size} سوال</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">نمره کل:</span>
                        <span className="font-bold text-green-600">{totalPoints} نمره</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">نمره قبولی:</span>
                        <span className="font-bold">{Math.round(totalPoints * config.passing_score / 100)} ({config.passing_score}%)</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribution Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-500" />
                        توزیع سوالات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-green-600">آسان</span>
                          <span className="font-bold">{selectedByDifficulty.easy} ({Math.round(selectedByDifficulty.easy / selectedQuestions.size * 100)}%)</span>
                        </div>
                        <Progress value={selectedByDifficulty.easy / selectedQuestions.size * 100} className="h-2 [&>div]:bg-green-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-yellow-600">متوسط</span>
                          <span className="font-bold">{selectedByDifficulty.medium} ({Math.round(selectedByDifficulty.medium / selectedQuestions.size * 100)}%)</span>
                        </div>
                        <Progress value={selectedByDifficulty.medium / selectedQuestions.size * 100} className="h-2 [&>div]:bg-yellow-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-red-600">سخت</span>
                          <span className="font-bold">{selectedByDifficulty.hard} ({Math.round(selectedByDifficulty.hard / selectedQuestions.size * 100)}%)</span>
                        </div>
                        <Progress value={selectedByDifficulty.hard / selectedQuestions.size * 100} className="h-2 [&>div]:bg-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Config */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-orange-500" />
                      تنظیمات امتحان
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shuffle className="w-4 h-4 text-gray-500" />
                          <span>ترتیب سوالات تصادفی</span>
                        </div>
                        <Switch
                          checked={config.shuffle_questions}
                          onCheckedChange={(v) => setConfig({ ...config, shuffle_questions: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shuffle className="w-4 h-4 text-gray-500" />
                          <span>ترتیب گزینه‌ها تصادفی</span>
                        </div>
                        <Switch
                          checked={config.shuffle_options}
                          onCheckedChange={(v) => setConfig({ ...config, shuffle_options: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-gray-500" />
                          <span>نمایش نمره فوری</span>
                        </div>
                        <Switch
                          checked={config.show_score_immediately}
                          onCheckedChange={(v) => setConfig({ ...config, show_score_immediately: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-500" />
                          <span>امکان بازبینی</span>
                        </div>
                        <Switch
                          checked={config.allow_review}
                          onCheckedChange={(v) => setConfig({ ...config, allow_review: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-gray-500" />
                          <span>استفاده از ماشین حساب</span>
                        </div>
                        <Switch
                          checked={config.calculator_allowed}
                          onCheckedChange={(v) => setConfig({ ...config, calculator_allowed: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Minus className="w-4 h-4 text-gray-500" />
                          <span>نمره منفی</span>
                        </div>
                        <Switch
                          checked={config.negative_marking}
                          onCheckedChange={(v) => setConfig({ ...config, negative_marking: v })}
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>نمره قبولی: {config.passing_score}%</Label>
                      <Slider
                        value={[config.passing_score]}
                        onValueChange={(v) => setConfig({ ...config, passing_score: v[0] })}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Questions Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-500" />
                      پیش‌نمایش سوالات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {Array.from(selectedQuestions).map((id, index) => {
                        const q = sampleQuestionBank.find(q => q.id === id)
                        if (!q) return null
                        return (
                          <div
                            key={id}
                            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3"
                          >
                            <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </span>
                            <span className="flex-1 line-clamp-1">{q.question_text}</span>
                            <Badge className={DIFFICULTY_COLORS[q.difficulty]}>
                              {DIFFICULTY_LABELS[q.difficulty]}
                            </Badge>
                            <Badge variant="outline">{q.points} نمره</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            قبلی
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 0 && !canProceedStep1) ||
                (currentStep === 1 && !canProceedStep2)
              }
              className="gap-2"
            >
              بعدی
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              ایجاد امتحان
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
