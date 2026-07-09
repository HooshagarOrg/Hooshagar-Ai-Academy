'use client'

import type { ReactNode } from 'react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

export function TeacherStudentsMotion({ children }: { children: ReactNode }) {
  return (
    <DashboardPage
      title="دانش‌آموزان"
      description="مدیریت دانش‌آموزان کلاس‌های شما"
    >
      <DashboardSectionBlock>{children}</DashboardSectionBlock>
    </DashboardPage>
  )
}
