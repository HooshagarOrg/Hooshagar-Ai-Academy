'use client'

import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type Balance = {
  student_id: string
  full_name: string
  remaining: number
  total_due: number
  paid: number
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n)
}

export default function DebtorsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [balances, setBalances] = useState<Balance[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/financial/tuition')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت بدهکاران ناموفق بود')
          return
        }
        setBalances(json.balances || [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const debtors = useMemo(
    () => balances.filter((b) => Number(b.remaining) > 0),
    [balances]
  )

  return (
    <DashboardPage kicker="معاون مالی" title="بدهکاران">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={DollarSign} title="گزارش در دسترس نیست" description={error} />
      ) : debtors.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="بدهکاری ثبت نشده"
          description="اگر شهریه و پرداخت‌ها صفر باشند، فهرستی نشان داده نمی‌شود."
        />
      ) : (
        <div className="space-y-3">
          {debtors.map((d) => (
            <GlassCard key={d.student_id} className="p-4">
              <p className="font-semibold">{d.full_name}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">
                مانده: {formatAmount(d.remaining)} ریال (بدهی {formatAmount(d.total_due)} ·
                پرداخت {formatAmount(d.paid)})
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
