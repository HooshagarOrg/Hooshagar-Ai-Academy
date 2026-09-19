'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Award, Loader2 } from 'lucide-react'
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

type Student = { id: string; name: string }
type Badge = { id: string; name: string; name_fa?: string | null }

export default function TeacherAwardBadgesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [studentUserId, setStudentUserId] = useState('')
  const [badgeId, setBadgeId] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [studentsRes, badgesRes] = await Promise.all([
          fetch('/api/teacher/class-students'),
          fetch('/api/badges'),
        ])
        const studentsJson = await studentsRes.json()
        const badgesJson = await badgesRes.json()

        if (!studentsRes.ok) {
          setError(studentsJson.error || 'دریافت دانش‌آموزان ناموفق بود')
        } else {
          const options = (
            (studentsJson.students || []) as Array<{
              id: string
              name: string
              userId?: string | null
              user_id?: string | null
            }>
          )
            .map((s) => ({
              id: s.userId || s.user_id || '',
              name: s.name,
            }))
            .filter((s) => s.id.length > 0)
          setStudents(options)
        }

        setBadges((badgesJson.badges || []) as Badge[])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentUserId || !badgeId) {
      toast.error('دانش‌آموز و نشان را انتخاب کنید')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/badges/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: studentUserId,
          badge_id: badgeId,
          reason: reason.trim() || 'اعطای دستی توسط معلم',
          notify_parent: true,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        toast.error(json.error || 'اعطای نشان ناموفق بود')
        return
      }
      toast.success('نشان اعطا شد')
      setReason('')
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="معلم" title="اعطای نشان">
      {loading ? (
        <div className="flex justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Award} title="اعطای نشان در دسترس نیست" description={error} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Award}
          title="دانش‌آموز قابل اعطا نیست"
          description="دانش‌آموز باید حساب کاربری داشته باشد تا نشان به پروفایلش وصل شود."
        />
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
          <div className="space-y-2">
            <Label>دانش‌آموز</Label>
            <Select value={studentUserId} onValueChange={setStudentUserId}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>نشان</Label>
            <Select value={badgeId} onValueChange={setBadgeId}>
              <SelectTrigger>
                <SelectValue placeholder={badges.length ? 'انتخاب نشان' : 'نشانی تعریف نشده'} />
              </SelectTrigger>
              <SelectContent>
                {badges.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name_fa || b.name || b.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>دلیل</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              minLength={5}
              required
            />
          </div>
          <Button type="submit" disabled={saving || !badgeId}>
            {saving ? 'در حال اعطا...' : 'اعطای نشان'}
          </Button>
        </form>
      )}
    </DashboardPage>
  )
}
