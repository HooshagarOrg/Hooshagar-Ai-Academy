'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Shield, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type BehaviorReport = {
  id: string
  studentName: string
  date: string
  positiveCount: number
  negativeCount: number
  description: string
}

type StudentOption = { id: string; name: string }

const POSITIVE_OPTIONS = [
  'تعامل مثبت با همکلاسی‌ها',
  'رفتار و بیان مؤدبانه',
  'رعایت قوانین مدرسه',
  'مشارکت فعال در کلاس',
  'کمک به دیگران',
]

const NEGATIVE_OPTIONS = [
  'بی‌ادبی و بی‌احترامی',
  'تأخیر غیرموجه',
  'نقض قوانین مدرسه',
  'اذیت همکلاسی‌ها',
  'عدم مشارکت در کلاس',
]

export default function DisciplineReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reports, setReports] = useState<BehaviorReport[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [studentId, setStudentId] = useState('')
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [positive, setPositive] = useState<string[]>([])
  const [negative, setNegative] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [reportsRes, studentsRes] = await Promise.all([
        fetch('/api/teacher/behavior'),
        fetch('/api/students?limit=100'),
      ])
      const reportsJson = await reportsRes.json()
      const studentsJson = await studentsRes.json()

      if (!reportsRes.ok) {
        setError(reportsJson.error || 'دریافت گزارش‌ها ناموفق بود')
      } else {
        setReports(reportsJson.reports || [])
        setError('')
      }

      const rows = (studentsJson.students || []) as Array<{
        id: string
        full_name?: string | null
        profiles?: { full_name?: string } | { full_name?: string }[]
      }>
      setStudents(
        rows.map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
          return {
            id: row.id,
            name: row.full_name || profile?.full_name || 'دانش‌آموز',
          }
        })
      )
    } catch {
      setError('خطای اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggle = (
    list: string[],
    setList: (next: string[]) => void,
    value: string,
    checked: boolean
  ) => {
    setList(checked ? [...list, value] : list.filter((item) => item !== value))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) {
      toast.error('دانش‌آموز را انتخاب کنید')
      return
    }
    if (positive.length === 0 && negative.length === 0) {
      toast.error('حداقل یک مورد رفتاری انتخاب کنید')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/teacher/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          report_date: reportDate,
          positive_behaviors: positive,
          negative_behaviors: negative,
          notes: notes.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت گزارش ناموفق بود')
        return
      }
      toast.success('گزارش رفتاری ثبت شد')
      setStudentId('')
      setNotes('')
      setPositive([])
      setNegative([])
      setLoading(true)
      await load()
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="معاون انضباطی" title="گزارش‌های انضباطی">
      <form onSubmit={onSubmit} className="mb-8 space-y-4 max-w-2xl">
        <GlassCard className="p-5 space-y-4">
          <h2 className="font-semibold text-lg">ثبت گزارش جدید</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>دانش‌آموز</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دانش‌آموز" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاریخ</Label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>رفتار مثبت</Label>
              {POSITIVE_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={positive.includes(option)}
                    onCheckedChange={(checked) =>
                      toggle(positive, setPositive, option, checked === true)
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <Label>نیازمند بهبود</Label>
              {NEGATIVE_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={negative.includes(option)}
                    onCheckedChange={(checked) =>
                      toggle(negative, setNegative, option, checked === true)
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>یادداشت</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'در حال ثبت...' : 'ثبت گزارش'}
          </Button>
        </GlassCard>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Shield} title="گزارش‌ها در دسترس نیست" description={error} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="گزارش رفتاری ثبت نشده"
          description="از فرم بالا گزارش بنویسید یا معلمان از صفحهٔ رفتار ثبت کنند."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <GlassCard key={report.id} className="p-4">
              <p className="font-semibold">{report.studentName}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">
                {report.date} · مثبت {report.positiveCount} · نیازمند بهبود {report.negativeCount}
              </p>
              {report.description ? (
                <p className="text-sm mt-2 leading-loose">{report.description}</p>
              ) : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
