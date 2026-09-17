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
  Video,
} from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxStatGrid } from '@/components/lux/lux-stat-grid'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import { VirtualClassCard } from '@/components/virtual-class/virtual-class-card'

type DashboardData = {
  teacher: {
    name: string
    class: { id?: string; name: string; grade: number } | null
    classes?: Array<{ id: string; name: string; grade: number | null }>
  }
  students: Array<{ id: string; name: string; needsAttention: boolean; lastScore: number | null }>
  stats: { totalStudents: number; attendanceRate: number; upcomingExams: number; averageGrade: number }
  timetableIncomplete?: boolean
}

export function TeacherDashboardLux() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [classId, setClassId] = useState('')

  useEffect(() => {
    const qs = classId ? `?class_id=${classId}` : ''
    setLoading(true)
    fetch(`/api/teacher/dashboard${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) setError(d.error || 'خطا')
        else {
          setData(d)
          if (!classId && d.teacher?.class?.id) setClassId(d.teacher.class.id)
        }
      })
      .catch(() => setError('خطای شبکه'))
      .finally(() => setLoading(false))
  }, [classId])

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
    { label: 'تحلیلگر هوشمند', href: '/teacher/analyzer', icon: Brain },
    { label: 'آزمون‌ساز', href: '/teacher/exam-generator', icon: ClipboardCheck },
    { label: 'محتوای AI', href: '/teacher/content-creator', icon: Sparkles },
    { label: 'دفتر کلاسی', href: '/teacher/grades', icon: BookOpen },
    { label: 'کلاس مجازی', href: '/teacher/virtual-class', icon: Video },
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

      {data.teacher.classes && data.teacher.classes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {data.teacher.classes.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setClassId(c.id)}
              className={`rounded-full px-3 py-1 text-sm border ${
                classId === c.id
                  ? 'border-[var(--arc-teacher)] bg-[var(--arc-teacher)]/15'
                  : 'border-white/10'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {data.timetableIncomplete && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          برنامهٔ کلاسی این کلاس هنوز کامل نیست.{' '}
          <Link href="/teacher/timetable" className="underline font-bold">
            همین حالا تکمیل کنید
          </Link>
        </div>
      )}

      <LuxStagger className="space-y-6" stagger={0.1}>
        <LuxStaggerItem>
          <VirtualClassCard />
        </LuxStaggerItem>

        <LuxStaggerItem>
          <LuxStatGrid
            items={[
              { label: 'دانش‌آموزان', value: data.stats.totalStudents ?? 0, icon: <Users className="h-5 w-5" />, accent: 'var(--arc-teacher)' },
              { label: 'حضور امروز', value: `${data.stats.attendanceRate ?? 0}٪`, icon: <ClipboardCheck className="h-5 w-5" />, accent: 'var(--lux-success)' },
              { label: 'میانگین نمره', value: (data.stats.averageGrade ?? 0).toFixed(1), icon: <BookOpen className="h-5 w-5" />, accent: 'var(--lux-primary)' },
              { label: 'آزمون پیش‌رو', value: data.stats.upcomingExams ?? 0, icon: <Sparkles className="h-5 w-5" />, accent: 'var(--lux-gold)' },
            ]}
          />
        </LuxStaggerItem>

        <LuxStaggerItem>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
