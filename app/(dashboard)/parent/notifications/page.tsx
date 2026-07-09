'use client'

/**
 * Parent Notifications Settings Page
 * 
 * صفحه تنظیمات اطلاع‌رسانی والدین
 */

import { NotificationSettings } from '@/components/NotificationSettings'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

export default function ParentNotificationsPage() {
  return (
    <DashboardPage
      title="تنظیمات اطلاع‌رسانی"
      description="مدیریت نحوه دریافت اعلان‌ها"
    >
      <DashboardSectionBlock>
        <NotificationSettings />
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
