'use client'

/**
 * Admin Broadcast SMS Page
 * 
 * صفحه ارسال پیامک موردی توسط ادمین
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { Megaphone } from 'lucide-react'

export default function AdminBroadcastPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_role: 'parent',
    target_grade: '',
    send_sms: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          send_sms: false,
          target_grade: formData.target_grade ? parseInt(formData.target_grade) : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(
          data.message ||
            `اعلان داخل برنامه برای ${data.recipients} نفر ثبت شد (پیامک گروهی فعلاً خاموش است)`
        )
        setFormData({
          title: '',
          message: '',
          target_role: 'parent',
          target_grade: '',
          send_sms: false,
        })
      } else {
        toast.error(data.error || 'خطا در ارسال پیام')
      }
    } catch (error) {
      toast.error('خطا در ارسال پیام')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <Megaphone className="text-[var(--lux-primary)]" aria-hidden />
          ارسال پیام گروهی
        </span>
      }
      description="ارسال اطلاع‌رسانی موردی به کاربران (فعلاً فقط اعلان داخلی — پیامک گروهی خاموش است)"
      className="max-w-2xl"
    >
      <DashboardSectionBlock>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="font-vazir">عنوان پیام *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: جلسه فوری والدین"
                required
                className="font-vazir"
                dir="rtl"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="font-vazir">متن پیام *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="متن پیام خود را وارد کنید (حداکثر 500 کاراکتر)"
                rows={5}
                required
                maxLength={500}
                className="font-vazir"
                dir="rtl"
              />
              <p className="text-sm text-[var(--lux-text-muted)]">
                {formData.message.length}/500 کاراکتر
              </p>
            </div>

            {/* Target Role */}
            <div className="space-y-2">
              <Label htmlFor="target_role" className="font-vazir">مخاطبین *</Label>
              <Select
                value={formData.target_role}
                onValueChange={value => setFormData(prev => ({ ...prev, target_role: value }))}
              >
                <SelectTrigger id="target_role" className="font-vazir" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent" className="font-vazir">والدین</SelectItem>
                  <SelectItem value="teacher" className="font-vazir">معلمان</SelectItem>
                  <SelectItem value="all" className="font-vazir">همه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Grade (if parent) */}
            {formData.target_role === 'parent' && (
              <div className="space-y-2">
                <Label htmlFor="target_grade" className="font-vazir">محدود به پایه (اختیاری)</Label>
                <Select
                  value={formData.target_grade}
                  onValueChange={value => setFormData(prev => ({ ...prev, target_grade: value }))}
                >
                  <SelectTrigger id="target_grade" className="font-vazir" dir="rtl">
                    <SelectValue placeholder="همه پایه‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-vazir">همه پایه‌ها</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                      <SelectItem key={grade} value={grade.toString()} className="font-vazir">
                        پایه {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* فاز A: پیامک گروهی خاموش */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-medium">پیامک گروهی فعلاً غیرفعال است</p>
              <p className="mt-1 text-amber-200/90">
                فقط اعلان داخل برنامه ارسال می‌شود. برای کنترل هزینه، SMS برودکست تا تکمیل
                سقف روزانه و لاگ هزینه خاموش مانده است.
              </p>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-[var(--lux-secondary)]/30 bg-[var(--lux-secondary)]/10 p-4">
              <p className="mb-2 text-sm font-medium text-[var(--lux-text)]">پیش‌نمایش اعلان:</p>
              <div className="rounded-lg border-r-4 border-[var(--lux-secondary)] bg-white/[0.04] p-3 text-sm text-[var(--lux-text)]">
                <p className="font-bold">{formData.title || '[عنوان]'}</p>
                <p className="mt-1">{formData.message || '[متن پیام]'}</p>
                <p className="mt-2 text-[var(--lux-text-muted)]">
                  {process.env.NEXT_PUBLIC_APP_URL || 'https://www.hooshagar.ir'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <p className="font-medium">⚠️ توجه:</p>
              <p className="mt-1">
                این پیام به همه کاربران منتخب ارسال می‌شود. لطفاً از صحت اطلاعات اطمینان حاصل کنید.
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full font-vazir"
            >
              {loading ? 'در حال ارسال...' : '📤 ارسال پیام'}
            </Button>
          </form>
        </CardContent>
      </Card>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}

