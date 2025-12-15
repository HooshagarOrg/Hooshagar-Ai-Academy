'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Home,
  FileText,
  TrendingUp,
  Award,
  Clock,
  Users,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  type ExamResult,
  type QuestionReview,
  getScoreColor,
  getScoreLabel,
} from '@/lib/types/exam.types';
import confetti from 'canvas-confetti';

// کامپوننت گیج نمره
function ScoreGauge({ percentage, passed }: { percentage: number; passed: boolean }) {
  const rotation = (percentage / 100) * 180 - 90;
  const color = passed ? '#22c55e' : '#ef4444';

  return (
    <div className="relative w-64 h-32 mx-auto">
      <svg viewBox="0 0 200 100" className="w-full h-full">
        {/* پس‌زمینه */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* مقدار */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.51} 251`}
          className="transition-all duration-1000"
        />
        {/* عقربه */}
        <motion.line
          x1="100"
          y1="100"
          x2="100"
          y2="35"
          stroke="#1f2937"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1, type: 'spring' }}
          style={{ transformOrigin: '100px 100px' }}
        />
        <circle cx="100" cy="100" r="6" fill="#1f2937" />
      </svg>
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
          {percentage.toFixed(0)}%
        </div>
      </motion.div>
    </div>
  );
}

// صفحه اصلی
export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [reviews, setReviews] = useState<QuestionReview[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [classStats, setClassStats] = useState<{
    average: number;
    median: number;
    highest: number;
    lowest: number;
    total_participants: number;
  } | null>(null);
  const [topicScores, setTopicScores] = useState<
    Array<{ topic: string; score: number }>
  >([]);

  // نمایش کانفتی برای قبولی
  useEffect(() => {
    const score = searchParams.get('score');
    if (score && parseFloat(score) >= 50) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 500);
    }
  }, [searchParams]);

  // بارگذاری نتایج
  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/exams/${params.id}/result`);
        if (!res.ok) throw new Error('خطا');

        const data = await res.json();
        setResult(data.result);
        setReviews(data.reviews || []);
        setExamTitle(data.exam_title || '');
        setClassStats(data.class_stats);
        setTopicScores(data.topic_scores || []);
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

    fetchResult();
  }, [params.id, toast]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 text-center">
        <p>نتایجی یافت نشد</p>
        <Button onClick={() => router.push('/student/exams')} className="mt-4">
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* هدر نتیجه */}
      <Card
        className={`overflow-hidden ${
          result.passed
            ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
            : 'border-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
        }`}
      >
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            {result.passed ? (
              <Trophy className="w-20 h-20 mx-auto text-yellow-500" />
            ) : (
              <AlertCircle className="w-20 h-20 mx-auto text-red-500" />
            )}
          </motion.div>
          <CardTitle className="text-2xl mt-4">
            {result.passed ? '🎉 تبریک! قبول شدید' : 'متأسفانه قبول نشدید'}
          </CardTitle>
          <CardDescription>{examTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScoreGauge percentage={result.percentage} passed={result.passed} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="text-center p-4 rounded-lg bg-background/50">
              <CheckCircle2 className="w-6 h-6 mx-auto text-green-500" />
              <div className="text-2xl font-bold mt-1">{result.correct_count}</div>
              <div className="text-sm text-muted-foreground">پاسخ صحیح</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <XCircle className="w-6 h-6 mx-auto text-red-500" />
              <div className="text-2xl font-bold mt-1">{result.wrong_count}</div>
              <div className="text-sm text-muted-foreground">پاسخ غلط</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <AlertCircle className="w-6 h-6 mx-auto text-yellow-500" />
              <div className="text-2xl font-bold mt-1">
                {result.unanswered_count}
              </div>
              <div className="text-sm text-muted-foreground">بدون پاسخ</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <Sparkles className="w-6 h-6 mx-auto text-amber-500" />
              <div className="text-2xl font-bold mt-1">+{result.xp_earned}</div>
              <div className="text-sm text-muted-foreground">XP کسب شده</div>
            </div>
          </div>

          {result.rank && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-center"
            >
              <Award className="w-8 h-8 mx-auto text-amber-600" />
              <div className="text-lg font-bold text-amber-800 dark:text-amber-400 mt-2">
                رتبه شما: {result.rank} از {result.total_participants}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* آمار کلاس */}
      {classStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                مقایسه با کلاس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>نمره شما</span>
                  <div className="flex items-center gap-2">
                    <Progress value={result.percentage} className="w-32 h-2" />
                    <span className="font-bold">{result.percentage.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>میانگین کلاس</span>
                  <div className="flex items-center gap-2">
                    <Progress value={classStats.average} className="w-32 h-2" />
                    <span className="font-bold">
                      {classStats.average.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>بالاترین نمره</span>
                  <div className="flex items-center gap-2">
                    <Progress value={classStats.highest} className="w-32 h-2" />
                    <span className="font-bold">
                      {classStats.highest.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>پایین‌ترین نمره</span>
                  <div className="flex items-center gap-2">
                    <Progress value={classStats.lowest} className="w-32 h-2" />
                    <span className="font-bold">
                      {classStats.lowest.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-muted text-center text-sm">
                {result.percentage > classStats.average ? (
                  <span className="text-green-600">
                    🎉 شما {(result.percentage - classStats.average).toFixed(0)}%
                    بالاتر از میانگین هستید!
                  </span>
                ) : (
                  <span className="text-yellow-600">
                    📚 برای بهبود نتیجه، بیشتر تمرین کنید
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* نمودار رادار موضوعات */}
          {topicScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  عملکرد در موضوعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={topicScores}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="topic" fontSize={12} />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="نمره"
                      dataKey="score"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.5}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* بررسی سوالات */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              بررسی سوالات
            </CardTitle>
            <CardDescription>
              پاسخ‌های خود را مرور کنید و از اشتباهات یاد بگیرید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {reviews.map((review, i) => (
                <AccordionItem
                  key={review.question.id}
                  value={review.question.id}
                  className={`border rounded-lg px-4 ${
                    review.is_correct
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-right">
                      {review.is_correct ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm line-clamp-1">
                        {review.question.question_text}
                      </span>
                      <Badge variant="outline" className="mr-auto">
                        {review.points_earned}/{review.max_points}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <p className="text-sm">{review.question.question_text}</p>

                      {review.question.options && (
                        <div className="space-y-2">
                          {review.question.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-2 rounded text-sm ${
                                opt.id === review.correct_answer
                                  ? 'bg-green-100 border border-green-300'
                                  : review.answer?.answer_option === opt.id &&
                                    !review.is_correct
                                  ? 'bg-red-100 border border-red-300'
                                  : 'bg-muted'
                              }`}
                            >
                              <span className="font-bold ml-2">{opt.id})</span>
                              {opt.text}
                              {opt.id === review.correct_answer && (
                                <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-600" />
                              )}
                              {review.answer?.answer_option === opt.id &&
                                !review.is_correct && (
                                  <XCircle className="w-4 h-4 inline mr-2 text-red-600" />
                                )}
                            </div>
                          ))}
                        </div>
                      )}

                      {review.question.explanation && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
                          <strong className="text-blue-700">توضیح: </strong>
                          <span className="text-blue-800">
                            {review.question.explanation}
                          </span>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* دکمه‌های اکشن */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/student/exams')}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          بازگشت به لیست امتحانات
        </Button>
        <Button onClick={() => router.push('/dashboard')} className="gap-2">
          <Home className="w-4 h-4" />
          داشبورد
        </Button>
      </div>
    </div>
  );
}







































