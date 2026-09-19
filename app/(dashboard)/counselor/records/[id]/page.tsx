'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type RecordDetail = {
  id: string
  status: string
  priority_level: string
  summary: string | null
  initial_assessment: string | null
  issue_categories: string[]
  student?: { full_name?: string; grade?: number } | null
}

export default function CounselorRecordDetailPage() {
  const params = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [record, setRecord] = useState<RecordDetail | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/counseling/records/${params.id}`)
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'پرونده یافت نشد')
          return
        }
        setRecord(json.record || json)
      } catch {
        setError('خطای اتصال به سرور')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [params.id])

  return (
    <DashboardPage
      kicker="مشاور"
      title={record?.student?.full_name || 'پرونده مشاوره'}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/counselor/records">بازگشت</Link>
          </Button>
          {record ? (
            <Button asChild>
              <Link href={`/counselor/records/${record.id}/edit`}>ویرایش</Link>
            </Button>
          ) : null}
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--lux-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          در حال بارگذاری
        </div>
      ) : error || !record ? (
        <EmptyState title="پرونده در دسترس نیست" description={error} />
      ) : (
        <GlassCard className="p-5 space-y-3">
          <div className="flex gap-2">
            <Badge variant="secondary">{record.status}</Badge>
            <Badge>{record.priority_level}</Badge>
          </div>
          <p className="text-sm text-[var(--lux-text-muted)]">
            {(record.issue_categories || []).join('، ') || 'بدون دسته'}
          </p>
          <p className="leading-loose">{record.summary || 'خلاصه ثبت نشده است.'}</p>
          {record.initial_assessment ? (
            <p className="text-sm leading-loose">{record.initial_assessment}</p>
          ) : null}
        </GlassCard>
      )}
    </DashboardPage>
  )
}
