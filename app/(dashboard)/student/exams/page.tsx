'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, ChevronLeft, ClipboardCheck, Loader2, PlayCircle } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'

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

  useEffect(() => {
    fetch('/api/exams?filter=upcoming')
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div dir="rtl">
      <LuxPageHeader title="آزمون‌ها" subtitle="تقویم امتحانات و وضعیت شرکت" />
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[var(--lux-primary)]" /></div>
      ) : exams.length === 0 ? (
        <LuxEmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="آزمون پیش‌رویی نیست" description="وقتی مدرسه آزمون تعریف کند اینجا نمایش داده می‌شود." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <LuxCard key={exam.id} interactive>
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
          ))}
        </div>
      )}
    </div>
  )
}
