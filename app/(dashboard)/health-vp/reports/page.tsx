'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type HealthStats = {
  studentsWithRecords?: number
  pendingFollowups?: number
  checkupsThisMonth?: number
  visitsThisMonth?: number
}

export default function HealthVpReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<HealthStats | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/health/stats?type=overview')
        const json = await res.json()
        if (!res.ok || json.success === false) {
          setError(json.error || 'دریافت گزارش ناموفق بود')
          return
        }
        setStats(json.data || json)
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage kicker="معاون بهداشت" title="گزارش بهداشت">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState title="گزارش در دسترس نیست" description={error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassCard className="p-4">پرونده سلامت: {stats?.studentsWithRecords ?? 0}</GlassCard>
          <GlassCard className="p-4">پیگیری باز: {stats?.pendingFollowups ?? 0}</GlassCard>
          <GlassCard className="p-4">معاینه این ماه: {stats?.checkupsThisMonth ?? 0}</GlassCard>
          <GlassCard className="p-4">ویزیت این ماه: {stats?.visitsThisMonth ?? 0}</GlassCard>
        </div>
      )}
    </DashboardPage>
  )
}
