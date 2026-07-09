'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ReportCard from '@/components/reports/ReportCard'
import { ParentReport } from '@/types/parent-reports.types'
import { FileText, Filter, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageSkeletonCards } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ParentReportsPage() {
  const [reports, setReports] = useState<ParentReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchReports()
  }, [filterType])

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      setError('')

      let url = '/api/reports/list?limit=50'
      if (filterType !== 'all') {
        url += `&report_type=${filterType}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('network')
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'دریافت گزارش‌ها ناموفق بود. لطفاً دوباره تلاش کنید.')
        return
      }

      setReports(data.reports)
    } catch {
      setError('اتصال برقرار نشد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardPage
      title="گزارش‌های عملکرد"
      description="مشاهده و بررسی گزارش‌های تحصیلی فرزندان"
      actions={
        <Badge variant="outline" className="w-fit text-sm">
          {reports.length} گزارش
        </Badge>
      }
    >
      <DashboardSectionBlock>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              فیلترها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-[var(--lux-text-muted)]" />
                <span className="text-sm text-[var(--lux-text)]">نوع گزارش:</span>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="همه گزارش‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه گزارش‌ها</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                  <SelectItem value="monthly">ماهانه</SelectItem>
                  <SelectItem value="term">ترم</SelectItem>
                  <SelectItem value="custom">سفارشی</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 w-full sm:w-auto"
                onClick={() => {
                  setFilterType('all')
                  fetchReports()
                }}
              >
                بازنشانی
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        {isLoading ? (
          <PageSkeletonCards count={4} />
        ) : error ? (
          <PageErrorState message={error} onRetry={fetchReports} />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="هنوز گزارشی منتشر نشده است"
            description="گزارش‌های جدید توسط معلم یا مدیر مدرسه منتشر خواهد شد."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
