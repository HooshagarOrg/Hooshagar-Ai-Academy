'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ReportStats from '@/components/reports/ReportStats';
import ReportInsights from '@/components/reports/ReportInsights';
import { ParentReport } from '@/types/parent-reports.types';
import { ArrowRight, Calendar, FileText, Download, Share2 } from 'lucide-react';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<ParentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError('');

      const res = await fetch(`/api/reports/${reportId}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'دریافت گزارش ناموفق بود');
        return;
      }

      setReport(data.report);
    } catch (err) {
      console.error('خطا در دریافت گزارش:', err);
      setError('خطای شبکه. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const typeLabels = {
    weekly: 'هفتگی',
    monthly: 'ماهانه',
    term: 'ترم',
    custom: 'سفارشی',
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{error || 'گزارش یافت نشد'}</p>
              <Button onClick={() => router.back()} variant="outline" className="mt-4">
                بازگشت
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            دانلود PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            اشتراک‌گذاری
          </Button>
        </div>
      </div>

      {/* اطلاعات کلی */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {report.student?.full_name || 'دانش‌آموز'}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                پایه {report.student?.grade} - {report.student?.class_name}
              </p>
            </div>
            <Badge variant="outline">
              {typeLabels[report.report_type]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(report.period_start)} تا {formatDate(report.period_end)}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div>
              تاریخ انتشار: {report.published_at ? formatDate(report.published_at) : 'نامشخص'}
            </div>
            {report.view_count > 0 && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div>{report.view_count} بازدید</div>
              </>
            )}
          </div>

          {report.summary && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">{report.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* آمار عملکرد */}
      <div>
        <h2 className="text-xl font-semibold mb-4">آمار عملکرد</h2>
        <ReportStats stats={report.stats} showDetails={true} />
      </div>

      {/* تحلیل‌ها و توصیه‌ها */}
      {(report.ai_insights || report.recommendations?.length > 0) && (
        <div>
          <h2 className="text-xl font-semibold mb-4">تحلیل‌ها و توصیه‌ها</h2>
          <ReportInsights
            insights={report.ai_insights}
            recommendations={report.recommendations}
          />
        </div>
      )}

      {/* روند پیشرفت */}
      {report.progress && report.progress.previous_period && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مقایسه با دوره قبل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">میانگین نمرات:</p>
                <p className="text-lg font-semibold">
                  {report.progress.grade_change > 0 ? '+' : ''}
                  {report.progress.grade_change.toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">حضور:</p>
                <p className="text-lg font-semibold">
                  {report.progress.attendance_change > 0 ? '+' : ''}
                  {report.progress.attendance_change.toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">تکالیف:</p>
                <p className="text-lg font-semibold">
                  {report.progress.homework_change > 0 ? '+' : ''}
                  {report.progress.homework_change.toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">رفتار:</p>
                <p className="text-lg font-semibold">
                  {report.progress.behavior_change > 0 ? '+' : ''}
                  {report.progress.behavior_change.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
