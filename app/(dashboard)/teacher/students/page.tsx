'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, ClipboardCheck, GraduationCap, Heart } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageLoading } from '@/components/ui/page-states'
import { Button } from '@/components/ui/button'

type ClassInfo = { id: string; name: string; grade: number }
type StudentRow = {
  id: string
  name: string
  grade?: number
  classId?: string | null
  className?: string
}

export default function TeacherStudentsPage(): JSX.Element {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/teacher/class-students')
      const data = (await res.json()) as {
        classes?: ClassInfo[]
        students?: StudentRow[]
        error?: string
      }
      if (!res.ok) {
        throw new Error(data.error || 'خطا در دریافت کلاس')
      }
      setClasses(data.classes ?? [])
      setStudents(data.students ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت کلاس')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const classLabel =
    classes.length === 1 && classes[0]
      ? `${classes[0].name} — پایه ${classes[0].grade}`
      : classes.length > 1
        ? `${classes.length} کلاس`
        : undefined

  return (
    <DashboardPage
      title="کلاس"
      description={classLabel || 'فهرست دانش‌آموزان کلاس شما'}
    >
      {loading ? (
        <PageLoading label="در حال بارگذاری کلاس..." compact />
      ) : error ? (
        <PageErrorState
          title="کلاس بارگذاری نشد"
          message={error}
          onRetry={() => void load()}
        />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={classes.length === 0 ? 'کلاسی به شما وصل نیست' : 'دانش‌آموزی در کلاس نیست'}
          description={
            classes.length === 0
              ? 'از مدیر بخواهید در «مدیریت کاربران» کلاس هوم‌روم را به حساب شما وصل کند. معلمان هنر و ورزش دانش‌آموزان کل مدرسه را می‌بینند.'
              : 'اگر تازه واردسازی شده‌اند، چند دقیقه بعد دوباره امتحان کنید.'
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="min-h-10">
              <Link href="/teacher/attendance">
                <ClipboardCheck className="ml-2 h-4 w-4" />
                حضور و غیاب
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-10">
              <Link href="/teacher/grades">
                <GraduationCap className="ml-2 h-4 w-4" />
                نمرات
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-10">
              <Link href="/teacher/behavior">
                <Heart className="ml-2 h-4 w-4" />
                رفتار
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full min-w-[480px] text-right text-sm">
              <thead className="bg-white/[0.03] text-[var(--lux-text-muted)]">
                <tr>
                  <th className="p-3 font-medium">نام</th>
                  <th className="p-3 font-medium">پایه</th>
                  <th className="p-3 font-medium">کلاس</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t border-white/[0.06]">
                    <td className="p-3 font-medium text-[var(--lux-text)]">{student.name}</td>
                    <td className="p-3 text-[var(--lux-text-muted)]">{student.grade ?? '—'}</td>
                    <td className="p-3 text-[var(--lux-text-muted)]">{student.className || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--lux-text-muted)]">
            {students.length} دانش‌آموز
          </p>
        </div>
      )}
    </DashboardPage>
  )
}
