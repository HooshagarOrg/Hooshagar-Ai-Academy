'use client'

import Link from 'next/link'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

export default function FinancialVpDashboardPage() {
  return (
    <DashboardPage kicker="معاون مالی" title="داشبورد مالی">
      <DashboardSectionBlock>
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">پرداخت‌ها</h2>
            <p className="text-sm text-[var(--lux-text-muted)] leading-loose">
              ثبت پرداخت شهریه و مانده واقعی دانش‌آموزان.
            </p>
            <Button asChild>
              <Link href="/financial-vp/payments">مدیریت پرداخت‌ها</Link>
            </Button>
          </GlassCard>
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">بدهکاران</h2>
            <Button asChild variant="outline">
              <Link href="/financial-vp/reports/debtors">مشاهده بدهکاران</Link>
            </Button>
          </GlassCard>
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">درآمد</h2>
            <Button asChild variant="outline">
              <Link href="/financial-vp/reports/income">گزارش درآمد</Link>
            </Button>
          </GlassCard>
        </div>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
