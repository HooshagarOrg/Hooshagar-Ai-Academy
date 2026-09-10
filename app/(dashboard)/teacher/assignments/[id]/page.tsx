'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageSkeletonTable } from '@/components/ui/page-states'
import { useToast } from '@/hooks/use-toast'
import type { AssignmentSubmissionRow, ClassAssignmentRow } from '@/lib/class-files'
import { ArrowRight, Download, Loader2 } from 'lucide-react'

type SubRow = AssignmentSubmissionRow & { student_name?: string }

const STATUS_LABEL: Record<string, string> = {
  submitted: 'تحویل‌شده',
  late: 'دیر',
  graded: 'نمره‌داده‌شده',
}

export default function TeacherAssignmentDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignment, setAssignment] = useState<ClassAssignmentRow | null>(null)
  const [submissions, setSubmissions] = useState<SubRow[]>([])
  const [scoreById, setScoreById] = useState<Record<string, string>>({})
  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/class-assignments/${id}/submissions`)
      const data = (await res.json()) as {
        assignment?: ClassAssignmentRow
        submissions?: SubRow[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'دریافت ناموفق بود')
      setAssignment(data.assignment || null)
      const rows = data.submissions || []
      setSubmissions(rows)
      setScoreById(
        Object.fromEntries(rows.map((s) => [s.id, s.score != null ? String(s.score) : '']))
      )
      setFeedbackById(Object.fromEntries(rows.map((s) => [s.id, s.feedback || ''])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const onDownload = async (submissionId: string) => {
    try {
      const res = await fetch(`/api/class-assignments/submissions/${submissionId}`)
      const data = (await res.json()) as { signedUrl?: string; error?: string }
      if (!res.ok || !data.signedUrl) throw new Error(data.error || 'دانلود ناموفق بود')
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'دانلود ناموفق بود',
        variant: 'destructive',
      })
    }
  }

  const onGrade = async (submissionId: string) => {
    const score = Number.parseFloat(scoreById[submissionId] || '')
    if (!Number.isFinite(score) || score < 0) {
      toast({ title: 'نمره نامعتبر است', variant: 'destructive' })
      return
    }
    setSavingId(submissionId)
    try {
      const res = await fetch(`/api/class-assignments/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          feedback: feedbackById[submissionId]?.trim() || null,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'ثبت نمره ناموفق بود')
      toast({ title: 'نمره ثبت شد', description: 'در کارنامه دانش‌آموز هم آمده است' })
      await load()
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error ? err.message : 'ثبت نمره ناموفق بود',
        variant: 'destructive',
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <DashboardPage
      title={assignment?.title || 'تحویل‌های تکلیف'}
      description={
        assignment
          ? `${assignment.subject} · سقف ${assignment.max_score}`
          : 'نمره و بازخورد برای هر دانش‌آموز'
      }
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/teacher/assignments">
            <ArrowRight className="size-4" />
            بازگشت
          </Link>
        </Button>
      }
    >
      {loading ? (
        <PageSkeletonTable />
      ) : error ? (
        <PageErrorState message={error} onRetry={() => void load()} />
      ) : submissions.length === 0 ? (
        <EmptyState title="هنوز تحویلی نیست" description="منتظر فایل دانش‌آموزان بمانید." />
      ) : (
        <ul className="space-y-4" dir="rtl">
          {submissions.map((row) => (
            <li key={row.id} className="space-y-3 rounded-xl border border-border/60 bg-card/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{row.student_name || 'دانش‌آموز'}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.original_name} · {STATUS_LABEL[row.status] || row.status}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => void onDownload(row.id)}>
                  <Download className="size-4" />
                  دانلود فایل
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`score-${row.id}`}>نمره</Label>
                  <Input
                    id={`score-${row.id}`}
                    type="number"
                    min={0}
                    max={assignment?.max_score}
                    step="0.25"
                    value={scoreById[row.id] ?? ''}
                    onChange={(e) =>
                      setScoreById((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`fb-${row.id}`}>بازخورد</Label>
                  <Textarea
                    id={`fb-${row.id}`}
                    rows={2}
                    value={feedbackById[row.id] ?? ''}
                    onChange={(e) =>
                      setFeedbackById((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button
                type="button"
                disabled={savingId === row.id}
                onClick={() => void onGrade(row.id)}
              >
                {savingId === row.id ? <Loader2 className="size-4 animate-spin" /> : 'ثبت نمره'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </DashboardPage>
  )
}
