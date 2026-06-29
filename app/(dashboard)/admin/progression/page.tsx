'use client'

import { useState, useEffect } from 'react'
import {
  GraduationCap, Users, CheckCircle2, XCircle, History,
  Loader2, AlertCircle, RefreshCw,
  Search, ArrowUp, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { PageLoading } from '@/components/ui/page-states'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// ============================================
// تایپ‌ها
// ============================================
interface StudentData {
  id: string
  student_number: string
  full_name: string
  grade: number
  class_name?: string
  avg_grade: number
  eligible: boolean
}

interface ProgressionSummary {
  total: number
  eligible: number
  not_eligible: number
}

interface ProgressionResult {
  total: number
  promoted: number
  failed: number
}

// ============================================
// صفحه اصلی
// ============================================
export default function ProgressionPage() {
  const { toast: toastFn } = useToast()
  const [activeTab, setActiveTab] = useState<'manage' | 'history'>('manage')
  const [students, setStudents] = useState<StudentData[]>([])
  const [summary, setSummary] = useState<ProgressionSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [eligibleFilter, setEligibleFilter] = useState<'all' | 'eligible' | 'not_eligible'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [academicYear, setAcademicYear] = useState('1403-1404')
  const [progressionMode, setProgressionMode] = useState<'selected' | 'all_eligible' | 'all'>('all_eligible')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const [result, setResult] = useState<ProgressionResult | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [gradeFilter])

  const fetchStudents = async () => {
    setIsLoading(true)
    setSelectedIds(new Set())
    try {
      const params = new URLSearchParams({ type: 'eligible' })
      if (gradeFilter !== 'all') params.append('grade', gradeFilter)

      const res = await fetch(`/api/admin/progression?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStudents(data.students || [])
      setSummary(data.summary || null)
    } catch (e: unknown) {
      toastFn.error('خطا در دریافت اطلاعات: ' + (e instanceof Error ? e.message : 'لطفاً دوباره تلاش کنید'))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromotion = async () => {
    setIsPromoting(true)
    try {
      const res = await fetch('/api/admin/progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_ids: progressionMode === 'selected' ? [...selectedIds] : [],
          academic_year: academicYear,
          mode: progressionMode,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setResult({
        total: data.total || 0,
        promoted: data.promoted || 0,
        failed: data.failed || 0,
      })

      toastFn.success(`${data.promoted || 0} دانش‌آموز با موفقیت ارتقاء یافت`)
      fetchStudents()
    } catch (e: unknown) {
      toastFn.error('خطا در ارتقاء: ' + (e instanceof Error ? e.message : 'لطفاً دوباره تلاش کنید'))
    } finally {
      setIsPromoting(false)
      setShowConfirm(false)
    }
  }

  // فیلتر محلی
  const filtered = students.filter(s => {
    const matchSearch = s.full_name.includes(search) || s.student_number.includes(search)
    const matchEligible = eligibleFilter === 'all' ? true :
      eligibleFilter === 'eligible' ? s.eligible : !s.eligible
    return matchSearch && matchEligible
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)))
    }
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="ارتقاء خودکار دانش‌آموزان"
        description="انتقال دانش‌آموزان به پایه بالاتر با حفظ سوابق"
        icon={GraduationCap}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
      />

      {/* تب‌ها */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-0">
        {[
          { key: 'manage', label: 'مدیریت ارتقاء', icon: GraduationCap },
          { key: 'history', label: 'تاریخچه', icon: History },
        ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
                >
                  <Icon className="w-4 h-4" />
              {tab.label}
                </button>
              )
            })}
          </div>

      {activeTab === 'manage' && (
        <div className="space-y-5">
          {/* نتیجه ارتقاء */}
          {result && (
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
              <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                نتیجه ارتقاء
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'کل', value: result.total, color: 'text-gray-700' },
                  { label: 'ارتقاء یافته', value: result.promoted, color: 'text-emerald-700' },
                  { label: 'ناموفق', value: result.failed, color: 'text-red-600' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
                  </div>
                </div>
          )}

          {/* آمار کلی */}
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'کل دانش‌آموزان', value: summary.total, color: 'text-gray-700', bg: 'bg-gray-50' },
                { label: 'واجد شرایط', value: summary.eligible, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'غیرواجد', value: summary.not_eligible, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* تنظیمات ارتقاء */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              تنظیمات ارتقاء
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">سال تحصیلی</label>
                <Input
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  placeholder="مثال: 1403-1404"
                  className="mt-1"
                />
                        </div>
              <div>
                <label className="text-sm font-medium text-gray-700">حالت ارتقاء</label>
                <Select value={progressionMode} onValueChange={v => setProgressionMode(v as typeof progressionMode)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_eligible">همه واجد شرایط (میانگین ≥ ۱۰)</SelectItem>
                    <SelectItem value="selected">فقط انتخاب‌شده‌ها</SelectItem>
                    <SelectItem value="all">همه دانش‌آموزان (بدون شرط)</SelectItem>
                  </SelectContent>
                </Select>
                      </div>
              <div className="flex items-end">
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={
                    isLoading ||
                    (progressionMode === 'selected' && selectedIds.size === 0)
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <ArrowUp className="w-4 h-4" />
                  اجرای ارتقاء
                  {progressionMode === 'selected' && selectedIds.size > 0 &&
                    ` (${selectedIds.size} نفر)`
                  }
                </Button>
                    </div>
                  </div>
                </div>

          {/* فیلترها */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="جستجو..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-9"
                      />
                    </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="پایه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه پایه‌ها</SelectItem>
                {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
                  <SelectItem key={g} value={String(g)}>پایه {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              {[
                { key: 'all', label: 'همه' },
                { key: 'eligible', label: 'واجد شرایط' },
                { key: 'not_eligible', label: 'غیرواجد' },
              ].map(f => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={eligibleFilter === f.key ? 'default' : 'outline'}
                  onClick={() => setEligibleFilter(f.key as typeof eligibleFilter)}
                  className="text-xs"
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchStudents}>
              <RefreshCw className="w-4 h-4" />
            </Button>
                    </div>

          {/* جدول */}
          {isLoading ? (
            <PageLoading label="در حال بارگذاری دانش‌آموزان..." compact />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="دانش‌آموزی یافت نشد"
              description="با فیلتر انتخابی دانش‌آموزی وجود ندارد"
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* هدر جدول */}
              <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                      <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
                <span className="text-sm text-gray-500">
                  {selectedIds.size > 0 ? `${selectedIds.size} نفر انتخاب شده` : `${filtered.length} دانش‌آموز`}
                </span>
                    </div>

              <div className="divide-y divide-gray-50">
                {filtered.map(student => (
                  <div
                    key={student.id}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors',
                      selectedIds.has(student.id) && 'bg-emerald-50'
                    )}
                  >
                      <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="rounded flex-shrink-0"
                    />

                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                  </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{student.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {student.student_number} • پایه {student.grade}
                        {student.class_name && ` • ${student.class_name}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center">
                        <p className={cn(
                          'text-sm font-bold',
                          student.avg_grade >= 17 ? 'text-emerald-600' :
                          student.avg_grade >= 12 ? 'text-blue-600' :
                          student.avg_grade >= 10 ? 'text-yellow-600' : 'text-red-500'
                        )}>
                          {student.avg_grade > 0 ? student.avg_grade.toFixed(1) : '-'}
                        </p>
                        <p className="text-xs text-gray-400">میانگین</p>
                    </div>

                      <div className="flex items-center gap-1">
                        <ArrowUp className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">پایه {student.grade + 1}</span>
                    </div>

                      {student.eligible ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          واجد شرایط
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-600 text-xs gap-1">
                          <XCircle className="w-3 h-3" />
                          غیرواجد
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                  </div>
                </div>
          )}
              </div>
            )}

            {activeTab === 'history' && (
        <ProgressionHistory />
      )}

      {/* دیالوگ تایید */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              تایید ارتقاء دانش‌آموزان
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-1">
              <p>این عملیات دانش‌آموزان را به پایه بالاتر منتقل می‌کند.</p>
              <p className="font-medium text-gray-700">
                {progressionMode === 'all_eligible' && `${summary?.eligible || 0} دانش‌آموز واجد شرایط ارتقاء می‌یابند`}
                {progressionMode === 'selected' && `${selectedIds.size} دانش‌آموز انتخاب‌شده ارتقاء می‌یابند`}
                {progressionMode === 'all' && `${summary?.total || 0} دانش‌آموز (همه) ارتقاء می‌یابند`}
              </p>
              <p className="text-amber-600 text-sm">این عملیات قابل بازگشت نیست.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromotion}
              disabled={isPromoting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPromoting ? (
                <><Loader2 className="w-4 h-4 animate-spin ml-2" />در حال اجرا...</>
              ) : 'تایید و اجرا'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============================================
// کامپوننت تاریخچه
// ============================================
function ProgressionHistory() {
  const [history, setHistory] = useState<{
    id: string
    from_grade: number
    to_grade: number
    academic_year: string
    progression_type: string
    status: string
    progression_date: string
    students?: { profiles?: { full_name: string } }
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/progression?type=history')
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .finally(() => setIsLoading(false))
  }, [])

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(dateStr))

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6" dir="rtl">
        <PageLoading label="در حال بارگذاری تاریخچه..." compact />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="تاریخچه‌ای ثبت نشده"
        description="پس از اجرای ارتقاء، تاریخچه اینجا نمایش داده می‌شود"
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-50">
        {history.map(h => (
          <div key={h.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <ArrowUp className="w-4 h-4 text-emerald-600" />
                  </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                {(h.students as { profiles?: { full_name: string } } | null)?.profiles?.full_name || 'نامشخص'}
              </p>
              <p className="text-xs text-gray-500">
                پایه {h.from_grade} → پایه {h.to_grade} • {h.academic_year}
              </p>
                </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-gray-100 text-gray-600">{h.progression_type === 'normal' ? 'عادی' : h.progression_type}</Badge>
              <Badge className={cn(
                'text-xs',
                h.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              )}>
                {h.status === 'completed' ? 'موفق' : 'ناموفق'}
              </Badge>
              <span className="text-xs text-gray-400">{formatDate(h.progression_date)}</span>
              </div>
          </div>
        ))}
      </div>
    </div>
  )
}
