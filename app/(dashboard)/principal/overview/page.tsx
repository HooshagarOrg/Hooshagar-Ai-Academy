'use client'

import { useEffect, useState } from 'react'
import { Building, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type ClassRow = { id: string; name: string; grade: number | null }

type Overview = { students: number; classes: number; teachers: number; staff: number }

export default function PrincipalOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [classes, setClasses] = useState<ClassRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, classesRes] = await Promise.all([
          fetch('/api/school/overview'),
          fetch('/api/timetable/school-classes'),
        ])
        const overviewJson = await overviewRes.json()
        const classesJson = await classesRes.json()
        if (!overviewRes.ok) {
          setError(overviewJson.error || 'دریافت اطلاعات ناموفق بود')
          return
        }
        setOverview({
          students: overviewJson.students ?? 0,
          classes: overviewJson.classes ?? 0,
          teachers: overviewJson.teachers ?? 0,
          staff: overviewJson.staff ?? 0,
        })
        setClasses(classesRes.ok ? classesJson.classes || [] : [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage kicker="مدیر مدرسه" title="نمای مدرسه" description="کلاس‌ها و شمار دانش‌آموز و کارکنان">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState title="اطلاعات مدرسه در دسترس نیست" description={error} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4 text-sm">
            <GlassCard className="p-4">دانش‌آموز: {overview?.students ?? 0}</GlassCard>
            <GlassCard className="p-4">کلاس: {overview?.classes ?? 0}</GlassCard>
            <GlassCard className="p-4">معلم: {overview?.teachers ?? 0}</GlassCard>
            <GlassCard className="p-4">کارمند: {overview?.staff ?? 0}</GlassCard>
          </div>
          {classes.length === 0 ? (
            <EmptyState icon={Building} title="کلاسی ثبت نشده" description="کلاس‌ها از واردسازی یا پنل ادمین ساخته می‌شوند." />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {classes.map((cls) => (
                <GlassCard key={cls.id} className="p-4">
                  <p className="font-semibold">{cls.name}</p>
                  <p className="text-sm text-[var(--lux-text-muted)]">
                    {cls.grade ? `پایه ${cls.grade}` : 'پایه نامشخص'}
                  </p>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardPage>
  )
}
