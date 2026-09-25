'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building,
  Users,
  GraduationCap,
  ClipboardCheck,
  MessageSquare,
  BookOpen,
  Loader2,
} from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type Overview = {
  students: number
  classes: number
  teachers: number
  staff: number
}

type Attendance = {
  presentCount?: number
  absentCount?: number
  lateCount?: number
  attendanceRate?: number
  totalStudents?: number
}

export default function PrincipalDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [attendance, setAttendance] = useState<Attendance | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, attendanceRes] = await Promise.all([
          fetch('/api/school/overview'),
          fetch('/api/attendance/stats?type=school'),
        ])
        const overviewJson = await overviewRes.json()
        const attendanceJson = await attendanceRes.json()
        if (!overviewRes.ok) {
          setError(overviewJson.error || 'دریافت آمار مدرسه ناموفق بود')
          return
        }
        setOverview({
          students: overviewJson.students ?? 0,
          classes: overviewJson.classes ?? 0,
          teachers: overviewJson.teachers ?? 0,
          staff: overviewJson.staff ?? 0,
        })
        if (attendanceRes.ok && !attendanceJson.error) {
          setAttendance(attendanceJson)
        }
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
      kicker="مدیر مدرسه"
      title="داشبورد"
      description="نمای واقعی مدرسه — بدون عدد نمونه"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState title="آمار در دسترس نیست" description={error} />
      ) : (
        <>
          <DashboardSectionBlock>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="دانش‌آموزان" value={overview?.students ?? 0} icon={Users} />
              <Stat label="کلاس‌ها" value={overview?.classes ?? 0} icon={Building} />
              <Stat label="معلمان" value={overview?.teachers ?? 0} icon={GraduationCap} />
              <Stat label="کارکنان" value={overview?.staff ?? 0} icon={Users} />
            </div>
          </DashboardSectionBlock>
          <DashboardSectionBlock>
            <GlassCard className="p-5">
              <h2 className="text-sm font-bold mb-3">حضور امروز</h2>
              {attendance ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <p>حاضر: {attendance.presentCount ?? 0}</p>
                  <p>غایب: {attendance.absentCount ?? 0}</p>
                  <p>تأخیر: {attendance.lateCount ?? 0}</p>
                  <p>نرخ: {attendance.attendanceRate ?? 0}٪</p>
                </div>
              ) : (
                <p className="text-sm text-[var(--lux-text-muted)]">هنوز حضور امروز ثبت نشده است.</p>
              )}
            </GlassCard>
          </DashboardSectionBlock>
          <DashboardSectionBlock>
            <div className="grid gap-3 sm:grid-cols-2">
              <LinkCard href="/principal/overview" title="نمای مدرسه" description="کلاس‌ها و کارکنان" />
              <LinkCard
                href="/teacher/textbooks"
                title="کتاب‌های درسی"
                description="آپلود PDF برای هر پایه"
                icon={BookOpen}
              />
              <LinkCard href="/messages" title="پیام‌ها" description="ارتباط با معلمان و والدین" icon={MessageSquare} />
              <LinkCard href="/discipline-vp/attendance" title="حضور و غیاب" description="نمای انضباطی امروز" icon={ClipboardCheck} />
            </div>
          </DashboardSectionBlock>
        </>
      )}
    </DashboardPage>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Users
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[var(--lux-text-muted)]" />
        <div>
          <p className="text-xs text-[var(--lux-text-muted)]">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </GlassCard>
  )
}

function LinkCard({
  href,
  title,
  description,
  icon: Icon = Building,
}: {
  href: string
  title: string
  description: string
  icon?: typeof Building
}) {
  return (
    <Link href={href} className="block">
      <GlassCard className="p-4 h-full hover:bg-white/[0.04] transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-[var(--lux-text-muted)]">{description}</p>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
