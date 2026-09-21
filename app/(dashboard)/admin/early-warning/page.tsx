'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type AlertRow = {
  student_id: string
  full_name: string
  grade: number | null
  reason: string
  metric: string
  severity: 'medium' | 'high'
}

export default function AdminEarlyWarningPage() {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/early-warning')
        const json = await res.json()
        setAlerts(json.alerts || [])
      } catch {
        toast.error('دریافت هشدارها ناموفق بود')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const runAnalysis = async (row: AlertRow) => {
    setAnalyzingId(row.student_id)
    try {
      const res = await fetch('/api/admin/early-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: row.student_id,
          reason: row.reason,
          metric: row.metric,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'تحلیل AI ناموفق بود')
        return
      }
      setAnalysis((prev) => ({ ...prev, [row.student_id]: json.analysis || '' }))
    } catch {
      toast.error('خطای اتصال')
    } finally {
      setAnalyzingId(null)
    }
  }

  return (
    <DashboardPage kicker="ادمین" title="هشدار زودهنگام">
      <p className="text-sm text-[var(--lux-text-muted)] leading-loose mb-6 max-w-2xl">
        بر اساس حضور و نمرات واقعی مدرسه — بدون عدد ساختگی. اگر داده کم باشد، لیست خالی است.
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="هشداری ثبت نشده"
          description="غیبت یا افت نمرهٔ قابل‌توجه در داده‌های این ماه دیده نشد."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((row) => (
            <GlassCard key={row.student_id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.full_name}</p>
                  <p className="text-sm text-[var(--lux-text-muted)]">
                    پایه {row.grade ?? '—'} · {row.reason} · {row.metric}
                  </p>
                </div>
                <Badge variant={row.severity === 'high' ? 'destructive' : 'secondary'}>
                  {row.severity === 'high' ? 'بالا' : 'متوسط'}
                </Badge>
              </div>
              {analysis[row.student_id] ? (
                <p className="text-sm leading-loose border-r-2 border-brand-purple pr-3">
                  {analysis[row.student_id]}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={analyzingId === row.student_id}
                onClick={() => void runAnalysis(row)}
              >
                {analyzingId === row.student_id ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Sparkles className="h-4 w-4 ml-2" />
                )}
                تحلیل AI
              </Button>
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
