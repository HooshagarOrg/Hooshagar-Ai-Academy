'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Search,
  
  Plus,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar,
  
  
  CheckCircle2,
  X,
} from 'lucide-react'
import { Card, CardContent} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import {
  ISSUE_CATEGORIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type CounselingRecord,
  type PriorityLevel,
  type CounselingStatus,
  type IssueCategory,
} from '@/lib/types/counseling.types'

// ==========================================
// Mock Data
// ==========================================
const mockRecords: (CounselingRecord & { sessions_count: number })[] = [
  {
    id: '1',
    student_id: 's1',
    school_id: 'sch1',
    counselor_id: 'c1',
    opened_date: '1403/09/01',
    closed_date: null,
    status: 'active',
    issue_categories: ['رفتاری', 'خانوادگی'],
    priority_level: 'urgent',
    summary: 'مشکلات رفتاری شدید در کلاس و ارتباط با همکلاسی‌ها',
    initial_assessment: 'نیاز به مداخله فوری',
    goals: [],
    is_referred: false,
    referred_to: null,
    referral_reason: null,
    referral_date: null,
    referral_outcome: null,
    created_at: '2024-01-15',
    updated_at: '2024-01-20',
    student: { id: 's1', full_name: 'علی رضایی', grade: 6, class_name: '۶ الف' },
    sessions_count: 8,
    last_session_date: '2024-01-18',
  },
  {
    id: '2',
    student_id: 's2',
    school_id: 'sch1',
    counselor_id: 'c1',
    opened_date: '1403/08/15',
    closed_date: null,
    status: 'active',
    issue_categories: ['تحصیلی', 'اضطراب'],
    priority_level: 'high',
    summary: 'افت تحصیلی و اضطراب امتحان',
    initial_assessment: 'نیاز به کار روی مهارت‌های مطالعه',
    goals: [],
    is_referred: false,
    referred_to: null,
    referral_reason: null,
    referral_date: null,
    referral_outcome: null,
    created_at: '2024-01-10',
    updated_at: '2024-01-17',
    student: { id: 's2', full_name: 'سارا احمدی', grade: 5, class_name: '۵ ب' },
    sessions_count: 5,
    last_session_date: '2024-01-15',
  },
  {
    id: '3',
    student_id: 's3',
    school_id: 'sch1',
    counselor_id: 'c1',
    opened_date: '1403/07/20',
    closed_date: null,
    status: 'active',
    issue_categories: ['اجتماعی'],
    priority_level: 'medium',
    summary: 'مشکل در برقراری ارتباط با دوستان',
    initial_assessment: 'کمبود مهارت‌های اجتماعی',
    goals: [],
    is_referred: false,
    referred_to: null,
    referral_reason: null,
    referral_date: null,
    referral_outcome: null,
    created_at: '2024-01-05',
    updated_at: '2024-01-12',
    student: { id: 's3', full_name: 'محمد کریمی', grade: 4, class_name: '۴ الف' },
    sessions_count: 3,
    last_session_date: '2024-01-10',
  },
  {
    id: '4',
    student_id: 's4',
    school_id: 'sch1',
    counselor_id: 'c1',
    opened_date: '1403/06/10',
    closed_date: '1403/08/25',
    status: 'closed',
    issue_categories: ['تحصیلی'],
    priority_level: 'low',
    summary: 'برنامه‌ریزی تحصیلی',
    initial_assessment: 'نیاز به بهبود برنامه‌ریزی',
    goals: [],
    is_referred: false,
    referred_to: null,
    referral_reason: null,
    referral_date: null,
    referral_outcome: null,
    created_at: '2023-12-01',
    updated_at: '2024-01-08',
    student: { id: 's4', full_name: 'فاطمه نوری', grade: 3, class_name: '۳ ب' },
    sessions_count: 6,
    last_session_date: '2024-01-05',
  },
  {
    id: '5',
    student_id: 's5',
    school_id: 'sch1',
    counselor_id: 'c1',
    opened_date: '1403/09/05',
    closed_date: null,
    status: 'referred',
    issue_categories: ['افسردگی', 'خانوادگی'],
    priority_level: 'urgent',
    summary: 'علائم افسردگی شدید',
    initial_assessment: 'نیاز به ارجاع به روانپزشک',
    goals: [],
    is_referred: true,
    referred_to: 'دکتر محمدی - روانپزشک کودک',
    referral_reason: 'علائم افسردگی شدید',
    referral_date: '1403/09/10',
    referral_outcome: 'در حال درمان',
    created_at: '2024-01-18',
    updated_at: '2024-01-20',
    student: { id: 's5', full_name: 'امیر صادقی', grade: 6, class_name: '۶ ب' },
    sessions_count: 4,
    last_session_date: '2024-01-19',
  },
]

// ==========================================
// Helper Functions
// ==========================================
const getPriorityBadge = (priority: PriorityLevel): { color: string; icon: React.ReactNode } => {
  const badges = {
    low: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: null },
    medium: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: null },
    high: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: null },
    urgent: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <AlertTriangle className="w-3 h-3" /> },
  }
  return badges[priority]
}

const getStatusBadge = (status: CounselingStatus): string => {
  const colors = {
    active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    referred: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }
  return colors[status]
}

const formatRelativeDate = (dateStr: string | null): string => {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'امروز'
  if (days === 1) return 'دیروز'
  if (days < 7) return `${days} روز پیش`
  if (days < 30) return `${Math.floor(days / 7)} هفته پیش`
  return `${Math.floor(days / 30)} ماه پیش`
}

// ==========================================
// Main Component
// ==========================================
export default function CounselingRecordsPage() {
  const [records, setRecords] = useState<(CounselingRecord & { sessions_count: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [setShowNewRecordDialog] = useState(false)
  
  const itemsPerPage = 10

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (priorityFilter !== 'all') params.set('priority', priorityFilter)
        if (categoryFilter !== 'all') params.set('category', categoryFilter)
        if (search) params.set('search', search)

        const res = await fetch(`/api/counseling/records?${params}`)
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        setRecords(json.records || [])
      } catch {
        setRecords(mockRecords)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecords()
  }, [statusFilter, priorityFilter, categoryFilter, search])

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = !search || 
      record.student?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      record.summary?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || record.priority_level === priorityFilter
    const matchesCategory = categoryFilter === 'all' || record.issue_categories.includes(categoryFilter as IssueCategory)
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setCategoryFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-16 w-full glass-panel-quiet" />
        <Skeleton className="h-14 w-full glass-panel-quiet" />
        <Skeleton className="h-96 w-full glass-panel-quiet" />
      </div>
    )
  }

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-brand-pink" />
          پرونده‌های مشاوره
        </span>
      }
      description="مدیریت و پیگیری پرونده‌های مشاوره دانش‌آموزان"
      actions={
        <Link href="/counselor/records/new">
          <Button className="bg-brand-pink hover:opacity-90 text-space gap-2">
            <Plus className="w-4 h-4" />
            پرونده جدید
          </Button>
        </Link>
      }
      animatedSections={false}
    >
        <GlassCard>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="جستجوی نام دانش‌آموز..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="closed">بسته شده</SelectItem>
                  <SelectItem value="referred">ارجاع شده</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="اولویت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه اولویت‌ها</SelectItem>
                  <SelectItem value="urgent">فوری</SelectItem>
                  <SelectItem value="high">بالا</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">پایین</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دسته‌ها</SelectItem>
                  {ISSUE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-white hover:bg-white/10 gap-1"
                >
                  <X className="w-4 h-4" />
                  پاک کردن
                </Button>
              )}
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-right">#</TableHead>
                    <TableHead className="text-muted-foreground text-right">دانش‌آموز</TableHead>
                    <TableHead className="text-muted-foreground text-right">کلاس</TableHead>
                    <TableHead className="text-muted-foreground text-right">دسته‌بندی</TableHead>
                    <TableHead className="text-muted-foreground text-right">اولویت</TableHead>
                    <TableHead className="text-muted-foreground text-right">وضعیت</TableHead>
                    <TableHead className="text-muted-foreground text-right">جلسات</TableHead>
                    <TableHead className="text-muted-foreground text-right">آخرین فعالیت</TableHead>
                    <TableHead className="text-muted-foreground text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record, idx) => {
                    const priorityBadge = getPriorityBadge(record.priority_level)
                    return (
                      <TableRow 
                        key={record.id} 
                        className="border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <TableCell className="text-muted-foreground">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                              {record.student?.full_name.charAt(0) || '؟'}
                            </div>
                            <span className="font-medium">
                              {record.student?.full_name || 'نامشخص'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          پایه {record.student?.grade}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap max-w-xs">
                            {record.issue_categories.slice(0, 2).map((cat, i) => (
                              <span key={i} className="bg-white/10 text-muted-foreground text-xs px-2 py-0.5 rounded">
                                {cat}
                              </span>
                            ))}
                            {record.issue_categories.length > 2 && (
                              <span className="bg-white/10 text-muted-foreground text-xs px-2 py-0.5 rounded">
                                +{record.issue_categories.length - 2}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${priorityBadge.color}`}>
                            {priorityBadge.icon}
                            {PRIORITY_LABELS[record.priority_level]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(record.status)}`}>
                            {STATUS_LABELS[record.status]}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.sessions_count} جلسه
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatRelativeDate(record.last_session_date || record.updated_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/counselor/records/${record.id}`}>
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/10">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/counselor/records/${record.id}/edit`}>
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/10">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Empty State */}
            {filteredRecords.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-muted-foreground">پرونده‌ای یافت نشد</p>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    onClick={clearFilters}
                    className="text-purple-400 mt-2"
                  >
                    پاک کردن فیلترها
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/10">
                <p className="text-muted-foreground text-sm">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, filteredRecords.length)} از {filteredRecords.length} پرونده
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-muted-foreground text-sm px-3">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* ==================== Stats Summary ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">کل پرونده‌ها</p>
                <p className="text-xl font-bold tabular-nums">{records.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">فعال</p>
                <p className="text-xl font-bold tabular-nums">
                  {records.filter(r => r.status === 'active').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">فوری</p>
                <p className="text-xl font-bold tabular-nums">
                  {records.filter(r => r.priority_level === 'urgent').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">ارجاع شده</p>
                <p className="text-xl font-bold tabular-nums">
                  {records.filter(r => r.status === 'referred').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

    </DashboardPage>
  )
}







