'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  FileText,
  User,
  Calendar,
  Clock,
  MessageSquare,
  Brain,
  Eye,
  Target,
  ChevronRight,
  Edit,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Star,
  Phone,
  Users,
  Activity,
  Download,
  Printer,
  Mail,
  ExternalLink,
  TrendingUp,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  SESSION_TYPE_LABELS,
  TEST_TYPE_LABELS,
  CONTACT_TYPE_LABELS,
  COOPERATION_LABELS,
  SEVERITY_LABELS,
  FREQUENCY_LABELS,
  ISSUE_CATEGORIES,
  SESSION_TOPICS,
  INTERVENTIONS,
  OBSERVATION_SETTINGS,
  type CounselingRecord,
  type CounselingSession,
  type PsychologicalTest,
  type BehavioralObservation,
  type ParentContact,
  type CounselingGoal,
  type PriorityLevel,
  type SessionType,
  type TestType,
} from '@/lib/types/counseling.types'

// ==========================================
// Mock Data
// ==========================================
const mockRecord: CounselingRecord & {
  sessions: CounselingSession[]
  tests: PsychologicalTest[]
  observations: BehavioralObservation[]
  parent_contacts: ParentContact[]
} = {
  id: '1',
  student_id: 's1',
  school_id: 'sch1',
  counselor_id: 'c1',
  opened_date: '1403/09/01',
  closed_date: null,
  status: 'active',
  issue_categories: ['رفتاری', 'خانوادگی', 'اضطراب'],
  priority_level: 'high',
  summary: 'مشکلات رفتاری در کلاس، درگیری با همکلاسی‌ها، عدم تمرکز در درس. همچنین گزارش‌هایی از مشکلات خانوادگی دریافت شده است.',
  initial_assessment: 'دانش‌آموز نیاز به حمایت روان‌شناختی دارد. مشکلات رفتاری احتمالاً ریشه در مسائل خانوادگی دارد. پیشنهاد می‌شود جلسات منظم مشاوره فردی و همچنین جلسه خانوادگی برگزار شود.',
  goals: [
    { id: '1', goal: 'بهبود رفتار در کلاس', target_date: '1403/12/29', status: 'in_progress', progress: 60 },
    { id: '2', goal: 'کاهش درگیری با همکلاسی‌ها', target_date: '1403/11/30', status: 'in_progress', progress: 40 },
    { id: '3', goal: 'افزایش تمرکز', target_date: '1403/12/15', status: 'pending', progress: 20 },
  ],
  is_referred: false,
  referred_to: null,
  referral_reason: null,
  referral_date: null,
  referral_outcome: null,
  created_at: '2024-01-15',
  updated_at: '2024-01-20',
  student: {
    id: 's1',
    full_name: 'علی رضایی',
    grade: 6,
    class_name: '۶ الف',
  },
  counselor: {
    id: 'c1',
    full_name: 'خانم رحیمی',
  },
  sessions: [
    {
      id: 'ses1',
      counseling_record_id: '1',
      student_id: 's1',
      counselor_id: 'c1',
      session_number: 8,
      session_date: '2024-01-18T10:00:00',
      duration_minutes: 45,
      session_type: 'individual',
      attendees: null,
      topics_discussed: ['بررسی وضعیت تحصیلی', 'مشکلات رفتاری'],
      session_notes: 'در این جلسه درباره رفتار دانش‌آموز در کلاس صحبت شد. دانش‌آموز اعلام کرد که در خانه مشکلاتی وجود دارد که باعث بی‌حوصلگی او می‌شود.',
      student_mood: 'نگران',
      student_cooperation: 'good',
      interventions_used: ['گفتگوی انگیزشی', 'تکنیک آرام‌سازی'],
      homework: 'تمرین تنفس عمیق هر روز صبح',
      homework_completed: null,
      progress_rating: 4,
      progress_notes: 'پیشرفت خوبی در مقایسه با جلسه قبل داشته است.',
      next_session_planned: true,
      next_session_date: '2024-01-25',
      next_session_goals: 'بررسی انجام تکالیف و پیگیری وضعیت خانوادگی',
      created_at: '2024-01-18',
    },
    {
      id: 'ses2',
      counseling_record_id: '1',
      student_id: 's1',
      counselor_id: 'c1',
      session_number: 7,
      session_date: '2024-01-11T10:00:00',
      duration_minutes: 60,
      session_type: 'family',
      attendees: [
        { name: 'پدر', relation: 'پدر', attended: true },
        { name: 'مادر', relation: 'مادر', attended: true },
      ],
      topics_discussed: ['مشکلات خانوادگی', 'مشارکت والدین'],
      session_notes: 'جلسه خانوادگی با حضور هر دو والدین برگزار شد. والدین از مشکلات خود صحبت کردند و توافقاتی برای بهبود فضای خانه انجام شد.',
      student_mood: 'مضطرب',
      student_cooperation: 'fair',
      interventions_used: ['حل مسئله'],
      homework: 'برقراری زمان با کیفیت خانوادگی',
      homework_completed: true,
      progress_rating: 3,
      progress_notes: 'والدین همکاری خوبی داشتند.',
      next_session_planned: true,
      next_session_date: '2024-01-18',
      next_session_goals: 'پیگیری توافقات',
      created_at: '2024-01-11',
    },
  ],
  tests: [
    {
      id: 't1',
      student_id: 's1',
      counseling_record_id: '1',
      test_name: 'آزمون هوش وکسلر کودکان',
      test_type: 'intelligence',
      test_date: '2024-01-10',
      administered_by: 'c1',
      raw_scores: { verbal: 45, performance: 48 },
      standard_scores: { verbal: 105, performance: 110, total: 108 },
      percentile_ranks: { total: 70 },
      iq_score: 108,
      interpretation: 'هوش کلی در محدوده متوسط بالا قرار دارد. توانایی‌های غیرکلامی قوی‌تر از توانایی‌های کلامی است.',
      strengths: 'حافظه دیداری، استدلال فضایی',
      weaknesses: 'حافظه کوتاه‌مدت کلامی',
      recommendations: 'استفاده از روش‌های بصری در یادگیری',
      report_url: null,
      created_at: '2024-01-10',
    },
    {
      id: 't2',
      student_id: 's1',
      counseling_record_id: '1',
      test_name: 'پرسشنامه اضطراب کودکان',
      test_type: 'anxiety',
      test_date: '2024-01-05',
      administered_by: 'c1',
      raw_scores: { total: 28 },
      standard_scores: null,
      percentile_ranks: { total: 85 },
      iq_score: null,
      interpretation: 'سطح اضطراب بالاتر از حد متوسط است. نیاز به مداخله و آموزش تکنیک‌های مدیریت اضطراب وجود دارد.',
      strengths: null,
      weaknesses: 'مدیریت استرس',
      recommendations: 'آموزش تکنیک‌های آرام‌سازی، تمرینات تنفسی',
      report_url: null,
      created_at: '2024-01-05',
    },
  ],
  observations: [
    {
      id: 'o1',
      student_id: 's1',
      counseling_record_id: '1',
      observation_date: '2024-01-17',
      observation_time: '10:30',
      duration_minutes: 30,
      setting: 'کلاس',
      observer_id: 'c1',
      observer_role: 'مشاور',
      behaviors_observed: ['بی‌قراری', 'عدم تمرکز', 'صحبت با همکلاسی'],
      behavior_frequency: 'frequent',
      description: 'دانش‌آموز در طول درس ریاضی بی‌قرار بود و مدام با همکلاسی‌ها صحبت می‌کرد. توجه به درس کم بود.',
      severity: 'moderate',
      antecedents: 'شروع درس ریاضی',
      consequences: 'تذکر معلم',
      environmental_factors: 'نزدیک پنجره، صدای بیرون',
      student_response: 'موقتاً آرام شد',
      intervention_applied: 'تغییر صندلی',
      intervention_effectiveness: 'مؤثر بود',
      created_at: '2024-01-17',
    },
    {
      id: 'o2',
      student_id: 's1',
      counseling_record_id: '1',
      observation_date: '2024-01-15',
      observation_time: '11:00',
      duration_minutes: 20,
      setting: 'حیاط',
      observer_id: 'c1',
      observer_role: 'مشاور',
      behaviors_observed: ['درگیری کلامی'],
      behavior_frequency: 'occasional',
      description: 'در زنگ تفریح با یکی از همکلاسی‌ها درگیری کلامی داشت. علت: اختلاف بر سر توپ فوتبال.',
      severity: 'mild',
      antecedents: 'اختلاف بر سر توپ',
      consequences: 'مداخله ناظم',
      environmental_factors: 'شلوغی حیاط',
      student_response: 'عصبانی ولی عقب‌نشینی کرد',
      intervention_applied: 'گفتگو',
      intervention_effectiveness: 'نسبتاً مؤثر',
      created_at: '2024-01-15',
    },
  ],
  parent_contacts: [
    {
      id: 'pc1',
      student_id: 's1',
      counseling_record_id: '1',
      counselor_id: 'c1',
      contact_date: '2024-01-19T14:00:00',
      contact_type: 'phone',
      parent_name: 'آقای رضایی',
      parent_relation: 'پدر',
      purpose: 'پیگیری وضعیت خانوادگی',
      discussion_summary: 'با پدر دانش‌آموز تماس گرفته شد. ایشان از بهبود نسبی رفتار فرزند در خانه خبر دادند. همچنین اعلام کردند که سعی می‌کنند زمان بیشتری با فرزند بگذرانند.',
      parent_concerns: 'نگرانی در مورد عملکرد تحصیلی',
      agreements_made: 'برقراری تماس هفتگی برای پیگیری',
      action_items: [
        { id: '1', item: 'پیگیری تکالیف', responsible: 'والدین', deadline: '2024-01-25' },
      ],
      follow_up_needed: true,
      follow_up_date: '2024-01-26',
      follow_up_note: 'بررسی پیشرفت',
      created_at: '2024-01-19',
    },
  ],
}

// ==========================================
// Helper Components
// ==========================================
const ProgressBar = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`h-2 bg-white/10 rounded-full overflow-hidden ${className}`}>
    <div
      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
      style={{ width: `${value}%` }}
    />
  </div>
)

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(star => (
      <Star
        key={star}
        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
      />
    ))}
  </div>
)

const getPriorityColor = (priority: PriorityLevel): string => {
  const colors = {
    low: 'text-green-400 bg-green-500/20 border-green-500/30',
    medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    high: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    urgent: 'text-red-400 bg-red-500/20 border-red-500/30',
  }
  return colors[priority]
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fa-IR')
}

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('fa-IR')} - ${date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
}

// ==========================================
// Main Component
// ==========================================
export default function CounselingRecordDetailPage() {
  const params = useParams()
  const recordId = params.id as string
  const [record, setRecord] = useState<typeof mockRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [showSessionDialog, setShowSessionDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [showObservationDialog, setShowObservationDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)

  useEffect(() => {
    // TODO: Replace with API call
    // fetch(`/api/counseling/records/${recordId}`)
    setTimeout(() => {
      setRecord(mockRecord)
      setIsLoading(false)
    }, 500)
  }, [recordId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full bg-white/10" />
          <Skeleton className="h-12 w-full bg-white/10" />
          <Skeleton className="h-96 w-full bg-white/10" />
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">پرونده یافت نشد</p>
          <Link href="/counselor/records">
            <Button variant="link" className="text-purple-400 mt-4">
              بازگشت به لیست پرونده‌ها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ==================== Breadcrumb ==================== */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/counselor/dashboard" className="text-white/50 hover:text-white">داشبورد</Link>
          <ChevronRight className="w-4 h-4 text-white/30" />
          <Link href="/counselor/records" className="text-white/50 hover:text-white">پرونده‌ها</Link>
          <ChevronRight className="w-4 h-4 text-white/30" />
          <span className="text-white">{record.student?.full_name}</span>
        </div>

        {/* ==================== Header Card ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                  {record.student?.full_name.charAt(0) || '؟'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{record.student?.full_name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-white/60 text-sm">پایه {record.student?.grade}</span>
                    <span className="text-white/40">•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${getPriorityColor(record.priority_level)}`}>
                      {PRIORITY_LABELS[record.priority_level]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      record.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      record.status === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {STATUS_LABELS[record.status]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                  <Edit className="w-4 h-4" />
                  ویرایش
                </Button>
                {record.status === 'active' && (
                  <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 gap-2">
                    <Lock className="w-4 h-4" />
                    بستن پرونده
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">تاریخ باز شدن</p>
                  <p className="text-white text-sm">{record.opened_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">تعداد جلسات</p>
                  <p className="text-white text-sm">{record.sessions.length} جلسه</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">آزمون‌ها</p>
                  <p className="text-white text-sm">{record.tests.length} آزمون</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2 rounded-lg">
                  <Eye className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">مشاهدات</p>
                  <p className="text-white text-sm">{record.observations.length} مورد</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== Tabs ==================== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 w-full flex flex-wrap gap-1">
            <TabsTrigger value="info" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-white/60 flex-1">
              اطلاعات پایه
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-white/60 flex-1">
              جلسات
            </TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-white/60 flex-1">
              آزمون‌ها
            </TabsTrigger>
            <TabsTrigger value="observations" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-white/60 flex-1">
              مشاهدات
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-white/60 flex-1">
              تماس‌ها
            </TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-white/60 flex-1">
              گزارش
            </TabsTrigger>
          </TabsList>

          {/* ========== Tab 1: Info ========== */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Issue Categories & Summary */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    دسته‌بندی و خلاصه
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-white/50 text-sm mb-2">دسته‌بندی مسائل</p>
                    <div className="flex flex-wrap gap-2">
                      {record.issue_categories.map((cat, idx) => (
                        <span key={idx} className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm mb-2">خلاصه وضعیت</p>
                    <p className="text-white/80 leading-relaxed">{record.summary}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm mb-2">ارزیابی اولیه</p>
                    <p className="text-white/80 leading-relaxed">{record.initial_assessment}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Goals */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-400" />
                      اهداف مشاوره
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white gap-1">
                      <Plus className="w-4 h-4" />
                      افزودن
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {record.goals?.map((goal) => (
                    <div key={goal.id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white font-medium">{goal.goal}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          goal.status === 'achieved' ? 'bg-green-500/20 text-green-400' :
                          goal.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          goal.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {goal.status === 'achieved' ? 'تکمیل شده' :
                           goal.status === 'in_progress' ? 'در حال انجام' :
                           goal.status === 'cancelled' ? 'لغو شده' : 'در انتظار'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>هدف: {goal.target_date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={goal.progress} className="flex-1" />
                        <span className="text-white/60 text-sm">{goal.progress}%</span>
                      </div>
                    </div>
                  ))}
                  {(!record.goals || record.goals.length === 0) && (
                    <p className="text-center text-white/40 py-4">هدفی تعریف نشده است</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Referral Info */}
            {record.is_referred && (
              <Card className="bg-purple-500/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-purple-400" />
                    اطلاعات ارجاع
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/50 text-sm">ارجاع به</p>
                    <p className="text-white">{record.referred_to}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">تاریخ ارجاع</p>
                    <p className="text-white">{record.referral_date}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">دلیل ارجاع</p>
                    <p className="text-white">{record.referral_reason}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">نتیجه</p>
                    <p className="text-white">{record.referral_outcome || '—'}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ========== Tab 2: Sessions ========== */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">تاریخچه جلسات</h2>
              <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    ثبت جلسه جدید
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">ثبت جلسه جدید</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/70">تاریخ و زمان</Label>
                        <Input type="datetime-local" className="bg-white/5 border-white/20 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-white/70">مدت (دقیقه)</Label>
                        <Input type="number" defaultValue={45} className="bg-white/5 border-white/20 text-white mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/70">نوع جلسه</Label>
                      <Select>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SESSION_TYPE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/70">یادداشت‌های جلسه</Label>
                      <Textarea className="bg-white/5 border-white/20 text-white mt-1 min-h-32" placeholder="خلاصه جلسه..." />
                    </div>
                    <div>
                      <Label className="text-white/70">ارزیابی پیشرفت (۱-۵)</Label>
                      <Select>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n} ستاره</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                      ذخیره جلسه
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Sessions Timeline */}
            <div className="space-y-4">
              {record.sessions.map((session) => (
                <Card key={session.id} className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold">
                          {session.session_number}
                        </div>
                        <div>
                          <p className="text-white font-medium">جلسه {session.session_number}</p>
                          <div className="flex items-center gap-2 text-white/50 text-xs">
                            <span>{formatDateTime(session.session_date)}</span>
                            <span>•</span>
                            <span>{session.duration_minutes} دقیقه</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">
                          {SESSION_TYPE_LABELS[session.session_type as SessionType]}
                        </span>
                        <StarRating rating={session.progress_rating || 0} />
                      </div>
                    </div>

                    <p className="text-white/80 mb-4 leading-relaxed">{session.session_notes}</p>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-white/50 text-xs mb-1">موضوعات</p>
                        <div className="flex flex-wrap gap-1">
                          {session.topics_discussed.map((topic, idx) => (
                            <span key={idx} className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                      {session.interventions_used && (
                        <div>
                          <p className="text-white/50 text-xs mb-1">مداخلات</p>
                          <div className="flex flex-wrap gap-1">
                            {session.interventions_used.map((int, idx) => (
                              <span key={idx} className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded">
                                {int}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {session.homework && (
                      <div className="bg-white/5 rounded-lg p-3 mb-4">
                        <p className="text-white/50 text-xs mb-1">تکلیف</p>
                        <p className="text-white/80 text-sm">{session.homework}</p>
                        {session.homework_completed !== null && (
                          <span className={`inline-flex items-center gap-1 mt-2 text-xs ${
                            session.homework_completed ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {session.homework_completed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {session.homework_completed ? 'انجام شده' : 'در انتظار'}
                          </span>
                        )}
                      </div>
                    )}

                    {session.next_session_planned && session.next_session_date && (
                      <div className="flex items-center gap-2 text-white/50 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>جلسه بعدی: {formatDate(session.next_session_date)}</span>
                        {session.next_session_goals && (
                          <>
                            <span>•</span>
                            <span>{session.next_session_goals}</span>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ========== Tab 3: Tests ========== */}
          <TabsContent value="tests" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">آزمون‌های روان‌شناختی</h2>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                ثبت آزمون جدید
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {record.tests.map((test) => (
                <Card key={test.id} className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{test.test_name}</CardTitle>
                        <p className="text-white/50 text-sm mt-1">
                          {TEST_TYPE_LABELS[test.test_type as TestType]} • {formatDate(test.test_date)}
                        </p>
                      </div>
                      {test.iq_score && (
                        <div className="bg-blue-500/20 px-3 py-1 rounded-lg">
                          <p className="text-blue-400 text-xs">IQ</p>
                          <p className="text-white text-xl font-bold">{test.iq_score}</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-white/50 text-sm mb-1">تفسیر</p>
                      <p className="text-white/80 text-sm leading-relaxed">{test.interpretation}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {test.strengths && (
                        <div>
                          <p className="text-green-400 text-xs mb-1">نقاط قوت</p>
                          <p className="text-white/70 text-sm">{test.strengths}</p>
                        </div>
                      )}
                      {test.weaknesses && (
                        <div>
                          <p className="text-orange-400 text-xs mb-1">نقاط ضعف</p>
                          <p className="text-white/70 text-sm">{test.weaknesses}</p>
                        </div>
                      )}
                    </div>
                    {test.recommendations && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/50 text-xs mb-1">توصیه‌ها</p>
                        <p className="text-white/80 text-sm">{test.recommendations}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {record.tests.length === 0 && (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">آزمونی ثبت نشده است</p>
              </div>
            )}
          </TabsContent>

          {/* ========== Tab 4: Observations ========== */}
          <TabsContent value="observations" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">مشاهدات رفتاری</h2>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                ثبت مشاهده جدید
              </Button>
            </div>

            <div className="space-y-4">
              {record.observations.map((obs) => (
                <Card key={obs.id} className={`bg-white/5 backdrop-blur-xl border-r-4 ${
                  obs.severity === 'severe' ? 'border-red-500' :
                  obs.severity === 'moderate' ? 'border-orange-500' :
                  'border-yellow-500'
                } border-white/10`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-500/20 p-2 rounded-lg">
                          <Eye className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{obs.setting}</p>
                          <p className="text-white/50 text-xs">
                            {formatDate(obs.observation_date)}
                            {obs.observation_time && ` - ${obs.observation_time}`}
                            {obs.duration_minutes && ` (${obs.duration_minutes} دقیقه)`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {obs.severity && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            obs.severity === 'severe' ? 'bg-red-500/20 text-red-400' :
                            obs.severity === 'moderate' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {SEVERITY_LABELS[obs.severity]}
                          </span>
                        )}
                        {obs.behavior_frequency && (
                          <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded text-xs">
                            {FREQUENCY_LABELS[obs.behavior_frequency]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {obs.behaviors_observed.map((beh, idx) => (
                        <span key={idx} className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded">
                          {beh}
                        </span>
                      ))}
                    </div>

                    <p className="text-white/80 mb-4">{obs.description}</p>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {obs.antecedents && (
                        <div>
                          <p className="text-white/50 text-xs">پیش‌آیند</p>
                          <p className="text-white/70">{obs.antecedents}</p>
                        </div>
                      )}
                      {obs.consequences && (
                        <div>
                          <p className="text-white/50 text-xs">پیامد</p>
                          <p className="text-white/70">{obs.consequences}</p>
                        </div>
                      )}
                      {obs.intervention_applied && (
                        <div>
                          <p className="text-white/50 text-xs">مداخله</p>
                          <p className="text-white/70">{obs.intervention_applied}</p>
                        </div>
                      )}
                      {obs.intervention_effectiveness && (
                        <div>
                          <p className="text-white/50 text-xs">اثربخشی</p>
                          <p className="text-white/70">{obs.intervention_effectiveness}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {record.observations.length === 0 && (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">مشاهده‌ای ثبت نشده است</p>
              </div>
            )}
          </TabsContent>

          {/* ========== Tab 5: Parent Contacts ========== */}
          <TabsContent value="contacts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">تماس با والدین</h2>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                ثبت تماس جدید
              </Button>
            </div>

            <div className="space-y-4">
              {record.parent_contacts.map((contact) => (
                <Card key={contact.id} className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                          <Phone className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {contact.parent_name}
                            {contact.parent_relation && ` (${contact.parent_relation})`}
                          </p>
                          <p className="text-white/50 text-xs">{formatDateTime(contact.contact_date)}</p>
                        </div>
                      </div>
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">
                        {CONTACT_TYPE_LABELS[contact.contact_type]}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-white/50 text-xs mb-1">هدف تماس</p>
                        <p className="text-white/80 text-sm">{contact.purpose}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-xs mb-1">خلاصه گفتگو</p>
                        <p className="text-white/80 text-sm leading-relaxed">{contact.discussion_summary}</p>
                      </div>
                      {contact.parent_concerns && (
                        <div>
                          <p className="text-white/50 text-xs mb-1">نگرانی‌های والدین</p>
                          <p className="text-white/80 text-sm">{contact.parent_concerns}</p>
                        </div>
                      )}
                      {contact.agreements_made && (
                        <div className="bg-green-500/10 rounded-lg p-3">
                          <p className="text-green-400 text-xs mb-1">توافقات</p>
                          <p className="text-white/80 text-sm">{contact.agreements_made}</p>
                        </div>
                      )}
                    </div>

                    {contact.follow_up_needed && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-white/50 text-sm">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span>پیگیری: {formatDate(contact.follow_up_date || '')}</span>
                        {contact.follow_up_note && (
                          <>
                            <span>•</span>
                            <span>{contact.follow_up_note}</span>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {record.parent_contacts.length === 0 && (
              <div className="text-center py-12">
                <Phone className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">تماسی ثبت نشده است</p>
              </div>
            )}
          </TabsContent>

          {/* ========== Tab 6: Report ========== */}
          <TabsContent value="report" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">گزارش جامع</h2>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                  <Download className="w-4 h-4" />
                  دانلود PDF
                </Button>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                  <Printer className="w-4 h-4" />
                  چاپ
                </Button>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                  <Mail className="w-4 h-4" />
                  ارسال به والدین
                </Button>
              </div>
            </div>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-8 space-y-8">
                {/* Student Info */}
                <div className="text-center border-b border-white/10 pb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">گزارش مشاوره</h3>
                  <p className="text-white/60">دانش‌آموز: {record.student?.full_name} - پایه {record.student?.grade}</p>
                  <p className="text-white/40 text-sm">تاریخ گزارش: {new Date().toLocaleDateString('fa-IR')}</p>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    خلاصه پرونده
                  </h4>
                  <p className="text-white/80 leading-relaxed">{record.summary}</p>
                </div>

                {/* Goals Progress */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    پیشرفت نسبت به اهداف
                  </h4>
                  <div className="space-y-4">
                    {record.goals?.map((goal) => (
                      <div key={goal.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/80">{goal.goal}</span>
                          <span className="text-white/60">{goal.progress}%</span>
                        </div>
                        <ProgressBar value={goal.progress} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sessions Summary */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    خلاصه جلسات
                  </h4>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-white text-2xl font-bold">{record.sessions.length}</p>
                        <p className="text-white/50 text-sm">کل جلسات</p>
                      </div>
                      <div>
                        <p className="text-white text-2xl font-bold">
                          {Math.round(record.sessions.reduce((acc, s) => acc + (s.progress_rating || 0), 0) / record.sessions.length * 10) / 10 || 0}
                        </p>
                        <p className="text-white/50 text-sm">میانگین پیشرفت</p>
                      </div>
                      <div>
                        <p className="text-white text-2xl font-bold">
                          {record.sessions.reduce((acc, s) => acc + s.duration_minutes, 0)}
                        </p>
                        <p className="text-white/50 text-sm">دقیقه</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                {record.tests.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-400" />
                      نتایج آزمون‌ها
                    </h4>
                    <div className="space-y-3">
                      {record.tests.map((test) => (
                        <div key={test.id} className="bg-white/5 rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-white font-medium">{test.test_name}</span>
                            {test.iq_score && <span className="text-blue-400">IQ: {test.iq_score}</span>}
                          </div>
                          <p className="text-white/70 text-sm">{test.interpretation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    توصیه‌ها و برنامه آینده
                  </h4>
                  <ul className="text-white/80 space-y-2 list-disc list-inside">
                    <li>ادامه جلسات مشاوره فردی به صورت هفتگی</li>
                    <li>برگزاری جلسه خانوادگی ماهانه</li>
                    <li>آموزش تکنیک‌های مدیریت استرس به دانش‌آموز</li>
                    <li>هماهنگی با معلم کلاس برای پیگیری رفتار</li>
                    {record.tests.some(t => t.recommendations) && 
                      record.tests.filter(t => t.recommendations).map(t => (
                        <li key={t.id}>{t.recommendations}</li>
                      ))
                    }
                  </ul>
                </div>

                {/* Signature */}
                <div className="text-left pt-6 border-t border-white/10">
                  <p className="text-white/60 text-sm">مشاور: {record.counselor?.full_name}</p>
                  <p className="text-white/40 text-xs">امضا و مهر</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}







