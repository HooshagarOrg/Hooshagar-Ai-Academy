'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, ChevronLeft, ClipboardCheck, PlayCircle } from 'lucide-react'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { LuxErrorState, LuxSkeletonCards } from '@/components/lux/lux-page-states'

interface Exam {
  id: string
  title: string
  subject: string
  exam_date: string
  duration_minutes: number
  status: string
  session?: { status: string; percentage?: number }
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadExams = () => {
    setLoading(true)
    setError('')
    fetch('/api/exams?filter=upcoming')
      .then(async (r) => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((d) => setExams(d.exams || []))
      .catch(() => setError('دریافت آزمون‌ها ناموفق بود. لطفاً دوباره تلاش کنید.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadExams()
  }, [])

  return (
    <DashboardPage
      title="آزمون‌ها"
      description="تقویم امتحانات و وضعیت شرکت"
    >
      {loading ? (
        <DashboardSectionBlock><LuxSkeletonCards variant="lux" className="sm:grid-cols-2 lg:grid-cols-3" /></DashboardSectionBlock>
      ) : error ? (
        <DashboardSectionBlock>
          <LuxErrorState message={error} onRetry={loadExams} variant="lux" />
        </DashboardSectionBlock>
      ) : exams.length === 0 ? (
        <DashboardSectionBlock>
          <LuxEmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="آزمون پیش‌رویی نیست" description="وقتی مدرسه آزمون تعریف کند اینجا نمایش داده می‌شود." />
        </DashboardSectionBlock>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <DashboardSectionBlock key={exam.id}>
              <LuxCard interactive>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black text-[var(--lux-text)]">{exam.title}</p>
                  <p className="mt-1 text-xs text-[var(--lux-text-muted)]">{exam.subject}</p>
                </div>
                <Calendar className="h-5 w-5 text-[var(--lux-secondary)]" />
              </div>
              <p className="mt-3 text-xs text-[var(--lux-text-muted)]">
                {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('fa-IR') : '—'}
                {exam.duration_minutes ? ` · ${exam.duration_minutes} دقیقه` : ''}
              </p>
              <Link href={`/student/exams/${exam.id}/take`} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--lux-primary)]">
                <PlayCircle className="h-4 w-4" /> شروع / ادامه
                <ChevronLeft className="h-4 w-4" />
              </Link>
              </LuxCard>
            </DashboardSectionBlock>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
