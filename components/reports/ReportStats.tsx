'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  CalendarCheck,
  BookOpen,
  TrendingUp,
  Award,
} from 'lucide-react';

interface ReportStatsProps {
  stats: {
    average_grade?: number;
    attendance_rate?: number;
    homework_completion?: number;
    behavior_score?: number;
    total_score?: number;
  };
}

export default function ReportStats({ stats }: ReportStatsProps) {
  const statItems = [
    {
      title: 'میانگین نمرات',
      value: stats.average_grade?.toFixed(1) || '0',
      max: 20,
      icon: GraduationCap,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'حضور و غیاب',
      value: stats.attendance_rate?.toFixed(0) || '0',
      max: 100,
      suffix: '%',
      icon: CalendarCheck,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'انجام تکالیف',
      value: stats.homework_completion?.toFixed(0) || '0',
      max: 100,
      suffix: '%',
      icon: BookOpen,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'امتیاز رفتاری',
      value: stats.behavior_score?.toFixed(1) || '0',
      max: 10,
      icon: Award,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ];

  const getProgressValue = (value: number, max: number) => {
    return (value / max) * 100;
  };

  return (
    <div className="space-y-6">
      {/* امتیاز کلی */}
      {stats.total_score !== undefined && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              امتیاز کلی عملکرد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total_score.toFixed(1)}
              </span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <Progress value={stats.total_score} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* آمار تفصیلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          const value = parseFloat(item.value);
          const progress = getProgressValue(value, item.max);

          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${item.color}`}>
                    {item.value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.suffix || `/${item.max}`}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

