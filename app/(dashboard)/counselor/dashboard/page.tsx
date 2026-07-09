'use client'

import Link from 'next/link'
import { FileText, Users } from 'lucide-react'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxLoading } from '@/components/lux/lux-page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { useEffect, useState } from 'react'

export default function CounselorDashboardLuxPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  if (loading) {
    return <LuxLoading variant="lux" label="در حال بارگذاری پرونده‌ها..." />
  }

  return (
    <DashboardPage
      meta="مشاوره"
      title="پرونده دانش‌آموزان"
      description="گزارش‌ها و پیگیری‌های مشاوره‌ای"
    >
      <DashboardSectionBlock>
        <div className="grid gap-4 md:grid-cols-2">
          <LuxCard interactive>
            <Link href="/counselor/records" className="flex items-center gap-3">
              <Users className="h-6 w-6 text-[var(--arc-counselor)]" />
              <div>
                <p className="font-black text-[var(--lux-text)]">لیست دانش‌آموزان</p>
                <p className="text-sm text-[var(--lux-text-muted)]">پرونده و وضعیت هر دانش‌آموز</p>
              </div>
            </Link>
          </LuxCard>
          <LuxCard interactive>
            <Link href="/counselor/reports" className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-[var(--arc-counselor)]" />
              <div>
                <p className="font-black text-[var(--lux-text)]">گزارش‌های مشاوره</p>
                <p className="text-sm text-[var(--lux-text-muted)]">ثبت و پیگیری جلسات</p>
              </div>
            </Link>
          </LuxCard>
        </div>
      </DashboardSectionBlock>
      <DashboardSectionBlock>
        <LuxEmptyState
          title="هنوز پرونده‌ای انتخاب نشده"
          description="از لیست دانش‌آموزان یک پرونده را باز کنید."
          actionLabel="مشاهده دانش‌آموزان"
          actionHref="/counselor/records"
        />
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
