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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Student = { id: string; name: string }
type Report = {
  id: string
  title: string
  rating: number
  notes: string | null
  students?: { full_name?: string } | { full_name?: string }[] | null
}

function studentName(report: Report): string {
  const s = report.students
  const row = Array.isArray(s) ? s[0] : s
  return row?.full_name || 'دانش‌آموز'
}

export default function ArtReportsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [studentId, setStudentId] = useState('')
  const [title, setTitle] = useState('')
  const [rating, setRating] = useState('3')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [reportsRes, studentsRes] = await Promise.all([
          fetch('/api/specialty/reports?kind=art'),
          fetch('/api/students?limit=100'),
        ])
        const reportsJson = await reportsRes.json()
        const studentsJson = await studentsRes.json()
        if (!reportsRes.ok) {
          setError(reportsJson.error || 'دریافت گزارش‌ها ناموفق بود')
        } else {
          setReports(reportsJson.reports || [])
        }
        const rows = (studentsJson.students || []) as Array<{
          id: string
          full_name?: string | null
          profiles?: { full_name?: string } | { full_name?: string }[]
        }>
        setStudents(
          rows.map((row) => {
            const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
            return { id: row.id, name: row.full_name || profile?.full_name || 'دانش‌آموز' }
          })
        )
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/specialty/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'art',
          student_id: studentId,
          title,
          rating: Number.parseInt(rating, 10),
          notes: notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت گزارش ناموفق بود')
        return
      }
      toast.success('گزارش هنری ثبت شد')
      setTitle('')
      setNotes('')
      setReports((c) => [json.report, ...c])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="معلم هنر" title="گزارشات هنری">
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>دانش‌آموز</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>عنوان</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
        </div>
        <div className="space-y-2">
          <Label>امتیاز (۰–۵)</Label>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>یادداشت</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <Button type="submit" disabled={saving || !studentId}>
          {saving ? 'در حال ثبت...' : 'ثبت گزارش'}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={FileText} title="گزارش در دسترس نیست" description={error} />
      ) : reports.length === 0 ? (
        <EmptyState icon={FileText} title="گزارشی ثبت نشده" description="اولین گزارش را از فرم بالا بسازید." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <GlassCard key={r.id} className="p-4">
              <p className="font-semibold">
                {studentName(r)} · {r.title}
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
