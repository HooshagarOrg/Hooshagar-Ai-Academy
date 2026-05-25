'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReportCard from '@/components/reports/ReportCard';
import { ParentReport } from '@/types/parent-reports.types';
import { 
  FileText, 
  Plus, 
  Filter, 
  Search,
  Send,
  Sparkles
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ParentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // فرم ایجاد گزارش
  const [newReport, setNewReport] = useState({
    student_id: '',
    report_type: 'weekly',
    period_start: '',
    period_end: '',
  });

  useEffect(() => {
    fetchReports();
  }, [filterType, filterStatus]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError('');

      let url = '/api/reports/list?limit=100';
      if (filterType !== 'all') {
        url += `&report_type=${filterType}`;
      }
      if (filterStatus !== 'all') {
        url += `&report_status=${filterStatus}`;
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

  const handleGenerateReport = async () => {
    if (!newReport.student_id || !newReport.period_start || !newReport.period_end) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدها را پر کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGenerating(true);

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReport,
          period_start: new Date(newReport.period_start).toISOString(),
          period_end: new Date(newReport.period_end).toISOString(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast({
          title: 'خطا',
          description: data.error || 'ایجاد گزارش ناموفق بود',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'موفق',
        description: 'گزارش با موفقیت ایجاد شد',
      });

      setIsDialogOpen(false);
      setNewReport({
        student_id: '',
        report_type: 'weekly',
        period_start: '',
        period_end: '',
      });
      fetchReports();
    } catch (err) {
      console.error('خطا در ایجاد گزارش:', err);
      toast({
        title: 'خطا',
        description: 'خطای شبکه. لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishReport = async (reportId: string) => {
    try {
      const res = await fetch('/api/reports/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId }),
      });

      const data = await res.json();

      if (!data.success) {
        toast({
          title: 'خطا',
          description: data.error || 'انتشار گزارش ناموفق بود',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'موفق',
        description: 'گزارش با موفقیت منتشر شد',
      });

      fetchReports();
    } catch (err) {
      console.error('خطا در انتشار گزارش:', err);
      toast({
        title: 'خطا',
        description: 'خطای شبکه. لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateAIInsights = async (reportId: string) => {
    try {
      toast({
        title: 'در حال پردازش...',
        description: 'تحلیل هوشمند در حال تولید است',
      });

      const res = await fetch('/api/reports/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId }),
      });

      const data = await res.json();

      if (!data.success) {
        toast({
          title: 'خطا',
          description: data.error || 'تولید تحلیل ناموفق بود',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'موفق',
        description: `تحلیل هوشمند با ${data.model_used} تولید شد`,
      });

      fetchReports();
    } catch (err) {
      console.error('خطا در تولید تحلیل:', err);
      toast({
        title: 'خطا',
        description: 'خطای شبکه. لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
  };

  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;
    return report.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مدیریت گزارش‌ها</h1>
          <p className="text-muted-foreground mt-1">
            ایجاد، ویرایش و انتشار گزارش‌های عملکرد دانش‌آموزان
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              ایجاد گزارش جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ایجاد گزارش جدید</DialogTitle>
              <DialogDescription>
                گزارش عملکرد برای یک دانش‌آموز ایجاد کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student_id">شناسه دانش‌آموز</Label>
                <Input
                  id="student_id"
                  placeholder="UUID دانش‌آموز"
                  value={newReport.student_id}
                  onChange={(e) =>
                    setNewReport({ ...newReport, student_id: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="report_type">نوع گزارش</Label>
                <Select
                  value={newReport.report_type}
                  onValueChange={(value) =>
                    setNewReport({ ...newReport, report_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">هفتگی</SelectItem>
                    <SelectItem value="monthly">ماهانه</SelectItem>
                    <SelectItem value="term">ترم</SelectItem>
                    <SelectItem value="custom">سفارشی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="period_start">تاریخ شروع</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={newReport.period_start}
                  onChange={(e) =>
                    setNewReport({ ...newReport, period_start: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="period_end">تاریخ پایان</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={newReport.period_end}
                  onChange={(e) =>
                    setNewReport({ ...newReport, period_end: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
              >
                {isGenerating ? 'در حال ایجاد...' : 'ایجاد گزارش'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* فیلترها و جستجو */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            فیلترها و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search" className="sr-only">جستجو</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="جستجو نام دانش‌آموز..."
                  className="pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filterType" className="sr-only">نوع</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filterType">
                  <SelectValue placeholder="نوع گزارش" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه انواع</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                  <SelectItem value="monthly">ماهانه</SelectItem>
                  <SelectItem value="term">ترم</SelectItem>
                  <SelectItem value="custom">سفارشی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatus" className="sr-only">وضعیت</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filterStatus">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="draft">پیش‌نویس</SelectItem>
                  <SelectItem value="published">منتشر شده</SelectItem>
                  <SelectItem value="archived">آرشیو</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* لیست گزارش‌ها */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
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
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchQuery ? 'گزارشی یافت نشد' : 'هنوز گزارشی ایجاد نشده است'}
              </p>
              <p className="text-sm mt-2">
                برای شروع، روی دکمه "ایجاد گزارش جدید" کلیک کنید.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="space-y-2">
              <ReportCard report={report} showActions={false} />
              <div className="flex gap-2">
                {report.report_status === 'draft' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => handleGenerateAIInsights(report.id)}
                    >
                      <Sparkles className="h-4 w-4" />
                      تحلیل AI
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handlePublishReport(report.id)}
                    >
                      <Send className="h-4 w-4" />
                      انتشار
                    </Button>
                  </>
                )}
                {report.report_status === 'published' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`/parent/reports/${report.id}`, '_blank')}
                  >
                    مشاهده
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
