'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Target, Loader2 } from 'lucide-react'
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
type Score = {
  id: string
  domain: string
  score: number
  notes: string | null
  assessed_at: string
  students?: { full_name?: string } | { full_name?: string }[] | null
}

const DOMAINS = ['زبان', 'ریاضی', 'شناختی', 'مهارت اجتماعی']

function nameOf(row: Score): string {
  const s = row.students
  const one = Array.isArray(s) ? s[0] : s
  return one?.full_name || 'دانش‌آموز'
}

export default function AcademicFoundationPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [studentId, setStudentId] = useState('')
  const [domain, setDomain] = useState(DOMAINS[0])
  const [score, setScore] = useState('3')
  const [notes, setNotes] = useState('')
  const [assessedAt, setAssessedAt] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const load = async () => {
      try {
        const [scoresRes, studentsRes] = await Promise.all([
          fetch('/api/teacher/foundation'),
          fetch('/api/teacher/class-students'),
        ])
        const scoresJson = await scoresRes.json()
        const studentsJson = await studentsRes.json()
        if (!scoresRes.ok) {
          setError(scoresJson.error || 'دریافت ارزیابی ناموفق بود')
        } else {
          setScores(scoresJson.scores || [])
        }
        setStudents(
          (studentsJson.students || []).map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          }))
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
      const res = await fetch('/api/teacher/foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          domain,
          score: Number.parseInt(score, 10),
          notes: notes || null,
          assessed_at: assessedAt,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت ارزیابی ناموفق بود')
        return
      }
      toast.success('ارزیابی مهارت پایه ثبت شد')
      setNotes('')
      setScores((c) => [json.score, ...c])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="معلم" title="ارزیابی مهارت‌های پایه">
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
          <Label>حوزه</Label>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>نمره (۱–۵)</Label>
            <Select value={score} onValueChange={setScore}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>تاریخ</Label>
            <Input type="date" value={assessedAt} onChange={(e) => setAssessedAt(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>یادداشت</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <Button type="submit" disabled={saving || !studentId}>
          {saving ? 'در حال ثبت...' : 'ثبت ارزیابی'}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Target} title="ارزیابی در دسترس نیست" description={error} />
      ) : scores.length === 0 ? (
        <EmptyState
          icon={Target}
          title="ارزیابی ثبت نشده"
          description="برای دورهٔ اول/دوم ابتدایی مهارت پایه را از فرم بالا ثبت کنید."
        />
      ) : (
        <div className="space-y-3">
          {scores.map((row) => (
            <GlassCard key={row.id} className="p-4">
              <p className="font-semibold">
                {nameOf(row)} · {row.domain} · نمره {row.score}
              </p>
              <p className="text-sm text-[var(--lux-text-muted)]">{row.assessed_at}</p>
              {row.notes ? <p className="text-sm mt-2 leading-loose">{row.notes}</p> : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
