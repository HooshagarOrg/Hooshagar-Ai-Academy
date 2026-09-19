'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = ['رفتاری', 'تحصیلی', 'خانوادگی', 'اجتماعی', 'عاطفی', 'اضطراب', 'افسردگی']

type StudentOption = { id: string; full_name: string | null }

export default function NewCounselingRecordPage() {
  const router = useRouter()
  const [students, setStudents] = useState<StudentOption[]>([])
  const [studentId, setStudentId] = useState('')
  const [category, setCategory] = useState('تحصیلی')
  const [priority, setPriority] = useState('medium')
  const [summary, setSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/students?limit=100')
        const json = await res.json()
        const rows = (json.students || []) as Array<{
          id: string
          full_name?: string | null
          profiles?: { full_name?: string } | { full_name?: string }[]
        }>
        setStudents(
          rows.map((row) => {
            const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
            return {
              id: row.id,
              full_name: row.full_name || profile?.full_name || 'دانش‌آموز',
            }
          })
        )
      } catch {
        toast.error('دریافت فهرست دانش‌آموزان ناموفق بود')
      } finally {
        setLoadingStudents(false)
      }
    }
    void load()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) {
      toast.error('دانش‌آموز را انتخاب کنید')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/counseling/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          issue_categories: [category],
          priority_level: priority,
          summary: summary.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت پرونده ناموفق بود')
        return
      }
      toast.success('پرونده ثبت شد')
      router.push(`/counselor/records/${json.record.id}`)
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="مشاور" title="پرونده جدید">
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <Label>دانش‌آموز</Label>
          <Select value={studentId} onValueChange={setStudentId} disabled={loadingStudents}>
            <SelectTrigger>
              <SelectValue placeholder={loadingStudents ? 'در حال بارگذاری...' : 'انتخاب دانش‌آموز'} />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>دسته‌بندی</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>اولویت</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">کم</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="high">بالا</SelectItem>
              <SelectItem value="urgent">فوری</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>خلاصه</Label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            maxLength={2000}
          />
        </div>
        <Button type="submit" disabled={saving || loadingStudents}>
          {saving ? 'در حال ثبت...' : 'ثبت پرونده'}
        </Button>
      </form>
    </DashboardPage>
  )
}
