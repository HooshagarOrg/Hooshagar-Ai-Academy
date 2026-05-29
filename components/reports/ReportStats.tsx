'use client';

import { ReportStats as IReportStats } from '@/types/parent-reports.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  Heart,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportStatsProps {
  stats: IReportStats;
  showDetails?: boolean;
}

export default function ReportStats({ stats, showDetails = false }: ReportStatsProps) {
  const getScoreColor = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const statCards = [
    {
      title: 'میانگین نمرات',
      value: stats.average_grade.toFixed(1),
      max: 100,
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'حضور و غیاب',
      value: stats.attendance_rate.toFixed(1),
      max: 100,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      unit: '%',
    },
    {
      title: 'انجام تکالیف',
      value: stats.homework_completion.toFixed(1),
      max: 100,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      unit: '%',
    },
    {
      title: 'رفتار و انضباط',
      value: stats.behavior_score.toFixed(1),
      max: 10,
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      unit: '/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* آمار کلیدی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const percentage = (parseFloat(stat.value) / stat.max) * 100;
          
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                  {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
                </div>
                <Progress 
                  value={percentage} 
                  className={cn('mt-2', getScoreColor(parseFloat(stat.value), stat.max))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(0)}% از حداکثر
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* جزئیات بیشتر */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">جزئیات آماری</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* نمرات به تفکیک درس */}
              {stats.grades_by_subject && Object.keys(stats.grades_by_subject).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">نمرات به تفکیک درس:</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.grades_by_subject).map(([subject, grade]) => (
                      <div key={subject} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{subject}:</span>
                        <span className="font-medium">{grade.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* حضور و غیاب */}
              {(stats.total_absences !== undefined || stats.total_late !== undefined) && (
                <div>
                  <h4 className="font-semibold mb-2">حضور و غیاب:</h4>
                  <div className="space-y-2">
                    {stats.total_absences !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">غیبت:</span>
                        <span className="font-medium">{stats.total_absences} روز</span>
                      </div>
                    )}
                    {stats.total_late !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">تأخیر:</span>
                        <span className="font-medium">{stats.total_late} بار</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* تکالیف */}
              {(stats.homework_submitted !== undefined || stats.homework_total !== undefined) && (
                <div>
                  <h4 className="font-semibold mb-2">تکالیف:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">انجام شده:</span>
                      <span className="font-medium">
                        {stats.homework_submitted} از {stats.homework_total}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* رفتار */}
              {(stats.positive_behaviors !== undefined || stats.negative_behaviors !== undefined) && (
                <div>
                  <h4 className="font-semibold mb-2">رفتار:</h4>
                  <div className="space-y-2">
                    {stats.positive_behaviors !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">رفتارهای مثبت:</span>
                        <span className="font-medium text-green-600">{stats.positive_behaviors}</span>
                      </div>
                    )}
                    {stats.negative_behaviors !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">رفتارهای منفی:</span>
                        <span className="font-medium text-red-600">{stats.negative_behaviors}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
