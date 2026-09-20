'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type AttendanceStats = {
  presentCount?: number
  absentCount?: number
  lateCount?: number
  attendanceRate?: number
  totalStudents?: number
  pendingFollowups?: number
}

type ClassInfo = { id: string; name: string | null; grade: number | null }
type StudentRow = { id: string; name: string; classId: string | null }
type Status = 'present' | 'absent' | 'late' | 'excused' | 'sick'

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: 'present', label: 'حاضر' },
  { value: 'absent', label: 'غایب' },
  { value: 'late', label: 'تأخیر' },
  { value: 'excused', label: 'با اجازه' },
  { value: 'sick', label: 'بیمار' },
]

export default function DisciplineAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, rosterRes] = await Promise.all([
          fetch('/api/attendance/stats?type=school'),
          fetch('/api/teacher/class-students'),
        ])
        const statsJson = await statsRes.json()
        const rosterJson = await rosterRes.json()

        if (!statsRes.ok || statsJson.error) {
          setError(statsJson.error || 'دریافت حضور و غیاب ناموفق بود')
        } else {
          setStats(statsJson)
        }

        if (!rosterRes.ok) {
          toast.error(rosterJson.error || 'دریافت کلاس‌ها ناموفق بود')
        } else {
          setClasses(rosterJson.classes || [])
          setStudents(
            (rosterJson.students || []).map(
              (s: { id: string; name: string; classId: string | null }) => ({
                id: s.id,
                name: s.name,
                classId: s.classId,
              })
            )
          )
        }
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === selectedClass),
    [students, selectedClass]
  )

  useEffect(() => {
    setStatuses((previous) => {
      const next: Record<string, Status> = {}
      for (const student of classStudents) {
        next[student.id] = previous[student.id] || 'present'
      }
      return next
    })
  }, [classStudents])

  const markAllPresent = () => {
    const next: Record<string, Status> = {}
    for (const student of classStudents) next[student.id] = 'present'
    setStatuses(next)
  }

  const saveAttendance = async () => {
    if (!selectedClass) {
      toast.error('کلاس را انتخاب کنید')
      return
    }
    if (classStudents.length === 0) {
      toast.error('دانش‌آموزی در این کلاس نیست')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: classStudents.map((student) => ({
            student_id: student.id,
            date,
            status: statuses[student.id] || 'present',
            class_id: selectedClass,
            notify_parent: true,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت حضور ناموفق بود')
        return
      }
      toast.success(`${json.saved ?? classStudents.length} حضور ثبت شد`)
      const statsRes = await fetch('/api/attendance/stats?type=school')
      const statsJson = await statsRes.json()
      if (statsRes.ok && !statsJson.error) setStats(statsJson)
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="معاون انضباطی" title="حضور و غیاب مدرسه">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error && !stats ? (
        <EmptyState icon={ClipboardCheck} title="آمار حضور در دسترس نیست" description={error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            <GlassCard className="p-4">دانش‌آموز: {stats?.totalStudents ?? 0}</GlassCard>
            <GlassCard className="p-4">نرخ حضور: {stats?.attendanceRate ?? 0}٪</GlassCard>
            <GlassCard className="p-4">حاضر: {stats?.presentCount ?? 0}</GlassCard>
            <GlassCard className="p-4">غایب: {stats?.absentCount ?? 0}</GlassCard>
            <GlassCard className="p-4">تأخیر: {stats?.lateCount ?? 0}</GlassCard>
            <GlassCard className="p-4">پیگیری باز: {stats?.pendingFollowups ?? 0}</GlassCard>
          </div>

          <GlassCard className="p-5 space-y-4">
            <h2 className="font-semibold text-lg">ثبت حضور کلاس</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>کلاس</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کلاس" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name || 'کلاس'}
                        {cls.grade != null ? ` (پایه ${cls.grade})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>تاریخ</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            {!selectedClass ? (
              <p className="text-sm text-[var(--lux-text-muted)]">برای ثبت حضور یک کلاس انتخاب کنید.</p>
            ) : classStudents.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="دانش‌آموزی در این کلاس نیست"
                description="پس از تخصیص دانش‌آموز به کلاس، اینجا فهرست می‌آید."
              />
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={markAllPresent}>
                    همه حاضر
                  </Button>
                  <Button type="button" onClick={saveAttendance} disabled={saving}>
                    {saving ? 'در حال ثبت...' : 'ذخیره حضور'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {classStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-white/10 p-3"
                    >
                      <p className="font-medium">{student.name}</p>
                      <Select
                        value={statuses[student.id] || 'present'}
                        onValueChange={(value) =>
                          setStatuses((current) => ({
                            ...current,
                            [student.id]: value as Status,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </>
            )}
          </GlassCard>
        </>
      )}
    </DashboardPage>
  )
}
