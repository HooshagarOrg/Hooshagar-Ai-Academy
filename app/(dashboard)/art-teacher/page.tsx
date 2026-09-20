'use client'

import Link from 'next/link'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

export default function ArtTeacherPage() {
  return (
    <DashboardPage kicker="معلم هنر" title="داشبورد هنر">
      <DashboardSectionBlock>
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">برنامه</h2>
            <Button asChild variant="outline">
              <Link href="/art-teacher/timetable">برنامهٔ من</Link>
            </Button>
          </GlassCard>
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">گزارش هنری</h2>
            <Button asChild>
              <Link href="/art-teacher/art-reports">ثبت گزارش</Link>
            </Button>
          </GlassCard>
        </div>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
