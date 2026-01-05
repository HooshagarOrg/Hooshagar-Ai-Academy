'use client'

import { useState, useEffect, useMemo} from 'react'
import {
  ClipboardCheck,
  User,
  Calendar,
  ChevronDown,
  
  Check,
  Star,
  
  
  AlertTriangle,
  Lightbulb,
  Target,
  Save,
  
  Printer,
  Mail,
  CalendarPlus,
  FileText,
  BarChart3,
  LineChart,
  Eye,
  Edit,
  Trash2,
  Clock,
  BookOpen,
  Users,
  MessageSquare,
  GraduationCap,
  Heart,
  Briefcase,
  Loader2,
  
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها و اینترفیس‌ها
// ============================================

interface Teacher {
  id: string
  name: string
  subject: string
  experience: number
  lastEvaluation?: {
    date: string
    score: number
  }
  avatar?: string
}

interface Indicator {
  id: string
  label: string
  checked: boolean
}

interface Criterion {
  id: string
  title: string
  score: number
  indicators: Indicator[]
  notes: string
  extraFields?: Record<string, string | number>
}

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  weight: number
  maxScore: number
  criteria: Criterion[]
}

interface EvaluationHistory {
  id: string
  teacherId: string
  teacherName: string
  date: string
  type: string
  totalScore: number
  level: string
  status: 'draft' | 'submitted' | 'sent'
}

// ============================================
// داده‌های نمونه
// ============================================

const SAMPLE_TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'علی رضایی',
    subject: 'ریاضی',
    experience: 8,
    lastEvaluation: { date: '6 ماه پیش', score: 85 },
  },
  {
    id: 't2',
    name: 'سارا احمدی',
    subject: 'علوم',
    experience: 5,
    lastEvaluation: { date: '3 ماه پیش', score: 78 },
  },
  {
    id: 't3',
    name: 'محمد کریمی',
    subject: 'ادبیات فارسی',
    experience: 12,
    lastEvaluation: { date: '1 سال پیش', score: 92 },
  },
  {
    id: 't4',
    name: 'فاطمه موسوی',
    subject: 'زبان انگلیسی',
    experience: 3,
  },
  {
    id: 't5',
    name: 'حسین نوری',
    subject: 'تربیت بدنی',
    experience: 10,
    lastEvaluation: { date: '4 ماه پیش', score: 70 },
  },
]

const EVALUATION_TYPES = [
  { value: 'mid-first', label: 'میان‌ترم (نیمسال اول)' },
  { value: 'final-first', label: 'پایان‌ترم (نیمسال اول)' },
  { value: 'mid-second', label: 'میان‌ترم (نیمسال دوم)' },
  { value: 'final-second', label: 'پایان‌ترم (نیمسال دوم)' },
  { value: 'annual', label: 'ارزیابی سالانه' },
]

const SAMPLE_HISTORY: EvaluationHistory[] = [
  {
    id: 'e1',
    teacherId: 't1',
    teacherName: 'علی رضایی',
    date: '1403/06/15',
    type: 'میان‌ترم (نیمسال اول)',
    totalScore: 85,
    level: 'خوب',
    status: 'sent',
  },
  {
    id: 'e2',
    teacherId: 't2',
    teacherName: 'سارا احمدی',
    date: '1403/06/18',
    type: 'میان‌ترم (نیمسال اول)',
    totalScore: 78,
    level: 'خوب',
    status: 'sent',
  },
  {
    id: 'e3',
    teacherId: 't3',
    teacherName: 'محمد کریمی',
    date: '1403/07/01',
    type: 'پایان‌ترم (نیمسال اول)',
    totalScore: 92,
    level: 'عالی',
    status: 'submitted',
  },
  {
    id: 'e4',
    teacherId: 't5',
    teacherName: 'حسین نوری',
    date: '1403/07/10',
    type: 'میان‌ترم (نیمسال دوم)',
    totalScore: 70,
    level: 'متوسط',
    status: 'draft',
  },
]

// ساختار اولیه فرم ارزیابی
const createInitialSections = (): Section[] => [
  {
    id: 'section-a',
    title: 'بخش الف: تخصص علمی و تدریس',
    icon: <BookOpen className="w-5 h-5" />,
    weight: 30,
    maxScore: 25,
    criteria: [
      {
        id: 'c1',
        title: 'تسلط به محتوای درسی',
        score: 0,
        indicators: [
          { id: 'c1-i1', label: 'تسلط به مفاهیم پایه', checked: false },
          { id: 'c1-i2', label: 'پاسخ به سوالات پیچیده', checked: false },
          { id: 'c1-i3', label: 'ارائه مثال‌های متنوع', checked: false },
          { id: 'c1-i4', label: 'به‌روز بودن اطلاعات', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c2',
        title: 'روش‌های تدریس مؤثر',
        score: 0,
        indicators: [
          { id: 'c2-i1', label: 'تنوع در روش‌های تدریس', checked: false },
          { id: 'c2-i2', label: 'استفاده از وسایل کمک آموزشی', checked: false },
          { id: 'c2-i3', label: 'تدریس تعاملی', checked: false },
          { id: 'c2-i4', label: 'سازگاری با سطح دانش‌آموزان', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c3',
        title: 'توانایی پاسخگویی به سوالات',
        score: 0,
        indicators: [
          { id: 'c3-i1', label: 'پاسخ‌های واضح و مفهوم', checked: false },
          { id: 'c3-i2', label: 'صبر و حوصله', checked: false },
          { id: 'c3-i3', label: 'تشویق به پرسش', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c4',
        title: 'خلاقیت در آموزش',
        score: 0,
        indicators: [
          { id: 'c4-i1', label: 'روش‌های نوآورانه', checked: false },
          { id: 'c4-i2', label: 'استفاده از بازی و داستان', checked: false },
          { id: 'c4-i3', label: 'ایجاد علاقه به یادگیری', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c5',
        title: 'استفاده از فناوری',
        score: 0,
        indicators: [
          { id: 'c5-i1', label: 'پروژکتور و تصاویر', checked: false },
          { id: 'c5-i2', label: 'نرم‌افزارهای آموزشی', checked: false },
          { id: 'c5-i3', label: 'ویدئوهای آموزشی', checked: false },
          { id: 'c5-i4', label: 'کلاس مجازی', checked: false },
        ],
        notes: '',
      },
    ],
  },
  {
    id: 'section-b',
    title: 'بخش ب: مدیریت کلاس',
    icon: <Users className="w-5 h-5" />,
    weight: 20,
    maxScore: 20,
    criteria: [
      {
        id: 'c6',
        title: 'نظم و انضباط کلاسی',
        score: 0,
        indicators: [
          { id: 'c6-i1', label: 'کنترل رفتار دانش‌آموزان', checked: false },
          { id: 'c6-i2', label: 'ایجاد فضای آرام', checked: false },
          { id: 'c6-i3', label: 'مدیریت درگیری‌ها', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c7',
        title: 'مدیریت زمان',
        score: 0,
        indicators: [
          { id: 'c7-i1', label: 'شروع به‌موقع کلاس', checked: false },
          { id: 'c7-i2', label: 'تخصیص زمان مناسب به هر بخش', checked: false },
          { id: 'c7-i3', label: 'پایان به‌موقع کلاس', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c8',
        title: 'تعامل با دانش‌آموزان',
        score: 0,
        indicators: [
          { id: 'c8-i1', label: 'توجه به همه دانش‌آموزان', checked: false },
          { id: 'c8-i2', label: 'ایجاد فضای گفتگو', checked: false },
          { id: 'c8-i3', label: 'شناخت نیازهای فردی', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c9',
        title: 'ایجاد انگیزه در یادگیری',
        score: 0,
        indicators: [
          { id: 'c9-i1', label: 'تشویق و قدردانی', checked: false },
          { id: 'c9-i2', label: 'ایجاد چالش‌های مثبت', checked: false },
          { id: 'c9-i3', label: 'مرتبط کردن درس با زندگی', checked: false },
        ],
        notes: '',
      },
    ],
  },
  {
    id: 'section-c',
    title: 'بخش ج: ارزشیابی و بازخورد',
    icon: <ClipboardCheck className="w-5 h-5" />,
    weight: 15,
    maxScore: 15,
    criteria: [
      {
        id: 'c10',
        title: 'تنوع در روش‌های ارزشیابی',
        score: 0,
        indicators: [
          { id: 'c10-i1', label: 'آزمون کتبی', checked: false },
          { id: 'c10-i2', label: 'آزمون شفاهی', checked: false },
          { id: 'c10-i3', label: 'پروژه', checked: false },
          { id: 'c10-i4', label: 'فعالیت کلاسی', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c11',
        title: 'بازخورد سازنده به دانش‌آموزان',
        score: 0,
        indicators: [
          { id: 'c11-i1', label: 'بازخورد به‌موقع', checked: false },
          { id: 'c11-i2', label: 'بازخورد مشخص و کاربردی', checked: false },
          { id: 'c11-i3', label: 'تقویت نقاط قوت', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c12',
        title: 'عدالت در نمره‌دهی',
        score: 0,
        indicators: [
          { id: 'c12-i1', label: 'معیارهای شفاف', checked: false },
          { id: 'c12-i2', label: 'بدون تبعیض', checked: false },
          { id: 'c12-i3', label: 'ارائه توضیح برای نمرات', checked: false },
        ],
        notes: '',
      },
    ],
  },
  {
    id: 'section-d',
    title: 'بخش د: تعامل و همکاری',
    icon: <MessageSquare className="w-5 h-5" />,
    weight: 15,
    maxScore: 15,
    criteria: [
      {
        id: 'c13',
        title: 'ارتباط با والدین',
        score: 0,
        indicators: [
          { id: 'c13-i1', label: 'پاسخگویی به تماس‌ها', checked: false },
          { id: 'c13-i2', label: 'گزارش منظم به والدین', checked: false },
          { id: 'c13-i3', label: 'شرکت در جلسات', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c14',
        title: 'همکاری با همکاران',
        score: 0,
        indicators: [
          { id: 'c14-i1', label: 'تبادل تجربه', checked: false },
          { id: 'c14-i2', label: 'همکاری در پروژه‌ها', checked: false },
          { id: 'c14-i3', label: 'کمک به همکاران جدید', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c15',
        title: 'مشارکت در برنامه‌های مدرسه',
        score: 0,
        indicators: [
          { id: 'c15-i1', label: 'شرکت در جشن‌ها', checked: false },
          { id: 'c15-i2', label: 'همکاری در اردوها', checked: false },
          { id: 'c15-i3', label: 'مسئولیت‌پذیری اضافی', checked: false },
        ],
        notes: '',
      },
    ],
  },
  {
    id: 'section-e',
    title: 'بخش ه: رشد حرفه‌ای',
    icon: <GraduationCap className="w-5 h-5" />,
    weight: 10,
    maxScore: 10,
    criteria: [
      {
        id: 'c16',
        title: 'شرکت در دوره‌های آموزشی',
        score: 0,
        indicators: [
          { id: 'c16-i1', label: 'دوره‌های تخصصی', checked: false },
          { id: 'c16-i2', label: 'کارگاه‌های عملی', checked: false },
          { id: 'c16-i3', label: 'دوره‌های آنلاین', checked: false },
        ],
        notes: '',
        extraFields: { courseCount: 0, courseNames: '' },
      },
      {
        id: 'c17',
        title: 'مطالعه و به‌روز بودن',
        score: 0,
        indicators: [
          { id: 'c17-i1', label: 'مطالعه کتب تخصصی', checked: false },
          { id: 'c17-i2', label: 'حضور در کنفرانس‌ها', checked: false },
          { id: 'c17-i3', label: 'استفاده از منابع آنلاین', checked: false },
        ],
        notes: '',
      },
    ],
  },
  {
    id: 'section-f',
    title: 'بخش و: اخلاق و رفتار حرفه‌ای',
    icon: <Heart className="w-5 h-5" />,
    weight: 10,
    maxScore: 15,
    criteria: [
      {
        id: 'c18',
        title: 'حضور و وقت‌شناسی',
        score: 0,
        indicators: [
          { id: 'c18-i1', label: 'حضور منظم', checked: false },
          { id: 'c18-i2', label: 'به‌موقع بودن', checked: false },
          { id: 'c18-i3', label: 'اطلاع‌رسانی غیبت', checked: false },
        ],
        notes: '',
        extraFields: { absences: 0, delays: 0 },
      },
      {
        id: 'c19',
        title: 'احترام و رفتار حرفه‌ای',
        score: 0,
        indicators: [
          { id: 'c19-i1', label: 'احترام به دانش‌آموزان', checked: false },
          { id: 'c19-i2', label: 'احترام به همکاران', checked: false },
          { id: 'c19-i3', label: 'رعایت قوانین مدرسه', checked: false },
          { id: 'c19-i4', label: 'ظاهر مرتب و آراسته', checked: false },
        ],
        notes: '',
      },
      {
        id: 'c20',
        title: 'تعهد و مسئولیت‌پذیری',
        score: 0,
        indicators: [
          { id: 'c20-i1', label: 'انجام وظایف محوله', checked: false },
          { id: 'c20-i2', label: 'پیگیری مشکلات دانش‌آموزان', checked: false },
          { id: 'c20-i3', label: 'تلاش برای بهبود', checked: false },
        ],
        notes: '',
      },
    ],
  },
]

// ============================================
// کامپوننت‌های کمکی
// ============================================

const SCORE_EMOJIS = ['😢', '😕', '😐', '😊', '😃', '🤩']

function ScoreSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const emojiIndex = Math.min(Math.floor(value), 5)

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-2xl">
        {SCORE_EMOJIS.map((emoji, index) => (
          <span
            key={index}
            className={cn(
              'cursor-pointer transition-transform',
              Math.floor(value) === index && 'scale-125'
            )}
            onClick={() => onChange(index)}
          >
            {emoji}
          </span>
        ))}
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        max={5}
        step={0.5}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>0</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
      <div className="text-center">
        <Badge variant="outline" className="text-lg px-4 py-1">
          {value.toFixed(1)} از 5
        </Badge>
      </div>
    </div>
  )
}

function getScoreLevel(score: number): { label: string; color: string; icon: React.ReactNode } {
  if (score >= 85) return { label: 'عالی', color: 'text-green-600 bg-green-100', icon: <Star className="w-4 h-4" /> }
  if (score >= 75) return { label: 'خوب', color: 'text-blue-600 bg-blue-100', icon: <CheckCircle2 className="w-4 h-4" /> }
  if (score >= 65) return { label: 'متوسط', color: 'text-yellow-600 bg-yellow-100', icon: <AlertCircle className="w-4 h-4" /> }
  if (score >= 50) return { label: 'نیازمند بهبود', color: 'text-orange-600 bg-orange-100', icon: <AlertTriangle className="w-4 h-4" /> }
  return { label: 'ضعیف', color: 'text-red-600 bg-red-100', icon: <XCircle className="w-4 h-4" /> }
}

function SectionSummary({ section, sectionScore }: { section: Section; sectionScore: number }) {
  const percentage = Math.round((sectionScore / section.maxScore) * 100)
  const level = getScoreLevel(percentage)

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        {section.icon}
        <span className="text-sm font-medium">{section.title.split(':')[0]}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {sectionScore.toFixed(1)}/{section.maxScore}
        </span>
        <Badge className={level.color}>
          {percentage}%
        </Badge>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function TeacherEvaluationPage() {
  // State اصلی
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [teacherSearchOpen, setTeacherSearchOpen] = useState(false)
  const [evaluationType, setEvaluationType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // State فرم
  const [sections, setSections] = useState<Section[]>(createInitialSections())
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [developmentPlan, setDevelopmentPlan] = useState('')

  // State UI
  const [activeTab, setActiveTab] = useState('evaluation')
  const [openAccordions, setOpenAccordions] = useState<string[]>(['section-a'])
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // ============================================
  // محاسبات
  // ============================================

  // تعداد معیارهای تکمیل شده
  const completedCriteria = useMemo(() => {
    let count = 0
    sections.forEach((section) => {
      section.criteria.forEach((criterion) => {
        if (criterion.score > 0) count++
      })
    })
    return count
  }, [sections])

  const totalCriteria = 20

  // نمره هر بخش
  const sectionScores = useMemo(() => {
    const scores: Record<string, number> = {}
    sections.forEach((section) => {
      const total = section.criteria.reduce((sum, c) => sum + c.score, 0)
      scores[section.id] = total
    })
    return scores
  }, [sections])

  // نمره کل
  const totalScore = useMemo(() => {
    let sum = 0
    sections.forEach((section) => {
      sum += sectionScores[section.id] || 0
    })
    return sum
  }, [sections, sectionScores])

  // نمره با وزن‌دهی (0-100)
  const weightedScore = useMemo(() => {
    let weighted = 0
    sections.forEach((section) => {
      const sectionPercentage = (sectionScores[section.id] / section.maxScore) * 100
      weighted += (sectionPercentage * section.weight) / 100
    })
    return weighted
  }, [sections, sectionScores])

  const maxPossibleScore = sections.reduce((sum, s) => sum + s.maxScore, 0)

  // داده‌های نمودار Radar
  const radarData = useMemo(() => {
    return sections.map((section) => ({
      subject: section.title.split(':')[1]?.trim() || section.title,
      score: Math.round((sectionScores[section.id] / section.maxScore) * 100),
      fullMark: 100,
    }))
  }, [sections, sectionScores])

  // داده‌های نمودار روند
  const trendData = [
    { name: 'شهریور', score: 70 },
    { name: 'مهر', score: 72 },
    { name: 'آبان', score: 74 },
    { name: 'آذر', score: Math.round(weightedScore) },
  ]

  // داده‌های مقایسه
  const comparisonData = [
    { name: 'این معلم', score: Math.round(weightedScore), fill: '#3b82f6' },
    { name: 'میانگین مدرسه', score: 72, fill: '#94a3b8' },
    { name: 'بالاترین', score: 92, fill: '#22c55e' },
    { name: 'پایین‌ترین', score: 58, fill: '#ef4444' },
  ]

  // ============================================
  // Handlers
  // ============================================

  const handleScoreChange = (sectionId: string, criterionId: string, score: number) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              criteria: section.criteria.map((criterion) =>
                criterion.id === criterionId ? { ...criterion, score } : criterion
              ),
            }
          : section
      )
    )
  }

  const handleIndicatorChange = (
    sectionId: string,
    criterionId: string,
    indicatorId: string,
    checked: boolean
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              criteria: section.criteria.map((criterion) =>
                criterion.id === criterionId
                  ? {
                      ...criterion,
                      indicators: criterion.indicators.map((indicator) =>
                        indicator.id === indicatorId ? { ...indicator, checked } : indicator
                      ),
                    }
                  : criterion
              ),
            }
          : section
      )
    )
  }

  const handleNotesChange = (sectionId: string, criterionId: string, notes: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              criteria: section.criteria.map((criterion) =>
                criterion.id === criterionId ? { ...criterion, notes } : criterion
              ),
            }
          : section
      )
    )
  }

  const handleExtraFieldChange = (
    sectionId: string,
    criterionId: string,
    fieldName: string,
    value: string | number
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              criteria: section.criteria.map((criterion) =>
                criterion.id === criterionId
                  ? {
                      ...criterion,
                      extraFields: { ...criterion.extraFields, [fieldName]: value },
                    }
                  : criterion
              ),
            }
          : section
      )
    )
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setLastSaved(new Date())
      toast.success('پیش‌نویس ذخیره شد')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTeacher) {
      toast.error('لطفاً معلم را انتخاب کنید')
      return
    }
    if (!evaluationType) {
      toast.error('لطفاً نوع ارزیابی را انتخاب کنید')
      return
    }
    if (completedCriteria < totalCriteria) {
      toast.error('لطفاً همه معیارها را امتیازدهی کنید')
      return
    }
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('ارزیابی با موفقیت ثبت شد')
      setShowConfirmDialog(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Auto-save
  useEffect(() => {
    if (selectedTeacher && completedCriteria > 0) {
      const timer = setTimeout(() => {
        handleSaveDraft()
      }, 30000) // هر 30 ثانیه
      return () => clearTimeout(timer)
    }
  }, [sections, selectedTeacher, completedCriteria])

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ClipboardCheck className="w-8 h-8 text-blue-600" />
                </div>
                ارزیابی عملکرد معلم
              </h1>
              <p className="text-gray-500 mt-2 mr-14">
                ارزیابی جامع بر اساس 20 معیار تخصصی
              </p>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <FileText className="w-4 h-4 ml-2" />
              فرم استاندارد
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="evaluation" className="gap-2">
              <ClipboardCheck className="w-4 h-4" />
              ارزیابی جدید
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              تاریخچه ارزیابی‌ها
            </TabsTrigger>
          </TabsList>

          {/* تب ارزیابی جدید */}
          <TabsContent value="evaluation" className="space-y-6">
            {/* بخش انتخاب معلم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  انتخاب معلم و تنظیمات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* انتخاب معلم */}
                  <div className="space-y-2">
                    <Label>معلم *</Label>
                    <Popover open={teacherSearchOpen} onOpenChange={setTeacherSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedTeacher?.name || 'انتخاب معلم...'}
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="جستجوی معلم..." />
                          <CommandList>
                            <CommandEmpty>معلمی یافت نشد</CommandEmpty>
                            <CommandGroup>
                              {SAMPLE_TEACHERS.map((teacher) => (
                                <CommandItem
                                  key={teacher.id}
                                  onSelect={() => {
                                    setSelectedTeacher(teacher)
                                    setTeacherSearchOpen(false)
                                  }}
                                  className="flex items-center gap-3 p-3"
                                >
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {teacher.name.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium">{teacher.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {teacher.subject} • {teacher.experience} سال سابقه
                                    </p>
                                  </div>
                                  {selectedTeacher?.id === teacher.id && (
                                    <Check className="w-4 h-4 text-blue-600" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* نوع ارزیابی */}
                  <div className="space-y-2">
                    <Label>نوع ارزیابی *</Label>
                    <Select value={evaluationType} onValueChange={setEvaluationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب نوع ارزیابی..." />
                      </SelectTrigger>
                      <SelectContent>
                        {EVALUATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* اطلاعات معلم انتخاب شده */}
                {selectedTeacher && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {selectedTeacher.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{selectedTeacher.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            درس: {selectedTeacher.subject}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            سابقه: {selectedTeacher.experience} سال
                          </span>
                        </div>
                        {selectedTeacher.lastEvaluation && (
                          <p className="text-sm text-gray-500 mt-1">
                            آخرین ارزیابی: {selectedTeacher.lastEvaluation.date} ({selectedTeacher.lastEvaluation.score}%)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* بازه زمانی */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاریخ شروع بازه</Label>
                    <Input
                      type="text"
                      placeholder="1403/07/01"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاریخ پایان بازه</Label>
                    <Input
                      type="text"
                      placeholder="1403/09/30"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* بدنه اصلی - فرم و خلاصه */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* فرم ارزیابی */}
              <div className="lg:col-span-3 space-y-4">
                {/* Progress Bar */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">پیشرفت تکمیل فرم</span>
                      <span className="text-sm text-gray-500">
                        {completedCriteria} از {totalCriteria} معیار تکمیل شده
                      </span>
                    </div>
                    <Progress value={(completedCriteria / totalCriteria) * 100} className="h-3" />
                  </CardContent>
                </Card>

                {/* Accordions */}
                <Accordion
                  type="multiple"
                  value={openAccordions}
                  onValueChange={setOpenAccordions}
                  className="space-y-4"
                >
                  {sections.map((section, sectionIndex) => (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className="border rounded-xl bg-white shadow-sm overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                              {section.icon}
                            </div>
                            <div className="text-right">
                              <h3 className="font-bold text-gray-800">{section.title}</h3>
                              <p className="text-xs text-gray-500">
                                وزن: {section.weight}% • حداکثر نمره: {section.maxScore}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <Badge
                              variant={
                                (sectionScores[section.id] / section.maxScore) >= 0.75
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {sectionScores[section.id].toFixed(1)}/{section.maxScore}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="space-y-6 pt-4">
                          {section.criteria.map((criterion, criterionIndex) => {
                            const globalIndex = sections
                              .slice(0, sectionIndex)
                              .reduce((sum, s) => sum + s.criteria.length, 0) + criterionIndex + 1

                            return (
                              <Card key={criterion.id} className="bg-gray-50">
                                <CardContent className="pt-6">
                                  <div className="space-y-4">
                                    {/* عنوان معیار */}
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                                        {globalIndex}
                                      </span>
                                      <h4 className="font-bold text-gray-800">{criterion.title}</h4>
                                    </div>

                                    {/* اسلایدر نمره */}
                                    <ScoreSlider
                                      value={criterion.score}
                                      onChange={(value) =>
                                        handleScoreChange(section.id, criterion.id, value)
                                      }
                                    />

                                    {/* شاخص‌ها */}
                                    <div className="space-y-2">
                                      <Label className="text-sm text-gray-600">شاخص‌های ارزیابی:</Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        {criterion.indicators.map((indicator) => (
                                          <div
                                            key={indicator.id}
                                            className="flex items-center gap-2"
                                          >
                                            <Checkbox
                                              id={indicator.id}
                                              checked={indicator.checked}
                                              onCheckedChange={(checked) =>
                                                handleIndicatorChange(
                                                  section.id,
                                                  criterion.id,
                                                  indicator.id,
                                                  checked as boolean
                                                )
                                              }
                                            />
                                            <label
                                              htmlFor={indicator.id}
                                              className="text-sm text-gray-700 cursor-pointer"
                                            >
                                              {indicator.label}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* فیلدهای اضافی */}
                                    {criterion.extraFields && (
                                      <div className="grid grid-cols-2 gap-4">
                                        {criterion.id === 'c16' && (
                                          <>
                                            <div className="space-y-2">
                                              <Label className="text-sm">تعداد دوره‌ها</Label>
                                              <Input
                                                type="number"
                                                min="0"
                                                value={criterion.extraFields.courseCount || ''}
                                                onChange={(e) =>
                                                  handleExtraFieldChange(
                                                    section.id,
                                                    criterion.id,
                                                    'courseCount',
                                                    parseInt(e.target.value) || 0
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-sm">نام دوره‌ها</Label>
                                              <Input
                                                value={criterion.extraFields.courseNames || ''}
                                                onChange={(e) =>
                                                  handleExtraFieldChange(
                                                    section.id,
                                                    criterion.id,
                                                    'courseNames',
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="روش‌های نوین تدریس..."
                                              />
                                            </div>
                                          </>
                                        )}
                                        {criterion.id === 'c18' && (
                                          <>
                                            <div className="space-y-2">
                                              <Label className="text-sm">تعداد غیبت (روز)</Label>
                                              <Input
                                                type="number"
                                                min="0"
                                                value={criterion.extraFields.absences || ''}
                                                onChange={(e) =>
                                                  handleExtraFieldChange(
                                                    section.id,
                                                    criterion.id,
                                                    'absences',
                                                    parseInt(e.target.value) || 0
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-sm">تعداد تأخیر</Label>
                                              <Input
                                                type="number"
                                                min="0"
                                                value={criterion.extraFields.delays || ''}
                                                onChange={(e) =>
                                                  handleExtraFieldChange(
                                                    section.id,
                                                    criterion.id,
                                                    'delays',
                                                    parseInt(e.target.value) || 0
                                                  )
                                                }
                                              />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}

                                    {/* یادداشت */}
                                    <div className="space-y-2">
                                      <Label className="text-sm text-gray-600">یادداشت و مستندات:</Label>
                                      <Textarea
                                        value={criterion.notes}
                                        onChange={(e) =>
                                          handleNotesChange(section.id, criterion.id, e.target.value)
                                        }
                                        placeholder="مشاهدات و یادداشت‌های مرتبط..."
                                        className="min-h-[80px]"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}

                          {/* جمع بخش */}
                          <div className="flex items-center justify-end pt-4 border-t">
                            <div className="text-left">
                              <p className="text-sm text-gray-600">جمع نمره این بخش:</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {sectionScores[section.id].toFixed(1)} / {section.maxScore}
                                <span className="text-sm font-normal text-gray-500 mr-2">
                                  ({Math.round((sectionScores[section.id] / section.maxScore) * 100)}%)
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* نقاط قوت و ضعف */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      تحلیل و پیشنهادات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          نقاط قوت برجسته
                        </Label>
                        <Textarea
                          value={strengths}
                          onChange={(e) => setStrengths(e.target.value)}
                          placeholder="تسلط علمی عالی، پاسخگویی فوق‌العاده..."
                          className="min-h-[120px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          نقاط نیازمند بهبود
                        </Label>
                        <Textarea
                          value={weaknesses}
                          onChange={(e) => setWeaknesses(e.target.value)}
                          placeholder="استفاده محدود از فناوری..."
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        پیشنهادات برای بهبود
                      </Label>
                      <Textarea
                        value={suggestions}
                        onChange={(e) => setSuggestions(e.target.value)}
                        placeholder="شرکت در کارگاه استفاده از فناوری..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        برنامه توسعه حرفه‌ای
                      </Label>
                      <Textarea
                        value={developmentPlan}
                        onChange={(e) => setDevelopmentPlan(e.target.value)}
                        placeholder="ماه 1-2: کارگاه فناوری&#10;ماه 3-4: طراحی روش‌های جدید..."
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* نمودارهای مقایسه */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        مقایسه با سایر معلمان
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comparisonData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <LineChart className="w-5 h-5 text-green-600" />
                        روند پیشرفت
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="#22c55e"
                              strokeWidth={3}
                              dot={{ r: 6 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* دکمه‌های نهایی */}
                <Card>
                  <CardContent className="py-6">
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="gap-2"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        ذخیره پیش‌نویس
                      </Button>
                      <Button onClick={handleSubmit} className="gap-2 bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4" />
                        ثبت نهایی
                      </Button>
                      <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer className="w-4 h-4" />
                        چاپ گزارش
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Mail className="w-4 h-4" />
                        ارسال به معلم
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <CalendarPlus className="w-4 h-4" />
                        تعیین جلسه بازخورد
                      </Button>
                    </div>
                    {lastSaved && (
                      <p className="text-center text-xs text-gray-400 mt-3">
                        آخرین ذخیره: {lastSaved.toLocaleTimeString('fa-IR')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar خلاصه */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        خلاصه ارزیابی
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="text-center">
                        <Badge
                          variant={completedCriteria === totalCriteria ? 'default' : 'secondary'}
                          className="mb-2"
                        >
                          {completedCriteria}/{totalCriteria}{' '}
                          {completedCriteria === totalCriteria && '✅'}
                        </Badge>
                        <Progress
                          value={(completedCriteria / totalCriteria) * 100}
                          className="h-2"
                        />
                      </div>

                      <Separator />

                      {/* نمرات بخش‌ها */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">نمرات بخش‌ها:</p>
                        {sections.map((section) => (
                          <SectionSummary
                            key={section.id}
                            section={section}
                            sectionScore={sectionScores[section.id]}
                          />
                        ))}
                      </div>

                      <Separator />

                      {/* جمع کل */}
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">جمع کل:</p>
                        <p className="text-3xl font-bold text-gray-800">
                          {totalScore.toFixed(1)}/{maxPossibleScore}
                        </p>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">نمره نهایی (با وزن‌دهی):</p>
                          <p className="text-4xl font-bold text-blue-600">
                            {weightedScore.toFixed(1)}
                            <span className="text-lg text-gray-500">/100</span>
                          </p>
                        </div>
                        <Badge className={cn('text-sm px-4 py-1', getScoreLevel(weightedScore).color)}>
                          {getScoreLevel(weightedScore).icon}
                          <span className="mr-1">سطح: {getScoreLevel(weightedScore).label}</span>
                        </Badge>
                      </div>

                      <Separator />

                      {/* نمودار Radar */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2 text-center">
                          نمودار عملکرد
                        </p>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} />
                              <Radar
                                name="نمره"
                                dataKey="score"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.5}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <Separator />

                      {/* راهنمای رنگ‌ها */}
                      <div className="space-y-1 text-xs">
                        <p className="font-medium text-gray-700">رنگ‌بندی:</p>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span>85-100: عالی</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          <span>75-84: خوب</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          <span>65-74: متوسط</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full" />
                          <span>50-64: نیازمند بهبود</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          <span>0-49: ضعیف</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* تب تاریخچه */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  تاریخچه ارزیابی‌ها
                </CardTitle>
                <CardDescription>لیست تمام ارزیابی‌های انجام شده</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معلم</TableHead>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>نوع</TableHead>
                      <TableHead>نمره کل</TableHead>
                      <TableHead>سطح</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_HISTORY.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">{evaluation.teacherName}</TableCell>
                        <TableCell>{evaluation.date}</TableCell>
                        <TableCell>{evaluation.type}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{evaluation.totalScore}%</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getScoreLevel(evaluation.totalScore).color}>
                            {evaluation.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              evaluation.status === 'sent'
                                ? 'default'
                                : evaluation.status === 'submitted'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {evaluation.status === 'sent'
                              ? 'ارسال شده'
                              : evaluation.status === 'submitted'
                              ? 'ثبت شده'
                              : 'پیش‌نویس'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {evaluation.status === 'draft' && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog تأیید */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                تأیید ثبت نهایی
              </DialogTitle>
              <DialogDescription>
                آیا از ثبت نهایی این ارزیابی اطمینان دارید؟
                <br />
                پس از ثبت، ارزیابی به معلم ارسال می‌شود.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">نمره نهایی:</p>
              <p className="text-3xl font-bold text-blue-600">{weightedScore.toFixed(1)}/100</p>
              <Badge className={cn('mt-2', getScoreLevel(weightedScore).color)}>
                {getScoreLevel(weightedScore).label}
              </Badge>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                انصراف
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                تأیید و ثبت
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}














































