'use client'

import { useEffect, useState } from 'react'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type Attendance = {
  presentCount?: number
  absentCount?: number
  lateCount?: number
  attendanceRate?: number
  totalStudents?: number
  pendingFollowups?: number
}

export default function DisciplineAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Attendance | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/attendance/stats?type=school')
        const json = await res.json()
        if (!res.ok || json.error) {
          setError(json.error || 'دریافت حضور و غیاب ناموفق بود')
          return
        }
        setStats(json)
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage kicker="معاون انضباطی" title="حضور و غیاب مدرسه">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={ClipboardCheck} title="آمار حضور در دسترس نیست" description={error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassCard className="p-4">دانش‌آموز: {stats?.totalStudents ?? 0}</GlassCard>
          <GlassCard className="p-4">نرخ حضور: {stats?.attendanceRate ?? 0}٪</GlassCard>
          <GlassCard className="p-4">حاضر: {stats?.presentCount ?? 0}</GlassCard>
          <GlassCard className="p-4">غایب: {stats?.absentCount ?? 0}</GlassCard>
          <GlassCard className="p-4">تأخیر: {stats?.lateCount ?? 0}</GlassCard>
          <GlassCard className="p-4">پیگیری باز: {stats?.pendingFollowups ?? 0}</GlassCard>
        </div>
      )}
    </DashboardPage>
  )
}
