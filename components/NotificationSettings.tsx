'use client'

/**
 * Notification Settings Component
 * 
 * تنظیمات اطلاع‌رسانی برای کاربران (والدین)
 */

import { useState, useEffect } from 'react'

interface NotificationPrefs {
  weekly_sms_enabled: boolean
  weekly_sms_day: string
  weekly_sms_time: string
  total_sms_sent?: number
  last_sms_sent_at?: string
}

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    weekly_sms_enabled: true,
    weekly_sms_day: 'thursday',
    weekly_sms_time: '11:00:00'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const res = await fetch('/api/notifications/preferences')
      const data = await res.json()
      
      if (data.preferences) {
        setPrefs(data.preferences)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePreference(key: keyof NotificationPrefs, value: any) {
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })

      if (res.ok) {
        const data = await res.json()
        setPrefs(data.preferences)
        setMessage('تنظیمات با موفقیت ذخیره شد ✓')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('خطا در ذخیره تنظیمات ✗')
      }
    } catch (error) {
      setMessage('خطا در ذخیره تنظیمات ✗')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse font-vazir" dir="rtl">
        در حال بارگذاری...
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold mb-2 font-vazir">تنظیمات اطلاع‌رسانی</h2>
        <p className="text-gray-600 font-vazir">
          مدیریت نحوه دریافت اطلاع‌رسانی‌های سامانه
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} font-vazir`}>
          {message}
        </div>
      )}

      {/* SMS Settings */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 font-vazir">
              <span>📱</span>
              پیامک هفتگی
            </h3>
            <p className="text-sm text-gray-600 mt-1 font-vazir">
              دریافت خلاصه هفتگی از وضعیت فرزندتان
            </p>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.weekly_sms_enabled}
              onChange={e =>
                updatePreference('weekly_sms_enabled', e.target.checked)
              }
              className="sr-only peer"
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>

        {prefs.weekly_sms_enabled && (
          <div className="space-y-4 mt-6 pr-4 border-r-2 border-blue-200">
            {/* Day Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 font-vazir">
                روز ارسال
              </label>
              <select
                value={prefs.weekly_sms_day}
                onChange={e => updatePreference('weekly_sms_day', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-vazir"
                disabled={saving}
              >
                <option value="saturday">شنبه</option>
                <option value="sunday">یکشنبه</option>
                <option value="monday">دوشنبه</option>
                <option value="tuesday">سه‌شنبه</option>
                <option value="wednesday">چهارشنبه</option>
                <option value="thursday">پنج‌شنبه (پیشنهادی)</option>
                <option value="friday">جمعه</option>
              </select>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 font-vazir">
                ساعت ارسال
              </label>
              <select
                value={prefs.weekly_sms_time}
                onChange={e => updatePreference('weekly_sms_time', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-vazir"
                disabled={saving}
              >
                <option value="08:00:00">8 صبح</option>
                <option value="09:00:00">9 صبح</option>
                <option value="10:00:00">10 صبح</option>
                <option value="11:00:00">11 صبح (پیشنهادی)</option>
                <option value="12:00:00">12 ظهر</option>
                <option value="13:00:00">1 بعدازظهر</option>
              </select>
            </div>

            {/* Sample SMS */}
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="font-medium text-sm mb-2 font-vazir">📋 نمونه پیامک:</p>
              <div className="text-sm text-gray-700 bg-white p-3 rounded border-r-4 border-blue-400 font-vazir">
                <p>📊 گزارش هفتگی</p>
                <p className="mt-1">
                  وضعیت آموزشی و رفتاری علی در سامانه هوشگر بررسی شده است.
                </p>
                <p className="mt-1">جزئیات: www.hooshagar.ir</p>
              </div>
            </div>

            {/* Stats */}
            {prefs.total_sms_sent !== undefined && prefs.total_sms_sent > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 font-vazir">
                📊 تعداد پیامک ارسال شده: {prefs.total_sms_sent}
                {prefs.last_sms_sent_at && (
                  <span className="mr-2">
                    • آخرین ارسال: {new Date(prefs.last_sms_sent_at).toLocaleDateString('fa-IR')}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {!prefs.weekly_sms_enabled && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mt-4 text-sm font-vazir">
            <p className="font-medium">⚠️ توجه:</p>
            <p className="mt-1">
              با غیرفعال کردن پیامک هفتگی، مسئولیت پیگیری وضعیت آموزشی فرزندتان
              کاملاً بر عهده شماست.
            </p>
          </div>
        )}
      </div>

      {/* In-App (Always On) */}
      <div className="bg-white p-6 rounded-lg border shadow-sm opacity-75">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 font-vazir">
              <span>📨</span>
              اعلان‌های داخل سامانه
            </h3>
            <p className="text-sm text-gray-600 mt-1 font-vazir">
              نمایش اعلان‌ها در سامانه (همیشه فعال)
            </p>
          </div>
          <span className="text-green-600 font-medium flex items-center gap-1 font-vazir">
            <span>✓</span>
            فعال
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 font-vazir">
        <p className="font-medium mb-2">💡 نکته:</p>
        <ul className="space-y-1 pr-4">
          <li>• پیامک‌ها فقط در ساعات اداری (8 صبح تا 2 بعدازظهر) ارسال می‌شوند</li>
          <li>• هزینه ارسال پیامک بر عهده سامانه است</li>
          <li>• می‌توانید هر زمان تنظیمات را تغییر دهید</li>
        </ul>
      </div>
    </div>
  )
}

