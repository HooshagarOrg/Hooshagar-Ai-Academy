'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, User } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageSkeletonCards } from '@/components/ui/page-states'

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
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <GraduationCap className="text-green-600" aria-hidden />
          نمرات فرزندان
        </h1>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">
          آخرین نمرات ثبت‌شده برای فرزندان شما
        </p>
      </div>

      {loading ? (
        <PageSkeletonCards count={2} />
      ) : error ? (
        <PageErrorState message={error} onRetry={loadGrades} />
      ) : Object.keys(byChild).length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="هنوز نمره‌ای ثبت نشده"
          description="به محض ثبت نمرات توسط مدرسه، اینجا نمایش داده می‌شود."
        />
      ) : (
        Object.entries(byChild).map(([id, child]) => {
          const avg = child.grades.reduce((s, g) => s + (g.score / g.max_score) * 20, 0) / child.grades.length
          return (
            <Card key={id}>
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-2">
                    <User className="text-green-600" aria-hidden />
                    {child.name}
                  </span>
                  <span className={`text-lg ${avg >= 17 ? 'text-green-600' : avg >= 14 ? 'text-blue-600' : avg >= 10 ? 'text-orange-600' : 'text-red-600'}`}>
                    معدل: {avg.toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {child.grades.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{g.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {EXAM_TYPE_LABELS[g.exam_type] || g.exam_type} • {new Date(g.exam_date).toLocaleDateString('fa-IR')}
                          {g.profiles?.full_name && ` • معلم: ${g.profiles.full_name}`}
                        </p>
                        {g.comments && <p className="mt-1 text-xs italic text-muted-foreground">{g.comments}</p>}
                      </div>
                      <div className={`text-2xl font-bold shrink-0 ${g.score >= g.max_score * 0.85 ? 'text-green-600' : g.score >= g.max_score * 0.5 ? 'text-blue-600' : 'text-red-600'}`}>
                        {g.score}<span className="text-sm text-muted-foreground">/{g.max_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
