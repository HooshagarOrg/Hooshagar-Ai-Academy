'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Loader2 } from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

type Attendance = {
  presentCount?: number
  absentCount?: number
  lateCount?: number
  attendanceRate?: number
}

type BehaviorReport = {
  id: string
  studentName: string
  date: string
  positiveCount: number
  negativeCount: number
}

export default function DisciplineVpDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [reports, setReports] = useState<BehaviorReport[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [attRes, behRes] = await Promise.all([
          fetch('/api/attendance/stats?type=school'),
          fetch('/api/teacher/behavior'),
        ])
        const attJson = await attRes.json()
        const behJson = await behRes.json()
        if (attRes.ok && !attJson.error) setAttendance(attJson)
        if (!behRes.ok) {
          setError(behJson.error || 'دریافت گزارش انضباطی ناموفق بود')
          return
        }
        setReports(behJson.reports || [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage kicker="معاون انضباطی" title="داشبورد انضباط">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Shield} title="اطلاعات در دسترس نیست" description={error} />
      ) : (
        <>
          <DashboardSectionBlock>
            <GlassCard className="p-5">
              <h2 className="font-semibold mb-2">حضور امروز</h2>
              {attendance ? (
                <p className="text-sm">
                  حاضر {attendance.presentCount ?? 0} · غایب {attendance.absentCount ?? 0} · تأخیر{' '}
                  {attendance.lateCount ?? 0} · نرخ {attendance.attendanceRate ?? 0}٪
                </p>
              ) : (
                <p className="text-sm text-[var(--lux-text-muted)]">حضور امروز هنوز ثبت نشده است.</p>
              )}
            </GlassCard>
          </DashboardSectionBlock>
          <DashboardSectionBlock>
            <h2 className="font-semibold mb-2">آخرین گزارش‌های رفتاری</h2>
            {reports.length === 0 ? (
              <EmptyState title="گزارش رفتاری ثبت نشده" description="گزارش‌ها را معلمان از داشبورد معلم می‌نویسند." />
            ) : (
              <div className="space-y-2">
                {reports.slice(0, 5).map((report) => (
                  <GlassCard key={report.id} className="p-3 text-sm">
                    {report.studentName} — مثبت {report.positiveCount} / نیازمند بهبود {report.negativeCount}
                  </GlassCard>
                ))}
              </div>
            )}
          </DashboardSectionBlock>
          <DashboardSectionBlock>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/discipline-vp/attendance">حضور و غیاب</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/discipline-vp/reports">گزارش‌های انضباطی</Link>
              </Button>
            </div>
          </DashboardSectionBlock>
        </>
      )}
    </DashboardPage>
  )
}
