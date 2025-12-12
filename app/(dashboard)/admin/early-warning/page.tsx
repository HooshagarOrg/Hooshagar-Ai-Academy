'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Users,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Send,
  ChevronDown,
  TrendingDown,
  Calendar,
  BookOpen,
  UserX,
  FileText,
  Bell,
  Settings,
  Download,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Building,
  GraduationCap,
  MessageSquare,
  Phone,
  School,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
type WarningType = 'academic' | 'behavioral' | 'attendance' | 'all'
type RiskLevel = 'critical' | 'medium' | 'low' | 'all'

interface WarningReason {
  type: string
  description: string
  value: string
  icon: React.ReactNode
}

interface RecommendedAction {
  id: string
  action: string
  priority: 'high' | 'medium' | 'low'
  responsible: string
}

interface AtRiskStudent {
  id: string
  name: string
  grade: number
  className: string
  school: string
  warningType: WarningType
  riskLevel: Exclude<RiskLevel, 'all'>
  reasons: WarningReason[]
  recommendedActions: RecommendedAction[]
  lastAnalysis: string
  trend: 'improving' | 'stable' | 'declining'
}

// ============================================
// داده‌های نمونه
// ============================================
const schools = [
  { value: 'all', label: 'همه مدارس' },
  { value: 'school-1', label: 'دبستان پسرانه شهید رجایی' },
  { value: 'school-2', label: 'دبستان دخترانه فاطمیه' },
  { value: 'school-3', label: 'دبستان مختلط نور' },
]

const warningTypeOptions = [
  { value: 'all', label: 'همه انواع' },
  { value: 'academic', label: 'تحصیلی' },
  { value: 'behavioral', label: 'رفتاری' },
  { value: 'attendance', label: 'حضوری' },
]

const riskLevelOptions = [
  { value: 'all', label: 'همه سطوح' },
  { value: 'critical', label: 'بحرانی' },
  { value: 'medium', label: 'متوسط' },
  { value: 'low', label: 'کم' },
]

const mockStudents: AtRiskStudent[] = [
  {
    id: '1',
    name: 'علی رضایی',
    grade: 5,
    className: 'پنجم الف',
    school: 'دبستان پسرانه شهید رجایی',
    warningType: 'academic',
    riskLevel: 'critical',
    reasons: [
      { type: 'نمرات پایین', description: 'میانگین نمرات زیر ۱۲', value: 'میانگین: ۱۰.۵', icon: <TrendingDown className="w-4 h-4" /> },
      { type: 'افت ناگهانی', description: 'کاهش ۵ نمره در ۲ ماه اخیر', value: 'از ۱۶ به ۱۱', icon: <AlertCircle className="w-4 h-4" /> },
      { type: 'تکالیف', description: 'عدم تحویل بیش از ۵۰٪ تکالیف', value: '۶۵٪ عدم تحویل', icon: <FileText className="w-4 h-4" /> },
    ],
    recommendedActions: [
      { id: '1', action: 'جلسه فوری با مشاور', priority: 'high', responsible: 'مشاور' },
      { id: '2', action: 'تماس با والدین', priority: 'high', responsible: 'مدیر' },
      { id: '3', action: 'ثبت‌نام در کلاس تقویتی', priority: 'medium', responsible: 'معلم' },
    ],
    lastAnalysis: '۱۴۰۳/۰۹/۱۵',
    trend: 'declining',
  },
  {
    id: '2',
    name: 'سارا احمدی',
    grade: 4,
    className: 'چهارم ب',
    school: 'دبستان دخترانه فاطمیه',
    warningType: 'attendance',
    riskLevel: 'critical',
    reasons: [
      { type: 'غیبت بالا', description: 'بیش از ۵ روز غیبت در ماه', value: '۸ روز غیبت', icon: <Calendar className="w-4 h-4" /> },
      { type: 'تأخیرها', description: 'تأخیر مکرر در ورود به مدرسه', value: '۱۲ بار تأخیر', icon: <Clock className="w-4 h-4" /> },
    ],
    recommendedActions: [
      { id: '1', action: 'بررسی وضعیت خانوادگی', priority: 'high', responsible: 'مشاور' },
      { id: '2', action: 'تماس با والدین', priority: 'high', responsible: 'مدیر' },
    ],
    lastAnalysis: '۱۴۰۳/۰۹/۱۵',
    trend: 'declining',
  },
  {
    id: '3',
    name: 'محمد کریمی',
    grade: 6,
    className: 'ششم الف',
    school: 'دبستان پسرانه شهید رجایی',
    warningType: 'behavioral',
    riskLevel: 'critical',
    reasons: [
      { type: 'مشکلات رفتاری', description: 'بیش از ۳ مورد ثبت شده', value: '۵ مورد', icon: <UserX className="w-4 h-4" /> },
      { type: 'درگیری', description: 'درگیری با همکلاسی‌ها', value: '۲ درگیری', icon: <AlertTriangle className="w-4 h-4" /> },
    ],
    recommendedActions: [
      { id: '1', action: 'جلسه با مشاور رفتاری', priority: 'high', responsible: 'مشاور' },
      { id: '2', action: 'جلسه والدین', priority: 'high', responsible: 'مدیر' },
      { id: '3', action: 'نظارت ویژه', priority: 'medium', responsible: 'معلم' },
    ],
    lastAnalysis: '۱۴۰۳/۰۹/۱۴',
    trend: 'stable',
  },
  {
    id: '4',
    name: 'زهرا محمدی',
    grade: 3,
    className: 'سوم الف',
    school: 'دبستان دخترانه فاطمیه',
    warningType: 'academic',
    riskLevel: 'medium',
    reasons: [
      { type: 'نمرات پایین', description: 'میانگین نمرات زیر ۱۴', value: 'میانگین: ۱۳.۵', icon: <TrendingDown className="w-4 h-4" /> },
      { type: 'ضعف در ریاضی', description: 'نیاز به تقویت', value: 'نمره: ۱۱', icon: <BookOpen className="w-4 h-4" /> },
    ],
    recommendedActions: [
      { id: '1', action: 'کلاس تقویتی ریاضی', priority: 'medium', responsible: 'معلم' },
      { id: '2', action: 'پیگیری تکالیف', priority: 'low', responsible: 'معلم' },
    ],
    lastAnalysis: '۱۴۰۳/۰۹/۱۳',
    trend: 'improving',
  },
  {
    id: '5',
    name: 'امیر حسینی',
    grade: 5,
    className: 'پنجم ب',
    school: 'دبستان مختلط نور',
    warningType: 'academic',
    riskLevel: 'critical',
    reasons: [
      { type: 'افت شدید', description: 'کاهش ۸ نمره در ۳ ماه', value: 'از ۱۸ به ۱۰', icon: <TrendingDown className="w-4 h-4" /> },
      { type: 'عدم مشارکت', description: 'عدم شرکت در فعالیت‌های کلاسی', value: '۷۰٪ عدم مشارکت', icon: <UserX className="w-4 h-4" /> },
    ],
    recommendedActions: [
      { id: '1', action: 'بررسی مشکلات شخصی', priority: 'high', responsible: 'مشاور' },
      { id: '2', action: 'جلسه با والدین', priority: 'high', responsible: 'مدیر' },
      { id: '3', action: 'تغییر روش تدریس', priority: 'medium', responsible: 'معلم' },
    ],
    lastAnalysis: '۱۴۰۳/۰۹/۱۵',
    trend: 'declining',
  },
  {
    id: '6',
    name: 'فاطمه نوری',
    grade: 2,
    className: 'دوم الف',
    school: 'دبستان دخترانه فاطمیه',
    warningType: 'attendance',
    riskLevel: 'medium',
    reasons: [
      { type: 'غیبت‌های پراکنده', description: 'غیبت در روزهای خاص', value: '۵ روز در ماه', icon: <Calendar className="w-4 h-4" /> },
    ],
    recommendedActions: [
      { id: '1', action: 'گفتگو با دانش‌آموز', priority: 'medium', responsible: 'معلم' },
      { id: '2', action: 'اطلاع‌رسانی به والدین', priority: 'low', responsible: 'مدیر' },
    ],
    lastAnalysis: '۱۴۰۳/۰۹/۱۲',
    trend: 'stable',
  },
  {
    id: '7',
    name: 'رضا صادقی',
    grade: 4,
    className: 'چهارم الف',
    school: 'دبستان پسرانه شهید رجایی',
    warningType: 'behavioral',
    riskLevel: 'medium',
    reasons: [
      { type: 'بی‌توجهی', description: 'عدم تمرکز در کلاس', value: 'گزارش معلم', icon: <AlertCircle className="w-4 h-4" /> },
      { type: 'بیش‌فعالی', description: 'نیاز به ارزیابی', value: 'مشکوک به ADHD', icon: <UserX className="w-4 h-4" /> },
    ],
    recommendedActions: [
      { id: '1', action: 'ارجاع به روانشناس', priority: 'high', responsible: 'مشاور' },
      { id: '2', action: 'هماهنگی با والدین', priority: 'medium', responsible: 'مدیر' },
    ],
    lastAnalysis: '۱۴۰۳/۰۹/۱۰',
    trend: 'stable',
  },
  {
    id: '8',
    name: 'مریم جعفری',
    grade: 6,
    className: 'ششم ب',
    school: 'دبستان مختلط نور',
    warningType: 'academic',
    riskLevel: 'low',
    reasons: [
      { type: 'ضعف در علوم', description: 'نیاز به تقویت', value: 'نمره: ۱۳', icon: <BookOpen className="w-4 h-4" /> },
    ],
    recommendedActions: [
      { id: '1', action: 'تمرین بیشتر', priority: 'low', responsible: 'معلم' },
    ],
    lastAnalysis: '۱۴۰۳/۰۹/۱۵',
    trend: 'improving',
  },
]

// ============================================
// کامپوننت Badge سطح خطر
// ============================================
interface RiskBadgeProps {
  level: Exclude<RiskLevel, 'all'>
}

function RiskBadge({ level }: RiskBadgeProps) {
  const styles = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/50',
    medium: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  }

  const labels = {
    critical: 'بحرانی',
    medium: 'متوسط',
    low: 'کم',
  }

  const icons = {
    critical: <AlertTriangle className="w-3 h-3" />,
    medium: <AlertCircle className="w-3 h-3" />,
    low: <Info className="w-3 h-3" />,
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[level]}`}>
      {icons[level]}
      {labels[level]}
    </span>
  )
}

// ============================================
// کامپوننت Badge نوع هشدار
// ============================================
interface WarningTypeBadgeProps {
  type: Exclude<WarningType, 'all'>
}

function WarningTypeBadge({ type }: WarningTypeBadgeProps) {
  const styles = {
    academic: 'bg-blue-500/20 text-blue-400',
    behavioral: 'bg-purple-500/20 text-purple-400',
    attendance: 'bg-cyan-500/20 text-cyan-400',
  }

  const labels = {
    academic: 'تحصیلی',
    behavioral: 'رفتاری',
    attendance: 'حضوری',
  }

  return (
    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

// ============================================
// کامپوننت Modal جزئیات
// ============================================
interface DetailModalProps {
  student: AtRiskStudent | null
  onClose: () => void
  onSendToCounselor: (student: AtRiskStudent) => void
}

function DetailModal({ student, onClose, onSendToCounselor }: DetailModalProps) {
  if (!student) return null

  const trendStyles = {
    improving: { text: 'در حال بهبود', color: 'text-green-400', icon: '📈' },
    stable: { text: 'ثابت', color: 'text-yellow-400', icon: '➡️' },
    declining: { text: 'رو به افت', color: 'text-red-400', icon: '📉' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">جزئیات هشدار</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{student.name}</h3>
              <p className="text-white/60">{student.className} • پایه {student.grade}</p>
              <p className="text-white/40 text-sm">{student.school}</p>
            </div>
            <div className="mr-auto">
              <RiskBadge level={student.riskLevel} />
            </div>
          </div>
        </div>

        {/* Trend */}
        <div className="px-6 py-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">روند:</span>
            <span className={`flex items-center gap-1 ${trendStyles[student.trend].color}`}>
              {trendStyles[student.trend].icon}
              {trendStyles[student.trend].text}
            </span>
          </div>
        </div>

        {/* دلایل هشدار */}
        <div className="p-6 border-b border-white/10">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            دلایل هشدار
          </h4>
          <div className="space-y-3">
            {student.reasons.map((reason, index) => (
              <div key={index} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-400">{reason.icon}</span>
                  <span className="text-white font-medium">{reason.type}</span>
                </div>
                <p className="text-white/60 text-sm mr-6">{reason.description}</p>
                <p className="text-red-400 text-sm mr-6 mt-1">{reason.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* اقدامات پیشنهادی */}
        <div className="p-6 border-b border-white/10">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            اقدامات پیشنهادی
          </h4>
          <div className="space-y-2">
            {student.recommendedActions.map((action) => {
              const priorityStyles = {
                high: 'bg-red-500/10 border-red-500/30 text-red-400',
                medium: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
                low: 'bg-green-500/10 border-green-500/30 text-green-400',
              }
              return (
                <div key={action.id} className={`flex items-center justify-between p-3 rounded-lg border ${priorityStyles[action.priority]}`}>
                  <span className="text-white">{action.action}</span>
                  <span className="text-xs">{action.responsible}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3">
          <button
            onClick={() => onSendToCounselor(student)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all font-medium"
          >
            <Send className="w-4 h-4" />
            ارسال به مشاور
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function EarlyWarningPage() {
  // State
  const [students] = useState<AtRiskStudent[]>(mockStudents)
  const [selectedSchool, setSelectedSchool] = useState('all')
  const [selectedWarningType, setSelectedWarningType] = useState<WarningType | 'all'>('all')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null)
  const [autoReport, setAutoReport] = useState(false)
  const [reportRecipients, setReportRecipients] = useState<string[]>(['counselor'])

  // آمار
  const stats = useMemo(() => ({
    critical: students.filter(s => s.riskLevel === 'critical').length,
    medium: students.filter(s => s.riskLevel === 'medium').length,
    low: students.filter(s => s.riskLevel === 'low').length,
  }), [students])

  // فیلتر دانش‌آموزان
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedSchool !== 'all' && !student.school.includes(schools.find(s => s.value === selectedSchool)?.label || '')) return false
      if (selectedWarningType !== 'all' && student.warningType !== selectedWarningType) return false
      if (selectedRiskLevel !== 'all' && student.riskLevel !== selectedRiskLevel) return false
      if (searchQuery && !student.name.includes(searchQuery)) return false
      return true
    })
  }, [students, selectedSchool, selectedWarningType, selectedRiskLevel, searchQuery])

  // اجرای تحلیل جدید
  const runAnalysis = async (): Promise<void> => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsAnalyzing(false)
    alert('تحلیل با موفقیت انجام شد. گزارش جدید آماده است.')
  }

  // ارسال به مشاور
  const sendToCounselor = (student: AtRiskStudent): void => {
    alert(`پرونده ${student.name} به مشاور ارسال شد.`)
    setSelectedStudent(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                  سیستم هشدار زودهنگام (EWS)
                </h1>
                <p className="text-white/60 mt-1">
                  شناسایی دانش‌آموزان در معرض خطر با هوش مصنوعی
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {stats.critical + stats.medium} هشدار فعال
              </span>
            </div>
          </div>
        </header>

        {/* ==================== کارت‌های آمار ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-red-400 text-sm">دانش‌آموزان پرخطر</p>
                <p className="text-white text-3xl font-bold">{stats.critical}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-orange-400 text-sm">هشدار متوسط</p>
                <p className="text-white text-3xl font-bold">{stats.medium}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-yellow-400 text-sm">نیاز به پیگیری</p>
                <p className="text-white text-3xl font-bold">{stats.low}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== فیلترها ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* جستجو */}
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="جستجوی نام دانش‌آموز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pr-12 pl-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* فیلتر مدرسه */}
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 min-w-[180px]"
            >
              {schools.map(school => (
                <option key={school.value} value={school.value} className="bg-slate-800">
                  {school.label}
                </option>
              ))}
            </select>

            {/* فیلتر نوع هشدار */}
            <select
              value={selectedWarningType}
              onChange={(e) => setSelectedWarningType(e.target.value as WarningType | 'all')}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 min-w-[140px]"
            >
              {warningTypeOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-slate-800">
                  {option.label}
                </option>
              ))}
            </select>

            {/* فیلتر سطح خطر */}
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value as RiskLevel)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 min-w-[120px]"
            >
              {riskLevelOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-slate-800">
                  {option.label}
                </option>
              ))}
            </select>

            {/* دکمه تحلیل */}
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                ${isAnalyzing
                  ? 'bg-white/10 text-white/50 cursor-wait'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600'
                }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال تحلیل...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  تحلیل جدید
                </>
              )}
            </button>
          </div>
        </div>

        {/* ==================== جدول دانش‌آموزان ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-white/60 text-sm">
                  <th className="text-right px-4 py-4 font-medium">دانش‌آموز</th>
                  <th className="text-center px-4 py-4 font-medium">کلاس</th>
                  <th className="text-center px-4 py-4 font-medium">نوع هشدار</th>
                  <th className="text-center px-4 py-4 font-medium">سطح خطر</th>
                  <th className="text-center px-4 py-4 font-medium">دلایل</th>
                  <th className="text-center px-4 py-4 font-medium">روند</th>
                  <th className="text-center px-4 py-4 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-white/50">
                      دانش‌آموزی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const trendIcons = { improving: '📈', stable: '➡️', declining: '📉' }
                    return (
                      <tr key={student.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                              ${student.riskLevel === 'critical' ? 'bg-red-500' :
                                student.riskLevel === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'}`}
                            >
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-white font-medium">{student.name}</p>
                              <p className="text-white/40 text-xs">{student.school}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-white/70">
                          {student.className}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <WarningTypeBadge type={student.warningType} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <RiskBadge level={student.riskLevel} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-white/70 text-sm">
                            {student.reasons.length} مورد
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-xl">
                          {trendIcons[student.trend]}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                              title="مشاهده جزئیات"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => sendToCounselor(student)}
                              className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                              title="ارسال به مشاور"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-white/10 text-white/50 text-sm">
            نمایش {filteredStudents.length} از {students.length} دانش‌آموز
          </div>
        </div>

        {/* ==================== تنظیمات گزارش خودکار ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-white/60" />
            تنظیمات گزارش خودکار
          </h3>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setAutoReport(!autoReport)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                  ${autoReport ? 'bg-green-500 border-green-500' : 'bg-white/10 border-white/30'}`}
              >
                {autoReport && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <span className="text-white">ارسال خودکار گزارش هر ۳۰ روز</span>
            </label>

            {/* دریافت‌کنندگان */}
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm">دریافت‌کنندگان:</span>
              <div className="flex gap-2">
                {[
                  { id: 'counselor', label: 'مشاور' },
                  { id: 'principal', label: 'مدیر' },
                  { id: 'teachers', label: 'معلمان' },
                ].map(recipient => (
                  <button
                    key={recipient.id}
                    onClick={() => {
                      setReportRecipients(prev =>
                        prev.includes(recipient.id)
                          ? prev.filter(r => r !== recipient.id)
                          : [...prev, recipient.id]
                      )
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-all
                      ${reportRecipients.includes(recipient.id)
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-white/10 text-white/50 border border-white/20'
                      }`}
                  >
                    {recipient.label}
                  </button>
                ))}
              </div>
            </div>

            {/* دکمه دانلود */}
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 rounded-xl transition-all mr-auto">
              <Download className="w-4 h-4" />
              دانلود گزارش PDF
            </button>
          </div>
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>

      {/* ==================== Modal ==================== */}
      {selectedStudent && (
        <DetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSendToCounselor={sendToCounselor}
        />
      )}
    </div>
  )
}

































