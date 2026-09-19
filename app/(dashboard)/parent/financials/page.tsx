'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type ChildFinance = {
  student_id: string
  full_name: string | null
  total_due: number
  discount: number
  paid: number
  remaining: number
  payments: Array<{ id: string; amount: number; paid_at: string; receipt_no: string | null }>
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n)
}

export default function ParentFinancialsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [children, setChildren] = useState<ChildFinance[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/financial/parent')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت امور مالی ناموفق بود')
          return
        }
        setChildren(json.children || [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage kicker="والد" title="امور مالی">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={DollarSign} title="امور مالی در دسترس نیست" description={error} />
      ) : children.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="اطلاعات مالی ثبت نشده"
          description="اگر مدرسه شهریه ثبت نکرده باشد، اینجا صفر/خالی می‌ماند — مبلغ نمونه نشان داده نمی‌شود."
        />
      ) : (
        <div className="space-y-4">
          {children.map((child) => (
            <GlassCard key={child.student_id} className="p-5 space-y-2">
              <p className="font-semibold text-lg">{child.full_name || 'فرزند'}</p>
              <p className="text-sm text-[var(--lux-text-muted)] leading-loose">
                شهریه: {formatAmount(child.total_due)} · تخفیف: {formatAmount(child.discount)} ·
                پرداخت‌شده: {formatAmount(child.paid)} · مانده: {formatAmount(child.remaining)}
              </p>
              {child.payments.length > 0 ? (
                <div className="space-y-1 pt-2">
                  {child.payments.map((p) => (
                    <p key={p.id} className="text-sm">
                      {p.paid_at}: {formatAmount(p.amount)} ریال
                      {p.receipt_no ? ` (رسید ${p.receipt_no})` : ''}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--lux-text-muted)]">پرداختی ثبت نشده است.</p>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
