'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type StatsPayload = {
  stats?: {
    active_records: number
    urgent_records: number
    closed_this_month: number
  }
  distributions?: {
    categories?: Record<string, number>
    priorities?: Record<string, number>
  }
}

export default function CounselorReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<StatsPayload | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/counseling/stats')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت گزارش ناموفق بود')
          return
        }
        setData(json)
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const categories = Object.entries(data?.distributions?.categories || {})
  const priorities = Object.entries(data?.distributions?.priorities || {})

  return (
    <DashboardPage kicker="مشاور" title="گزارش مشاوره">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState title="گزارش در دسترس نیست" description={error} />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <GlassCard className="p-4">فعال: {data?.stats?.active_records ?? 0}</GlassCard>
            <GlassCard className="p-4">فوری: {data?.stats?.urgent_records ?? 0}</GlassCard>
            <GlassCard className="p-4">بسته این ماه: {data?.stats?.closed_this_month ?? 0}</GlassCard>
          </div>
          {categories.length === 0 && priorities.length === 0 ? (
            <EmptyState title="توزیع‌ای ثبت نشده" description="بعد از ثبت پرونده، دسته‌ها اینجا دیده می‌شوند." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <GlassCard className="p-4">
                <h2 className="font-semibold mb-2">دسته‌ها</h2>
                {categories.map(([name, count]) => (
                  <p key={name} className="text-sm">{name}: {count}</p>
                ))}
              </GlassCard>
              <GlassCard className="p-4">
                <h2 className="font-semibold mb-2">اولویت</h2>
                {priorities.map(([name, count]) => (
                  <p key={name} className="text-sm">{name}: {count}</p>
                ))}
              </GlassCard>
            </div>
          )}
        </div>
      )}
    </DashboardPage>
  )
}
