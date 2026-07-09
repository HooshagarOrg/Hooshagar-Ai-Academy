'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users, BookOpen, TrendingUp, Award, BarChart3,
  GraduationCap, CheckCircle2, XCircle, Star,
} from 'lucide-react'
import { PageErrorState, PageLoading } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  overview: {
    total_students: number
    total_teachers: number
    total_parents: number
    total_schools: number
  }
  grades: {
    average_score: number
    total_grades: number
    passing_rate: number
    subject_averages: { subject: string; avg: number }[]
  }
  attendance: {
    average_rate: number
    total_records: number
    absent_count: number
  }
  gamification: {
    total_xp_awarded: number
    active_users: number
    badges_awarded: number
    avg_level: number
  }
  exams: {
    total_exams: number
    avg_pass_rate: number
    recent_count: number
  }
}

const overviewStats = [
  { key: 'total_students' as const, label: 'دانش‌آموز', icon: Users, color: 'text-[var(--lux-secondary)]', bg: 'bg-[var(--lux-secondary)]/10' },
  { key: 'total_teachers' as const, label: 'معلم', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'total_parents' as const, label: 'والدین', icon: Users, color: 'text-[var(--lux-primary)]', bg: 'bg-[var(--lux-primary)]/10' },
  { key: 'total_schools' as const, label: 'مدرسه', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
]

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--lux-text-muted)]">{label}</span>
      <span className={cn('text-xl font-bold', valueClass ?? 'text-[var(--lux-text)]')}>{value}</span>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setError('')
        const res = await fetch('/api/admin/analytics')
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setData(json)
      } catch {
        setError('دریافت گزارش تحلیلی ناموفق بود. لطفاً دوباره تلاش کنید.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <DashboardPage title="گزارش تحلیلی" description="آمار و تحلیل جامع سیستم">
        <PageLoading label="در حال بارگذاری گزارش تحلیلی..." compact />
      </DashboardPage>
    )
  }

  if (error) {
    return (
      <DashboardPage title="گزارش تحلیلی" description="آمار و تحلیل جامع سیستم">
        <PageErrorState message={error} onRetry={() => window.location.reload()} />
      </DashboardPage>
    )
  }

  const overview = data?.overview
  const grades = data?.grades
  const attend = data?.attendance
  const game = data?.gamification
  const exams = data?.exams

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <BarChart3 className="text-[var(--lux-primary)]" aria-hidden />
          گزارش تحلیلی
        </span>
      }
      description="آمار و تحلیل جامع سیستم"
    >
      <DashboardSectionBlock>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {overviewStats.map(({ key, label, icon: Icon, color, bg }) => (
            <div key={key} className={cn('lux-dash-stat', bg)}>
              <div className="mb-2 flex items-center justify-between">
                <Icon className={cn('h-8 w-8', color)} />
                <span className={cn('text-2xl font-bold', color)}>
                  {overview?.[key] ?? '—'}
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--lux-text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-5 w-5 text-amber-400" />
                آمار نمرات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatRow
                label="میانگین کلی"
                value={`${grades?.average_score?.toFixed(1) ?? '—'} / ۲۰`}
                valueClass={(grades?.average_score ?? 0) >= 14 ? 'text-emerald-400' : 'text-red-400'}
              />
              <StatRow
                label="نرخ قبولی"
                value={`${grades?.passing_rate?.toFixed(0) ?? '—'}٪`}
                valueClass="text-[var(--lux-secondary)]"
              />
              <StatRow
                label="تعداد نمرات ثبت شده"
                value={grades?.total_grades?.toLocaleString('fa-IR') ?? '—'}
              />
              {grades?.subject_averages && grades.subject_averages.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-[var(--lux-text)]">میانگین هر درس</p>
                  {grades.subject_averages.slice(0, 5).map((s) => (
                    <div key={s.subject} className="flex items-center gap-2">
                      <span className="w-24 truncate text-sm text-[var(--lux-text-muted)]">{s.subject}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className={cn('h-full rounded-full', s.avg >= 14 ? 'bg-emerald-500' : 'bg-amber-500')}
                          style={{ width: `${(s.avg / 20) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm font-medium text-[var(--lux-text)]">{s.avg.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                آمار حضور و غیاب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatRow
                label="نرخ حضور"
                value={`${attend?.average_rate?.toFixed(1) ?? '—'}٪`}
                valueClass={(attend?.average_rate ?? 0) >= 80 ? 'text-emerald-400' : 'text-red-400'}
              />
              <StatRow
                label="کل رکوردهای ثبت شده"
                value={attend?.total_records?.toLocaleString('fa-IR') ?? '—'}
              />
              <StatRow
                label="تعداد غیبت‌ها"
                value={attend?.absent_count?.toLocaleString('fa-IR') ?? '—'}
                valueClass="text-red-400"
              />
              {attend && (
                <div className="mt-4">
                  <div className="mb-1 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-[var(--lux-text-muted)]">حضور</span>
                    <XCircle className="mr-4 h-4 w-4 text-red-400" />
                    <span className="text-sm text-[var(--lux-text-muted)]">غیبت</span>
                  </div>
                  <div className="flex h-4 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full bg-emerald-500" style={{ width: `${attend.average_rate}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${100 - attend.average_rate}%` }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5 text-amber-400" />
                آمار گیمیفیکیشن
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatRow label="کل XP اهدایی" value={game?.total_xp_awarded?.toLocaleString('fa-IR') ?? '—'} valueClass="text-amber-400" />
              <StatRow label="کاربران فعال" value={game?.active_users?.toLocaleString('fa-IR') ?? '—'} valueClass="text-emerald-400" />
              <StatRow label="نشان اهدا شده" value={game?.badges_awarded?.toLocaleString('fa-IR') ?? '—'} valueClass="text-[var(--lux-primary)]" />
              <StatRow label="میانگین سطح" value={game?.avg_level?.toFixed(1) ?? '—'} valueClass="text-[var(--lux-secondary)]" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-[var(--lux-secondary)]" />
                آمار آزمون‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatRow label="کل آزمون‌ها" value={exams?.total_exams?.toLocaleString('fa-IR') ?? '—'} valueClass="text-[var(--lux-secondary)]" />
              <StatRow
                label="میانگین نرخ قبولی"
                value={`${exams?.avg_pass_rate?.toFixed(0) ?? '—'}٪`}
                valueClass={(exams?.avg_pass_rate ?? 0) >= 70 ? 'text-emerald-400' : 'text-red-400'}
              />
              <StatRow label="آزمون‌های اخیر (۳۰ روز)" value={exams?.recent_count?.toLocaleString('fa-IR') ?? '—'} />
            </CardContent>
          </Card>
        </div>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
