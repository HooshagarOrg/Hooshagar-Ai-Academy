'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Loader2 } from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

type Stats = {
  active_records: number
  urgent_records: number
  high_priority_records: number
  today_sessions: number
  closed_this_month: number
  pending_follow_ups: number
}

export default function CounselorDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/counseling/stats')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت آمار مشاوره ناموفق بود')
          return
        }
        setStats(json.stats)
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage kicker="مشاور" title="داشبورد مشاوره" description="پرونده‌های واقعی مدرسه">
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
              <GlassCard className="p-4">پرونده فعال: {stats?.active_records ?? 0}</GlassCard>
              <GlassCard className="p-4">فوری: {stats?.urgent_records ?? 0}</GlassCard>
              <GlassCard className="p-4">جلسه امروز: {stats?.today_sessions ?? 0}</GlassCard>
              <GlassCard className="p-4">اولویت بالا: {stats?.high_priority_records ?? 0}</GlassCard>
              <GlassCard className="p-4">بسته‌شده این ماه: {stats?.closed_this_month ?? 0}</GlassCard>
              <GlassCard className="p-4">پیگیری والدین: {stats?.pending_follow_ups ?? 0}</GlassCard>
            </div>
          </DashboardSectionBlock>
          <DashboardSectionBlock>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/counselor/records">پرونده‌ها</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/counselor/records/new">پرونده جدید</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/counselor/reports">گزارش‌ها</Link>
              </Button>
            </div>
          </DashboardSectionBlock>
        </>
      )}
    </DashboardPage>
  )
}
