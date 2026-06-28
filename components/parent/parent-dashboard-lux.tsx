'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ChevronLeft, Loader2, Sparkles, Star, TrendingUp, Users } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxStatGrid } from '@/components/lux/lux-stat-grid'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import { TalentRadarPanel } from '@/components/talent/talent-radar'

type DashboardData = {
  parent: { name: string }
  activeChild: { name: string; grade: number; className: string } | null
  stats: { averageGrade: number; attendanceRate: number; recentReports: number }
  recentGrades: Array<{ subject: string; score: number; type: string }>
}

export function ParentDashboardLux() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/parent/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) setError(d.error || 'خطا')
        else setData(d)
      })
      .catch(() => setError('خطای شبکه'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="lux-dash-card flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-[var(--arc-parent)]" /></div>
  }

  if (error) {
    return (
      <LuxEmptyState
        icon={<AlertCircle className="h-6 w-6" />}
        title="خطا در بارگذاری"
        description={error}
        actionLabel="تلاش مجدد"
        onAction={() => window.location.reload()}
      />
    )
  }

  if (!data?.activeChild) {
    return (
      <LuxEmptyState
        icon={<Users className="h-6 w-6" />}
        title="فرزندی ثبت نشده"
        description="برای اتصال فرزند با مدیر مدرسه هماهنگ کنید."
      />
    )
  }

  const radar = [70, 55, 60, 75, 50]

  return (
    <div className="space-y-6" dir="rtl" style={{ ['--role-accent' as string]: 'var(--arc-parent)' }}>
      <LuxFadeUp>
        <LuxPageHeader
          kicker="پنل خانواده"
          title={`سلام، ${data.parent.name}`}
          subtitle={`وضعیت ${data.activeChild.name} — پایه ${data.activeChild.grade} · ${data.activeChild.className}`}
          action={
            <Link href="/parent/reports" className="lux-btn-accent min-h-10 px-4 text-sm" style={{ background: 'var(--arc-parent)' }}>
              گزارش‌های AI
            </Link>
          }
        />
      </LuxFadeUp>

      <LuxStagger className="space-y-6" stagger={0.1}>
        <LuxStaggerItem>
          <LuxStatGrid
            items={[
              { label: 'میانگین نمره', value: data.stats.averageGrade.toFixed(1), icon: <Star className="h-5 w-5" />, accent: 'var(--arc-parent)' },
              { label: 'حضور', value: `${data.stats.attendanceRate}٪`, icon: <TrendingUp className="h-5 w-5" />, accent: 'var(--lux-success)' },
              { label: 'گزارش‌های اخیر', value: data.stats.recentReports, icon: <Sparkles className="h-5 w-5" />, accent: 'var(--lux-primary)' },
              { label: 'کلاس', value: data.activeChild.className, icon: <Users className="h-5 w-5" />, accent: 'var(--lux-secondary)' },
            ]}
          />
        </LuxStaggerItem>

        <div className="grid gap-5 lg:grid-cols-2">
          <LuxStaggerItem>
            <LuxCard gradientBorder>
              <p className="lux-kicker mb-2" style={{ color: 'var(--arc-parent)' }}>بینش AI</p>
              <h3 className="font-black text-[var(--lux-text)]">خلاصه هفتگی فرزند</h3>
              <p className="mt-3 text-sm leading-8 text-[var(--lux-text-muted)]">
                {data.activeChild.name} این هفته در دروس اصلی پیشرفت پایدار داشته. پیشنهاد می‌شود ۲۰ دقیقه مرور ریاضی و گفت‌وگوی کوتاه درباره اهداف هفته داشته باشید.
              </p>
            </LuxCard>
          </LuxStaggerItem>
          <LuxStaggerItem>
            <TalentRadarPanel current={radar} />
          </LuxStaggerItem>
        </div>

        <LuxStaggerItem>
          <LuxCard>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black text-[var(--lux-text)]">نمرات اخیر</h3>
              <Link href="/parent/grades" className="text-xs font-bold text-[var(--arc-parent)]">همه <ChevronLeft className="inline h-3 w-3" /></Link>
            </div>
            {data.recentGrades.length === 0 ? (
              <LuxEmptyState title="نمره‌ای ثبت نشده" />
            ) : (
              <div className="space-y-2">
                {data.recentGrades.slice(0, 5).map((g, i) => (
                  <div key={i} className="flex justify-between rounded-xl border border-[var(--lux-surface)] bg-[var(--lux-card)] px-3 py-2 text-sm">
                    <span className="text-[var(--lux-text)]">{g.subject}</span>
                    <span className="font-black text-[var(--lux-text)]">{g.score}</span>
                  </div>
                ))}
              </div>
            )}
          </LuxCard>
        </LuxStaggerItem>
      </LuxStagger>
    </div>
  )
}
