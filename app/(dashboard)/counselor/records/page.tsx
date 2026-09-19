'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type RecordRow = {
  id: string
  status: string
  priority_level: string
  summary: string | null
  student: { full_name?: string; grade?: number } | null
}

const PRIORITY_FA: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'بالا',
  urgent: 'فوری',
}

const STATUS_FA: Record<string, string> = {
  active: 'فعال',
  closed: 'بسته',
  referred: 'ارجاع',
}

export default function CounselorRecordsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [records, setRecords] = useState<RecordRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/counseling/records?limit=50')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'دریافت پرونده‌ها ناموفق بود')
          return
        }
        setRecords(json.records || [])
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <DashboardPage
      kicker="مشاور"
      title="پرونده‌های مشاوره"
      actions={
        <Button asChild>
          <Link href="/counselor/records/new">پرونده جدید</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error ? (
        <EmptyState icon={FileText} title="پرونده‌ها در دسترس نیست" description={error} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="هنوز پرونده‌ای ثبت نشده"
          description="برای دانش‌آموز نیازمند پیگیری، پرونده جدید بسازید."
          action={
            <Button asChild>
              <Link href="/counselor/records/new">پرونده جدید</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Link key={record.id} href={`/counselor/records/${record.id}`} className="block">
              <GlassCard className="p-4 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{record.student?.full_name || 'دانش‌آموز'}</p>
                    <p className="text-sm text-[var(--lux-text-muted)] mt-1">
                      {record.summary || 'بدون خلاصه'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary">{STATUS_FA[record.status] || record.status}</Badge>
                    <span className="text-xs text-[var(--lux-text-muted)]">
                      {PRIORITY_FA[record.priority_level] || record.priority_level}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </DashboardPage>
  )
}
