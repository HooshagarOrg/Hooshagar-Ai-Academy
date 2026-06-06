'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DashboardPage } from '@/components/layout/dashboard-page';
import {
  ClipboardList,
  Clock,
  ChevronRight,
  ChevronLeft,
  Star,
  Save,
  Send,
  CheckCircle2,
  Home,
  BarChart3,
  GripVertical,
  Sparkles,
} from 'lucide-react';
import {
  type Survey,
  type SurveyQuestion,
  type QuestionType,
  EMOJI_RATINGS,
  getDaysRemaining,
} from '@/lib/types/survey.types';
import confetti from 'canvas-confetti';

// کامپوننت سوال ستاره‌ای
function StarRating({
  value,
  onChange,
  max = 5,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <motion.button
          key={star}
          type="button"
          className="text-4xl transition-transform focus:outline-none"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`w-10 h-10 transition-colors ${
              star <= (hover || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
}

// کامپوننت ایموجی
function EmojiRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-4 justify-center">
      {EMOJI_RATINGS.map((emoji, index) => (
        <motion.button
          key={index}
          type="button"
          className={`text-5xl p-2 rounded-xl transition-all focus:outline-none ${
            value === index + 1
              ? 'bg-primary/10 ring-2 ring-primary scale-110'
              : 'hover:bg-muted'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(index + 1)}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}

// کامپوننت مقیاس
function ScaleRating({
  value,
  onChange,
  min = 1,
  max = 5,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => (
        <motion.button
          key={num}
          type="button"
          className={`w-12 h-12 rounded-full text-lg font-bold transition-all focus:outline-none ${
            value === num
              ? 'bg-primary text-primary-foreground scale-110'
              : 'bg-muted hover:bg-muted/80'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(num)}
        >
          {num}
        </motion.button>
      ))}
    </div>
  );
}

// کامپوننت رتبه‌بندی (Drag & Drop)
function RankingQuestion({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [items, setItems] = useState<string[]>(value.length > 0 ? value : options);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    onChange(items);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground text-center mb-4">
        آیتم‌ها را بکشید و رها کنید تا ترتیب اهمیت را مشخص کنید
      </p>
      {items.map((item, index) => (
        <motion.div
          key={item}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-3 p-4 rounded-lg border cursor-move transition-colors ${
            draggedIndex === index
              ? 'bg-primary/10 border-primary'
              : 'bg-card hover:bg-muted'
          }`}
          layout
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
            {index + 1}
          </span>
          <span className="flex-1">{item}</span>
        </motion.div>
      ))}
    </div>
  );
}

// کامپوننت اصلی سوال
function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string | number | string[];
  onChange: (v: string | number | string[]) => void;
}) {
  const options = question.options || [];

  switch (question.question_type) {
    case 'rating_stars':
      return (
        <StarRating
          value={value as number}
          onChange={(v) => onChange(v)}
          max={question.max_value || 5}
        />
      );

    case 'emoji_rating':
      return (
        <EmojiRating value={value as number} onChange={(v) => onChange(v)} />
      );

    case 'rating_scale':
      return (
        <ScaleRating
          value={value as number}
          onChange={(v) => onChange(v)}
          min={question.min_value || 1}
          max={question.max_value || 5}
        />
      );

    case 'slider':
      return (
        <div className="space-y-6 px-4">
          <Slider
            value={[value as number]}
            onValueChange={([v]) => onChange(v)}
            min={question.min_value || 0}
            max={question.max_value || 100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{question.min_value || 0}</span>
            <span className="text-2xl font-bold text-primary">{value || 0}</span>
            <span>{question.max_value || 100}</span>
          </div>
        </div>
      );

    case 'multiple_choice':
      return (
        <RadioGroup
          value={value as string}
          onValueChange={(v) => onChange(v)}
          className="space-y-3"
        >
          {options.map((option, index) => (
            <motion.div
              key={index}
              className={`flex items-center space-x-3 space-x-reverse p-4 rounded-lg border transition-colors cursor-pointer ${
                value === option
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted'
              }`}
              whileHover={{ scale: 1.01 }}
              onClick={() => onChange(option)}
            >
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label
                htmlFor={`option-${index}`}
                className="flex-1 cursor-pointer"
              >
                {option}
              </Label>
            </motion.div>
          ))}
        </RadioGroup>
      );

    case 'yes_no':
      return (
        <div className="flex gap-4 justify-center">
          {['بله', 'خیر'].map((opt) => (
            <motion.button
              key={opt}
              type="button"
              className={`px-8 py-4 rounded-xl text-lg font-medium transition-all ${
                value === opt
                  ? opt === 'بله'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(opt)}
            >
              {opt}
            </motion.button>
          ))}
        </div>
      );

    case 'ranking':
      return (
        <RankingQuestion
          options={options}
          value={value as string[]}
          onChange={(v) => onChange(v)}
        />
      );

    case 'text':
      return (
        <div className="space-y-2">
          <Textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder="نظر خود را بنویسید..."
            className="min-h-[150px] resize-none"
            maxLength={500}
          />
          <p className="text-sm text-muted-foreground text-left">
            {(value as string)?.length || 0} / 500 کاراکتر
          </p>
        </div>
      );

    default:
      return (
        <p className="text-center text-muted-foreground">
          نوع سوال پشتیبانی نمی‌شود
        </p>
      );
  }
}

// صفحه تکمیل موفق
function SuccessPage({
  survey,
  xpEarned,
  showResults,
}: {
  survey: Survey;
  xpEarned: number;
  showResults: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    // انیمیشن کانفتی
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </motion.div>
          <CardTitle className="text-2xl">تشکر از شما!</CardTitle>
          <CardDescription>{survey.thank_you_message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30"
          >
            <div className="flex items-center justify-center gap-2 text-amber-600">
              <Sparkles className="w-6 h-6" />
              <span className="text-2xl font-bold">+{xpEarned} XP</span>
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              به عنوان پاداش شرکت در نظرسنجی
            </p>
          </motion.div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/dashboard')} className="gap-2">
              <Home className="w-4 h-4" />
              بازگشت به داشبورد
            </Button>
            {showResults && (
              <Button
                variant="outline"
                onClick={() => router.push(`/surveys/${survey.id}/results`)}
                className="gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                مشاهده نتایج
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// صفحه اصلی نظرسنجی
export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, string | number | string[]>
  >({});
  const [sessionId] = useState(() => crypto.randomUUID());
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(50);
  const [startTime] = useState(() => Date.now());

  // بارگذاری نظرسنجی
  useEffect(() => {
    async function fetchSurvey() {
      try {
        const res = await fetch(`/api/surveys/${params.id}`);
        if (!res.ok) throw new Error('خطا در دریافت نظرسنجی');

        const data = await res.json();
        setSurvey(data.survey);
        setQuestions(data.questions);
      } catch (error) {
        console.error(error);
        toast({
          title: 'خطا',
          description: 'دریافت نظرسنجی با مشکل مواجه شد',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSurvey();
  }, [params.id, toast]);

  // پاسخ به سوال
  const handleAnswer = useCallback(
    (questionId: string, value: string | number | string[]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  // ذخیره پیش‌نویس
  const saveDraft = useCallback(async () => {
    // ذخیره در localStorage
    localStorage.setItem(
      `survey-draft-${params.id}`,
      JSON.stringify({ answers, currentIndex })
    );
    toast({
      title: 'ذخیره شد',
      description: 'پاسخ‌های شما ذخیره موقت شد',
    });
  }, [answers, currentIndex, params.id, toast]);

  // ارسال نهایی
  const handleSubmit = async () => {
    // چک سوالات اجباری
    const unansweredRequired = questions.filter(
      (q) => q.is_required && !answers[q.id]
    );

    if (unansweredRequired.length > 0) {
      toast({
        title: 'خطا',
        description: `لطفاً به تمام سوالات اجباری پاسخ دهید (${unansweredRequired.length} سوال باقی‌مانده)`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const totalTime = Math.round((Date.now() - startTime) / 1000);

      const res = await fetch(`/api/surveys/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answers,
          total_time: totalTime,
        }),
      });

      if (!res.ok) throw new Error('خطا در ارسال');

      const data = await res.json();
      setXpEarned(data.xp_earned || 50);

      // حذف پیش‌نویس
      localStorage.removeItem(`survey-draft-${params.id}`);

      setCompleted(true);
    } catch (error) {
      console.error(error);
      toast({
        title: 'خطا',
        description: 'ارسال نظرسنجی با مشکل مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // بارگذاری پیش‌نویس
  useEffect(() => {
    const draft = localStorage.getItem(`survey-draft-${params.id}`);
    if (draft) {
      try {
        const { answers: savedAnswers, currentIndex: savedIndex } =
          JSON.parse(draft);
        setAnswers(savedAnswers);
        setCurrentIndex(savedIndex);
        toast({
          title: 'پیش‌نویس بازیابی شد',
          description: 'پاسخ‌های قبلی شما بازیابی شد',
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, [params.id, toast]);

  // لودینگ
  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // نظرسنجی یافت نشد
  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">نظرسنجی یافت نشد</h2>
          <p className="text-muted-foreground mb-4">
            این نظرسنجی وجود ندارد یا منقضی شده است
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            بازگشت به داشبورد
          </Button>
        </Card>
      </div>
    );
  }

  // صفحه موفقیت
  if (completed) {
    return (
      <SuccessPage
        survey={survey}
        xpEarned={xpEarned}
        showResults={survey.show_results_to_respondents}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <DashboardPage className="max-w-2xl mx-auto" title={survey.title} description={survey.description} animatedSections={false}>
        <Card className="border-primary/20 glass-panel">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  <ClipboardList className="w-3 h-3 ml-1" />
                  نظرسنجی
                </Badge>
                <CardTitle className="text-xl">{survey.title}</CardTitle>
                <CardDescription className="mt-2">
                  {survey.description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{getDaysRemaining(survey.end_date)} روز باقی‌مانده</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>پیشرفت</span>
                <span>
                  {currentIndex + 1} از {questions.length} سوال
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* سوال */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {currentIndex + 1}
                  </span>
                  <span>سوال {currentIndex + 1} از {questions.length}</span>
                  {currentQuestion.is_required && (
                    <Badge variant="destructive" className="mr-auto text-xs">
                      اجباری
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQuestion.question_text}
                </CardTitle>
                {currentQuestion.hint_text && (
                  <CardDescription>{currentQuestion.hint_text}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <QuestionRenderer
                  question={currentQuestion}
                  value={answers[currentQuestion.id] || (currentQuestion.question_type === 'ranking' ? [] : currentQuestion.question_type === 'text' ? '' : 0)}
                  onChange={(v) => handleAnswer(currentQuestion.id, v)}
                />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* ناوبری */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveDraft}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  ذخیره موقت
                </Button>
              </div>

              {currentIndex < questions.length - 1 ? (
                <Button
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(questions.length - 1, i + 1)
                    )
                  }
                  className="gap-2"
                >
                  بعدی
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      ارسال نهایی
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* خلاصه پاسخ‌ها */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">پاسخ داده شده:</span>
              <span className="font-medium">
                {answeredCount} از {questions.length} سوال
              </span>
            </div>
            <div className="flex gap-1 mt-2">
              {questions.map((q, i) => (
                <motion.button
                  key={q.id}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    answers[q.id]
                      ? 'bg-green-500'
                      : i === currentIndex
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                  whileHover={{ scaleY: 1.5 }}
                  onClick={() => setCurrentIndex(i)}
                  title={`سوال ${i + 1}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
    </DashboardPage>
  );
}
