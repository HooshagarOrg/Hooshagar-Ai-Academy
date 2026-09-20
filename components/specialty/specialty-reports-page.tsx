'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Student = { id: string; name: string }
type Report = {
  id: string
  title: string
  rating: number
  notes: string | null
  created_at: string
  students?: { full_name?: string } | { full_name?: string }[]
}

function studentName(r: Report): string {
  const s = r.students
  const row = Array.isArray(s) ? s[0] : s
  return row?.full_name || '—'
}

export function SpecialtyReportsPage({
  kind,
  kicker,
  title,
}: {
  kind: 'art' | 'sports'
  kicker: string
  title: string
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [studentId, setStudentId] = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const [rating, setRating] = useState('3')
  const [notes, setNotes] = useState('')

  const load = async () => {
    try {
      const [reportsRes, studentsRes] = await Promise.all([
        fetch(`/api/specialty/reports?kind=${kind}`),
        fetch('/api/teacher/class-students'),
      ])
      const reportsJson = await reportsRes.json()
      const studentsJson = await studentsRes.json()
      if (!reportsRes.ok) {
        setError(reportsJson.error || 'دریافت گزارش‌ها ناموفق بود')
        return
      }
      setReports(reportsJson.reports || [])
      if (studentsRes.ok) setStudents(studentsJson.students || [])
      setError('')
    } catch {
      setError('خطای اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [kind])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/specialty/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          student_id: studentId,
          title: reportTitle,
          rating: Number(rating),
          notes: notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت گزارش ناموفق بود')
        return
      }
      toast.success('گزارش ثبت شد')
      setReportTitle('')
      setNotes('')
      await load()
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker={kicker} title={title}>
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>دانش‌آموز</Label>
          <select
            className="w-full rounded-md border bg-transparent px-3 py-2"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          >
            <option value="">انتخاب کنید</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>عنوان</Label>
          <Input
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            required
            minLength={3}
          />
        </div>
        <div className="space-y-2">
          <Label>امتیاز (۰ تا ۵)</Label>
          <Input
            type="number"
            min={0}
            max={5}
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>یادداشت</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <Button type="submit" disabled={saving || !studentId}>
          {saving ? 'در حال ذخیره...' : 'ثبت گزارش'}
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={FileText} title="فهرست در دسترس نیست" description={error} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="گزارشی ثبت نشده"
          description="اولین گزارش را از فرم بالا ثبت کنید."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <GlassCard key={r.id} className="p-4">
              <p className="font-semibold">
                {r.title} — {studentName(r)}
              </p>
              <p className="text-sm text-[var(--lux-text-muted)]">امتیاز {r.rating}</p>
              {r.notes ? <p className="text-sm mt-2 leading-loose">{r.notes}</p> : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
