'use client'

import { useEffect, useState } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type BehaviorReport = {
  id: string
  studentName: string
  date: string
  positiveCount: number
  negativeCount: number
  description: string
}

export default function DisciplineReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reports, setReports] = useState<BehaviorReport[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/teacher/behavior')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت گزارش‌ها ناموفق بود')
          return
        }
        setReports(json.reports || [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage kicker="معاون انضباطی" title="گزارش‌های انضباطی">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Shield} title="گزارش‌ها در دسترس نیست" description={error} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="گزارش رفتاری ثبت نشده"
          description="معلمان از صفحهٔ رفتار، گزارش می‌نویسند؛ اینجا همان داده دیده می‌شود."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <GlassCard key={report.id} className="p-4">
              <p className="font-semibold">{report.studentName}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">
                {report.date} · مثبت {report.positiveCount} · نیازمند بهبود {report.negativeCount}
              </p>
              {report.description ? (
                <p className="text-sm mt-2 leading-loose">{report.description}</p>
              ) : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
