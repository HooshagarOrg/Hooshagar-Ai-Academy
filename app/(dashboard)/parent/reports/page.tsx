'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Send, Calendar, TrendingUp, Award, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import Link from 'next/link';

interface Report {
  id: string;
  student_id: string;
  report_type: string;
  start_date: string;
  end_date: string;
  status: string;
  sent_at: string | null;
  academic_performance: {
    average_grade: number;
    total_assignments: number;
    completed_assignments: number;
    completion_rate: number;
    subjects: Array<{ name: string; grade: number; rank: number }>;
  };
  behavioral_analysis: {
    behavior_score: number;
    positive_behaviors: number;
    negative_behaviors: number;
    teacher_notes: string[];
  };
  attendance_stats: {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_arrivals: number;
    attendance_rate: number;
  };
  xp_progress: {
    total_xp: number;
    current_level: number;
    xp_gained_in_period: number;
    rank_in_class: number;
  };
  achievements: {
    total_badges: number;
    badges: Array<{ name: string; icon: string; earned_at: string }>;
  };
  recommendations: {
    strengths: string[];
    areas_for_improvement: string[];
    parent_guidance: string[];
  };
  student: {
    id: string;
    full_name: string;
    grade: number;
  };
  created_at: string;
}

export default function ParentReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // دریافت گزارش‌ها
  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reports/parent');
      const data = await response.json();

      if (response.ok) {
        setReports(data.reports || []);
        if (data.reports && data.reports.length > 0) {
          setSelectedReport(data.reports[0]);
        }
      } else {
        toast.error(data.error || 'خطا در دریافت گزارش‌ها');
      }
    } catch (error) {
      console.error('خطا در دریافت گزارش‌ها:', error);
      toast.error('خطا در دریافت گزارش‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // فرمت نوع گزارش
  const formatReportType = (type: string) => {
    const types: Record<string, string> = {
      daily: 'روزانه',
      weekly: 'هفتگی',
      monthly: 'ماهانه',
      semester: 'ترم',
      yearly: 'سالانه',
    };
    return types[type] || type;
  };

  // فرمت تاریخ
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fa-IR').format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">هنوز گزارشی ثبت نشده است</p>
              <Button onClick={fetchReports}>بروزرسانی</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-white" />
                <h1 className="text-3xl font-bold text-white">گزارش‌های تحصیلی</h1>
              </div>
              <p className="text-purple-100">پیشرفت تحصیلی و رفتاری فرزند شما</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* لیست گزارش‌ها */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-lg mb-3">گزارش‌ها</h3>
          {reports.map((report) => (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedReport?.id === report.id ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedReport(report)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge>{formatReportType(report.report_type)}</Badge>
                  {report.status === 'sent' && (
                    <Badge variant="outline" className="text-green-600">
                      ارسال شده
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm">{report.student.full_name}</CardTitle>
                <CardDescription className="text-xs">
                  {formatDate(report.start_date)} تا {formatDate(report.end_date)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* محتوای گزارش */}
        {selectedReport && (
          <div className="lg:col-span-3 space-y-6">
            {/* اطلاعات کلی */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>گزارش {formatReportType(selectedReport.report_type)}</CardTitle>
                    <CardDescription>
                      {selectedReport.student.full_name} - پایه {selectedReport.student.grade}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 ml-2" />
                      دانلود PDF
                    </Button>
                    <Button size="sm">
                      <Send className="w-4 h-4 ml-2" />
                      ارسال
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* آمار کلیدی */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedReport.academic_performance.average_grade.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">میانگین نمرات</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <div className="text-3xl font-bold text-green-600">
                    {selectedReport.attendance_stats.attendance_rate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-500">حضور</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                  <div className="text-3xl font-bold text-purple-600">
                    {selectedReport.xp_progress.total_xp}
                  </div>
                  <div className="text-sm text-gray-500">امتیاز XP</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <div className="text-3xl font-bold text-yellow-600">
                    {selectedReport.achievements.total_badges}
                  </div>
                  <div className="text-sm text-gray-500">نشان‌ها</div>
                </CardContent>
              </Card>
            </div>

            {/* عملکرد تحصیلی */}
            <Card>
              <CardHeader>
                <CardTitle>عملکرد تحصیلی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">تکالیف تکمیل شده</p>
                    <Progress
                      value={selectedReport.academic_performance.completion_rate}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedReport.academic_performance.completed_assignments} از{' '}
                      {selectedReport.academic_performance.total_assignments} ({selectedReport.academic_performance.completion_rate.toFixed(0)}%)
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">نمرات درس‌ها</h4>
                  <div className="space-y-3">
                    {selectedReport.academic_performance.subjects.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-xs text-gray-500">رتبه {subject.rank} کلاس</p>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{subject.grade}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* تحلیل رفتاری */}
            <Card>
              <CardHeader>
                <CardTitle>تحلیل رفتاری</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700">امتیاز رفتاری</span>
                  <span className="text-3xl font-bold text-green-600">
                    {selectedReport.behavioral_analysis.behavior_score}/100
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">رفتارهای مثبت</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedReport.behavioral_analysis.positive_behaviors}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">رفتارهای منفی</p>
                    <p className="text-2xl font-bold text-red-600">
                      {selectedReport.behavioral_analysis.negative_behaviors}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">یادداشت‌های معلم</h4>
                  <ul className="space-y-2">
                    {selectedReport.behavioral_analysis.teacher_notes.map((note, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* توصیه‌ها */}
            <Card>
              <CardHeader>
                <CardTitle>توصیه‌ها و راهنمایی‌ها</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">💪 نقاط قوت</h4>
                  <ul className="space-y-1">
                    {selectedReport.recommendations.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-gray-700">• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">📈 نیاز به بهبود</h4>
                  <ul className="space-y-1">
                    {selectedReport.recommendations.areas_for_improvement.map((area, index) => (
                      <li key={index} className="text-sm text-gray-700">• {area}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">👨‍👩‍👧 راهنمایی برای والدین</h4>
                  <ul className="space-y-1">
                    {selectedReport.recommendations.parent_guidance.map((guidance, index) => (
                      <li key={index} className="text-sm text-gray-700">• {guidance}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

