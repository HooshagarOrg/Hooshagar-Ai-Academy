'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Loader2 } from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

type Overview = { students: number; classes: number; teachers: number }

export default function EducationalVpDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState<Overview | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/school/overview')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت آمار آموزشی ناموفق بود')
          return
        }
        setOverview({
          students: json.students ?? 0,
          classes: json.classes ?? 0,
          teachers: json.teachers ?? 0,
        })
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
      kicker="معاون آموزشی"
      title="داشبورد آموزشی"
      description="برنامهٔ کلاسی و آمار آموزش — جدا از معاون پرورشی"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Calendar} title="آمار در دسترس نیست" description={error} />
      ) : (
        <>
          <DashboardSectionBlock>
            <div className="grid gap-3 sm:grid-cols-3">
              <GlassCard className="p-4">دانش‌آموز: {overview?.students ?? 0}</GlassCard>
              <GlassCard className="p-4">کلاس: {overview?.classes ?? 0}</GlassCard>
              <GlassCard className="p-4">معلم: {overview?.teachers ?? 0}</GlassCard>
            </div>
          </DashboardSectionBlock>
          <DashboardSectionBlock>
            <Button asChild>
              <Link href="/educational-vp/planning">برنامه‌ریزی درسی</Link>
            </Button>
          </DashboardSectionBlock>
        </>
      )}
    </DashboardPage>
  )
}
