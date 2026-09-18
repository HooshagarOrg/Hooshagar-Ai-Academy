'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
type SchoolOpt = { id: string; name: string }

function withSchool(path: string, schoolId: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams()
  if (schoolId) params.set('school_id', schoolId)
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, v)
  }
  const q = params.toString()
  return q ? `${path}?${q}` : path
}

export default function AdminTimetableSettingsPage() {
  const [schools, setSchools] = useState<SchoolOpt[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [bells, setBells] = useState<Bell[]>([])
  const [days, setDays] = useState<CalDay[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [schoolsReady, setSchoolsReady] = useState(false)

  const reload = useCallback(async (sid: string) => {
    const [s, b, c] = await Promise.all([
      fetch(withSchool('/api/school/subjects', sid, { active: '0' })).then((r) =>
        r.json().catch(() => ({}))
      ),
      fetch(withSchool('/api/school/bell-slots', sid)).then((r) =>
        r.json().catch(() => ({}))
      ),
      fetch(withSchool('/api/academic-calendar', sid)).then((r) =>
        r.json().catch(() => ({}))
      ),
    ])
    const err = s.error || b.error
    setLoadError(typeof err === 'string' ? err : null)
    setSubjects(s.subjects || [])
    setBells(b.slots || [])
    setDays(c.days || [])
  }, [])

  useEffect(() => {
    fetch('/api/admin/schools')
      .then((r) => r.json().catch(() => ({})))
      .then((d) => {
        const list: SchoolOpt[] = (d.schools || []).map(
          (row: { id: string; name: string }) => ({ id: row.id, name: row.name })
        )
        setSchools(list)
        if (list.length === 1 && list[0]) setSchoolId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setSchoolsReady(true))
  }, [])

  useEffect(() => {
    if (!schoolsReady) return
    if (schools.length > 0 && !schoolId) return
    void reload(schoolId)
  }, [schoolId, schools.length, schoolsReady, reload])

  const addSubject = async () => {
    if (!newSubject.trim()) return
    const res = await fetch('/api/school/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newSubject.trim(),
        ...(schoolId ? { school_id: schoolId } : {}),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error || 'خطا')
      return
    }
    toast.success('درس اضافه شد')
    setNewSubject('')
    await reload(schoolId)
  }

  const resetBells = async () => {
    const res = await fetch('/api/school/bell-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true, ...(schoolId ? { school_id: schoolId } : {}) }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error || 'خطا')
      return
    }
    toast.success('قالب بازگردانی شد')
    await reload(schoolId)
  }

  return (
    <DashboardPage
      title="تنظیمات برنامهٔ کلاسی"
      description="درس‌ها، قالب زنگ و تعطیلات"
    >
      {schools.length > 0 && (
        <div className="mb-4 flex justify-end">
          <Select value={schoolId} onValueChange={setSchoolId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="انتخاب مدرسه" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {loadError && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {loadError}
        </p>
      )}
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
