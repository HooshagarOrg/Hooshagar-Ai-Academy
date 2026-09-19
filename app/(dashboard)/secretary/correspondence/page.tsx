'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Mail, Loader2 } from 'lucide-react'
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

type Item = {
  id: string
  direction: string
  subject: string
  party_name: string | null
  status: string
  body: string | null
  created_at: string
}

export default function SecretaryCorrespondencePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [direction, setDirection] = useState('in')
  const [subject, setSubject] = useState('')
  const [partyName, setPartyName] = useState('')
  const [body, setBody] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/secretary/correspondence')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'دریافت مکاتبات ناموفق بود')
        return
      }
      setItems(json.items || [])
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
      const res = await fetch('/api/secretary/correspondence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction,
          subject,
          party_name: partyName || null,
          body: body || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت مکاتبه ناموفق بود')
        return
      }
      toast.success('مکاتبه ثبت شد')
      setSubject('')
      setPartyName('')
      setBody('')
      setItems((current) => [json.item, ...current])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="منشی" title="مکاتبات">
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>جهت</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">ورودی</SelectItem>
              <SelectItem value="out">خروجی</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>موضوع</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} />
        </div>
        <div className="space-y-2">
          <Label>طرف مکاتبه</Label>
          <Input value={partyName} onChange={(e) => setPartyName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>متن</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ثبت...' : 'ثبت مکاتبه'}
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Mail} title="مکاتبات در دسترس نیست" description={error} />
      ) : items.length === 0 ? (
        <EmptyState icon={Mail} title="مکاتبه‌ای ثبت نشده" description="اولین نامه را از فرم بالا ثبت کنید." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GlassCard key={item.id} className="p-4">
              <p className="font-semibold">{item.subject}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">
                {item.direction === 'in' ? 'ورودی' : 'خروجی'}
                {item.party_name ? ` · ${item.party_name}` : ''}
                {` · ${item.status}`}
              </p>
              {item.body ? <p className="text-sm mt-2 leading-loose">{item.body}</p> : null}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
