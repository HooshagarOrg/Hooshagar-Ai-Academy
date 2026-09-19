'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Award, Loader2 } from 'lucide-react'
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

type Teacher = { id: string; full_name: string | null }
type Evaluation = {
  id: string
  teacher_id: string
  period_label: string
  score: number
  notes: string | null
  created_at: string
}

export default function EvaluationVpPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [teacherId, setTeacherId] = useState('')
  const [period, setPeriod] = useState('')
  const [score, setScore] = useState('3')
  const [notes, setNotes] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/evaluation/teachers')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'دریافت ارزیابی‌ها ناموفق بود')
        return
      }
      setTeachers(json.teachers || [])
      setEvaluations(json.evaluations || [])
      setError('')
    } catch {
      setError('خطای اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/evaluation/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          period_label: period,
          score: Number.parseInt(score, 10),
          notes: notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت ارزیابی ناموفق بود')
        return
      }
      toast.success('ارزیابی ثبت شد')
      setPeriod('')
      setNotes('')
      setEvaluations((c) => [json.evaluation, ...c])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const nameOf = (id: string) => teachers.find((t) => t.id === id)?.full_name || 'معلم'

  return (
    <DashboardPage
      kicker="معاون ارزشیابی"
      title="ارزیابی معلمان"
      actions={
        <Button asChild variant="outline">
          <Link href="/evaluation-vp/stats">آمار</Link>
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>معلم</Label>
          <Select value={teacherId} onValueChange={setTeacherId}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب معلم" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.full_name || t.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>دوره</Label>
          <Input value={period} onChange={(e) => setPeriod(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>نمره (۱ تا ۵)</Label>
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
          <Label>یادداشت</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <Button type="submit" disabled={saving || !teacherId}>
          {saving ? 'در حال ثبت...' : 'ثبت ارزیابی'}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Award} title="ارزیابی در دسترس نیست" description={error} />
      ) : evaluations.length === 0 ? (
        <EmptyState icon={Award} title="ارزیابی ثبت نشده" description="اولین ارزیابی را از فرم بالا بسازید." />
      ) : (
        <div className="space-y-3">
          {evaluations.map((item) => (
            <GlassCard key={item.id} className="p-4">
              <p className="font-semibold">
                {nameOf(item.teacher_id)} · نمره {item.score}
              </p>
              <p className="text-sm text-[var(--lux-text-muted)]">{item.period_label}</p>
              {item.notes ? <p className="text-sm mt-2 leading-loose">{item.notes}</p> : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
