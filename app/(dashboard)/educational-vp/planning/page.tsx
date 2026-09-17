'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { SchoolWeekday } from '@/lib/timetable/defaults'

type ClassRow = { id: string; name: string; grade: number | null }

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

export default function EducationalVpPlanningPage() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [classId, setClassId] = useState('')
  const [bells, setBells] = useState<WeekGridBell[]>([])
  const [cells, setCells] = useState<WeekGridCell[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([])
  const [versionId, setVersionId] = useState<string | null>(null)
  const [status, setStatus] = useState<'draft' | 'locked' | null>(null)
  const [canLock, setCanLock] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [closureDate, setClosureDate] = useState('')
  const [closureTitle, setClosureTitle] = useState('')
  const [newVersionFrom, setNewVersionFrom] = useState('')

  const loadClasses = useCallback(async () => {
    const res = await fetch('/api/classes?limit=100')
    const data = await res.json().catch(() => ({}))
    const list = (data.classes || data || []) as ClassRow[]
    if (Array.isArray(list) && list.length) {
      setClasses(list)
      if (!classId) setClassId(list[0]!.id)
      return
    }
    // fallback: admin students scope
    const res2 = await fetch('/api/admin/data-flow')
    if (res2.ok) {
      /* ignore */
    }
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
        (data.teachers || []).map((t: { id: string; full_name: string | null }) => ({
          id: t.id,
          full_name: t.full_name || 'بدون نام',
        }))
      )
      setVersionId(data.version?.id ?? null)
      setStatus(data.version?.status ?? null)
      setCanLock(Boolean(data.canLock))
      setCanEdit(Boolean(data.canEdit) || Boolean(data.canLock))
      setCells(
        ((data.slots || []) as SlotApi[]).map((s) => ({
          weekday: s.weekday as SchoolWeekday,
          slot_index: s.slot_index,
          subject_id: s.subject_id,
          teacher_id: s.teacher_id,
          subject_name: joinName(s.school_subjects),
          teacher_name: joinName(s.profiles),
        }))
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      // لیست کلاس‌های مدرسه از API عمومی کلاس‌ها
      try {
        const res = await fetch('/api/teacher/class-students')
        // educational_vp may not have this — try schools classes via admin
      } catch {
        /* ignore */
      }
      const adminRes = await fetch('/api/admin/users?role=student&limit=1')
      void adminRes
      const classesRes = await fetch('/api/classes')
      if (classesRes.ok) {
        const data = await classesRes.json()
        const list = (data.classes || data.data || []) as ClassRow[]
        if (Array.isArray(list) && list.length > 0) {
          setClasses(list)
          setClassId(list[0]!.id)
          return
        }
      }
      // آخرین راه: از timetable mine / school
      setClasses([])
    })()
  }, [])

  useEffect(() => {
    if (classId) void loadTimetable(classId)
  }, [classId, loadTimetable])

  // Load classes for edu-vp via dedicated endpoint - create simple one if needed
  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/timetable/school-classes')
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.classes) && data.classes.length) {
        setClasses(data.classes)
        if (!classId) setClassId(data.classes[0].id)
      }
    })()
  }, [classId])

  const save = async () => {
    if (!classId) return
    const res = await fetch(`/api/classes/${classId}/timetable`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version_id: versionId || undefined,
        slots: cells.map((c) => ({
          weekday: c.weekday,
          slot_index: c.slot_index,
          subject_id: c.subject_id,
          teacher_id: c.teacher_id,
        })),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'ذخیره ناموفق')
      return
    }
    toast.success('ذخیره شد')
    if (data.version_id) setVersionId(data.version_id)
    await loadTimetable(classId)
  }

  const lock = async () => {
    const res = await fetch(`/api/classes/${classId}/timetable/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version_id: versionId }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'قفل ناموفق')
      return
    }
    toast.success('برنامه قفل شد')
    await loadTimetable(classId)
  }

  const unlock = async () => {
    const res = await fetch(`/api/classes/${classId}/timetable/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version_id: versionId }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'باز کردن قفل ناموفق')
      return
    }
    toast.success('قفل باز شد')
    await loadTimetable(classId)
  }

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
    if (classId) await loadTimetable(classId)
  }

  const addClosure = async () => {
    if (!closureDate || !closureTitle.trim()) return
    const res = await fetch('/api/academic-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        on_date: closureDate,
        kind: 'school_closure',
        title: closureTitle.trim(),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'خطا')
      return
    }
    toast.success('تعطیلی ثبت شد')
    setClosureDate('')
    setClosureTitle('')
  }

  const newVersion = async () => {
    if (!newVersionFrom || !classId) return
    const res = await fetch(`/api/classes/${classId}/timetable/new-version`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ effective_from: newVersionFrom }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'خطا')
      return
    }
    toast.success('نسخهٔ جدید ساخته شد')
    await loadTimetable(classId)
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
    toast.success('قالب زنگ به پیش‌فرض برگشت')
    if (classId) await loadTimetable(classId)
  }

  return (
    <DashboardPage
      title="برنامه‌ریزی آموزشی"
      description="برنامهٔ کلاسی، قفل، قالب زنگ، درس‌ها و تعطیلات"
    >
      <DashboardSectionBlock>
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">برنامهٔ کلاس‌ها</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="انتخاب کلاس" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.grade != null ? ` — پایه ${c.grade}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {status && (
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs">
                  {status === 'locked' ? 'قفل' : 'پیش‌نویس'}
                </span>
              )}
              {canEdit && status !== 'locked' && (
                <Button size="sm" onClick={() => void save()}>
                  ذخیره
                </Button>
              )}
              {canLock && status !== 'locked' && (
                <Button size="sm" variant="outline" onClick={() => void lock()}>
                  قفل
                </Button>
              )}
              {canLock && status === 'locked' && (
                <Button size="sm" variant="outline" onClick={() => void unlock()}>
                  باز کردن قفل
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 animate-pulse rounded-xl bg-white/5" />
            ) : classId ? (
              <WeekGrid
                bells={bells}
                cells={cells}
                subjects={subjects}
                teachers={teachers}
                editable={canEdit && status !== 'locked'}
                onChange={setCells}
              />
            ) : (
              <p className="text-sm text-[var(--lux-text-muted)]">کلاسی انتخاب نشده</p>
            )}
          </CardContent>
        </Card>
      </DashboardSectionBlock>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">درس جدید</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="نام درس"
            />
            <Button onClick={() => void addSubject()}>افزودن</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تعطیلی مدرسه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>تاریخ (میلادی YYYY-MM-DD)</Label>
            <Input
              dir="ltr"
              value={closureDate}
              onChange={(e) => setClosureDate(e.target.value)}
              placeholder="2026-03-21"
            />
            <Input
              value={closureTitle}
              onChange={(e) => setClosureTitle(e.target.value)}
              placeholder="عنوان"
            />
            <Button onClick={() => void addClosure()}>ثبت</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نسخه از تاریخ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              dir="ltr"
              value={newVersionFrom}
              onChange={(e) => setNewVersionFrom(e.target.value)}
              placeholder="2026-01-01"
            />
            <Button variant="outline" onClick={() => void newVersion()}>
              ساخت نسخهٔ جدید
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">قالب زنگ</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void resetBells()}>
              بازگردانی به پیش‌فرض ۷:۴۵–۱۳:۱۵
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardPage>
  )
}
