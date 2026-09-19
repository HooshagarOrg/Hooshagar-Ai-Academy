'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Activity, Loader2 } from 'lucide-react'
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
  const [title, setTitle] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/nurturing/activities')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'دریافت فعالیت‌ها ناموفق بود')
        return
      }
      setActivities(json.activities || [])
    } catch {
      setError('خطای اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/nurturing/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          activity_date: activityDate,
          location: location || null,
          notes: notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت فعالیت ناموفق بود')
        return
      }
      toast.success('فعالیت ثبت شد')
      setTitle('')
      setActivityDate('')
      setLocation('')
      setNotes('')
      setActivities((current) => [json.activity, ...current])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
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
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ثبت...' : 'ثبت فعالیت'}
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Activity} title="فهرست در دسترس نیست" description={error} />
      ) : activities.length === 0 ? (
        <EmptyState icon={Activity} title="هنوز فعالیتی ثبت نشده" description="اولین رویداد پرورشی را از فرم بالا بسازید." />
      ) : (
        <div className="space-y-3">
          {activities.map((item) => (
            <GlassCard key={item.id} className="p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">
                {item.activity_date}
                {item.location ? ` · ${item.location}` : ''}
              </p>
              {item.notes ? <p className="text-sm mt-2 leading-loose">{item.notes}</p> : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
