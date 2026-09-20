'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Activity, Loader2, Pencil, Trash2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type ActivityRow = {
  id: string
  title: string
  activity_date: string
  location: string | null
  notes: string | null
}

export default function NurturingActivitiesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setActivityDate('')
    setLocation('')
    setNotes('')
  }

  const load = async () => {
    try {
      const res = await fetch('/api/nurturing/activities')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'دریافت فعالیت‌ها ناموفق بود')
        return
      }
      setActivities(json.activities || [])
      setError('')
    } catch {
      setError('خطای اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const startEdit = (item: ActivityRow) => {
    setEditingId(item.id)
    setTitle(item.title)
    setActivityDate(item.activity_date)
    setLocation(item.location || '')
    setNotes(item.notes || '')
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/nurturing/activities', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          title,
          activity_date: activityDate,
          location: location || null,
          notes: notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ذخیره فعالیت ناموفق بود')
        return
      }
      toast.success(editingId ? 'فعالیت بروزرسانی شد' : 'فعالیت ثبت شد')
      resetForm()
      if (editingId) {
        setActivities((current) =>
          current.map((row) => (row.id === json.activity.id ? json.activity : row))
        )
      } else {
        setActivities((current) => [json.activity, ...current])
      }
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('این فعالیت حذف شود؟')) return
    try {
      const res = await fetch('/api/nurturing/activities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'حذف ناموفق بود')
        return
      }
      toast.success('فعالیت حذف شد')
      setActivities((current) => current.filter((row) => row.id !== id))
      if (editingId === id) resetForm()
    } catch {
      toast.error('خطای اتصال به سرور')
    }
  }

  return (
    <DashboardPage kicker="معاون پرورشی" title="فعالیت‌های پرورشی">
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>عنوان</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
        </div>
        <div className="space-y-2">
          <Label>تاریخ</Label>
          <Input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>محل (اختیاری)</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>یادداشت</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ثبت فعالیت'}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              انصراف از ویرایش
            </Button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Activity} title="فهرست در دسترس نیست" description={error} />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="هنوز فعالیتی ثبت نشده"
          description="اولین رویداد پرورشی را از فرم بالا بسازید."
        />
      ) : (
        <div className="space-y-3">
          {activities.map((item) => (
            <GlassCard key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-[var(--lux-text-muted)]">
                    {item.activity_date}
                    {item.location ? ` · ${item.location}` : ''}
                  </p>
                  {item.notes ? <p className="text-sm mt-2 leading-loose">{item.notes}</p> : null}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}>
                    <Pencil className="h-3.5 w-3.5 ml-1" />
                    ویرایش
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void onDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
