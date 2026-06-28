'use client'

import Link from 'next/link'
import { FileText, Loader2, Users } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import { useEffect, useState } from 'react'

export default function CounselorDashboardLuxPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[var(--arc-counselor)]" /></div>
  }

  return (
    <div className="space-y-6" dir="rtl">
      <LuxFadeUp>
        <LuxPageHeader
          kicker="مشاوره"
          title="پرونده دانش‌آموزان"
          subtitle="گزارش‌ها و پیگیری‌های مشاوره‌ای"
        />
      </LuxFadeUp>

      <LuxStagger className="space-y-6" stagger={0.1}>
        <div className="grid gap-4 md:grid-cols-2">
          <LuxStaggerItem>
            <LuxCard interactive>
              <Link href="/counselor/students" className="flex items-center gap-3">
                <Users className="h-6 w-6 text-[var(--arc-counselor)]" />
                <div>
                  <p className="font-black text-[var(--lux-text)]">لیست دانش‌آموزان</p>
                  <p className="text-sm text-[var(--lux-text-muted)]">پرونده و وضعیت هر دانش‌آموز</p>
                </div>
              </Link>
            </LuxCard>
          </LuxStaggerItem>
          <LuxStaggerItem>
            <LuxCard interactive>
              <Link href="/counselor/reports" className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[var(--arc-counselor)]" />
                <div>
                  <p className="font-black text-[var(--lux-text)]">گزارش‌های مشاوره</p>
                  <p className="text-sm text-[var(--lux-text-muted)]">ثبت و پیگیری جلسات</p>
                </div>
              </Link>
            </LuxCard>
          </LuxStaggerItem>
        </div>
        <LuxStaggerItem>
          <LuxEmptyState
            title="هنوز پرونده‌ای انتخاب نشده"
            description="از لیست دانش‌آموزان یک پرونده را باز کنید."
            actionLabel="مشاهده دانش‌آموزان"
            actionHref="/counselor/students"
          />
        </LuxStaggerItem>
      </LuxStagger>
    </div>
  )
}
