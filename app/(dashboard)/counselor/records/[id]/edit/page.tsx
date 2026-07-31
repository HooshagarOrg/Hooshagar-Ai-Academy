'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Save,
  Target,
  User,
  X,
} from 'lucide-react'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { PageErrorState, PageSkeletonCards } from '@/components/ui/page-states'
import {
  ISSUE_CATEGORIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type CounselingGoal,
  type CounselingStatus,
  type IssueCategory,
  type PriorityLevel,
} from '@/lib/types/counseling.types'

type EditableRecord = {
  id: string
  summary: string
  initial_assessment: string
  priority_level: PriorityLevel
  status: CounselingStatus
  issue_categories: string[]
  goals: CounselingGoal[]
  student?: { full_name: string; grade?: number } | null
}

export default function EditCounselingRecordPage() {
  const params = useParams()
  const router = useRouter()
  const recordId = typeof params.id === 'string' ? params.id : ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentGrade, setStudentGrade] = useState<number | undefined>()
  const [selectedCategories, setSelectedCategories] = useState<IssueCategory[]>([])
  const [priority, setPriority] = useState<PriorityLevel>('medium')
  const [status, setStatus] = useState<CounselingStatus>('active')
  const [summary, setSummary] = useState('')
  const [initialAssessment, setInitialAssessment] = useState('')
  const [goals, setGoals] = useState<CounselingGoal[]>([])
  const [newGoal, setNewGoal] = useState('')

  const loadRecord = async () => {
    if (!recordId) {
      setError('شناسه پرونده نامعتبر است')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/counseling/records/${recordId}`)
      const data = await response.json() as { record?: EditableRecord; error?: string }
      if (!response.ok || !data.record) {
        setError(data.error || 'پرونده یافت نشد')
        return
      }
      const record = data.record
      setStudentName(record.student?.full_name || 'دانش‌آموز')
      setStudentGrade(record.student?.grade)
      setSelectedCategories(
        (record.issue_categories || []).filter((c): c is IssueCategory =>
          (ISSUE_CATEGORIES as readonly string[]).includes(c)
        )
      )
      setPriority(record.priority_level || 'medium')
      setStatus(record.status || 'active')
      setSummary(record.summary || '')
      setInitialAssessment(record.initial_assessment || '')
      setGoals(Array.isArray(record.goals) ? record.goals : [])
    } catch {
      setError('خطا در دریافت پرونده')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecord()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId])

  const toggleCategory = (cat: IssueCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const addGoal = () => {
    if (!newGoal.trim()) return
    setGoals((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        goal: newGoal.trim(),
        target_date: '',
        status: 'pending',
        progress: 0,
      },
    ])
    setNewGoal('')
  }

  const removeGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  const updateGoalDate = (id: string, date: string) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, target_date: date } : g)))
  }

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      setError('حداقل یک دسته‌بندی انتخاب کنید')
      return
    }

    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/counseling/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_categories: selectedCategories,
          priority_level: priority,
          status,
          summary,
          initial_assessment: initialAssessment,
          goals: goals
            .filter((g) => g.goal?.trim())
            .map((g) => ({
              id: g.id,
              goal: g.goal,
              target_date: g.target_date || '',
              status: g.status || 'pending',
              progress: g.progress ?? 0,
              notes: g.notes,
            })),
        }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) {
        setError(data.error || 'خطا در ذخیره تغییرات')
        return
      }
      router.push(`/counselor/records/${recordId}`)
    } catch {
      setError('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardPage title="ویرایش پرونده" animatedSections={false}>
        <PageSkeletonCards count={3} />
      </DashboardPage>
    )
  }

  if (error && !studentName) {
    return (
      <DashboardPage title="ویرایش پرونده" animatedSections={false}>
        <PageErrorState message={error} onRetry={() => void loadRecord()} />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      className="max-w-3xl mx-auto"
      title="ویرایش پرونده مشاوره"
      description={studentName}
      meta={
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/counselor" className="text-muted-foreground hover:text-foreground">
            داشبورد
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Link href="/counselor/records" className="text-muted-foreground hover:text-foreground">
            پرونده‌ها
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Link href={`/counselor/records/${recordId}`} className="text-muted-foreground hover:text-foreground">
            جزئیات
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span>ویرایش</span>
        </div>
      }
      animatedSections={false}
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              دانش‌آموز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl bg-purple-500/20 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold text-white">
                {studentName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-white">{studentName}</p>
                {studentGrade != null ? (
                  <p className="text-sm text-white/60">پایه {studentGrade}</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              دسته‌بندی مسئله
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ISSUE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    selectedCategories.includes(cat)
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle>اولویت و وضعیت</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>اولویت</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as PriorityLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as PriorityLevel[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>وضعیت</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CounselingStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as CounselingStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              خلاصه و ارزیابی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">خلاصه پرونده</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="bg-white/5 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment">ارزیابی اولیه</Label>
              <Textarea
                id="assessment"
                value={initialAssessment}
                onChange={(e) => setInitialAssessment(e.target.value)}
                rows={4}
                className="bg-white/5 border-white/20"
              />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              اهداف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="هدف جدید..."
                className="bg-white/5 border-white/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addGoal()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addGoal} className="gap-1">
                <Plus className="w-4 h-4" />
                افزودن
              </Button>
            </div>
            <div className="space-y-2">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">{goal.goal}</p>
                    <Input
                      type="date"
                      value={goal.target_date || ''}
                      onChange={(e) => updateGoalDate(goal.id, e.target.value)}
                      className="mt-2 h-8 bg-white/5 border-white/20 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGoal(goal.id)}
                    className="text-white/50 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </GlassCard>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="flex-1 gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            ذخیره تغییرات
          </Button>
          <Link href={`/counselor/records/${recordId}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full" disabled={saving}>
              انصراف
            </Button>
          </Link>
        </div>
      </div>
    </DashboardPage>
  )
}
