'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

/** برنامهٔ فقط‌خواندنی برای معلم هنر / ورزش */
export default function SpecialtyTimetablePage() {
  const [periods, setPeriods] = useState<
    Array<{
      weekday_label: string
      label: string
      starts_at: string | null
      subject_name: string | null
      class: { name: string } | null
    }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/timetable/mine')
        const data = await res.json()
        if (res.ok) setPeriods(data.periods || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <DashboardPage
      title="برنامهٔ من"
      description="زنگ‌هایی که در برنامهٔ کلاس‌ها به شما اختصاص داده شده"
    >
      <DashboardSectionBlock>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">زنگ‌های هفته</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 animate-pulse rounded-xl bg-white/5" />
            ) : periods.length === 0 ? (
              <p className="text-sm text-[var(--lux-text-muted)]">
                هنوز زنگی برای شما ثبت نشده. معلم کلاس یا معاون آموزشی باید زنگ را در برنامه بگذارد.
              </p>
            ) : (
              <ul className="space-y-2">
                {periods.map((p, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm"
                  >
                    <span>
                      {p.weekday_label} — {p.label}
                      {p.starts_at ? ` (${p.starts_at})` : ''}
                    </span>
                    <span className="text-[var(--lux-text-muted)]">
                      {p.subject_name || '—'} · {p.class?.name || '—'}
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
