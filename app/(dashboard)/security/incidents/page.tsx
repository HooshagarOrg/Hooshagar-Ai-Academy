'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, Loader2 } from 'lucide-react'
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

type Incident = {
  id: string
  title: string
  severity: string
  status: string
  description: string | null
  created_at: string
}

export default function SecurityIncidentsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Incident[]>([])
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [description, setDescription] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/security/incidents')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'دریافت رخدادها ناموفق بود')
        return
      }
      setItems(json.incidents || [])
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
      const res = await fetch('/api/security/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, severity, description: description || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت رخداد ناموفق بود')
        return
      }
      toast.success('رخداد ثبت شد')
      setTitle('')
      setDescription('')
      setItems((c) => [json.incident, ...c])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="حراست" title="رخدادها">
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>عنوان</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
        </div>
        <div className="space-y-2">
          <Label>شدت</Label>
          <Select value={severity} onValueChange={setSeverity}>
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
          {saving ? 'در حال ثبت...' : 'ثبت رخداد'}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={AlertCircle} title="رخدادها در دسترس نیست" description={error} />
      ) : items.length === 0 ? (
        <EmptyState icon={AlertCircle} title="رخدادی ثبت نشده" description="اولین رخداد را ثبت کنید." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GlassCard key={item.id} className="p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">
                {item.severity} · {item.status}
              </p>
              {item.description ? (
                <p className="text-sm mt-2 leading-loose">{item.description}</p>
              ) : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
