'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Search, Eye, Edit, Trash2, MoreVertical, ClipboardList,
  Clock, Calendar, Users, CheckCircle, XCircle, BarChart3,
  BookOpen, Loader2, AlertCircle, Send, Lock, Upload,
  ChevronDown, Filter, PlayCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PageErrorState, PageLoading } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

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
  total_submissions?: number
  avg_score?: number
  created_at: string
}

const STATUS_CONFIG = {
  draft: { label: 'پیش‌نویس', color: 'bg-white/10 text-muted-foreground', icon: Edit },
  published: { label: 'منتشر شده', color: 'bg-brand-cyan/15 text-brand-cyan', icon: Send },
  active: { label: 'در حال برگزاری', color: 'bg-brand-green/15 text-brand-green', icon: PlayCircle },
  closed: { label: 'پایان یافته', color: 'bg-destructive/15 text-destructive', icon: Lock },
}

// ============================================
// صفحه اصلی
// ============================================
export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/exams?limit=50')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExams(data.exams || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت آزمون‌ها')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (examId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setExams(prev => prev.map(e => e.id === examId ? { ...e, status: newStatus as Exam['status'] } : e))
      toast.success('وضعیت آزمون به‌روزرسانی شد')
    } catch {
      toast.error('خطا در تغییر وضعیت')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/exams/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setExams(prev => prev.filter(e => e.id !== deleteTarget.id))
      toast.success('آزمون حذف شد')
    } catch {
      toast.error('خطا در حذف آزمون')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filtered = exams.filter(exam => {
    const matchSearch = exam.title.includes(search) || exam.subject.includes(search)
    const matchStatus = statusFilter === 'all' || exam.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: exams.length,
    active: exams.filter(e => e.status === 'active' || e.status === 'published').length,
    closed: exams.filter(e => e.status === 'closed').length,
    submissions: exams.reduce((s, e) => s + (e.total_submissions || 0), 0),
  }

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr))

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-[var(--lux-primary)]" />
          آزمون‌های من
        </span>
      }
      description="مدیریت و برگزاری آزمون‌های آنلاین"
      actions={
        <div className="flex gap-2">
          <Link href="/teacher/exams/upload">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              آپلود PDF
            </Button>
          </Link>
          <Link href="/teacher/exams/create">
            <Button className="bg-brand-purple hover:opacity-90 text-space gap-2">
              <Plus className="w-4 h-4" />
              آزمون جدید
            </Button>
          </Link>
        </div>
      }
    >
      <DashboardSectionBlock>
      {/* آمار */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="کل آزمون‌ها" value={stats.total} accentClass="text-brand-cyan" />
        <StatCard label="فعال / منتشر" value={stats.active} accentClass="text-brand-green" />
        <StatCard label="پایان یافته" value={stats.closed} accentClass="text-brand-purple" />
        <StatCard label="کل شرکت‌کنندگان" value={stats.submissions} accentClass="text-brand-yellow" />
      </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      {/* جستجو و فیلتر */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            { key: 'draft', label: 'پیش‌نویس' },
            { key: 'published', label: 'منتشر' },
            { key: 'active', label: 'فعال' },
            { key: 'closed', label: 'بسته' },
          ].map(f => (
            <Button
              key={f.key}
              size="sm"
              variant={statusFilter === f.key ? 'default' : 'outline'}
              onClick={() => setStatusFilter(f.key)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      {/* لیست آزمون‌ها */}
      {isLoading ? (
        <PageLoading label="در حال بارگذاری آزمون‌ها..." compact />
      ) : error ? (
        <PageErrorState message={error} onRetry={fetchExams} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="آزمونی وجود ندارد"
          description="اولین آزمون خود را ایجاد کنید"
          action={
            <Link href="/teacher/exams/create">
              <Button className="bg-brand-purple hover:opacity-90 text-space gap-2">
                <Plus className="w-4 h-4" />
                ایجاد آزمون
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(exam => {
            const statusCfg = STATUS_CONFIG[exam.status]
            const StatusIcon = statusCfg.icon

            return (
              <GlassCard key={exam.id} hover className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-purple/15 border border-brand-purple/20 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-6 h-6 text-brand-purple" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-base">{exam.title}</h3>
                      <Badge className={cn('text-xs gap-1 border-0', statusCfg.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {exam.subject} - پایه {exam.grade}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {exam.duration_minutes} دقیقه
                      </span>
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-3.5 h-3.5" />
                        {exam.total_questions} سوال
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(exam.exam_date)}
                      </span>
                      {(exam.total_submissions ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {exam.total_submissions} شرکت‌کننده
                        </span>
                      )}
                      {exam.avg_score !== undefined && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3.5 h-3.5" />
                          میانگین: {Math.round(exam.avg_score)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* دکمه‌ها */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* تغییر وضعیت */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-1 text-xs">
                          <Filter className="w-3 h-3" />
                          وضعیت
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {exam.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(exam.id, 'published')}>
                            <Send className="w-4 h-4 ml-2 text-blue-500" />
                            انتشار آزمون
                          </DropdownMenuItem>
                        )}
                        {exam.status === 'published' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(exam.id, 'active')}>
                            <PlayCircle className="w-4 h-4 ml-2 text-green-500" />
                            فعال‌سازی
                          </DropdownMenuItem>
                        )}
                        {(exam.status === 'published' || exam.status === 'active') && (
                          <DropdownMenuItem onClick={() => handleStatusChange(exam.id, 'closed')}>
                            <Lock className="w-4 h-4 ml-2 text-red-500" />
                            بستن آزمون
                          </DropdownMenuItem>
                        )}
                        {exam.status !== 'draft' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(exam.id, 'draft')}>
                            <Edit className="w-4 h-4 ml-2 text-muted-foreground" />
                            برگشت به پیش‌نویس
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* سایر عملیات */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/teacher/exams/${exam.id}/results`} className="flex items-center">
                            <BarChart3 className="w-4 h-4 ml-2 text-purple-500" />
                            نتایج دانش‌آموزان
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/teacher/exams/${exam.id}/preview`} className="flex items-center">
                            <Eye className="w-4 h-4 ml-2 text-blue-500" />
                            پیش‌نمایش
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteTarget(exam)}
                          disabled={exam.status === 'active'}
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف آزمون
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
      </DashboardSectionBlock>

      {/* دیالوگ حذف */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف آزمون</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف آزمون &quot;{deleteTarget?.title}&quot; مطمئن هستید؟ این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPage>
  )
}
