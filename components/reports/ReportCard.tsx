'use client';

import { Calendar, TrendingUp, Clock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ReportCardProps {
  report: {
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
  };
}

export default function ReportCard({ report }: ReportCardProps) {
  const reportTypeLabels: Record<string, string> = {
    weekly: 'گزارش هفتگی',
    monthly: 'گزارش ماهانه',
    term: 'گزارش ترم',
    custom: 'گزارش سفارشی',
  };

  const statusLabels: Record<string, string> = {
    draft: 'پیش‌نویس',
    published: 'منتشر شده',
    archived: 'بایگانی شده',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">
              {report.student.full_name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(report.period_start)} - {formatDate(report.period_end)}
              </span>
            </div>
          </div>
          <Badge className={statusColors[report.status]}>
            {statusLabels[report.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* نوع گزارش */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">نوع گزارش:</span>
          <Badge variant="outline">{reportTypeLabels[report.report_type]}</Badge>
        </div>

        {/* امتیاز کلی */}
        {report.stats.total_score !== undefined && (
          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm font-medium">امتیاز کلی:</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className={`text-lg font-bold ${getScoreColor(report.stats.total_score)}`}>
                {report.stats.total_score.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* آمار سریع */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {report.stats.average_grade !== undefined && (
            <div className="space-y-1">
              <span className="text-muted-foreground">میانگین نمرات:</span>
              <div className={`font-semibold ${getScoreColor(report.stats.average_grade)}`}>
                {report.stats.average_grade.toFixed(1)}
              </div>
            </div>
          )}
          {report.stats.attendance_rate !== undefined && (
            <div className="space-y-1">
              <span className="text-muted-foreground">حضور و غیاب:</span>
              <div className={`font-semibold ${getScoreColor(report.stats.attendance_rate)}`}>
                {report.stats.attendance_rate.toFixed(0)}%
              </div>
            </div>
          )}
          {report.stats.homework_completion !== undefined && (
            <div className="space-y-1">
              <span className="text-muted-foreground">تکالیف:</span>
              <div className={`font-semibold ${getScoreColor(report.stats.homework_completion)}`}>
                {report.stats.homework_completion.toFixed(0)}%
              </div>
            </div>
          )}
          {report.stats.behavior_score !== undefined && (
            <div className="space-y-1">
              <span className="text-muted-foreground">رفتار:</span>
              <div className="font-semibold">
                {report.stats.behavior_score.toFixed(1)}
              </div>
            </div>
          )}
        </div>

        {/* وضعیت مشاهده */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3" />
            <span>{report.view_count} بار مشاهده</span>
          </div>
          {report.viewed_at && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>آخرین مشاهده: {formatDate(report.viewed_at)}</span>
            </div>
          )}
        </div>

        {/* دکمه مشاهده */}
        <Link href={`/parent/reports/${report.id}`}>
          <Button className="w-full" variant="outline">
            مشاهده گزارش کامل
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

