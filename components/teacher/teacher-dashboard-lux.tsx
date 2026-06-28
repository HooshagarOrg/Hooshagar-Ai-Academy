'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  BookOpen,
  Brain,
  ChevronLeft,
  ClipboardCheck,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxStatGrid } from '@/components/lux/lux-stat-grid'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'

type DashboardData = {
  teacher: { name: string; class: { name: string; grade: number } | null }
  students: Array<{ id: string; name: string; needsAttention: boolean; lastScore: number | null }>
  stats: { totalStudents: number; attendanceRate: number; upcomingExams: number; averageGrade: number }
}

export function TeacherDashboardLux() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/teacher/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) setError(d.error || 'خطا')
        else setData(d)
      })
      .catch(() => setError('خطای شبکه'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="lux-dash-card flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-[var(--arc-teacher)]" /></div>
  }

  if (error || !data) {
    return (
      <LuxEmptyState
        icon={<AlertCircle className="h-6 w-6" />}
        title="خطا در بارگذاری"
        description={error || 'داده‌ای دریافت نشد'}
        actionLabel="تلاش مجدد"
        onAction={() => window.location.reload()}
      />
    )
  }

  const tools = [
    { label: 'تحلیل دانش‌آموز', href: '/teacher/analytics', icon: Brain },
    { label: 'آزمون‌ساز', href: '/teacher/exam-generator', icon: ClipboardCheck },
    { label: 'محتوای AI', href: '/teacher/content-creator', icon: Sparkles },
    { label: 'دفتر کلاسی', href: '/teacher/grades', icon: BookOpen },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      <LuxFadeUp>
        <LuxPageHeader
          kicker="فضای معلم"
          title={`سلام، ${data.teacher.name}`}
          subtitle={data.teacher.class ? `کلاس ${data.teacher.class.name} — پایه ${data.teacher.class.grade}` : 'کلاسی اختصاص داده نشده'}
        />
      </LuxFadeUp>

      <LuxStagger className="space-y-6" stagger={0.1}>
        <LuxStaggerItem>
          <LuxStatGrid
            items={[
              { label: 'دانش‌آموزان', value: data.stats.totalStudents, icon: <Users className="h-5 w-5" />, accent: 'var(--arc-teacher)' },
              { label: 'حضور امروز', value: `${data.stats.attendanceRate}٪`, icon: <ClipboardCheck className="h-5 w-5" />, accent: 'var(--lux-success)' },
              { label: 'میانگین نمره', value: data.stats.averageGrade.toFixed(1), icon: <BookOpen className="h-5 w-5" />, accent: 'var(--lux-primary)' },
              { label: 'آزمون پیش‌رو', value: data.stats.upcomingExams, icon: <Sparkles className="h-5 w-5" />, accent: 'var(--lux-gold)' },
            ]}
          />
        </LuxStaggerItem>

        <LuxStaggerItem>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {tools.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="lux-dash-tool">
                <Icon className="h-5 w-5 text-[var(--arc-teacher)]" />
                <span className="text-sm font-bold text-[var(--lux-text)]">{label}</span>
              </Link>
            ))}
          </div>
        </LuxStaggerItem>

        <LuxStaggerItem>
          <LuxCard>
            <h3 className="mb-4 font-black text-[var(--lux-text)]">وضعیت دانش‌آموزان</h3>
            {data.students.length === 0 ? (
              <LuxEmptyState title="دانش‌آموزی در کلاس نیست" />
            ) : (
              <div className="space-y-2">
                {data.students.slice(0, 8).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-[var(--lux-surface)] bg-[var(--lux-card)] px-3 py-2">
                    <span className="text-sm font-bold text-[var(--lux-text)]">{s.name}</span>
                    <div className="flex items-center gap-2 text-xs">
                      {s.needsAttention && <span className="text-[var(--lux-accent)]">نیاز به توجه</span>}
                      <span className="text-[var(--lux-text-muted)]">{s.lastScore ?? '—'}</span>
                      <ChevronLeft className="h-3 w-3 text-[var(--lux-text-muted)]" />
                    </div>
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
