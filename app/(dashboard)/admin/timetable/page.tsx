'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

type Subject = { id: string; name: string; is_active: boolean }
type Bell = {
  slot_index: number
  kind: string
  starts_at: string
  ends_at: string
  label: string
}
type CalDay = { id: string; on_date: string; kind: string; title: string }

export default function AdminTimetableSettingsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [bells, setBells] = useState<Bell[]>([])
  const [days, setDays] = useState<CalDay[]>([])
  const [newSubject, setNewSubject] = useState('')

  const reload = async () => {
    const [s, b, c] = await Promise.all([
      fetch('/api/school/subjects?active=0').then((r) => r.json()),
      fetch('/api/school/bell-slots').then((r) => r.json()),
      fetch('/api/academic-calendar').then((r) => r.json()),
    ])
    setSubjects(s.subjects || [])
    setBells(b.slots || [])
    setDays(c.days || [])
  }

  useEffect(() => {
    void reload()
  }, [])

  const addSubject = async () => {
    if (!newSubject.trim()) return
    const res = await fetch('/api/school/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubject.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'خطا')
      return
    }
    toast.success('درس اضافه شد')
    setNewSubject('')
    await reload()
  }

  const resetBells = async () => {
    const res = await fetch('/api/school/bell-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true }),
    })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'خطا')
      return
    }
    toast.success('قالب بازگردانی شد')
    await reload()
  }

  return (
    <DashboardPage
      title="تنظیمات برنامهٔ کلاسی"
      description="درس‌ها، قالب زنگ و تعطیلات"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardSectionBlock>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">فهرست درس‌ها</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="درس جدید"
                />
                <Button onClick={() => void addSubject()}>افزودن</Button>
              </div>
              <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                {subjects.map((s) => (
                  <li key={s.id} className="flex justify-between border-b border-white/5 py-1">
                    <span>{s.name}</span>
                    {!s.is_active && (
                      <span className="text-xs text-[var(--lux-text-muted)]">غیرفعال</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </DashboardSectionBlock>

        <DashboardSectionBlock>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">قالب زنگ</CardTitle>
              <Button size="sm" variant="outline" onClick={() => void resetBells()}>
                پیش‌فرض
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {bells.map((b) => (
                  <li key={b.slot_index} className="flex justify-between">
                    <span>
                      {b.label}{' '}
                      <span className="text-xs text-[var(--lux-text-muted)]">({b.kind})</span>
                    </span>
                    <span dir="ltr" className="text-[var(--lux-text-muted)]">
                      {String(b.starts_at).slice(0, 5)}–{String(b.ends_at).slice(0, 5)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </DashboardSectionBlock>

        <DashboardSectionBlock>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تقویم / تعطیلات</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                {days.slice(0, 40).map((d) => (
                  <li key={d.id} className="flex justify-between gap-2">
                    <span>{d.title}</span>
                    <span className="text-[var(--lux-text-muted)]" dir="ltr">
                      {d.on_date}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </DashboardSectionBlock>
      </div>
    </DashboardPage>
  )
}
