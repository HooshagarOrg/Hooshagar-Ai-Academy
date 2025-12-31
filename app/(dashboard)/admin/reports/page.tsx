'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Calendar,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      total: number;
      success: number;
      failed: number;
    };
  } | null>(null);

  const generateReports = async (type: 'weekly' | 'monthly') => {
    try {
      setIsGenerating(true);
      setResult(null);

      const response = await fetch('/api/reports/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'تولید گزارش‌ها ناموفق بود');
      }

      setResult(data);
    } catch (err) {
      console.error('خطا در تولید گزارش‌ها:', err);
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'خطای نامشخص',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">مدیریت گزارش‌های والدین</h1>
        <p className="text-muted-foreground">
          تولید خودکار گزارش‌های هفتگی و ماهانه برای والدین
        </p>
      </div>

      {/* نتیجه */}
      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="space-y-2">
              <p>{result.message}</p>
              {result.stats && (
                <div className="flex gap-4 text-sm">
                  <span>کل: {result.stats.total}</span>
                  <span className="text-green-600">
                    موفق: {result.stats.success}
                  </span>
                  {result.stats.failed > 0 && (
                    <span className="text-red-600">
                      ناموفق: {result.stats.failed}
                    </span>
                  )}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* کارت‌های تولید گزارش */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* گزارش هفتگی */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                گزارش هفتگی
              </CardTitle>
              <Badge variant="outline">7 روز اخیر</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              تولید گزارش عملکرد 7 روز اخیر برای تمام دانش‌آموزان
            </p>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                میانگین نمرات
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                حضور و غیاب
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                تکالیف
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                رفتار و انضباط
              </li>
            </ul>

            <Button
              className="w-full gap-2"
              onClick={() => generateReports('weekly')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال تولید...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  تولید گزارش هفتگی
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* گزارش ماهانه */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                گزارش ماهانه
              </CardTitle>
              <Badge variant="outline">30 روز اخیر</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              تولید گزارش جامع 30 روز اخیر برای تمام دانش‌آموزان
            </p>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                تحلیل روند پیشرفت
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                مقایسه با ماه قبل
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                توصیه‌های هوش مصنوعی
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                نمودارهای پیشرفت
              </li>
            </ul>

            <Button
              className="w-full gap-2"
              onClick={() => generateReports('monthly')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال تولید...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  تولید گزارش ماهانه
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* راهنما */}
      <Card>
        <CardHeader>
          <CardTitle>راهنمای تولید گزارش‌ها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">گزارش هفتگی:</h4>
            <p className="text-sm text-muted-foreground">
              این گزارش شامل عملکرد 7 روز اخیر دانش‌آموز است و برای پیگیری سریع
              مناسب است. توصیه می‌شود هر هفته یکبار تولید شود.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">گزارش ماهانه:</h4>
            <p className="text-sm text-muted-foreground">
              این گزارش جامع‌تر است و شامل تحلیل روند پیشرفت، مقایسه با ماه قبل
              و توصیه‌های دقیق‌تر است. توصیه می‌شود هر ماه یکبار تولید شود.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">نکات مهم:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>گزارش‌ها فقط برای دانش‌آموزانی که والدین ثبت شده دارند تولید می‌شود</li>
              <li>گزارش‌ها به صورت خودکار منتشر می‌شوند</li>
              <li>والدین می‌توانند گزارش‌ها را در پنل خود مشاهده کنند</li>
              <li>برای هر گزارش می‌توانید تحلیل هوش مصنوعی تولید کنید</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

