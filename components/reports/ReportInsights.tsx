'use client';

import { Recommendation } from '@/types/parent-reports.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Target
} from 'lucide-react';

interface ReportInsightsProps {
  insights?: string;
  recommendations?: Recommendation[];
  riskLevel?: 'low' | 'medium' | 'high';
  isLoading?: boolean;
}

export default function ReportInsights({ 
  insights, 
  recommendations = [], 
  riskLevel,
  isLoading = false 
}: ReportInsightsProps) {
  const riskColors = {
    low: { bg: 'bg-green-100', text: 'text-green-800', label: 'پایین' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'متوسط' },
    high: { bg: 'bg-red-100', text: 'text-red-800', label: 'بالا' },
  };

  const typeIcons = {
    strength: { icon: CheckCircle, color: 'text-green-600', label: 'نقطه قوت' },
    improvement: { icon: TrendingUp, color: 'text-blue-600', label: 'قابل بهبود' },
    concern: { icon: AlertTriangle, color: 'text-red-600', label: 'نیاز به توجه' },
    achievement: { icon: Target, color: 'text-purple-600', label: 'دستاورد' },
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-red-100 text-red-800',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-5/6" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-4/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insights && recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>هنوز تحلیل هوشمند برای این گزارش تولید نشده است.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* تحلیل کلی */}
      {insights && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                تحلیل هوشمند
              </CardTitle>
              {riskLevel && (
                <Badge className={`${riskColors[riskLevel].bg} ${riskColors[riskLevel].text}`}>
                  ریسک {riskColors[riskLevel].label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {insights}
            </p>
          </CardContent>
        </Card>
      )}

      {/* توصیه‌ها */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توصیه‌های کاربردی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => {
                const TypeIcon = typeIcons[rec.type]?.icon || Lightbulb;
                const iconColor = typeIcons[rec.type]?.color || 'text-gray-600';
                const typeLabel = typeIcons[rec.type]?.label || rec.type;
                
                return (
                  <div 
                    key={index}
                    className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`mt-1 ${iconColor}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm">{rec.title}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {typeLabel}
                          </Badge>
                          <Badge className={`text-xs ${priorityColors[rec.priority]}`}>
                            {rec.priority === 'low' && 'کم‌اهمیت'}
                            {rec.priority === 'medium' && 'متوسط'}
                            {rec.priority === 'high' && 'مهم'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rec.description}
                      </p>
                      {rec.action && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium text-blue-900">اقدام پیشنهادی: </span>
                          <span className="text-blue-700">{rec.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
