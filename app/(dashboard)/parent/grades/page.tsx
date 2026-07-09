'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, User } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageSkeletonCards } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

type Grade = {
  id: string
  student_id: string
  subject: string
  score: number
  max_score: number
  exam_type: string
  comments?: string
  exam_date: string
  students?: { full_name: string; grade: number }
  profiles?: { full_name: string }
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  general: 'کلی', midterm: 'میان‌ترم', final: 'پایان‌ترم',
  quiz: 'پرسش کلاسی', homework: 'تکلیف', project: 'پروژه',
  oral: 'شفاهی', practical: 'عملی',
}

function scoreColor(score: number, max: number): string {
  const ratio = score / max
  if (ratio >= 0.85) return 'text-emerald-400'
  if (ratio >= 0.5) return 'text-[var(--lux-secondary)]'
  return 'text-red-400'
}

function avgColor(avg: number): string {
  if (avg >= 17) return 'text-emerald-400'
  if (avg >= 14) return 'text-[var(--lux-secondary)]'
  if (avg >= 10) return 'text-amber-400'
  return 'text-red-400'
}

export default function ParentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadGrades = () => {
    setLoading(true)
    setError('')
    fetch('/api/grades')
      .then(async (r) => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((d) => setGrades(d.grades || []))
      .catch(() => setError('دریافت نمرات ناموفق بود. لطفاً دوباره تلاش کنید.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadGrades()
  }, [])

  const byChild: Record<string, { name: string; grades: Grade[] }> = {}
  grades.forEach((g) => {
    const id = g.student_id
    if (!byChild[id]) byChild[id] = { name: g.students?.full_name || 'دانش‌آموز', grades: [] }
    byChild[id].grades.push(g)
  })

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <GraduationCap className="text-[var(--lux-primary)]" aria-hidden />
          نمرات فرزندان
        </span>
      }
      description="آخرین نمرات ثبت‌شده برای فرزندان شما"
    >
      {loading ? (
        <DashboardSectionBlock>
          <PageSkeletonCards count={2} />
        </DashboardSectionBlock>
      ) : error ? (
        <DashboardSectionBlock>
          <PageErrorState message={error} onRetry={loadGrades} />
        </DashboardSectionBlock>
      ) : Object.keys(byChild).length === 0 ? (
        <DashboardSectionBlock>
          <EmptyState
            icon={GraduationCap}
            title="هنوز نمره‌ای ثبت نشده"
            description="به محض ثبت نمرات توسط مدرسه، اینجا نمایش داده می‌شود."
          />
        </DashboardSectionBlock>
      ) : (
        Object.entries(byChild).map(([id, child]) => {
          const avg = child.grades.reduce((s, g) => s + (g.score / g.max_score) * 20, 0) / child.grades.length
          return (
            <DashboardSectionBlock key={id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-2">
                      <User className="text-[var(--lux-primary)]" aria-hidden />
                      {child.name}
                    </span>
                    <span className={`text-lg font-bold ${avgColor(avg)}`}>
                      معدل: {avg.toFixed(2)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {child.grades.map((g) => (
                      <div
                        key={g.id}
                        className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--lux-text)]">{g.subject}</p>
                          <p className="text-xs leading-6 text-[var(--lux-text-muted)]">
                            {EXAM_TYPE_LABELS[g.exam_type] || g.exam_type} • {new Date(g.exam_date).toLocaleDateString('fa-IR')}
                            {g.profiles?.full_name && ` • معلم: ${g.profiles.full_name}`}
                          </p>
                          {g.comments && (
                            <p className="mt-1 text-xs italic text-[var(--lux-text-muted)]">{g.comments}</p>
                          )}
                        </div>
                        <div className={`shrink-0 text-2xl font-bold ${scoreColor(g.score, g.max_score)}`}>
                          {g.score}
                          <span className="text-sm text-[var(--lux-text-muted)]">/{g.max_score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </DashboardSectionBlock>
          )
        })
      )}
    </DashboardPage>
  )
}
