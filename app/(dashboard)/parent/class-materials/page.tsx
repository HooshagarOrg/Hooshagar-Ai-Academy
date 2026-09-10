'use client'

import { DashboardPage } from '@/components/layout/dashboard-page'
import { ClassMaterialsList } from '@/components/class-files/class-materials-list'

export default function ParentClassMaterialsPage() {
  return (
    <DashboardPage
      title="منابع کلاس"
      description="فایل‌های کلاس فرزندتان برای دانلود."
    >
      <ClassMaterialsList />
    </DashboardPage>
  )
}
