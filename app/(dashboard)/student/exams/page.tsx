'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ClipboardCheck, Clock, Calendar, ChevronLeft, Search,
  CheckCircle2, XCircle, Lock, PlayCircle, Trophy, Filter,
  BookOpen, BarChart3, Loader2, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================
interface Exam {
  id: string
  title: string
  subject: string
  grade: number
  exam_date: string
  duration_minutes: number
  status: 'draft' | 'published' | 'active' | 'closed'
  total_questions: number
  session?: {
    status: 'not_started' | 'in_progress' | 'submitted' | 'graded'
    percentage?: number
    passed?: boolean
    total_score?: number
    max_score?: number
  }
}

const STATUS_CONFIG = {
  not_started: { label: 'شروع نشده', color: 'bg-blue-100 text-blue-700', icon: PlayCircle },
  in_progress: { label: 'در حال انجام', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  submitted: { label: 'ارسال شده', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
  graded: { label: 'نمره‌دهی شد', color: 'bg-green-100 text-green-700', icon: Trophy },
}

const EXAM_STATUS_CONFIG = {
  draft: { label: 'پیش‌نویس', color: 'bg-gray-100 text-gray-600' },
  published: { label: 'منتشر شده', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'فعال', color: 'bg-green-100 text-green-700' },
  closed: { label: 'بسته شده', color: 'bg-red-100 text-red-700' },
}

const SUBJECT_COLORS: Record<string, string> = {
  'ریاضی': 'text-blue-600 bg-blue-50',
  'فارسی': 'text-green-600 bg-green-50',
  'علوم': 'text-purple-600 bg-purple-50',
  'اجتماعی': 'text-amber-600 bg-amber-50',
  'عربی': 'text-teal-600 bg-teal-50',
  'دینی': 'text-emerald-600 bg-emerald-50',
  'فیزیک': 'text-indigo-600 bg-indigo-50',
  'شیمی': 'text-orange-600 bg-orange-50',
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'done' | 'upcoming'>('all')

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/exams?status=published,active,closed')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExams(data.exams || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت آزمون‌ها')
    } finally {
      setIsLoading(false)
    }
  }

  // فیلتر و جستجو
  const filtered = exams.filter(exam => {
    const matchSearch = exam.title.includes(search) || exam.subject.includes(search)
    if (!matchSearch) return false
    if (filter === 'active') return exam.status === 'active' || exam.status === 'published'
    if (filter === 'done') return exam.session?.status === 'graded' || exam.session?.status === 'submitted'
    if (filter === 'upcoming') return exam.status === 'published' && !exam.session
    return true
  })

  // آمار کلی
  const stats = {
    total: exams.length,
    done: exams.filter(e => e.session?.status === 'graded').length,
    active: exams.filter(e => e.status === 'active').length,
    avg: exams.filter(e => e.session?.percentage !== undefined).length > 0
      ? Math.round(
          exams.reduce((s, e) => s + (e.session?.percentage || 0), 0) /
          exams.filter(e => e.session?.percentage !== undefined).length
        )
      : 0,
  }

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))

  const canTakeExam = (exam: Exam) =>
    (exam.status === 'active' || exam.status === 'published') &&
    (!exam.session || exam.session.status === 'not_started')

  const isExpired = (exam: Exam) => exam.status === 'closed'

  return (
    <div dir="rtl">
      <PageHeader
        title="آزمون‌های من"
        description="آزمون‌های تعیین‌شده توسط معلمان"
        icon={ClipboardCheck}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />

      {/* آمار سریع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'کل آزمون‌ها', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: 'فعال', value: stats.active, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'تکمیل شده', value: stats.done, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'میانگین نمره', value: `${stats.avg}%`, color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* نوار جستجو و فیلتر */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="جستجو در آزمون‌ها..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'همه' },
            { key: 'active', label: 'فعال' },
            { key: 'upcoming', label: 'پیش‌رو' },
            { key: 'done', label: 'انجام‌شده' },
          ].map(f => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? 'default' : 'outline'}
              onClick={() => setFilter(f.key as typeof filter)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* محتوا */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchExams}>تلاش مجدد</Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="آزمونی یافت نشد"
          description="هنوز آزمونی برای شما ثبت نشده یا فیلتر نتیجه‌ای ندارد"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(exam => {
            const sessionStatus = exam.session?.status || 'not_started'
            const statusCfg = STATUS_CONFIG[sessionStatus]
            const examStatusCfg = EXAM_STATUS_CONFIG[exam.status]
            const subjectColor = SUBJECT_COLORS[exam.subject] || 'text-gray-600 bg-gray-50'
            const StatusIcon = statusCfg.icon

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* آیکون درس */}
                  <div className={`w-12 h-12 rounded-xl ${subjectColor} flex items-center justify-center flex-shrink-0`}>
                    <BookOpen className="w-6 h-6" />
                  </div>

                  {/* اطلاعات */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base">{exam.title}</h3>
                      <Badge className={cn('text-xs', examStatusCfg.color)}>
                        {examStatusCfg.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {exam.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {exam.duration_minutes} دقیقه
                      </span>
                      <span className="flex items-center gap-1">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        {exam.total_questions} سوال
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(exam.exam_date)}
                      </span>
                    </div>

                    {/* نتیجه آزمون */}
                    {exam.session?.percentage !== undefined && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 max-w-xs h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              exam.session.percentage >= 70 ? 'bg-green-500' :
                              exam.session.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${exam.session.percentage}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-sm font-bold',
                          exam.session.percentage >= 70 ? 'text-green-600' :
                          exam.session.percentage >= 50 ? 'text-yellow-600' : 'text-red-500'
                        )}>
                          {Math.round(exam.session.percentage)}%
                        </span>
                        {exam.session.passed !== undefined && (
                          exam.session.passed
                            ? <Badge className="bg-green-100 text-green-700 text-xs">قبول</Badge>
                            : <Badge className="bg-red-100 text-red-600 text-xs">مردود</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* دکمه‌های عملیات */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={cn('text-xs gap-1', statusCfg.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusCfg.label}
                    </Badge>

                    {canTakeExam(exam) && (
                      <Link href={`/student/exams/${exam.id}/take`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1">
                          <PlayCircle className="w-4 h-4" />
                          شروع
                        </Button>
                      </Link>
                    )}
                    {exam.session?.status === 'in_progress' && (
                      <Link href={`/student/exams/${exam.id}/take`}>
                        <Button size="sm" variant="outline" className="gap-1 border-yellow-300 text-yellow-700">
                          <Clock className="w-4 h-4" />
                          ادامه
                        </Button>
                      </Link>
                    )}
                    {(exam.session?.status === 'graded' || exam.session?.status === 'submitted') && (
                      <Link href={`/student/exams/${exam.id}/result`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <BarChart3 className="w-4 h-4" />
                          نتیجه
                        </Button>
                      </Link>
                    )}
                    {isExpired(exam) && !exam.session && (
                      <Button size="sm" variant="outline" disabled className="gap-1 text-gray-400">
                        <Lock className="w-4 h-4" />
                        منقضی
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
