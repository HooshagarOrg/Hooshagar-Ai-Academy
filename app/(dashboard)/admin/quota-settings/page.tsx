'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Settings2, GraduationCap, Shuffle, Save,
  Loader2, AlertCircle, Info, Building2,
} from 'lucide-react'
import { toast } from 'sonner'

// ────────────────────────────────────────────────────────────
// تایپ‌ها
// ────────────────────────────────────────────────────────────
interface ClassQuota {
  default_capacity:   number
  max_capacity:       number
  min_capacity:       number
  capacity_per_grade: Record<string, number>
}

interface LotteryQuota {
  max_choices_per_student:  number
  min_choices_per_student:  number
  default_platform_quota:   number
  waitlist_enabled:         boolean
  auto_fill_waitlist:       boolean
}

interface SchoolLimits {
  max_students_free:       number
  max_students_basic:      number
  max_students_premium:    number
  max_students_enterprise: number
  max_classes_per_grade:   number
}

// ────────────────────────────────────────────────────────────
// صفحه اصلی
// ────────────────────────────────────────────────────────────
export default function QuotaSettingsPage() {
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)

  const [classQuota, setClassQuota]     = useState<ClassQuota>({
    default_capacity: 30, max_capacity: 45, min_capacity: 10,
    capacity_per_grade: Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [String(i + 1), i < 6 ? 30 : 35])
    ),
  })
  const [lotteryQuota, setLotteryQuota] = useState<LotteryQuota>({
    max_choices_per_student: 5, min_choices_per_student: 1,
    default_platform_quota: 5, waitlist_enabled: false, auto_fill_waitlist: false,
  })
  const [schoolLimits, setSchoolLimits] = useState<SchoolLimits>({
    max_students_free: 50, max_students_basic: 300,
    max_students_premium: 1000, max_students_enterprise: 9999,
    max_classes_per_grade: 10,
  })

  useEffect(() => {
    fetch('/api/platform-admin/quota')
      .then(r => r.json())
      .then(d => {
        for (const s of d.settings || []) {
          if (s.key === 'class_quota')   setClassQuota(s.value)
          if (s.key === 'lottery_quota') setLotteryQuota(s.value)
          if (s.key === 'school_limits') setSchoolLimits(s.value)
        }
      })
      .catch(() => toast.error('خطا در دریافت تنظیمات'))
      .finally(() => setLoading(false))
  }, [])

  const save = async (key: string, value: unknown) => {
    setSaving(key)
    try {
      const res = await fetch('/api/platform-admin/quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('تنظیمات ذخیره شد')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'خطا در ذخیره')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">

      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Settings2 className="text-indigo-600" /> مدیریت ظرفیت و سهمیه
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          تنظیمات سراسری ظرفیت کلاس‌ها و سهمیه‌های قرعه‌کشی — فقط platform_admin
        </p>
      </div>

      {/* ── ظرفیت کلاس‌ها ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-500" /> ظرفیت پیش‌فرض کلاس‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">ظرفیت پیش‌فرض</Label>
              <Input type="number" min={1} max={200}
                value={classQuota.default_capacity}
                onChange={e => setClassQuota(p => ({ ...p, default_capacity: +e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">حداقل ظرفیت</Label>
              <Input type="number" min={1}
                value={classQuota.min_capacity}
                onChange={e => setClassQuota(p => ({ ...p, min_capacity: +e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">حداکثر ظرفیت</Label>
              <Input type="number" min={1} max={200}
                value={classQuota.max_capacity}
                onChange={e => setClassQuota(p => ({ ...p, max_capacity: +e.target.value }))}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">ظرفیت پیش‌فرض به تفکیک پایه</p>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(g => (
                <div key={g} className="space-y-1">
                  <Label className="text-xs text-center block">پایه {g}</Label>
                  <Input
                    type="number" min={1} max={200}
                    className="h-8 text-center text-sm"
                    value={classQuota.capacity_per_grade[g] ?? 30}
                    onChange={e => setClassQuota(p => ({
                      ...p,
                      capacity_per_grade: { ...p.capacity_per_grade, [g]: +e.target.value }
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => save('class_quota', classQuota)}
              disabled={saving === 'class_quota'}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {saving === 'class_quota' ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              ذخیره
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── سهمیه قرعه‌کشی ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-purple-500" /> سهمیه قرعه‌کشی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">حداکثر تعداد اولویت انتخابی</Label>
              <Input type="number" min={1} max={20}
                value={lotteryQuota.max_choices_per_student}
                onChange={e => setLotteryQuota(p => ({ ...p, max_choices_per_student: +e.target.value }))}
              />
              <p className="text-xs text-gray-400">سقف انتخاب معلم (= تعداد معلمان آن پایه)</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">حداقل تعداد اولویت الزامی</Label>
              <Input type="number" min={1} max={10}
                value={lotteryQuota.min_choices_per_student}
                onChange={e => setLotteryQuota(p => ({ ...p, min_choices_per_student: +e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">سهمیه پیش‌فرض مدیرکل (نفر)</Label>
              <Input type="number" min={0} max={50}
                value={lotteryQuota.default_platform_quota}
                onChange={e => setLotteryQuota(p => ({ ...p, default_platform_quota: +e.target.value }))}
              />
              <p className="text-xs text-gray-400">از ظرفیت کل کسر می‌شود — تخصیص دستی</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <strong>فرمول:</strong> ظرفیت قرعه‌کشی = ظرفیت کل − سهمیه مدیرکل
            &nbsp;|&nbsp; لیست انتظار: <strong>غیرفعال</strong>
            &nbsp;|&nbsp; جایگزینی انصراف: <strong>دستی توسط مدیرکل</strong>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => save('lottery_quota', lotteryQuota)}
              disabled={saving === 'lottery_quota'}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
            >
              {saving === 'lottery_quota' ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              ذخیره
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── محدودیت مدارس بر اساس پلن ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-green-500" /> محدودیت مدارس بر اساس پلن اشتراک
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'max_students_free',       label: 'پلن رایگان — حداکثر دانش‌آموز' },
              { key: 'max_students_basic',      label: 'پلن پایه — حداکثر دانش‌آموز' },
              { key: 'max_students_premium',    label: 'پلن پریمیوم — حداکثر دانش‌آموز' },
              { key: 'max_students_enterprise', label: 'پلن سازمانی — حداکثر دانش‌آموز' },
              { key: 'max_classes_per_grade',   label: 'حداکثر کلاس در هر پایه (همه پلن‌ها)' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number" min={1}
                  value={schoolLimits[key as keyof SchoolLimits] as number}
                  onChange={e => setSchoolLimits(p => ({ ...p, [key]: +e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => save('school_limits', schoolLimits)}
              disabled={saving === 'school_limits'}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              {saving === 'school_limits' ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              ذخیره
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* راهنما */}
      <Card className="border-indigo-100 bg-indigo-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-800 space-y-1">
            <p className="font-bold">نحوه اعمال تنظیمات</p>
            <ul className="text-indigo-600 space-y-1 text-xs list-disc list-inside">
              <li>ظرفیت per grade برای کلاس‌های جدید به‌صورت پیش‌فرض اعمال می‌شود</li>
              <li>مدیر مدرسه می‌تواند ظرفیت هر کلاس را تغییر دهد (در محدوده min-max)</li>
              <li>platform_admin می‌تواند هر کلاس را به‌صورت مستقل override کند</li>
              <li>تعداد اولویت انتخابی = تعداد معلمان آن پایه در آن مدرسه (حداکثر max_choices)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
