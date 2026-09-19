'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type Payment = { id: string; amount: number; paid_at: string }

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n)
}

export default function IncomePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/financial/tuition')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت درآمد ناموفق بود')
          return
        }
        setPayments(json.payments || [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const total = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments]
  )

  return (
    <DashboardPage kicker="معاون مالی" title="گزارش درآمد">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={TrendingUp} title="گزارش در دسترس نیست" description={error} />
      ) : (
        <>
          <GlassCard className="p-5 mb-6">
            <p className="text-sm text-[var(--lux-text-muted)]">جمع پرداخت‌های ثبت‌شده</p>
            <p className="text-2xl font-bold mt-1">{formatAmount(total)} ریال</p>
          </GlassCard>
          {payments.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="پرداختی ثبت نشده"
              description="پس از ثبت پرداخت در صفحهٔ پرداخت‌ها، اینجا جمع می‌شود."
            />
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <GlassCard key={p.id} className="p-3 text-sm">
                  {p.paid_at} · {formatAmount(p.amount)} ریال
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardPage>
  )
}
