'use client'

/**
 * Admin Broadcast SMS Page
 * 
 * صفحه ارسال پیامک موردی توسط ادمین
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function AdminBroadcastPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_role: 'parent',
    target_grade: '',
    send_sms: true
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
          target_grade: formData.target_grade ? parseInt(formData.target_grade) : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`پیام به ${data.recipients} نفر ارسال شد`)
        setFormData({
          title: '',
          message: '',
          target_role: 'parent',
          target_grade: '',
          send_sms: true
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
    <div className="container mx-auto py-8" dir="rtl">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-vazir">ارسال پیام گروهی</CardTitle>
          <CardDescription className="font-vazir">
            ارسال اطلاع‌رسانی موردی به کاربران (پیامک + اعلان داخلی)
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <p className="text-sm text-gray-500 font-vazir">
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

            {/* Send SMS */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                id="send_sms"
                checked={formData.send_sms}
                onChange={e => setFormData(prev => ({ ...prev, send_sms: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="send_sms" className="font-vazir cursor-pointer">
                ارسال پیامک (علاوه بر اعلان داخلی)
              </Label>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="font-medium text-sm mb-2 font-vazir">👁️ پیش‌نمایش پیامک:</p>
              <div className="text-sm text-gray-700 bg-white p-3 rounded border-r-4 border-blue-400 font-vazir">
                <p className="font-bold">{formData.title || '[عنوان]'}</p>
                <p className="mt-1">{formData.message || '[متن پیام]'}</p>
                <p className="mt-2 text-gray-500">hooshagar.com</p>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm font-vazir">
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
    </div>
  )
}

