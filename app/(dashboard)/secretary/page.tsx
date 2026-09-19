'use client'

import Link from 'next/link'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

export default function SecretaryDashboardPage() {
  return (
    <DashboardPage kicker="منشی" title="داشبورد منشی">
      <DashboardSectionBlock>
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">جلسات</h2>
            <p className="text-sm text-[var(--lux-text-muted)] leading-loose">
              ثبت و پیگیری جلسات داخلی مدرسه.
            </p>
            <Button asChild>
              <Link href="/secretary/meetings">مدیریت جلسات</Link>
            </Button>
          </GlassCard>
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">مکاتبات</h2>
            <p className="text-sm text-[var(--lux-text-muted)] leading-loose">
              نامه‌های ورودی و خروجی مدرسه.
            </p>
            <Button asChild>
              <Link href="/secretary/correspondence">مدیریت مکاتبات</Link>
            </Button>
          </GlassCard>
        </div>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
