'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Loader2 } from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

type HealthStats = {
  totalStudents?: number
  studentsWithRecords?: number
  pendingFollowups?: number
  checkupsThisMonth?: number
  visitsThisMonth?: number
}

export default function HealthVpDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<HealthStats | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/health/stats?type=overview')
        const json = await res.json()
        if (!res.ok || json.success === false) {
          setError(json.error || 'دریافت آمار بهداشت ناموفق بود')
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
    <DashboardPage kicker="معاون بهداشت" title="داشبورد بهداشت">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Heart} title="آمار در دسترس نیست" description={error} />
      ) : (
        <>
          <DashboardSectionBlock>
            <div className="grid gap-3 sm:grid-cols-3">
              <GlassCard className="p-4">دانش‌آموز: {stats?.totalStudents ?? 0}</GlassCard>
              <GlassCard className="p-4">دارای پرونده: {stats?.studentsWithRecords ?? 0}</GlassCard>
              <GlassCard className="p-4">پیگیری معاینات: {stats?.pendingFollowups ?? 0}</GlassCard>
              <GlassCard className="p-4">معاینه این ماه: {stats?.checkupsThisMonth ?? 0}</GlassCard>
              <GlassCard className="p-4">ویزیت این ماه: {stats?.visitsThisMonth ?? 0}</GlassCard>
            </div>
          </DashboardSectionBlock>
          <DashboardSectionBlock>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/health-vp/students">پرونده‌ها</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/health-vp/reports">گزارش‌ها</Link>
              </Button>
            </div>
          </DashboardSectionBlock>
        </>
      )}
    </DashboardPage>
  )
}
