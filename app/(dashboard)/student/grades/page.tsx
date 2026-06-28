'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, TrendingDown, TrendingUp } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxDashboardSection, LuxSectionBlock } from '@/components/lux/lux-dashboard-section'
import { LuxErrorState, LuxSkeletonTable } from '@/components/lux/lux-page-states'

type Grade = {
  id: string
  subject: string
  score: number
  max_score: number
  exam_type: string
  exam_date: string
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  general: 'کلی', midterm: 'میان‌ترم', final: 'پایان‌ترم',
  quiz: 'پرسش کلاسی', homework: 'تکلیف', project: 'پروژه',
}

export default function StudentGradesPage() {
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

  const avg = grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.score / g.max_score) * 20, 0) / grades.length
    : 0

  return (
    <LuxDashboardSection
      header={<LuxPageHeader title="نمرات من" subtitle={`میانگین کل: ${avg.toFixed(1)} از ۲۰`} />}
    >
      {loading ? (
        <LuxSectionBlock><LuxSkeletonTable variant="lux" /></LuxSectionBlock>
      ) : error ? (
        <LuxSectionBlock>
          <LuxErrorState message={error} onRetry={loadGrades} variant="lux" />
        </LuxSectionBlock>
      ) : grades.length === 0 ? (
        <LuxSectionBlock>
          <LuxEmptyState icon={<GraduationCap className="h-6 w-6" />} title="هنوز نمره‌ای ثبت نشده" description="نمرات از مدرسه همگام می‌شوند." />
        </LuxSectionBlock>
      ) : (
        <LuxSectionBlock>
          <LuxCard className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--lux-surface)] text-[var(--lux-text-muted)]">
                <th className="p-4 text-right font-bold">درس</th>
                <th className="p-4 text-center font-bold">نوع</th>
                <th className="p-4 text-center font-bold">نمره</th>
                <th className="p-4 text-center font-bold">روند</th>
                <th className="p-4 text-center font-bold">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => {
                const pct = (g.score / g.max_score) * 20
                return (
                  <tr key={g.id} className="border-b border-[var(--lux-surface)]">
                    <td className="p-4 font-bold text-[var(--lux-text)]">{g.subject}</td>
                    <td className="p-4 text-center text-[var(--lux-text-muted)]">{EXAM_TYPE_LABELS[g.exam_type] || g.exam_type}</td>
                    <td className="p-4 text-center font-black text-[var(--lux-text)]">{g.score}</td>
                    <td className="p-4 text-center">
                      {pct >= 17 ? <TrendingUp className="mx-auto h-4 w-4 text-[var(--lux-success)]" /> : <TrendingDown className="mx-auto h-4 w-4 text-[var(--lux-accent)]" />}
                    </td>
                    <td className="p-4 text-center text-xs text-[var(--lux-text-muted)]">
                      {g.exam_date ? new Date(g.exam_date).toLocaleDateString('fa-IR') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </LuxCard>
        </LuxSectionBlock>
      )}
      <LuxSectionBlock>
        <Link href="/student" className="lux-btn-ghost inline-flex text-sm">بازگشت به داشبورد</Link>
      </LuxSectionBlock>
    </LuxDashboardSection>
  )
}
