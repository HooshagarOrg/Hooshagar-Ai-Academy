'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DollarSign, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Settings = {
  academic_year: string | null
  base_tuition: number
  with_service_tuition: number
  registration_fee: number
}

export default function AdminTuitionSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [baseTuition, setBaseTuition] = useState('0')
  const [withService, setWithService] = useState('0')
  const [registrationFee, setRegistrationFee] = useState('0')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/financial/tuition')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت تنظیمات ناموفق بود')
          return
        }
        const s = json.settings as Settings | null
        if (s) {
          setAcademicYear(s.academic_year || '')
          setBaseTuition(String(s.base_tuition ?? 0))
          setWithService(String(s.with_service_tuition ?? 0))
          setRegistrationFee(String(s.registration_fee ?? 0))
        }
        setError('')
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/financial/tuition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          academic_year: academicYear || null,
          base_tuition: Number(baseTuition),
          with_service_tuition: Number(withService),
          registration_fee: Number(registrationFee),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ذخیره تنظیمات ناموفق بود')
        return
      }
      toast.success('تنظیمات شهریه ذخیره شد')
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardPage kicker="مدیر" title="تنظیمات شهریه">
        <div className="flex items-center justify-center py-12 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      </DashboardPage>
    )
  }

  if (error) {
    return (
      <DashboardPage kicker="مدیر" title="تنظیمات شهریه">
        <EmptyState icon={DollarSign} title="تنظیمات در دسترس نیست" description={error} />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage kicker="مدیر" title="تنظیمات شهریه" description="مبالغ به ریال؛ صفر یعنی هنوز تنظیم نشده">
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
        <div className="space-y-2">
          <Label>سال تحصیلی</Label>
          <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="مثلاً ۱۴۰۴-۱۴۰۵" />
        </div>
        <div className="space-y-2">
          <Label>شهریه پایه</Label>
          <Input
            type="number"
            min={0}
            value={baseTuition}
            onChange={(e) => setBaseTuition(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>شهریه با سرویس</Label>
          <Input
            type="number"
            min={0}
            value={withService}
            onChange={(e) => setWithService(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>هزینه ثبت‌نام</Label>
          <Input
            type="number"
            min={0}
            value={registrationFee}
            onChange={(e) => setRegistrationFee(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </Button>
      </form>
    </DashboardPage>
  )
}
