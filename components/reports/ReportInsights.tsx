'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
} from 'lucide-react';

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface ReportInsightsProps {
  aiInsights?: string;
  recommendations?: Recommendation[];
  charts?: {
    strengths?: string[];
    weaknesses?: string[];
    parent_tips?: string[];
  };
}

export default function ReportInsights({
  aiInsights,
  recommendations = [],
  charts = {},
}: ReportInsightsProps) {
  const priorityConfig = {
    high: {
      label: 'اولویت بالا',
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    },
    medium: {
      label: 'اولویت متوسط',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    },
    low: {
      label: 'اولویت پایین',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
  };

  return (
    <div className="space-y-6">
      {/* تحلیل هوش مصنوعی */}
      {aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              تحلیل هوشمند
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {aiInsights}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* نقاط قوت */}
        {charts.strengths && charts.strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                نقاط قوت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {charts.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* نقاط ضعف */}
        {charts.weaknesses && charts.weaknesses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-5 w-5" />
                نقاط قابل بهبود
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {charts.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* توصیه‌ها */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              توصیه‌های بهبود عملکرد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <Badge className={priorityConfig[rec.priority].color}>
                    {priorityConfig[rec.priority].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* توصیه‌های والدین */}
      {charts.parent_tips && charts.parent_tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
              توصیه‌ها برای والدین
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {charts.parent_tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

