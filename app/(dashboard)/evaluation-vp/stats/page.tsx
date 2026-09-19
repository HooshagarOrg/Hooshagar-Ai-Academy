'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

type Evaluation = { score: number }

export default function EvaluationStatsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/evaluation/teachers')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت آمار ناموفق بود')
          return
        }
        setEvaluations(json.evaluations || [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const avg = useMemo(() => {
    if (evaluations.length === 0) return 0
    const sum = evaluations.reduce((s, e) => s + Number(e.score), 0)
    return Math.round((sum / evaluations.length) * 10) / 10
  }, [evaluations])

  return (
    <DashboardPage
      kicker="معاون ارزشیابی"
      title="آمار ارزیابی"
      actions={
        <Button asChild variant="outline">
          <Link href="/evaluation-vp">بازگشت</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={BarChart3} title="آمار در دسترس نیست" description={error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassCard className="p-5">تعداد ارزیابی: {evaluations.length}</GlassCard>
          <GlassCard className="p-5">میانگین نمره: {avg || '—'}</GlassCard>
        </div>
      )}
    </DashboardPage>
  )
}
