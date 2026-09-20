'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Heart, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { EmptyState } from '@/components/ui/empty-state'
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

type StudentOption = { id: string; full_name: string | null }

export default function CounselorFamilyInsightPage() {
  const [students, setStudents] = useState<StudentOption[]>([])
  const [studentId, setStudentId] = useState('')
  const [homeEnvironment, setHomeEnvironment] = useState('')
  const [parentCooperation, setParentCooperation] = useState('')
  const [concerns, setConcerns] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadStudents = async () => {
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
        toast.error('دریافت دانش‌آموزان ناموفق بود')
      } finally {
        setLoading(false)
      }
    }
    void loadStudents()
  }, [])

  useEffect(() => {
    if (!studentId) return
    const loadForm = async () => {
      try {
        const res = await fetch(`/api/counseling/family-insight?student_id=${studentId}`)
        const json = await res.json()
        const form = json.form?.form_data as Record<string, string> | undefined
        if (!form) return
        setHomeEnvironment(form.home_environment || '')
        setParentCooperation(form.parent_cooperation || '')
        setConcerns(form.concerns || '')
      } catch {
        // پیش‌نویس اختیاری
      }
    }
    void loadForm()
  }, [studentId])

  const onSave = async (status: 'draft' | 'completed') => {
    if (!studentId) {
      toast.error('دانش‌آموز را انتخاب کنید')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/counseling/family-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          form_data: {
            home_environment: homeEnvironment.trim(),
            parent_cooperation: parentCooperation.trim(),
            concerns: concerns.trim(),
          },
          status,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ذخیره ناموفق بود')
        return
      }
      toast.success(status === 'completed' ? 'فرم نهایی شد' : 'پیش‌نویس ذخیره شد')
    } catch {
      toast.error('خطای اتصال')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardPage kicker="مشاور" title="بینش خانواده">
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage kicker="مشاور" title="بینش خانواده">
      <p className="text-sm text-[var(--lux-text-muted)] leading-loose mb-6 max-w-xl">
        یادداشت ساختارمند دربارهٔ خانواده و محیط خانه — روی دادهٔ واقعی ذخیره می‌شود.
      </p>

      {students.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="دانش‌آموزی نیست"
          description="ابتدا دانش‌آموزان مدرسه را ثبت کنید."
        />
      ) : (
        <div className="grid gap-4 max-w-xl">
          <div className="space-y-2">
            <Label>دانش‌آموز</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>محیط خانواده</Label>
            <Textarea
              value={homeEnvironment}
              onChange={(e) => setHomeEnvironment(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>همکاری والدین</Label>
            <Textarea
              value={parentCooperation}
              onChange={(e) => setParentCooperation(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>نگرانی‌ها و نکات</Label>
            <Textarea value={concerns} onChange={(e) => setConcerns(e.target.value)} rows={4} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => void onSave('draft')}>
              ذخیره پیش‌نویس
            </Button>
            <Button type="button" disabled={saving} onClick={() => void onSave('completed')}>
              {saving ? 'در حال ذخیره...' : 'ثبت نهایی'}
            </Button>
          </div>
        </div>
      )}
    </DashboardPage>
  )
}
