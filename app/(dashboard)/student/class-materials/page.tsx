'use client'

import { DashboardPage } from '@/components/layout/dashboard-page'
import { ClassMaterialsList } from '@/components/class-files/class-materials-list'

export default function StudentClassMaterialsPage() {
  return (
    <DashboardPage
      title="منابع کلاس"
      description="فایل‌هایی که معلم برای کلاس گذاشته — برای دانلود."
    >
      <ClassMaterialsList />
    </DashboardPage>
  )
}
