'use client'

import { useEffect, useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'

type HealthRecord = {
  id: string
  blood_type: string | null
  students?: { full_name?: string; classes?: { name?: string } | { name?: string }[] }
}

function classNameOf(record: HealthRecord): string {
  const cls = record.students?.classes
  const row = Array.isArray(cls) ? cls[0] : cls
  return row?.name || ''
}

export default function HealthVpStudentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [records, setRecords] = useState<HealthRecord[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/health/records')
        const json = await res.json()
        if (!res.ok || json.success === false) {
          setError(json.error || 'دریافت پرونده‌ها ناموفق بود')
          return
        }
        setRecords(json.data || [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage kicker="معاون بهداشت" title="پرونده‌های بهداشتی">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={Heart} title="پرونده‌ها در دسترس نیست" description={error} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="هنوز پرونده بهداشتی ثبت نشده"
          description="پرونده‌ها از مسیر بهداشت برای دانش‌آموزان ساخته می‌شوند."
        />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <GlassCard key={record.id} className="p-4">
              <p className="font-semibold">{record.students?.full_name || 'دانش‌آموز'}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">
                {classNameOf(record) ? `کلاس ${classNameOf(record)} · ` : ''}
                گروه خونی: {record.blood_type || 'ثبت نشده'}
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
