'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Shield, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Log = {
  id: string
  person_name: string
  direction: string
  logged_at: string
  gate: string | null
}

export default function SecurityPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<Log[]>([])
  const [personName, setPersonName] = useState('')
  const [direction, setDirection] = useState('in')
  const [gate, setGate] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/security/entry-exit')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'دریافت ورود/خروج ناموفق بود')
        return
      }
      setLogs(json.logs || [])
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
      const res = await fetch('/api/security/entry-exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_name: personName,
          direction,
          gate: gate || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت ناموفق بود')
        return
      }
      toast.success('ثبت شد')
      setPersonName('')
      setLogs((c) => [json.log, ...c])
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage
      kicker="حراست"
      title="ورود و خروج"
      actions={
        <Button asChild variant="outline">
          <Link href="/security/incidents">رخدادها</Link>
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>نام</Label>
          <Input value={personName} onChange={(e) => setPersonName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>جهت</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">ورود</SelectItem>
              <SelectItem value="out">خروج</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>درب / محل</Label>
          <Input value={gate} onChange={(e) => setGate(e.target.value)} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ثبت...' : 'ثبت'}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Shield} title="لاگ در دسترس نیست" description={error} />
      ) : logs.length === 0 ? (
        <EmptyState icon={Shield} title="ثبتی وجود ندارد" description="اولین ورود/خروج را ثبت کنید." />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <GlassCard key={log.id} className="p-3 text-sm">
              {log.person_name} · {log.direction === 'in' ? 'ورود' : 'خروج'} ·{' '}
              {new Date(log.logged_at).toLocaleString('fa-IR')}
              {log.gate ? ` · ${log.gate}` : ''}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
