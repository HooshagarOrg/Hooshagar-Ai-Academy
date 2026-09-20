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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Balance = {
  student_id: string
  full_name: string
  total_due: number
  discount: number
  paid: number
  remaining: number
}

type Payment = {
  id: string
  student_id: string
  amount: number
  paid_at: string
  method: string | null
  receipt_no: string | null
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n)
}

export default function FinancialPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [balances, setBalances] = useState<Balance[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [studentId, setStudentId] = useState('')
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState('cash')
  const [receiptNo, setReceiptNo] = useState('')
  const [totalDue, setTotalDue] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/financial/tuition')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'دریافت دادهٔ مالی ناموفق بود')
        return
      }
      setBalances(json.balances || [])
      setPayments(json.payments || [])
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

  const saveTuition = async () => {
    if (!studentId) {
      toast.error('دانش‌آموز را انتخاب کنید')
      return
    }
    const due = Number.parseInt(totalDue, 10)
    if (!Number.isFinite(due) || due < 0) {
      toast.error('مبلغ شهریه نامعتبر است')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/financial/tuition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tuition', student_id: studentId, total_due: due }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ذخیره شهریه ناموفق بود')
        return
      }
      toast.success('شهریه ذخیره شد')
      setLoading(true)
      await load()
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const savePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) {
      toast.error('دانش‌آموز را انتخاب کنید')
      return
    }
    const value = Number.parseInt(amount, 10)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('مبلغ پرداخت نامعتبر است')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/financial/tuition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment',
          student_id: studentId,
          amount: value,
          paid_at: paidAt,
          method,
          receipt_no: receiptNo || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت پرداخت ناموفق بود')
        return
      }
      toast.success('پرداخت ثبت شد')
      setAmount('')
      setReceiptNo('')
      setLoading(true)
      await load()
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage kicker="معاون مالی" title="پرداخت‌ها و شهریه">
      <form onSubmit={savePayment} className="grid gap-3 max-w-xl mb-8">
        <div className="space-y-2">
          <Label>دانش‌آموز</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب دانش‌آموز" />
            </SelectTrigger>
            <SelectContent>
              {balances.map((b) => (
                <SelectItem key={b.student_id} value={b.student_id}>
                  {b.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>شهریه کل (ریال)</Label>
            <Input
              value={totalDue}
              onChange={(e) => setTotalDue(e.target.value)}
              inputMode="numeric"
              className="text-left"
              dir="ltr"
            />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={saveTuition} disabled={saving}>
              ذخیره شهریه
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>مبلغ پرداخت</Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              inputMode="numeric"
              className="text-left"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>تاریخ</Label>
            <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} required />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>روش</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقد</SelectItem>
                <SelectItem value="card">کارت</SelectItem>
                <SelectItem value="transfer">واریز</SelectItem>
                <SelectItem value="check">چک</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>شماره رسید</Label>
            <Input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ثبت...' : 'ثبت پرداخت'}
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={CreditCard} title="دادهٔ مالی در دسترس نیست" description={error} />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold mb-3">مانده‌ها</h2>
            {balances.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="هنوز شهریه‌ای ثبت نشده"
                description="برای دانش‌آموز شهریه تعریف کنید؛ مبلغ ساختگی نشان داده نمی‌شود."
              />
            ) : (
              <div className="space-y-2">
                {balances.map((b) => (
                  <GlassCard key={b.student_id} className="p-4">
                    <p className="font-semibold">{b.full_name}</p>
                    <p className="text-sm text-[var(--lux-text-muted)]">
                      بدهی: {formatAmount(b.total_due)} · پرداخت‌شده: {formatAmount(b.paid)} ·
                      مانده: {formatAmount(b.remaining)}
                    </p>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold mb-3">آخرین پرداخت‌ها</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-[var(--lux-text-muted)]">پرداختی ثبت نشده است.</p>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 20).map((p) => (
                  <GlassCard key={p.id} className="p-3 text-sm">
                    {p.paid_at} · {formatAmount(p.amount)} ریال
                    {p.receipt_no ? ` · رسید ${p.receipt_no}` : ''}
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardPage>
  )
}
