'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ReportStats from '@/components/reports/ReportStats'
import ReportInsights from '@/components/reports/ReportInsights'
import { ParentReport } from '@/types/parent-reports.types'
import { ArrowRight, Calendar, Download, Share2 } from 'lucide-react'
import { PageErrorState, PageSkeletonCards } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

const typeLabels = {
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  term: 'ترم',
  custom: 'سفارشی',
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<ParentReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  const fetchReport = async () => {
    try {
      setIsLoading(true)
      setError('')

      const res = await fetch(`/api/reports/${reportId}`)
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'دریافت گزارش ناموفق بود')
        return
      }

      setReport(data.report)
    } catch (err) {
      console.error('خطا در دریافت گزارش:', err)
      setError('خطای شبکه. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" onClick={() => router.back()} className="min-h-10 gap-2">
        <ArrowRight className="h-4 w-4" aria-hidden />
        بازگشت
      </Button>
      <Button variant="outline" size="sm" className="min-h-10 gap-2">
        <Download className="h-4 w-4" aria-hidden />
        دانلود PDF
      </Button>
      <Button variant="outline" size="sm" className="min-h-10 gap-2">
        <Share2 className="h-4 w-4" aria-hidden />
        اشتراک‌گذاری
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <DashboardPage title="جزئیات گزارش" description="در حال بارگذاری...">
        <PageSkeletonCards count={2} />
      </DashboardPage>
    )
  }

  if (error || !report) {
    return (
      <DashboardPage title="جزئیات گزارش" actions={headerActions}>
        <PageErrorState message={error || 'گزارش یافت نشد'} onRetry={fetchReport} retryLabel="تلاش مجدد" />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      title={report.student?.full_name || 'جزئیات گزارش'}
      description={`پایه ${report.student?.grade} — ${report.student?.class_name || ''}`}
      actions={headerActions}
    >
      <DashboardSectionBlock>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-xl">اطلاعات گزارش</CardTitle>
              <Badge variant="outline">{typeLabels[report.report_type]}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--lux-text-muted)]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(report.period_start)} تا {formatDate(report.period_end)}
                </span>
              </div>
              <Separator orientation="vertical" className="hidden h-4 sm:block" />
              <div>
                تاریخ انتشار: {report.published_at ? formatDate(report.published_at) : 'نامشخص'}
              </div>
              {report.view_count > 0 && (
                <>
                  <Separator orientation="vertical" className="hidden h-4 sm:block" />
                  <div>{report.view_count} بازدید</div>
                </>
              )}
            </div>

            {report.summary && (
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="text-sm leading-7 text-[var(--lux-text)]">{report.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        <h2 className="mb-4 text-xl font-bold text-[var(--lux-text)]">آمار عملکرد</h2>
        <ReportStats stats={report.stats} showDetails={true} />
      </DashboardSectionBlock>

      {(report.ai_insights || report.recommendations?.length > 0) && (
        <DashboardSectionBlock>
          <h2 className="mb-4 text-xl font-bold text-[var(--lux-text)]">تحلیل‌ها و توصیه‌ها</h2>
          <ReportInsights insights={report.ai_insights} recommendations={report.recommendations} />
        </DashboardSectionBlock>
      )}

      {report.progress && report.progress.previous_period && (
        <DashboardSectionBlock>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">مقایسه با دوره قبل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-[var(--lux-text-muted)]">میانگین نمرات:</p>
                  <p className="text-lg font-semibold text-[var(--lux-text)]">
                    {report.progress.grade_change > 0 ? '+' : ''}
                    {report.progress.grade_change.toFixed(1)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--lux-text-muted)]">حضور:</p>
                  <p className="text-lg font-semibold text-[var(--lux-text)]">
                    {report.progress.attendance_change > 0 ? '+' : ''}
                    {report.progress.attendance_change.toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--lux-text-muted)]">تکالیف:</p>
                  <p className="text-lg font-semibold text-[var(--lux-text)]">
                    {report.progress.homework_change > 0 ? '+' : ''}
                    {report.progress.homework_change.toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--lux-text-muted)]">رفتار:</p>
                  <p className="text-lg font-semibold text-[var(--lux-text)]">
                    {report.progress.behavior_change > 0 ? '+' : ''}
                    {report.progress.behavior_change.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </DashboardSectionBlock>
      )}
    </DashboardPage>
  )
}
