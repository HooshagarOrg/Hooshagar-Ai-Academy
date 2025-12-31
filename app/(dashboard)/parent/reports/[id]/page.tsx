'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReportStats from '@/components/reports/ReportStats';
import ReportInsights from '@/components/reports/ReportInsights';
import {
  ArrowLeft,
  Calendar,
  User,
  GraduationCap,
  AlertCircle,
  Sparkles,
  Download,
} from 'lucide-react';

interface Report {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: string;
  summary?: string;
  ai_insights?: string;
  stats: {
    average_grade?: number;
    attendance_rate?: number;
    homework_completion?: number;
    behavior_score?: number;
    total_score?: number;
  };
  charts?: {
    strengths?: string[];
    weaknesses?: string[];
    parent_tips?: string[];
  };
  recommendations?: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  student: {
    full_name: string;
    grade: number;
    profile_picture?: string;
  };
  created_at: string;
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/${reportId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'دریافت گزارش ناموفق بود');
      }

      setReport(data.report);
    } catch (err) {
      console.error('خطا در دریافت گزارش:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = async () => {
    if (!report) return;

    try {
      setIsGeneratingInsights(true);

      const response = await fetch('/api/reports/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'تولید تحلیل ناموفق بود');
      }

      // بروزرسانی گزارش
      await fetchReport();
    } catch (err) {
      console.error('خطا در تولید تحلیل:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const reportTypeLabels: Record<string, string> = {
    weekly: 'گزارش هفتگی',
    monthly: 'گزارش ماهانه',
    term: 'گزارش ترم',
    custom: 'گزارش سفارشی',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/parent/reports')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          بازگشت
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'گزارش یافت نشد'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/parent/reports')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          بازگشت به لیست
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          دانلود PDF
        </Button>
      </div>

      {/* اطلاعات گزارش */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">
                  {reportTypeLabels[report.report_type]}
                </CardTitle>
                <Badge variant="outline">
                  {report.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{report.student.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>پایه {report.student.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(report.period_start)} - {formatDate(report.period_end)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {report.summary && (
          <CardContent>
            <p className="text-muted-foreground">{report.summary}</p>
          </CardContent>
        )}
      </Card>

      {/* آمار عملکرد */}
      <div>
        <h2 className="text-xl font-bold mb-4">آمار عملکرد</h2>
        <ReportStats stats={report.stats} />
      </div>

      {/* تحلیل‌های هوش مصنوعی */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">تحلیل‌های هوشمند</h2>
          {!report.ai_insights && (
            <Button
              onClick={generateAIInsights}
              disabled={isGeneratingInsights}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGeneratingInsights ? 'در حال تولید...' : 'تولید تحلیل AI'}
            </Button>
          )}
        </div>

        {report.ai_insights || report.recommendations ? (
          <ReportInsights
            aiInsights={report.ai_insights}
            recommendations={report.recommendations}
            charts={report.charts}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              برای مشاهده تحلیل‌های هوشمند، روی دکمه "تولید تحلیل AI" کلیک کنید
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

