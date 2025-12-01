'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
} from 'recharts';
import {
  Download,
  FileText,
  Mail,
  Users,
  TrendingUp,
  Clock,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Meh,
  BarChart3,
  PieChartIcon,
  Activity,
  Eye,
  Calendar,
} from 'lucide-react';
import {
  type Survey,
  type QuestionResult,
  type SurveyResults,
  SURVEY_TYPE_LABELS,
  QUESTION_TYPE_LABELS,
  getDaysRemaining,
  ratingToPercentage,
  EMOJI_RATINGS,
} from '@/lib/types/survey.types';

// رنگ‌های نمودار
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#eab308',
  negative: '#ef4444',
};

// کامپوننت گیج (نیم‌دایره)
function GaugeChart({ value, max = 5 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className="relative w-48 h-24 mx-auto">
      <svg viewBox="0 0 200 100" className="w-full h-full">
        {/* پس‌زمینه */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* مقدار */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.51} 251`}
        />
        {/* گرادیانت */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {/* عقربه */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="30"
          stroke="#1f2937"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${rotation} 100 100)`}
        />
        <circle cx="100" cy="100" r="8" fill="#1f2937" />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className="text-3xl font-bold">{value.toFixed(1)}</div>
        <div className="text-sm text-muted-foreground">از {max}</div>
      </div>
    </div>
  );
}

// کامپوننت ابر کلمات ساده
function WordCloud({ words }: { words: { text: string; count: number }[] }) {
  const maxCount = Math.max(...words.map((w) => w.count));

  return (
    <div className="flex flex-wrap gap-2 justify-center p-4">
      {words.map((word, i) => {
        const size = 0.8 + (word.count / maxCount) * 0.8;
        const opacity = 0.5 + (word.count / maxCount) * 0.5;
        return (
          <span
            key={i}
            className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary transition-transform hover:scale-110"
            style={{
              fontSize: `${size}rem`,
              opacity,
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
}

// صفحه اصلی
export default function SurveyResultsPage() {
  const params = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // بارگذاری داده‌ها
  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/surveys/${params.id}/results`);
        if (!res.ok) throw new Error('خطا');

        const data = await res.json();
        setSurvey(data.survey);
        setResults(data);
      } catch (error) {
        console.error(error);
        toast({
          title: 'خطا',
          description: 'دریافت نتایج با مشکل مواجه شد',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [params.id, toast]);

  // اکسپورت
  const handleExport = async (format: 'excel' | 'pdf') => {
    toast({
      title: 'در حال آماده‌سازی',
      description: `فایل ${format.toUpperCase()} در حال ساخته شدن است...`,
    });
    // TODO: Implement export
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!survey || !results) {
    return (
      <div className="p-6 text-center">
        <p>نتایجی یافت نشد</p>
      </div>
    );
  }

  // داده‌های نمونه برای نمودارها
  const responsesByRole = results.responses_by_role || {
    parent: 95,
    student: 50,
  };

  const dailyResponses = results.daily_responses || [
    { date: '1403/09/01', count: 5 },
    { date: '1403/09/02', count: 12 },
    { date: '1403/09/03', count: 18 },
    { date: '1403/09/04', count: 25 },
    { date: '1403/09/05', count: 30 },
    { date: '1403/09/06', count: 28 },
    { date: '1403/09/07', count: 27 },
  ];

  const overallAverage = results.questions
    .filter((q) => q.average_rating !== null)
    .reduce((sum, q) => sum + (q.average_rating || 0), 0) /
    results.questions.filter((q) => q.average_rating !== null).length || 4.2;

  const radarData = results.questions
    .filter((q) => q.average_rating !== null)
    .slice(0, 6)
    .map((q) => ({
      subject: q.question_text.substring(0, 20) + '...',
      value: q.average_rating || 0,
      fullMark: 5,
    }));

  const sentimentData = [
    { name: 'مثبت', value: 50, icon: '😍' },
    { name: 'خنثی', value: 25, icon: '😐' },
    { name: 'منفی', value: 10, icon: '😞' },
  ];

  const comparisonData = results.questions
    .filter((q) => q.average_rating !== null)
    .slice(0, 5)
    .map((q, i) => ({
      name: `سوال ${i + 1}`,
      والدین: 3.8 + Math.random() * 1.2,
      'دانش‌آموزان': 4 + Math.random() * 1,
    }));

  const wordCloudData = [
    { text: 'عالی', count: 45 },
    { text: 'مهربان', count: 38 },
    { text: 'باتجربه', count: 35 },
    { text: 'دلسوز', count: 30 },
    { text: 'خوب', count: 28 },
    { text: 'حرفه‌ای', count: 25 },
    { text: 'صبور', count: 22 },
    { text: 'خلاق', count: 20 },
    { text: 'دقیق', count: 18 },
    { text: 'با انضباط', count: 15 },
  ];

  const trendData = [
    { term: 'بهار ۱۴۰۲', score: 3.8 },
    { term: 'تابستان ۱۴۰۲', score: 4.0 },
    { term: 'پاییز ۱۴۰۲', score: 4.2 },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Badge className="mb-2">
                {SURVEY_TYPE_LABELS[survey.survey_type]}
              </Badge>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                نتایج: {survey.title}
              </CardTitle>
              <CardDescription className="mt-2">
                {survey.description}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
              >
                <Download className="w-4 h-4 ml-1" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
              >
                <FileText className="w-4 h-4 ml-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 ml-1" />
                ایمیل
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                کل پاسخ‌ها
              </div>
              <div className="text-2xl font-bold mt-1">
                {survey.total_responses}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  از {survey.target_response_count || '∞'}
                </span>
              </div>
              <Progress
                value={
                  survey.target_response_count
                    ? (survey.total_responses / survey.target_response_count) *
                      100
                    : 100
                }
                className="mt-2 h-1"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                والدین
              </div>
              <div className="text-2xl font-bold mt-1">
                {responsesByRole.parent || 0}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  (
                  {Math.round(
                    ((responsesByRole.parent || 0) / survey.total_responses) *
                      100
                  )}
                  %)
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                دانش‌آموزان
              </div>
              <div className="text-2xl font-bold mt-1">
                {responsesByRole.student || 0}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  (
                  {Math.round(
                    ((responsesByRole.student || 0) / survey.total_responses) *
                      100
                  )}
                  %)
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                وضعیت
              </div>
              <div className="mt-1">
                <Badge
                  variant={survey.status === 'active' ? 'default' : 'secondary'}
                >
                  {survey.status === 'active' ? 'فعال' : 'بسته'}
                </Badge>
                {survey.status === 'active' && (
                  <span className="text-sm text-muted-foreground mr-2">
                    ({getDaysRemaining(survey.end_date)} روز باقی‌مانده)
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نمودارهای اصلی */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* گیج میانگین کلی */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              میانگین کلی رضایت
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <GaugeChart value={overallAverage} />
            <div className="mt-6 flex items-center gap-2">
              <span className="text-lg">سطح رضایت:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(overallAverage)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Badge
                variant={
                  overallAverage >= 4
                    ? 'default'
                    : overallAverage >= 3
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {overallAverage >= 4
                  ? 'عالی'
                  : overallAverage >= 3
                  ? 'خوب'
                  : 'نیاز به بهبود'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* توزیع نمرات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              توزیع نمرات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { name: '5⭐', value: 45 },
                  { name: '4⭐', value: 30 },
                  { name: '3⭐', value: 15 },
                  { name: '2⭐', value: 7 },
                  { name: '1⭐', value: 3 },
                ]}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 50]} />
                <YAxis type="category" dataKey="name" width={50} />
                <Tooltip formatter={(value) => [`${value}%`, 'درصد']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {[0, 1, 2, 3, 4].map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[4 - index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ردیف دوم نمودارها */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* روند پاسخ‌ها */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              روند پاسخ‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyResponses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  fill="url(#colorGradient)"
                  name="تعداد پاسخ"
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* رادار مقایسه سوالات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              مقایسه سوالات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" fontSize={10} />
                <PolarRadiusAxis domain={[0, 5]} />
                <Radar
                  name="میانگین"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* مقایسه والدین و دانش‌آموزان + تحلیل احساسات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* مقایسه */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              مقایسه نظرات والدین و دانش‌آموزان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="والدین" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="دانش‌آموزان"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* تحلیل احساسات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              تحلیل احساسات نظرات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  <Cell fill={SENTIMENT_COLORS.positive} />
                  <Cell fill={SENTIMENT_COLORS.neutral} />
                  <Cell fill={SENTIMENT_COLORS.negative} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                <span className="text-sm">مثبت: 50</span>
              </div>
              <div className="flex items-center gap-2">
                <Meh className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">خنثی: 25</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-500" />
                <span className="text-sm">منفی: 10</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ابر کلمات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            کلمات پرتکرار در نظرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WordCloud words={wordCloudData} />
        </CardContent>
      </Card>

      {/* جدول نظرات متنی */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              نظرات متنی
            </CardTitle>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="فیلتر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="positive">مثبت</SelectItem>
                <SelectItem value="neutral">خنثی</SelectItem>
                <SelectItem value="negative">منفی</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">تاریخ</TableHead>
                <TableHead className="w-24">نقش</TableHead>
                <TableHead>نظر</TableHead>
                <TableHead className="w-24">احساس</TableHead>
                <TableHead className="w-20">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  date: '۱۴۰۳/۰۹/۱۵',
                  role: 'والد',
                  text: 'معلم عالی و باتجربه‌ای هستند. بچه‌ها عاشق کلاسشان هستند.',
                  sentiment: 'positive' as const,
                },
                {
                  date: '۱۴۰۳/۰۹/۱۴',
                  role: 'دانش‌آموز',
                  text: 'کلاس جالب و پرانرژی بود. خیلی چیزها یاد گرفتم.',
                  sentiment: 'positive' as const,
                },
                {
                  date: '۱۴۰۳/۰۹/۱۳',
                  role: 'والد',
                  text: 'امیدوارم روش‌های تدریس بهتر شود.',
                  sentiment: 'neutral' as const,
                },
                {
                  date: '۱۴۰۳/۰۹/۱۲',
                  role: 'دانش‌آموز',
                  text: 'سرعت تدریس زیاد است.',
                  sentiment: 'negative' as const,
                },
              ].map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">{item.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.role}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">{item.text}</TableCell>
                  <TableCell>
                    {item.sentiment === 'positive' && (
                      <span className="text-2xl">😊</span>
                    )}
                    {item.sentiment === 'neutral' && (
                      <span className="text-2xl">😐</span>
                    )}
                    {item.sentiment === 'negative' && (
                      <span className="text-2xl">😞</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* گزارش تفصیلی هر سوال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            گزارش تفصیلی هر سوال
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {results.questions.map((q, i) => (
              <AccordionItem
                key={q.question_id}
                value={q.question_id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-right">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm">
                      {q.question_text.substring(0, 50)}...
                    </span>
                    {q.average_rating !== null && (
                      <Badge variant="outline">
                        میانگین: {q.average_rating?.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        نوع سوال: {QUESTION_TYPE_LABELS[q.question_type]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        تعداد پاسخ: {q.total_responses}
                      </p>
                      {q.average_rating !== null && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            میانگین: {q.average_rating?.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            میانه: {q.median_rating?.toFixed(2)}
                          </p>
                        </>
                      )}
                    </div>
                    {q.distribution && (
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(q.distribution).map(
                              ([key, value]) => ({
                                name: key,
                                value,
                              })
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* روند در طول زمان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            روند در طول زمان
          </CardTitle>
          <CardDescription>
            مقایسه نتایج نظرسنجی‌های قبلی
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="term" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                name="نمره"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
            <TrendingUp className="w-5 h-5" />
            <span>روند: رو به بهبود (+8%)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
