'use client'

import Link from 'next/link'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

export default function SportsTeacherPage() {
  return (
    <DashboardPage kicker="معلم ورزش" title="داشبورد ورزش">
      <DashboardSectionBlock>
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">برنامه</h2>
            <Button asChild variant="outline">
              <Link href="/sports-teacher/timetable">برنامهٔ من</Link>
            </Button>
          </GlassCard>
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">گزارش ورزشی</h2>
            <Button asChild>
              <Link href="/sports-teacher/sports-reports">ثبت گزارش</Link>
            </Button>
          </GlassCard>
        </div>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
