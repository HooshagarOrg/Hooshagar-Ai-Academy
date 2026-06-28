'use client'

/**
 * Parent Notifications Settings Page
 * 
 * صفحه تنظیمات اطلاع‌رسانی والدین
 */

import { NotificationSettings } from '@/components/NotificationSettings'
import { LuxFadeUp } from '@/components/lux/lux-motion'

export default function ParentNotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 sm:px-6" dir="rtl">
      <LuxFadeUp>
        <NotificationSettings />
      </LuxFadeUp>
    </div>
  )
}

