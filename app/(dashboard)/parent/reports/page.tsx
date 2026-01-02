'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReportCard from '@/components/reports/ReportCard';
import { ParentReport } from '@/types/parent-reports.types';
import { FileText, Filter, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ParentReportsPage() {
  const [reports, setReports] = useState<ParentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchReports();
  }, [filterType]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError('');

      let url = '/api/reports/list?limit=50';
      if (filterType !== 'all') {
        url += `&report_type=${filterType}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'دریافت گزارش‌ها ناموفق بود');
        return;
      }

      setReports(data.reports);
    } catch (err) {
      console.error('خطا در دریافت گزارش‌ها:', err);
      setError('خطای شبکه. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">گزارش‌های عملکرد</h1>
          <p className="text-muted-foreground mt-1">
            مشاهده و بررسی گزارش‌های تحصیلی فرزندان
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {reports.length} گزارش
          </Badge>
        </div>
      </div>

      {/* فیلترها */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">نوع گزارش:</span>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="همه گزارش‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه گزارش‌ها</SelectItem>
                <SelectItem value="weekly">هفتگی</SelectItem>
                <SelectItem value="monthly">ماهانه</SelectItem>
                <SelectItem value="term">ترم</SelectItem>
                <SelectItem value="custom">سفارشی</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFilterType('all');
                fetchReports();
              }}
            >
              بازنشانی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* لیست گزارش‌ها */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 rounded w-4/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={fetchReports} variant="outline" className="mt-4">
                تلاش مجدد
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">هنوز گزارشی منتشر نشده است</p>
              <p className="text-sm mt-2">
                گزارش‌های جدید توسط معلم یا مدیر مدرسه منتشر خواهد شد.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
