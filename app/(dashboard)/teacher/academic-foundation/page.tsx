'use client'

import { useState, useMemo } from 'react'
import {
  Brain,
  BookOpen,
  Calculator,
  Users,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Printer,
  Send,
  Save,
  Sparkles,
  Eye,
  History,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Award,
  MessageSquare,
  Lightbulb,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { StatCard } from '@/components/ui/stat-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

interface Student {
  id: string
  name: string
  classId: string
  className: string
  avatar?: string
  lastAssessment?: string
  lastScore?: number
}

interface SkillAssessment {
  // Language Skills (40)
  reading: number // 0-10
  writing: number // 0-10
  vocabulary: number // 0-10
  speaking: number // 0-10
  // Math Skills (30)
  mentalMath: number // 0-10
  problemSolving: number // 0-10
  geometry: number // 0-10
  // Cognitive Skills (20)
  focus: number // 0-5
  memory: number // 0-5
  logicalThinking: number // 0-5
  creativity: number // 0-5
  // Social Skills (10)
  teamwork: number // 0-5
  leadership: number // 0-5
  // Notes
  notes: string
}

interface AssessmentRecord {
  id: string
  studentId: string
  date: string
  skills: SkillAssessment
  totalScore: number
  level: 'weak' | 'average' | 'good' | 'excellent'
  languageScore: number
  mathScore: number
  cognitiveScore: number
  socialScore: number
  aiRecommendations?: {
    strengths: string[]
    weaknesses: string[]
    plan: string[]
    resources: string[]
  }
}

interface Class {
  id: string
  name: string
  grade: string
}

// ============================================
// داده‌های ثابت
// ============================================

const CLASSES: Class[] = [
  { id: '1', name: 'ششم الف', grade: '6' },
  { id: '2', name: 'ششم ب', grade: '6' },
  { id: '3', name: 'پنجم الف', grade: '5' },
  { id: '4', name: 'پنجم ب', grade: '5' },
]

const STUDENTS: Student[] = [
  { id: '1', name: 'علی محمدی', classId: '1', className: 'ششم الف', lastAssessment: '1403/08/15', lastScore: 78 },
  { id: '2', name: 'مریم احمدی', classId: '1', className: 'ششم الف', lastAssessment: '1403/08/14', lastScore: 85 },
  { id: '3', name: 'حسین رضایی', classId: '1', className: 'ششم الف', lastAssessment: '1403/08/10', lastScore: 62 },
  { id: '4', name: 'زهرا کریمی', classId: '1', className: 'ششم الف', lastAssessment: '1403/07/25', lastScore: 91 },
  { id: '5', name: 'محمد حسینی', classId: '1', className: 'ششم الف' },
  { id: '6', name: 'فاطمه علوی', classId: '2', className: 'ششم ب', lastAssessment: '1403/08/12', lastScore: 73 },
  { id: '7', name: 'امیر عباسی', classId: '2', className: 'ششم ب', lastAssessment: '1403/08/11', lastScore: 68 },
  { id: '8', name: 'سارا نوری', classId: '2', className: 'ششم ب' },
  { id: '9', name: 'رضا قاسمی', classId: '3', className: 'پنجم الف', lastAssessment: '1403/08/08', lastScore: 80 },
  { id: '10', name: 'نازنین موسوی', classId: '3', className: 'پنجم الف', lastAssessment: '1403/08/05', lastScore: 88 },
]

const SAMPLE_ASSESSMENTS: AssessmentRecord[] = [
  {
    id: '1',
    studentId: '1',
    date: '1403/08/15',
    skills: {
      reading: 8, writing: 7, vocabulary: 8, speaking: 7,
      mentalMath: 8, problemSolving: 7, geometry: 8,
      focus: 4, memory: 4, logicalThinking: 4, creativity: 3,
      teamwork: 4, leadership: 3,
      notes: 'دانش‌آموز در مهارت‌های زبانی عملکرد خوبی دارد.',
    },
    totalScore: 78,
    level: 'good',
    languageScore: 30,
    mathScore: 23,
    cognitiveScore: 15,
    socialScore: 7,
  },
  {
    id: '2',
    studentId: '2',
    date: '1403/08/14',
    skills: {
      reading: 9, writing: 8, vocabulary: 9, speaking: 8,
      mentalMath: 9, problemSolving: 8, geometry: 8,
      focus: 4, memory: 5, logicalThinking: 4, creativity: 4,
      teamwork: 4, leadership: 4,
      notes: 'دانش‌آموز ممتاز با عملکرد یکنواخت در همه زمینه‌ها.',
    },
    totalScore: 85,
    level: 'excellent',
    languageScore: 34,
    mathScore: 25,
    cognitiveScore: 17,
    socialScore: 8,
  },
  {
    id: '3',
    studentId: '3',
    date: '1403/08/10',
    skills: {
      reading: 6, writing: 5, vocabulary: 6, speaking: 5,
      mentalMath: 6, problemSolving: 5, geometry: 6,
      focus: 3, memory: 3, logicalThinking: 3, creativity: 3,
      teamwork: 4, leadership: 3,
      notes: 'نیاز به تقویت در مهارت‌های پایه.',
    },
    totalScore: 62,
    level: 'average',
    languageScore: 22,
    mathScore: 17,
    cognitiveScore: 12,
    socialScore: 7,
  },
  {
    id: '4',
    studentId: '4',
    date: '1403/07/25',
    skills: {
      reading: 10, writing: 9, vocabulary: 9, speaking: 9,
      mentalMath: 9, problemSolving: 9, geometry: 9,
      focus: 5, memory: 5, logicalThinking: 4, creativity: 5,
      teamwork: 5, leadership: 4,
      notes: 'دانش‌آموز استثنایی با استعداد بالا.',
    },
    totalScore: 91,
    level: 'excellent',
    languageScore: 37,
    mathScore: 27,
    cognitiveScore: 19,
    socialScore: 9,
  },
  {
    id: '5',
    studentId: '6',
    date: '1403/08/12',
    skills: {
      reading: 7, writing: 7, vocabulary: 7, speaking: 7,
      mentalMath: 7, problemSolving: 7, geometry: 7,
      focus: 4, memory: 3, logicalThinking: 4, creativity: 3,
      teamwork: 4, leadership: 3,
      notes: 'عملکرد متوسط رو به بالا.',
    },
    totalScore: 73,
    level: 'good',
    languageScore: 28,
    mathScore: 21,
    cognitiveScore: 14,
    socialScore: 7,
  },
]

// Historical data for charts
const HISTORY_DATA = [
  { month: 'فروردین', score: 65, classAvg: 70 },
  { month: 'اردیبهشت', score: 68, classAvg: 71 },
  { month: 'خرداد', score: 72, classAvg: 72 },
  { month: 'تیر', score: 70, classAvg: 73 },
  { month: 'مرداد', score: 75, classAvg: 74 },
  { month: 'شهریور', score: 78, classAvg: 75 },
]

// ============================================
// کامپوننت‌های کمکی
// ============================================

function SkillSlider({
  label,
  value,
  onChange,
  max,
  color = 'blue',
}: {
  label: string
  value: number
  onChange: (value: number) => void
  max: number
  color?: string
}) {
  const percentage = (value / max) * 100
  const colorClass =
    percentage < 40
      ? 'bg-red-500'
      : percentage < 70
      ? 'bg-yellow-500'
      : 'bg-green-500'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Badge variant="outline" className={cn('min-w-[50px] justify-center', colorClass.replace('bg-', 'text-'))}>
          {value} از {max}
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        max={max}
        step={1}
        className={cn('cursor-pointer')}
      />
      <Progress value={percentage} className="h-2" />
    </div>
  )
}

function ScoreCard({
  title,
  score,
  maxScore,
  icon: Icon,
  color,
}: {
  title: string
  score: number
  maxScore: number
  icon: LucideIcon
  color: string
}) {
  const percentage = Math.round((score / maxScore) * 100)

  return (
    <div className={cn('rounded-xl p-4 text-white', color)}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-6 h-6" />
        <span className="text-2xl font-bold">{score}/{maxScore}</span>
      </div>
      <p className="text-sm opacity-90">{title}</p>
      <div className="mt-2 bg-white/20 rounded-full h-2">
        <div
          className="bg-white rounded-full h-2 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function getLevelInfo(level: 'weak' | 'average' | 'good' | 'excellent') {
  switch (level) {
    case 'weak':
      return { label: 'ضعیف', color: 'bg-red-100 text-red-700', icon: AlertCircle }
    case 'average':
      return { label: 'متوسط', color: 'bg-yellow-100 text-yellow-700', icon: Minus }
    case 'good':
      return { label: 'خوب', color: 'bg-green-100 text-green-700', icon: CheckCircle2 }
    case 'excellent':
      return { label: 'عالی', color: 'bg-purple-100 text-purple-700', icon: Award }
  }
}

function calculateLevel(score: number): 'weak' | 'average' | 'good' | 'excellent' {
  if (score < 50) return 'weak'
  if (score < 70) return 'average'
  if (score < 85) return 'good'
  return 'excellent'
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function AcademicFoundationPage() {
  // State
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [assessments, setAssessments] = useState<AssessmentRecord[]>(SAMPLE_ASSESSMENTS)

  // Dialog States
  const [assessDialogOpen, setAssessDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // Assessment Form State
  const [currentAssessment, setCurrentAssessment] = useState<SkillAssessment>({
    reading: 5,
    writing: 5,
    vocabulary: 5,
    speaking: 5,
    mentalMath: 5,
    problemSolving: 5,
    geometry: 5,
    focus: 3,
    memory: 3,
    logicalThinking: 3,
    creativity: 3,
    teamwork: 3,
    leadership: 3,
    notes: '',
  })

  // Loading States
  const [isSaving, setIsSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<{
    strengths: string[]
    weaknesses: string[]
    plan: string[]
    resources: string[]
  } | null>(null)

  // ============================================
  // محاسبات
  // ============================================

  const languageScore = currentAssessment.reading + currentAssessment.writing + currentAssessment.vocabulary + currentAssessment.speaking
  const mathScore = currentAssessment.mentalMath + currentAssessment.problemSolving + currentAssessment.geometry
  const cognitiveScore = currentAssessment.focus + currentAssessment.memory + currentAssessment.logicalThinking + currentAssessment.creativity
  const socialScore = currentAssessment.teamwork + currentAssessment.leadership
  const totalScore = languageScore + mathScore + cognitiveScore + socialScore
  const currentLevel = calculateLevel(totalScore)

  // Radar Chart Data
  const radarData = [
    { skill: 'خواندن', value: currentAssessment.reading, fullMark: 10 },
    { skill: 'نوشتن', value: currentAssessment.writing, fullMark: 10 },
    { skill: 'واژگان', value: currentAssessment.vocabulary, fullMark: 10 },
    { skill: 'بیان', value: currentAssessment.speaking, fullMark: 10 },
    { skill: 'محاسبات', value: currentAssessment.mentalMath, fullMark: 10 },
    { skill: 'حل مسئله', value: currentAssessment.problemSolving, fullMark: 10 },
    { skill: 'هندسه', value: currentAssessment.geometry, fullMark: 10 },
    { skill: 'تمرکز', value: currentAssessment.focus * 2, fullMark: 10 },
    { skill: 'حافظه', value: currentAssessment.memory * 2, fullMark: 10 },
    { skill: 'تفکر', value: currentAssessment.logicalThinking * 2, fullMark: 10 },
    { skill: 'خلاقیت', value: currentAssessment.creativity * 2, fullMark: 10 },
    { skill: 'کار گروهی', value: currentAssessment.teamwork * 2, fullMark: 10 },
  ]

  // Filtered Students
  const filteredStudents = useMemo(() => {
    let result = [...STUDENTS]

    if (selectedClass !== 'all') {
      result = result.filter((s) => s.classId === selectedClass)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((s) => s.name.toLowerCase().includes(query))
    }

    return result
  }, [selectedClass, searchQuery])

  // ============================================
  // Handlers
  // ============================================

  const openAssessDialog = (student: Student) => {
    setSelectedStudent(student)
    
    // Load existing assessment if available
    const existing = assessments.find((a) => a.studentId === student.id)
    if (existing) {
      setCurrentAssessment(existing.skills)
    } else {
      // Reset to defaults
      setCurrentAssessment({
        reading: 5,
        writing: 5,
        vocabulary: 5,
        speaking: 5,
        mentalMath: 5,
        problemSolving: 5,
        geometry: 5,
        focus: 3,
        memory: 3,
        logicalThinking: 3,
        creativity: 3,
        teamwork: 3,
        leadership: 3,
        notes: '',
      })
    }
    
    setAiRecommendations(null)
    setAssessDialogOpen(true)
  }

  const openHistoryDialog = (student: Student) => {
    setSelectedStudent(student)
    setHistoryDialogOpen(true)
  }

  const handleSaveAssessment = async () => {
    if (!selectedStudent) return

    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newAssessment: AssessmentRecord = {
        id: Date.now().toString(),
        studentId: selectedStudent.id,
        date: new Date().toLocaleDateString('fa-IR'),
        skills: currentAssessment,
        totalScore,
        level: currentLevel,
        languageScore,
        mathScore,
        cognitiveScore,
        socialScore,
        aiRecommendations: aiRecommendations || undefined,
      }

      // Update or add
      const existingIndex = assessments.findIndex((a) => a.studentId === selectedStudent.id)
      if (existingIndex >= 0) {
        const updated = [...assessments]
        updated[existingIndex] = newAssessment
        setAssessments(updated)
      } else {
        setAssessments([...assessments, newAssessment])
      }

      toast.success('ارزیابی با موفقیت ذخیره شد')
      setAssessDialogOpen(false)
    } catch (error) {
      toast.error('خطا در ذخیره ارزیابی')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock AI recommendations
      const recommendations = {
        strengths: [
          languageScore >= 30 ? 'مهارت‌های زبانی قوی' : null,
          mathScore >= 22 ? 'توانایی خوب در ریاضیات' : null,
          cognitiveScore >= 15 ? 'مهارت‌های شناختی مناسب' : null,
          socialScore >= 8 ? 'مهارت‌های اجتماعی خوب' : null,
        ].filter(Boolean) as string[],
        weaknesses: [
          languageScore < 25 ? 'نیاز به تقویت مهارت‌های زبانی' : null,
          mathScore < 18 ? 'نیاز به تمرین بیشتر در ریاضیات' : null,
          cognitiveScore < 12 ? 'تقویت تمرکز و حافظه' : null,
          socialScore < 6 ? 'بهبود مهارت‌های اجتماعی' : null,
        ].filter(Boolean) as string[],
        plan: [
          'تمرین روزانه 15 دقیقه خواندن',
          'حل 5 مسئله ریاضی در روز',
          'بازی‌های فکری برای تقویت تمرکز',
          'شرکت در فعالیت‌های گروهی',
        ],
        resources: [
          'کتاب‌های داستان مناسب سن',
          'اپلیکیشن آموزش ریاضی',
          'بازی‌های پازل و فکری',
          'کلاس‌های هنری گروهی',
        ],
      }

      if (recommendations.strengths.length === 0) {
        recommendations.strengths = ['پتانسیل رشد بالا']
      }
      if (recommendations.weaknesses.length === 0) {
        recommendations.weaknesses = ['عملکرد یکنواخت و مناسب']
      }

      setAiRecommendations(recommendations)
      toast.success('تحلیل هوشمند انجام شد')
    } catch (error) {
      toast.error('خطا در تحلیل')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handlePrint = () => {
    window.print()
    toast.success('در حال آماده‌سازی برای چاپ...')
  }

  const handleSendToParent = async () => {
    toast.success('گزارش به والدین ارسال شد')
  }

  const getStudentAssessment = (studentId: string) => {
    return assessments.find((a) => a.studentId === studentId)
  }

  // ============================================
  // Render
  // ============================================

  return (
    <DashboardPage
      className="max-w-7xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-brand-purple" />
          ارزیابی بنیه علمی
        </span>
      }
      description="ارزیابی مهارت‌های بنیادی و آمادگی یادگیری"
      meta={
        <div className="flex flex-wrap gap-3">
          <StatCard label="ارزیابی انجام شده" value={assessments.length} accentClass="text-brand-purple" className="min-w-[100px] p-4" />
          <StatCard
            label="خوب و عالی"
            value={assessments.filter((a) => a.level === 'excellent' || a.level === 'good').length}
            accentClass="text-brand-green"
            className="min-w-[100px] p-4"
          />
          <StatCard
            label="نیاز به تقویت"
            value={assessments.filter((a) => a.level === 'weak' || a.level === 'average').length}
            accentClass="text-brand-yellow"
            className="min-w-[100px] p-4"
          />
        </div>
      }
      animatedSections={false}
    >
        <GlassCard className="p-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی دانش‌آموز..."
                className="pr-10"
              />
            </div>
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="انتخاب کلاس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه کلاس‌ها</SelectItem>
              {CLASSES.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </GlassCard>

        {/* Students Table */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>نام دانش‌آموز</TableHead>
                <TableHead className="w-32">کلاس</TableHead>
                <TableHead className="w-32">آخرین ارزیابی</TableHead>
                <TableHead className="w-32">نمره</TableHead>
                <TableHead className="w-24">سطح</TableHead>
                <TableHead className="w-48">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student, index) => {
                const assessment = getStudentAssessment(student.id)
                const levelInfo = assessment ? getLevelInfo(assessment.level) : null

                return (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.className}</Badge>
                    </TableCell>
                    <TableCell>
                      {assessment ? (
                        <span className="text-sm text-gray-600">{assessment.date}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assessment ? (
                        <span className="font-bold text-lg">{assessment.totalScore}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {levelInfo ? (
                        <Badge className={levelInfo.color}>
                          <levelInfo.icon className="w-3 h-3 ml-1" />
                          {levelInfo.label}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openAssessDialog(student)}
                          className="gap-1"
                        >
                          <Target className="w-4 h-4" />
                          ارزیابی
                        </Button>
                        {assessment && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openHistoryDialog(student)}
                            className="gap-1"
                          >
                            <History className="w-4 h-4" />
                            تاریخچه
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

      {/* Assessment Dialog */}
      <Dialog open={assessDialogOpen} onOpenChange={setAssessDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Brain className="w-6 h-6 text-purple-600" />
              ارزیابی بنیه علمی - {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              مهارت‌های بنیادی دانش‌آموز را ارزیابی کنید
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Assessment Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section A: Language Skills */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  الف) مهارت‌های زبانی (40 نمره)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <SkillSlider
                    label="1. خواندن و درک مطلب"
                    value={currentAssessment.reading}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, reading: v })}
                    max={10}
                  />
                  <SkillSlider
                    label="2. نوشتن و املا"
                    value={currentAssessment.writing}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, writing: v })}
                    max={10}
                  />
                  <SkillSlider
                    label="3. واژگان و دایره لغت"
                    value={currentAssessment.vocabulary}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, vocabulary: v })}
                    max={10}
                  />
                  <SkillSlider
                    label="4. مکالمه و بیان"
                    value={currentAssessment.speaking}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, speaking: v })}
                    max={10}
                  />
                </div>
                <div className="text-left">
                  <Badge className="bg-blue-600">{languageScore} از 40</Badge>
                </div>
              </div>

              {/* Section B: Math Skills */}
              <div className="bg-green-50 rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-green-800 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  ب) مهارت‌های ریاضی (30 نمره)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <SkillSlider
                    label="5. محاسبات ذهنی"
                    value={currentAssessment.mentalMath}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, mentalMath: v })}
                    max={10}
                  />
                  <SkillSlider
                    label="6. حل مسئله"
                    value={currentAssessment.problemSolving}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, problemSolving: v })}
                    max={10}
                  />
                  <SkillSlider
                    label="7. هندسه و فضا"
                    value={currentAssessment.geometry}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, geometry: v })}
                    max={10}
                  />
                </div>
                <div className="text-left">
                  <Badge className="bg-green-600">{mathScore} از 30</Badge>
                </div>
              </div>

              {/* Section C: Cognitive Skills */}
              <div className="bg-purple-50 rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-purple-800 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  ج) مهارت‌های شناختی (20 نمره)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <SkillSlider
                    label="8. تمرکز و توجه"
                    value={currentAssessment.focus}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, focus: v })}
                    max={5}
                  />
                  <SkillSlider
                    label="9. حافظه"
                    value={currentAssessment.memory}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, memory: v })}
                    max={5}
                  />
                  <SkillSlider
                    label="10. تفکر منطقی"
                    value={currentAssessment.logicalThinking}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, logicalThinking: v })}
                    max={5}
                  />
                  <SkillSlider
                    label="11. خلاقیت"
                    value={currentAssessment.creativity}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, creativity: v })}
                    max={5}
                  />
                </div>
                <div className="text-left">
                  <Badge className="bg-purple-600">{cognitiveScore} از 20</Badge>
                </div>
              </div>

              {/* Section D: Social Skills */}
              <div className="bg-orange-50 rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-orange-800 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  د) مهارت‌های اجتماعی (10 نمره)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <SkillSlider
                    label="12. کار گروهی"
                    value={currentAssessment.teamwork}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, teamwork: v })}
                    max={5}
                  />
                  <SkillSlider
                    label="13. رهبری و مسئولیت"
                    value={currentAssessment.leadership}
                    onChange={(v) => setCurrentAssessment({ ...currentAssessment, leadership: v })}
                    max={5}
                  />
                </div>
                <div className="text-left">
                  <Badge className="bg-orange-600">{socialScore} از 10</Badge>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Textarea
                  value={currentAssessment.notes}
                  onChange={(e) => setCurrentAssessment({ ...currentAssessment, notes: e.target.value })}
                  placeholder="یادداشت‌ها و توضیحات تکمیلی..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Right Column - Summary & Chart */}
            <div className="space-y-6">
              {/* Total Score */}
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white text-center">
                <p className="text-5xl font-bold mb-2">{totalScore}</p>
                <p className="text-sm opacity-80">نمره کل از 100</p>
                <Badge className={cn('mt-3', getLevelInfo(currentLevel).color)}>
                  سطح: {getLevelInfo(currentLevel).label}
                </Badge>
              </div>

              {/* Score Cards */}
              <div className="grid grid-cols-2 gap-3">
                <ScoreCard
                  title="زبانی"
                  score={languageScore}
                  maxScore={40}
                  icon={BookOpen}
                  color="bg-blue-500"
                />
                <ScoreCard
                  title="ریاضی"
                  score={mathScore}
                  maxScore={30}
                  icon={Calculator}
                  color="bg-green-500"
                />
                <ScoreCard
                  title="شناختی"
                  score={cognitiveScore}
                  maxScore={20}
                  icon={Brain}
                  color="bg-purple-500"
                />
                <ScoreCard
                  title="اجتماعی"
                  score={socialScore}
                  maxScore={10}
                  icon={Users}
                  color="bg-orange-500"
                />
              </div>

              {/* Radar Chart */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-3 text-center">نمودار مهارت‌ها</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="نمره"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* AI Analysis Button */}
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال تحلیل...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    تحلیل و پیشنهاد هوشمند
                  </>
                )}
              </Button>

              {/* AI Recommendations */}
              {aiRecommendations && (
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-lg p-3">
                    <h5 className="font-medium text-green-800 flex items-center gap-1 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      نقاط قوت
                    </h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      {aiRecommendations.strengths.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3">
                    <h5 className="font-medium text-yellow-800 flex items-center gap-1 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      نقاط ضعف
                    </h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {aiRecommendations.weaknesses.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <h5 className="font-medium text-blue-800 flex items-center gap-1 mb-2">
                      <Lightbulb className="w-4 h-4" />
                      برنامه تقویت
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {aiRecommendations.plan.map((p, i) => (
                        <li key={i}>• {p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <h5 className="font-medium text-purple-800 flex items-center gap-1 mb-2">
                      <BookOpen className="w-4 h-4" />
                      منابع پیشنهادی
                    </h5>
                    <ul className="text-sm text-purple-700 space-y-1">
                      {aiRecommendations.resources.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 mt-6">
            <Button variant="outline" onClick={() => setAssessDialogOpen(false)}>
              انصراف
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-1">
              <Printer className="w-4 h-4" />
              چاپ گزارش
            </Button>
            <Button variant="outline" onClick={handleSendToParent} className="gap-1">
              <Send className="w-4 h-4" />
              ارسال به والدین
            </Button>
            <Button onClick={handleSaveAssessment} disabled={isSaving} className="gap-1">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              تاریخچه ارزیابی - {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Chart */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-700 mb-4">نمودار پیشرفت</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={HISTORY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="نمره دانش‌آموز"
                    dot={{ fill: '#8b5cf6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="classAvg"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="میانگین کلاس"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">نمره فعلی</p>
                <p className="text-3xl font-bold text-purple-600">78</p>
              </div>
              <div className="bg-white rounded-xl border p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">میانگین کلاس</p>
                <p className="text-3xl font-bold text-gray-600">75</p>
              </div>
              <div className="bg-white rounded-xl border p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">تغییرات</p>
                <p className="text-3xl font-bold text-green-600 flex items-center justify-center gap-1">
                  <ArrowUp className="w-5 h-5" />
                  +13
                </p>
              </div>
            </div>

            {/* Previous Assessments */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">ارزیابی‌های قبلی</h4>
              {HISTORY_DATA.slice(-3).reverse().map((item, index) => (
                <div key={index} className="bg-white rounded-lg border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{item.month} 1403</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{item.score} نمره</Badge>
                    {index > 0 && (
                      <span className={cn(
                        'text-sm flex items-center gap-1',
                        item.score > HISTORY_DATA[HISTORY_DATA.length - 2 - index]?.score
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}>
                        {item.score > HISTORY_DATA[HISTORY_DATA.length - 2 - index]?.score ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        {Math.abs(item.score - (HISTORY_DATA[HISTORY_DATA.length - 2 - index]?.score || 0))}
                      </span>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  )
}
















































