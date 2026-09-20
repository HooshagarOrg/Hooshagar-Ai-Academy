'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, Loader2 } from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

type Overview = { students: number; classes: number }
type ActivityRow = { id: string; title: string; activity_date: string }

export default function NurturingVpDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [activities, setActivities] = useState<ActivityRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, actRes] = await Promise.all([
          fetch('/api/school/overview'),
          fetch('/api/nurturing/activities'),
        ])
        const overviewJson = await overviewRes.json()
        const actJson = await actRes.json()
        if (!overviewRes.ok) {
          setError(overviewJson.error || 'دریافت آمار ناموفق بود')
          return
        }
        setOverview({
          students: overviewJson.students ?? 0,
          classes: overviewJson.classes ?? 0,
        })
        if (actRes.ok) setActivities(actJson.activities || [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage
      kicker="معاون پرورشی"
      title="داشبورد پرورشی"
      description="جدا از معاون آموزشی — برنامه‌ها و رویدادهای پرورشی"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Activity} title="اطلاعات در دسترس نیست" description={error} />
      ) : (
        <>
          <DashboardSectionBlock>
            <div className="grid gap-3 sm:grid-cols-2">
              <GlassCard className="p-4">دانش‌آموز: {overview?.students ?? 0}</GlassCard>
              <GlassCard className="p-4">کلاس: {overview?.classes ?? 0}</GlassCard>
            </div>
          </DashboardSectionBlock>
          <DashboardSectionBlock>
            <h2 className="font-semibold mb-2">آخرین فعالیت‌ها</h2>
            {activities.length === 0 ? (
              <EmptyState title="هنوز فعالیتی ثبت نشده" description="از صفحهٔ فعالیت‌ها رویداد پرورشی بسازید." />
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 5).map((item) => (
                  <GlassCard key={item.id} className="p-3 text-sm">
                    {item.title} — {item.activity_date}
                  </GlassCard>
                ))}
              </div>
            )}
          </DashboardSectionBlock>
          <Button asChild>
            <Link href="/nurturing-vp/activities">فعالیت‌ها</Link>
          </Button>
        </>
      )}
    </DashboardPage>
  )
}
