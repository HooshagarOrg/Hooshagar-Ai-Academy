'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import type { NotificationPreferences } from '@/types/notifications.types'
import { PageErrorState, PageLoading } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

const NOTIFICATION_TOGGLES: { key: keyof NotificationPreferences; id: string; label: string }[] = [
  { key: 'report_published_enabled', id: 'report_published', label: 'گزارش منتشر شده' },
  { key: 'grade_added_enabled', id: 'grade_added', label: 'نمره جدید' },
  { key: 'attendance_alert_enabled', id: 'attendance_alert', label: 'هشدار غیبت' },
  { key: 'homework_due_enabled', id: 'homework_due', label: 'یادآوری تکلیف' },
  { key: 'homework_graded_enabled', id: 'homework_graded', label: 'نمره تکلیف' },
  { key: 'achievement_enabled', id: 'achievement', label: 'دستاوردها' },
  { key: 'badge_earned_enabled', id: 'badge_earned', label: 'نشان‌ها' },
  { key: 'xp_milestone_enabled', id: 'xp_milestone', label: 'سطح جدید' },
  { key: 'system_enabled', id: 'system', label: 'سیستم' },
  { key: 'announcement_enabled', id: 'announcement', label: 'اطلاعیه‌ها' },
]

const CHANNEL_TOGGLES: {
  key: keyof NotificationPreferences
  id: string
  label: string
  disabled?: boolean
}[] = [
  { key: 'in_app_enabled', id: 'in_app', label: 'داخل برنامه' },
  { key: 'email_enabled', id: 'email', label: 'ایمیل', disabled: true },
  { key: 'push_enabled', id: 'push', label: 'اعلان Push', disabled: true },
]

function PreferenceRow({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: () => void
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/[0.06] py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <Label htmlFor={id} className="cursor-pointer text-[var(--lux-text)]">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

export default function NotificationSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setIsLoading(true)
      setLoadError('')
      const res = await fetch('/api/notifications/preferences')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()

      if (data.success) {
        setPreferences(data.preferences)
      } else {
        setLoadError(data.error || 'دریافت تنظیمات ناموفق بود')
      }
    } catch {
      setLoadError('اتصال برقرار نشد. لطفاً دوباره تلاش کنید.')
      toast({
        title: 'خطا',
        description: 'دریافت تنظیمات ناموفق بود',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    })
  }

  const handleSave = async () => {
    if (!preferences) return

    try {
      setIsSaving(true)
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: 'موفق',
          description: 'تنظیمات با موفقیت ذخیره شد',
        })
      } else {
        toast({
          title: 'خطا',
          description: data.error || 'ذخیره تنظیمات ناموفق بود',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error)
      toast({
        title: 'خطا',
        description: 'خطای شبکه',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageLoading label="در حال بارگذاری تنظیمات..." compact />
      </div>
    )
  }

  if (loadError || !preferences) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageErrorState
          message={loadError || 'دریافت تنظیمات ناموفق بود'}
          onRetry={fetchPreferences}
        />
      </div>
    )
  }

  return (
    <DashboardPage
      title="تنظیمات اعلان‌ها"
      description="مدیریت انواع اعلان‌های دریافتی"
      actions={
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="min-h-10 w-fit gap-2"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          بازگشت
        </Button>
      }
    >
      <DashboardSectionBlock>
        <Card>
          <CardHeader>
            <CardTitle>انواع اعلان‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            {NOTIFICATION_TOGGLES.map(({ key, id, label }) => (
              <PreferenceRow
                key={id}
                id={id}
                label={label}
                checked={Boolean(preferences[key])}
                onCheckedChange={() => handleToggle(key)}
              />
            ))}
          </CardContent>
        </Card>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        <Card>
          <CardHeader>
            <CardTitle>کانال‌های دریافت</CardTitle>
          </CardHeader>
          <CardContent>
            {CHANNEL_TOGGLES.map(({ key, id, label, disabled }) => (
              <PreferenceRow
                key={id}
                id={id}
                label={label}
                checked={Boolean(preferences[key])}
                disabled={disabled}
                onCheckedChange={() => handleToggle(key)}
              />
            ))}
            <p className="mt-3 text-sm leading-7 text-[var(--lux-text-muted)]">
              * ایمیل و Push در نسخه‌های آینده فعال خواهد شد
            </p>
          </CardContent>
        </Card>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => router.back()} className="min-h-10">
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="min-h-10">
            {isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </Button>
        </div>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
