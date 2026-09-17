'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

type Period = {
  label: string
  starts_at: string
  ends_at: string
  kind: string
  subject_name: string | null
  teacher_name: string | null
}

export default function ParentSchedulePage() {
  const [loading, setLoading] = useState(true)
  const [isSchoolDay, setIsSchoolDay] = useState(true)
  const [reason, setReason] = useState<string | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  const [className, setClassName] = useState<string | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/timetable/today')
        const data = await res.json()
        setIsSchoolDay(Boolean(data.isSchoolDay))
        setReason(data.reason ?? null)
        setTitle(data.title ?? null)
        setClassName(data.class?.name ?? null)
        setPeriods(data.periods || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <DashboardPage title="برنامهٔ کلاسی فرزند" description="زنگ‌های امروز">
      <DashboardSectionBlock>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              امروز {className ? `— ${className}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 animate-pulse rounded-xl bg-white/5" />
            ) : !isSchoolDay ? (
              <p className="text-sm text-[var(--lux-text-muted)]">
                امروز تعطیل است
                {title ? ` (${title})` : reason === 'weekend' ? ' (پنجشنبه/جمعه)' : ''}.
              </p>
            ) : periods.length === 0 ? (
              <p className="text-sm text-[var(--lux-text-muted)]">
                هنوز برنامه‌ای برای این کلاس ثبت نشده است.
              </p>
            ) : (
              <ul className="space-y-2">
                {periods.map((p) => (
                  <li
                    key={`${p.label}-${p.starts_at}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm"
                  >
                    <span>
                      {p.label}
                      <span className="mr-2 text-xs text-[var(--lux-text-muted)]" dir="ltr">
                        {p.starts_at}–{p.ends_at}
                      </span>
                    </span>
                    <span className="text-[var(--lux-text-muted)]">
                      {p.kind === 'lesson'
                        ? `${p.subject_name || '—'} · ${p.teacher_name || ''}`
                        : p.kind === 'recess'
                          ? 'تفریح'
                          : 'ورود'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
