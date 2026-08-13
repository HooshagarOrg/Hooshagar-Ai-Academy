'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, MessageSquare } from 'lucide-react'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxErrorState } from '@/components/lux/lux-page-states'

type SurveyRow = {
  id: string
  title: string
  status?: string
  survey_type?: string
}

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    fetch('/api/surveys?limit=50')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          setSurveys([])
          return
        }
        setSurveys(data.surveys || [])
      })
      .catch(() => setError('اتصال برقرار نشد'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-[var(--lux-primary)]" />
          نظرسنجی‌ها
        </span>
      }
      description="فهرست نظرسنجی‌های ثبت‌شده — بدون نتیجهٔ نمونه"
    >
      {loading ? (
        <DashboardSectionBlock>
          <div className="flex justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--lux-primary)]" />
          </div>
        </DashboardSectionBlock>
      ) : error ? (
        <DashboardSectionBlock>
          <LuxErrorState message={error} onRetry={load} variant="lux" />
        </DashboardSectionBlock>
      ) : surveys.length === 0 ? (
        <DashboardSectionBlock>
          <LuxEmptyState
            title="نظرسنجی‌ای ثبت نشده"
            description="وقتی نظرسنجی ساخته شود، نتایج واقعی از همین‌جا باز می‌شود."
          />
        </DashboardSectionBlock>
      ) : (
        <DashboardSectionBlock>
          <ul className="space-y-2">
            {surveys.map((survey) => (
              <li key={survey.id}>
                <Link
                  href={`/admin/surveys/${survey.id}/results`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--lux-text)] hover:border-white/20"
                >
                  <span className="font-bold">{survey.title}</span>
                  <span className="text-[var(--lux-text-muted)]">{survey.status || '—'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </DashboardSectionBlock>
      )}
    </DashboardPage>
  )
}
