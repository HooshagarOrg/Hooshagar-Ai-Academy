'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ReportCard from '@/components/reports/ReportCard';
import { FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Report {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: string;
  stats: {
    average_grade?: number;
    attendance_rate?: number;
    homework_completion?: number;
    behavior_score?: number;
    total_score?: number;
  };
  student: {
    full_name: string;
    grade: number;
  };
  viewed_at?: string | null;
  view_count: number;
  created_at: string;
}

export default function ParentReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/reports/list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'دریافت گزارش‌ها ناموفق بود');
      }

      setReports(data.reports || []);
    } catch (err) {
      console.error('خطا در دریافت گزارش‌ها:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">گزارش‌های عملکرد</h1>
          <p className="text-muted-foreground">
            مشاهده گزارش‌های جامع عملکرد تحصیلی فرزندان
          </p>
        </div>
        <Button onClick={fetchReports} variant="outline">
          بروزرسانی
        </Button>
      </div>

      {/* خطا */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* لیست گزارش‌ها */}
      {reports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">هیچ گزارشی موجود نیست</h3>
              <p className="text-muted-foreground">
                گزارش‌های منتشر شده توسط معلم اینجا نمایش داده می‌شود
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* آمار کلی */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  مجموع گزارش‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reports.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  گزارش‌های جدید
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {reports.filter((r) => !r.viewed_at).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  آخرین گزارش
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {reports.length > 0
                    ? new Date(reports[0].created_at).toLocaleDateString('fa-IR')
                    : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* گرید گزارش‌ها */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

