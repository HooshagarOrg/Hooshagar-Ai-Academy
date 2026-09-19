'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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

const CATEGORIES = ['رفتاری', 'تحصیلی', 'خانوادگی', 'اجتماعی', 'عاطفی', 'اضطراب', 'افسردگی']

type RecordDetail = {
  id: string
  status: string
  priority_level: string
  summary: string | null
  initial_assessment: string | null
  issue_categories: string[]
  student?: { full_name?: string } | null
}

export default function CounselorRecordEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [category, setCategory] = useState('تحصیلی')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('active')
  const [summary, setSummary] = useState('')
  const [assessment, setAssessment] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/counseling/records/${params.id}`)
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'پرونده یافت نشد')
          return
        }
        const record = (json.record || json) as RecordDetail
        setStudentName(record.student?.full_name || 'پرونده مشاوره')
        setCategory(record.issue_categories?.[0] || 'تحصیلی')
        setPriority(record.priority_level || 'medium')
        setStatus(record.status || 'active')
        setSummary(record.summary || '')
        setAssessment(record.initial_assessment || '')
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [params.id])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/counseling/records/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_categories: [category],
          priority_level: priority,
          status,
          summary: summary.trim() || undefined,
          initial_assessment: assessment.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ذخیره پرونده ناموفق بود')
        return
      }
      toast.success('پرونده بروزرسانی شد')
      router.push(`/counselor/records/${params.id}`)
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage
      kicker="مشاور"
      title={loading ? 'ویرایش پرونده' : `ویرایش: ${studentName}`}
      actions={
        <Button asChild variant="outline">
          <Link href={`/counselor/records/${params.id}`}>بازگشت</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState title="پرونده در دسترس نیست" description={error} />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
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
            <Label>وضعیت</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="closed">بسته</SelectItem>
                <SelectItem value="referred">ارجاع‌شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>خلاصه</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>ارزیابی اولیه</Label>
            <Textarea
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              rows={4}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </Button>
        </form>
      )}
    </DashboardPage>
  )
}
