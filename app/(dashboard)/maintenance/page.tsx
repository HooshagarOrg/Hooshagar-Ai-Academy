'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Wrench, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type RequestRow = {
  id: string
  title: string
  area: string | null
  priority: string
  status: string
  description: string | null
}

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<RequestRow[]>([])
  const [title, setTitle] = useState('')
  const [area, setArea] = useState('')
  const [priority, setPriority] = useState('medium')
  const [description, setDescription] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/maintenance/requests')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'دریافت درخواست‌ها ناموفق بود')
        return
      }
      setItems(json.requests || [])
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/maintenance/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          area: area || null,
          priority,
          description: description || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت درخواست ناموفق بود')
        return
      }
      toast.success('درخواست ثبت شد')
      setTitle('')
      setArea('')
      setDescription('')
      setItems((c) => [json.request, ...c])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/maintenance/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'بروزرسانی ناموفق بود')
        return
      }
      setItems((c) => c.map((row) => (row.id === id ? { ...row, status } : row)))
    } catch {
      toast.error('خطای اتصال به سرور')
    }
  }

  return (
    <DashboardPage kicker="تأسیسات" title="درخواست تعمیر">
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>عنوان</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
        </div>
        <div className="space-y-2">
          <Label>محل</Label>
          <Input value={area} onChange={(e) => setArea(e.target.value)} />
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
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>توضیح</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ثبت...' : 'ثبت درخواست'}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Wrench} title="درخواست‌ها در دسترس نیست" description={error} />
      ) : items.length === 0 ? (
        <EmptyState icon={Wrench} title="درخواستی نیست" description="اولین درخواست تعمیر را ثبت کنید." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GlassCard key={item.id} className="p-4 space-y-2">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">
                {item.priority} · {item.status}
                {item.area ? ` · ${item.area}` : ''}
              </p>
              {item.description ? (
                <p className="text-sm leading-loose">{item.description}</p>
              ) : null}
              {item.status !== 'done' ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void setStatus(item.id, 'in_progress')}
                  >
                    در حال انجام
                  </Button>
                  <Button type="button" size="sm" onClick={() => void setStatus(item.id, 'done')}>
                    انجام شد
                  </Button>
                </div>
              ) : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
