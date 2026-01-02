'use client';

import { ParentReport } from '@/types/parent-reports.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import Link from 'next/link';

interface ReportCardProps {
  report: ParentReport;
  showActions?: boolean;
}

export default function ReportCard({ report, showActions = true }: ReportCardProps) {
  const statusColors = {
    draft: 'bg-gray-500',
    published: 'bg-green-500',
    archived: 'bg-red-500',
  };

  const typeLabels = {
    weekly: 'هفتگی',
    monthly: 'ماهانه',
    term: 'ترم',
    custom: 'سفارشی',
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">
                {report.student?.full_name || 'دانش‌آموز'}
              </CardTitle>
              <Badge className={statusColors[report.report_status]}>
                {report.report_status === 'draft' && 'پیش‌نویس'}
                {report.report_status === 'published' && 'منتشر شده'}
                {report.report_status === 'archived' && 'آرشیو'}
              </Badge>
              <Badge variant="outline">
                {typeLabels[report.report_type]}
              </Badge>
            </div>
            {report.student?.grade && (
              <p className="text-sm text-muted-foreground">
                پایه {report.student.grade} - {report.student.class_name || 'کلاس نامشخص'}
              </p>
            )}
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(report.stats.total_score)}`}>
            {report.stats.total_score.toFixed(1)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* بازه زمانی */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(report.period_start)} تا {formatDate(report.period_end)}
            </span>
          </div>

          {/* آمار کلیدی */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span>میانگین نمرات:</span>
              <span className="font-semibold">{report.stats.average_grade.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span>حضور:</span>
              <span className="font-semibold">{report.stats.attendance_rate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span>تکالیف:</span>
              <span className="font-semibold">{report.stats.homework_completion.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span>رفتار:</span>
              <span className="font-semibold">{report.stats.behavior_score.toFixed(1)}/10</span>
            </div>
          </div>

          {/* روند پیشرفت */}
          {report.progress && report.progress.grade_change !== 0 && (
            <div className="flex items-center gap-2 text-sm">
              {report.progress.grade_change > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">
                    +{report.progress.grade_change.toFixed(1)} نسبت به دوره قبل
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">
                    {report.progress.grade_change.toFixed(1)} نسبت به دوره قبل
                  </span>
                </>
              )}
            </div>
          )}

          {/* متادیتا */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>ایجاد: {formatDate(report.generated_at)}</span>
            </div>
            {report.view_count > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{report.view_count} بازدید</span>
              </div>
            )}
          </div>

          {/* دکمه‌ها */}
          {showActions && (
            <Link href={`/parent/reports/${report.id}`}>
              <Button className="w-full" variant="outline">
                مشاهده جزئیات
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
