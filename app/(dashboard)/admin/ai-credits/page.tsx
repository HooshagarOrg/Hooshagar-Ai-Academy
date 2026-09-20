'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type CreditRow = {
  user_id: string
  full_name: string
  role: string
  total_credits: number
  used_credits: number
  bonus_credits: number
}

export default function AdminAiCreditsPage() {
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('10')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/user-credits')
      const json = await res.json()
      setCredits(json.credits || [])
    } catch {
      toast.error('دریافت اعتبارها ناموفق بود')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const onBonus = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/user-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: Number.parseInt(amount, 10),
          reason,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'افزودن اعتبار ناموفق بود')
        return
      }
      toast.success('اعتبار جایزه ثبت شد')
      setReason('')
      await load()
    } catch {
      toast.error('خطای اتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="ادمین" title="اعتبار AI">
      <form onSubmit={onBonus} className="grid gap-3 max-w-lg mb-8">
        <div className="space-y-2">
          <Label>شناسه کاربر (UUID)</Label>
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>مقدار جایزه</Label>
          <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>دلیل</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ثبت...' : 'افزودن اعتبار جایزه'}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : credits.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="اعتبار ماهانه ثبت نشده"
          description="با اولین استفاده از AI یا افزودن دستی جایزه، ردیف‌ها اینجا ظاهر می‌شوند."
        />
      ) : (
        <div className="space-y-2">
          {credits.map((c) => (
            <GlassCard key={c.user_id} className="p-4 flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-medium">{c.full_name}</span>
              <span className="text-[var(--lux-text-muted)]">
                کل {c.total_credits} · مصرف {c.used_credits} · جایزه {c.bonus_credits}
              </span>
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
