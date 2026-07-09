'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, Users, Calendar, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageLoading } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { cn } from '@/lib/utils'

interface AttendanceRecord {
  id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  student_name?: string
}

interface Child {
  id: string
  full_name: string
  grade: number
  attendance: AttendanceRecord[]
  stats: { total: number; present: number; absent: number; late: number }
}

const statusLabel: Record<string, string> = {
  present: 'حاضر',
  absent: 'غایب',
  late: 'تأخیر',
  excused: 'موجه',
}

const statusBadge: Record<string, string> = {
  present: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  absent: 'bg-red-500/15 text-red-300 border-red-500/30',
  late: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  excused: 'bg-[var(--lux-secondary)]/15 text-[var(--lux-secondary)] border-[var(--lux-secondary)]/30',
}

const statusIcon: Record<string, React.ReactNode> = {
  present: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  absent: <XCircle className="h-4 w-4 text-red-400" />,
  late: <Clock className="h-4 w-4 text-amber-400" />,
  excused: <CheckCircle2 className="h-4 w-4 text-[var(--lux-secondary)]" />,
}

const statCards = [
  { key: 'present' as const, label: 'روز حاضر', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'absent' as const, label: 'روز غیبت', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  { key: 'late' as const, label: 'بار تأخیر', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
]

export default function ParentAttendancePage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    loadAttendance()
  }, [])

  async function loadAttendance() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/parent/attendance')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      if (data.children) {
        setChildren(data.children)
        if (data.children.length > 0) setSelected(data.children[0].id)
      }
    } catch {
      setError('دریافت اطلاعات حضور و غیاب ناموفق بود. لطفاً دوباره تلاش کنید.')
      setChildren([])
    } finally {
      setLoading(false)
    }
  }

  const activeChild = children.find((c) => c.id === selected)

  const attendancePercent = (child: Child) => {
    if (!child.stats.total) return 0
    return Math.round((child.stats.present / child.stats.total) * 100)
  }

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <Calendar className="text-[var(--lux-primary)]" aria-hidden />
          حضور و غیاب فرزندان
        </span>
      }
      description="وضعیت حضور و غیاب فرزندتان را مشاهده کنید"
    >
      {loading ? (
        <DashboardSectionBlock>
          <PageLoading label="در حال بارگذاری حضور و غیاب..." compact />
        </DashboardSectionBlock>
      ) : error ? (
        <DashboardSectionBlock>
          <PageErrorState message={error} onRetry={loadAttendance} />
        </DashboardSectionBlock>
      ) : children.length === 0 ? (
        <DashboardSectionBlock>
          <EmptyState
            icon={Users}
            title="اطلاعاتی یافت نشد"
            description="فرزندی به حساب شما متصل نیست یا اطلاعات حضور ثبت نشده است."
          />
        </DashboardSectionBlock>
      ) : (
        <>
          {children.length > 1 && (
            <DashboardSectionBlock>
              <div className="flex flex-wrap gap-3">
                {children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelected(child.id)}
                    className={cn(
                      'lux-focus-ring min-h-10 rounded-xl px-4 py-2 font-medium transition-all',
                      selected === child.id
                        ? 'bg-[var(--lux-primary)] text-white shadow-md'
                        : 'border border-white/[0.12] bg-white/[0.04] text-[var(--lux-text)] hover:bg-white/[0.08]',
                    )}
                  >
                    {child.full_name}
                    <span className="mr-2 text-sm opacity-70">پایه {child.grade}</span>
                  </button>
                ))}
              </div>
            </DashboardSectionBlock>
          )}

          {activeChild && (
            <>
              <DashboardSectionBlock>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {statCards.map(({ key, label, icon: Icon, color, bg }) => (
                    <div key={key} className={cn('lux-dash-stat text-center', bg)}>
                      <Icon className={cn('mx-auto mb-2 h-8 w-8', color)} />
                      <p className={cn('text-2xl font-bold', color)}>{activeChild.stats[key]}</p>
                      <p className="text-sm text-[var(--lux-text-muted)]">{label}</p>
                    </div>
                  ))}
                  <div className="lux-dash-stat bg-[var(--lux-primary)]/10 text-center">
                    <TrendingUp className="mx-auto mb-2 h-8 w-8 text-[var(--lux-primary)]" />
                    <p className="text-2xl font-bold text-[var(--lux-primary)]">
                      {attendancePercent(activeChild)}%
                    </p>
                    <p className="text-sm text-[var(--lux-text-muted)]">درصد حضور</p>
                  </div>
                </div>
              </DashboardSectionBlock>

              <DashboardSectionBlock>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-5 w-5 text-[var(--lux-primary)]" />
                      نرخ حضور {activeChild.full_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            attendancePercent(activeChild) >= 80
                              ? 'bg-emerald-500'
                              : attendancePercent(activeChild) >= 60
                                ? 'bg-amber-500'
                                : 'bg-red-500',
                          )}
                          style={{ width: `${attendancePercent(activeChild)}%` }}
                        />
                      </div>
                      <span className="w-12 font-bold text-[var(--lux-text)]">
                        {attendancePercent(activeChild)}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--lux-text-muted)]">
                      {activeChild.stats.present} از {activeChild.stats.total} روز تحصیلی
                    </p>
                  </CardContent>
                </Card>
              </DashboardSectionBlock>

              <DashboardSectionBlock>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">تاریخچه حضور و غیاب</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeChild.attendance.length === 0 ? (
                      <p className="py-8 text-center text-[var(--lux-text-muted)]">
                        هنوز اطلاعاتی ثبت نشده
                      </p>
                    ) : (
                      <div className="max-h-96 space-y-2 overflow-y-auto">
                        {activeChild.attendance.map((record) => (
                          <div
                            key={record.id}
                            className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3">
                              {statusIcon[record.status]}
                              <div>
                                <p className="text-sm font-medium text-[var(--lux-text)]">
                                  {new Date(record.date).toLocaleDateString('fa-IR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                                {record.notes && (
                                  <p className="text-xs text-[var(--lux-text-muted)]">{record.notes}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className={statusBadge[record.status]}>
                              {statusLabel[record.status]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </DashboardSectionBlock>
            </>
          )}
        </>
      )}
    </DashboardPage>
  )
}
