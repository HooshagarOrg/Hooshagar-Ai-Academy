'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import {
  WeekGrid,
  type WeekGridBell,
  type WeekGridCell,
} from '@/components/timetable/WeekGrid'
import { isElementaryGrade } from '@/lib/timetable/defaults'
import type { SchoolWeekday } from '@/lib/timetable/defaults'

type ClassOption = { id: string; name: string; grade: number | null }

type SlotApi = {
  weekday: number
  slot_index: number
  subject_id: string | null
  teacher_id: string | null
  school_subjects?: { name: string } | { name: string }[] | null
  profiles?: { full_name: string } | { full_name: string }[] | null
}

function joinName(
  rel: { name?: string; full_name?: string } | { name?: string; full_name?: string }[] | null | undefined
): string | null {
  if (!rel) return null
  const row = Array.isArray(rel) ? rel[0] : rel
  return row?.name || row?.full_name || null
}

export default function TeacherTimetablePage() {
  const [tab, setTab] = useState<'class' | 'mine'>('class')
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [classId, setClassId] = useState<string>('')
  const [bells, setBells] = useState<WeekGridBell[]>([])
  const [cells, setCells] = useState<WeekGridCell[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([])
  const [versionId, setVersionId] = useState<string | null>(null)
  const [status, setStatus] = useState<'draft' | 'locked' | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [homeroomTeacherId, setHomeroomTeacherId] = useState<string | null>(null)
  const [grade, setGrade] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [minePeriods, setMinePeriods] = useState<
    Array<{
      weekday_label: string
      label: string
      starts_at: string | null
      subject_name: string | null
      class: { name: string } | null
    }>
  >([])
  const [copySource, setCopySource] = useState('')

  const loadClasses = useCallback(async () => {
    const res = await fetch('/api/teacher/class-students')
    const data = await res.json().catch(() => ({}))
    const list = (data.classes || []) as ClassOption[]
    setClasses(list)
    if (!classId && list[0]) setClassId(list[0].id)
  }, [classId])

  const loadTimetable = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/classes/${id}/timetable`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطا')

      setBells(
        (data.bells || []).map(
          (b: {
            slot_index: number
            kind: string
            starts_at: string
            ends_at: string
            label: string
          }) => ({
            slot_index: b.slot_index,
            kind: b.kind as WeekGridBell['kind'],
            starts_at: String(b.starts_at).slice(0, 5),
            ends_at: String(b.ends_at).slice(0, 5),
            label: b.label,
          })
        )
      )
      setSubjects(data.subjects || [])
      setTeachers(
        (data.teachers || []).map(
          (t: { id: string; full_name: string | null }) => ({
            id: t.id,
            full_name: t.full_name || 'بدون نام',
          })
        )
      )
      setVersionId(data.version?.id ?? null)
      setStatus(data.version?.status ?? null)
      setCanEdit(Boolean(data.canEdit))
      setHomeroomTeacherId(data.class?.teacher_id ?? null)
      setGrade(data.class?.grade ?? null)

      const mapped: WeekGridCell[] = ((data.slots || []) as SlotApi[]).map(
        (s) => ({
          weekday: s.weekday as SchoolWeekday,
          slot_index: s.slot_index,
          subject_id: s.subject_id,
          teacher_id: s.teacher_id,
          subject_name: joinName(s.school_subjects),
          teacher_name: joinName(s.profiles),
        })
      )
      setCells(mapped)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در بارگذاری')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMine = useCallback(async () => {
    const res = await fetch('/api/timetable/mine')
    const data = await res.json()
    if (res.ok) setMinePeriods(data.periods || [])
  }, [])

  useEffect(() => {
    void loadClasses()
  }, [loadClasses])

  useEffect(() => {
    if (classId && tab === 'class') void loadTimetable(classId)
  }, [classId, tab, loadTimetable])

  useEffect(() => {
    if (tab === 'mine') void loadMine()
  }, [tab, loadMine])

  const defaultTeacherId = useMemo(() => {
    if (isElementaryGrade(grade)) return homeroomTeacherId
    return null
  }, [grade, homeroomTeacherId])

  const handleSave = async () => {
    if (!classId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/classes/${classId}/timetable`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_id: versionId || undefined,
          slots: cells.map((c) => ({
            weekday: c.weekday,
            slot_index: c.slot_index,
            subject_id: c.subject_id,
            teacher_id: c.teacher_id || defaultTeacherId,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ذخیره ناموفق')
      if (data.conflicts?.length) {
        toast.warning(`ذخیره شد ولی ${data.conflicts.length} تداخل وجود دارد`)
      } else {
        toast.success('برنامه ذخیره شد')
      }
      if (data.version_id) setVersionId(data.version_id)
      await loadTimetable(classId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!classId || !copySource) return
    setSaving(true)
    try {
      const res = await fetch(`/api/classes/${classId}/timetable/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_class_id: copySource }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'کپی ناموفق')
      toast.success('برنامه کپی شد')
      await loadTimetable(classId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage
      title="برنامهٔ کلاسی"
      description="جدول هفتگی کلاس و برنامهٔ شخصی شما"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={tab === 'class' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('class')}
        >
          برنامهٔ کلاس
        </Button>
        <Button
          variant={tab === 'mine' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('mine')}
        >
          برنامهٔ من
        </Button>
      </div>

      {tab === 'class' ? (
        <DashboardSectionBlock>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">ویرایش برنامه</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="کلاس" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {status === 'locked' && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                    قفل‌شده
                  </span>
                )}
                {canEdit && (
                  <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
                    {saving ? 'در حال ذخیره…' : 'ذخیره'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canEdit && status === 'locked' && (
                <p className="text-sm text-[var(--lux-text-muted)]">
                  برنامه قفل است. برای ویرایش از مدیر یا معاون آموزشی بخواهید قفل را باز کند.
                </p>
              )}
              {loading ? (
                <div className="h-48 animate-pulse rounded-xl bg-white/5" />
              ) : (
                <WeekGrid
                  bells={bells}
                  cells={cells}
                  subjects={subjects}
                  teachers={teachers}
                  editable={canEdit}
                  onChange={setCells}
                  defaultTeacherId={defaultTeacherId}
                />
              )}
              {canEdit && classes.length > 1 && (
                <div className="flex flex-wrap items-end gap-2 border-t border-white/10 pt-4">
                  <div>
                    <p className="mb-1 text-xs text-[var(--lux-text-muted)]">کپی از کلاس دیگر</p>
                    <Select value={copySource} onValueChange={setCopySource}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="کلاس مبدأ" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes
                          .filter((c) => c.id !== classId)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!copySource || saving}
                    onClick={() => void handleCopy()}
                  >
                    کپی برنامه
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </DashboardSectionBlock>
      ) : (
        <DashboardSectionBlock>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">زنگ‌های من در این هفته</CardTitle>
            </CardHeader>
            <CardContent>
              {minePeriods.length === 0 ? (
                <p className="text-sm text-[var(--lux-text-muted)]">
                  هنوز زنگی با نام شما در برنامه‌ها ثبت نشده است.
                </p>
              ) : (
                <ul className="space-y-2">
                  {minePeriods.map((p, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm"
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
      )}
    </DashboardPage>
  )
}
