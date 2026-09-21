'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type StatsResponse = {
  summary?: {
    today?: { usage: number }
    week?: { usage: number }
    month?: { usage: number }
    blocked?: { count: number }
    successful?: number
  }
  featureStats?: Array<{
    feature_name: string
    total: number
    success: number
    blocked: number
    credits: number
  }>
  topUsers?: Array<{ user_id: string; full_name: string; usage: number }>
  available?: boolean
  error?: string
}

export default function AdminAiUsageDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StatsResponse | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/ai-usage-stats')
        const json = (await res.json()) as StatsResponse
        setData(json)
      } catch {
        setData({ error: 'خطای اتصال' })
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <DashboardPage kicker="ادمین" title="مصرف هوش مصنوعی">
        <div className="flex justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      </DashboardPage>
    )
  }

  if (!data?.available) {
    return (
      <DashboardPage kicker="ادمین" title="مصرف هوش مصنوعی">
        <EmptyState
          icon={BarChart3}
          title="آمار در دسترس نیست"
          description={data?.error || 'لاگ مصرف هنوز ثبت نشده'}
        />
      </DashboardPage>
    )
  }

  const s = data.summary

  return (
    <DashboardPage kicker="ادمین" title="مصرف هوش مصنوعی">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--lux-text-muted)]">امروز</p>
          <p className="text-2xl font-bold">{s?.today?.usage ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--lux-text-muted)]">۷ روز اخیر</p>
          <p className="text-2xl font-bold">{s?.week?.usage ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--lux-text-muted)]">۳۰ روز اخیر</p>
          <p className="text-2xl font-bold">{s?.month?.usage ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-[var(--lux-text-muted)]">مسدود شده</p>
          <p className="text-2xl font-bold">{s?.blocked?.count ?? 0}</p>
        </GlassCard>
      </div>

      {(data.featureStats || []).length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="هنوز مصرفی ثبت نشده"
          description="با استفاده از قابلیت‌های AI مدرسه، آمار اینجا نمایش داده می‌شود."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-5">
            <h2 className="font-semibold mb-4">بر اساس قابلیت</h2>
            <div className="space-y-2">
              {(data.featureStats || []).map((f) => (
                <div key={f.feature_name} className="flex justify-between text-sm">
                  <span>{f.feature_name}</span>
                  <span className="text-[var(--lux-text-muted)]">
                    {f.total} درخواست · {f.credits} اعتبار
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="font-semibold mb-4">پرمصرف‌ترین کاربران</h2>
            <div className="space-y-2">
              {(data.topUsers || []).map((u) => (
                <div key={u.user_id} className="flex justify-between text-sm">
                  <span>{u.full_name}</span>
                  <span>{u.usage}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </DashboardPage>
  )
}
