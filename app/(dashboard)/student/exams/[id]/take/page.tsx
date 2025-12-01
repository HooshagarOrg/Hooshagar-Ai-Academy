'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Grid3X3,
  Save,
  Send,
  AlertTriangle,
  Check,
  X,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import {
  type ExamQuestion,
  type ExamAnswer,
  type AnswerStatus,
  formatTimeRemaining,
  calculateProgress,
  QUESTION_TYPE_LABELS,
} from '@/lib/types/exam.types';

// کامپوننت تایمر
function ExamTimer({
  seconds,
  onTimeUp,
}: {
  seconds: number;
  onTimeUp: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const isWarning = remaining < 300; // کمتر از 5 دقیقه
  const isDanger = remaining < 60; // کمتر از 1 دقیقه

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, onTimeUp]);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg transition-colors ${
        isDanger
          ? 'bg-red-100 text-red-700 animate-pulse'
          : isWarning
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-muted'
      }`}
    >
      <Clock className="w-5 h-5" />
      <span>{formatTimeRemaining(remaining)}</span>
    </div>
  );
}

// کامپوننت نقشه سوالات
function QuestionMap({
  questions,
  answers,
  currentIndex,
  flaggedIds,
  onSelect,
  onClose,
}: {
  questions: ExamQuestion[];
  answers: Record<string, string | null>;
  currentIndex: number;
  flaggedIds: string[];
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const getStatus = (q: ExamQuestion, index: number): AnswerStatus => {
    if (index === currentIndex) return 'current';
    if (flaggedIds.includes(q.id)) return 'flagged';
    if (answers[q.id]) return 'answered';
    return 'unanswered';
  };

  const statusColors: Record<AnswerStatus, string> = {
    answered: 'bg-green-500 text-white',
    unanswered: 'bg-muted',
    flagged: 'bg-yellow-500 text-white',
    current: 'bg-primary text-primary-foreground',
  };

  const statusIcons: Record<AnswerStatus, React.ReactNode> = {
    answered: <Check className="w-3 h-3" />,
    unanswered: null,
    flagged: <Flag className="w-3 h-3" />,
    current: null,
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            نقشه سوالات
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2 py-4">
          {questions.map((q, i) => {
            const status = getStatus(q, i);
            return (
              <motion.button
                key={q.id}
                className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-sm font-bold transition-colors ${statusColors[status]}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onSelect(i);
                  onClose();
                }}
              >
                {statusIcons[status] || i + 1}
                {!statusIcons[status] && (
                  <span className="text-xs">{i + 1}</span>
                )}
              </motion.button>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>پاسخ داده</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-primary" />
            <span>فعلی</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-muted" />
            <span>بدون پاسخ</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>علامت‌گذاری</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// کامپوننت رندر سوال
function QuestionRenderer({
  question,
  answer,
  onChange,
  showHint,
}: {
  question: ExamQuestion;
  answer: string | null;
  onChange: (value: string) => void;
  showHint: boolean;
}) {
  switch (question.question_type) {
    case 'multiple_choice':
      return (
        <div className="space-y-4">
          <RadioGroup value={answer || ''} onValueChange={onChange}>
            {question.options?.map((opt) => (
              <motion.div
                key={opt.id}
                className={`flex items-center space-x-3 space-x-reverse p-4 rounded-lg border cursor-pointer transition-colors ${
                  answer === opt.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                }`}
                whileHover={{ scale: 1.01 }}
                onClick={() => onChange(opt.id)}
              >
                <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} />
                <Label
                  htmlFor={`opt-${opt.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <span className="font-bold ml-2">{opt.id})</span>
                  {opt.text}
                </Label>
              </motion.div>
            ))}
          </RadioGroup>
          {showHint && question.hint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm"
            >
              <div className="flex items-center gap-2 text-yellow-700">
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">راهنمایی:</span>
              </div>
              <p className="mt-1 text-yellow-800">{question.hint}</p>
            </motion.div>
          )}
        </div>
      );

    case 'true_false':
      return (
        <div className="flex gap-4 justify-center">
          {[
            { value: 'true', label: 'صحیح', color: 'bg-green-500' },
            { value: 'false', label: 'غلط', color: 'bg-red-500' },
          ].map((opt) => (
            <motion.button
              key={opt.value}
              type="button"
              className={`px-8 py-4 rounded-xl text-lg font-medium transition-all ${
                answer === opt.value
                  ? `${opt.color} text-white`
                  : 'bg-muted hover:bg-muted/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      );

    case 'short_answer':
    case 'numerical':
      return (
        <Input
          type={question.question_type === 'numerical' ? 'number' : 'text'}
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            question.question_type === 'numerical'
              ? 'عدد پاسخ را وارد کنید'
              : 'پاسخ خود را وارد کنید'
          }
          className="text-lg"
        />
      );

    case 'essay':
      return (
        <Textarea
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="پاسخ خود را بنویسید..."
          className="min-h-[200px] text-base leading-relaxed"
        />
      );

    default:
      return (
        <p className="text-center text-muted-foreground">
          نوع سوال پشتیبانی نمی‌شود
        </p>
      );
  }
}

// صفحه اصلی
export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<{
    id: string;
    title: string;
    duration_minutes: number;
    exam_config: Record<string, unknown>;
  } | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [showHint, setShowHint] = useState(false);

  const startTimeRef = useRef(Date.now());
  const questionStartTimeRef = useRef(Date.now());

  // بارگذاری امتحان
  useEffect(() => {
    async function startExam() {
      try {
        // شروع جلسه امتحان
        const res = await fetch(`/api/exams/${params.id}/start`, {
          method: 'POST',
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'خطا در شروع امتحان');
        }

        const data = await res.json();
        setExam(data.exam);
        setQuestions(data.questions || []);
        setSessionId(data.session_id);
        setTimeRemaining(data.time_limit_minutes * 60);

        // بازیابی پاسخ‌های قبلی
        if (data.answers) {
          const prevAnswers: Record<string, string | null> = {};
          data.answers.forEach((a: ExamAnswer) => {
            prevAnswers[a.question_id] = a.answer_option || a.answer_text;
          });
          setAnswers(prevAnswers);
        }
      } catch (error) {
        console.error(error);
        toast({
          title: 'خطا',
          description:
            error instanceof Error ? error.message : 'خطا در بارگذاری امتحان',
          variant: 'destructive',
        });
        router.push('/student/exams');
      } finally {
        setLoading(false);
      }
    }

    startExam();
  }, [params.id, toast, router]);

  // ذخیره پاسخ
  const saveAnswer = useCallback(
    async (questionId: string, value: string) => {
      if (!sessionId) return;

      const timeSpent = Math.round(
        (Date.now() - questionStartTimeRef.current) / 1000
      );
      questionStartTimeRef.current = Date.now();

      try {
        await fetch(`/api/exams/${params.id}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            question_id: questionId,
            answer: value,
            time_spent: timeSpent,
            is_flagged: flaggedIds.includes(questionId),
          }),
        });
      } catch (error) {
        console.error('خطا در ذخیره پاسخ:', error);
      }
    },
    [params.id, sessionId, flaggedIds]
  );

  // تغییر پاسخ
  const handleAnswerChange = (value: string) => {
    const questionId = questions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    saveAnswer(questionId, value);
  };

  // علامت‌گذاری سوال
  const toggleFlag = () => {
    const questionId = questions[currentIndex].id;
    setFlaggedIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  // اتمام زمان
  const handleTimeUp = useCallback(() => {
    toast({
      title: 'زمان تمام شد!',
      description: 'پاسخ‌های شما در حال ارسال است...',
      variant: 'destructive',
    });
    handleSubmit();
  }, []);

  // ارسال امتحان
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!res.ok) throw new Error('خطا');

      const result = await res.json();
      router.push(`/student/exams/${params.id}/result?score=${result.percentage}`);
    } catch (error) {
      console.error(error);
      toast({
        title: 'خطا',
        description: 'ارسال امتحان با مشکل مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  // ناوبری
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      questionStartTimeRef.current = Date.now();
      setShowHint(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="h-16 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">امتحان یافت نشد</h2>
          <Button onClick={() => router.push('/student/exams')}>بازگشت</Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
  const progress = calculateProgress(answeredCount, questions.length);

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      {/* هدر ثابت */}
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-bold text-lg">{exam.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  سوال {currentIndex + 1} از {questions.length}
                </span>
                <Progress value={progress} className="w-24 h-2" />
              </div>
            </div>
            <ExamTimer seconds={timeRemaining} onTimeUp={handleTimeUp} />
          </div>
        </div>
      </div>

      {/* محتوای سوال */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {QUESTION_TYPE_LABELS[currentQuestion.question_type]}
                      </Badge>
                      <Badge variant="outline">
                        {currentQuestion.points} نمره
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-relaxed">
                      {currentQuestion.question_text}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFlag}
                    className={
                      flaggedIds.includes(currentQuestion.id)
                        ? 'text-yellow-500'
                        : ''
                    }
                  >
                    <Flag className="w-5 h-5" />
                  </Button>
                </div>
                {currentQuestion.image_url && (
                  <img
                    src={currentQuestion.image_url}
                    alt="تصویر سوال"
                    className="mt-4 max-h-64 object-contain rounded-lg mx-auto"
                  />
                )}
              </CardHeader>
              <CardContent>
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || null}
                  onChange={handleAnswerChange}
                  showHint={showHint}
                />

                {currentQuestion.hint && !showHint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(true)}
                    className="mt-4 text-yellow-600"
                  >
                    <HelpCircle className="w-4 h-4 ml-1" />
                    نمایش راهنمایی
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* فوتر ناوبری */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              قبلی
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(true)}
              >
                <Grid3X3 className="w-4 h-4 ml-1" />
                نقشه
              </Button>
            </div>

            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => goToQuestion(currentIndex + 1)}>
                بعدی
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            ) : (
              <Button
                onClick={() => setShowConfirm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 ml-1" />
                اتمام امتحان
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* نقشه سوالات */}
      {showMap && (
        <QuestionMap
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          flaggedIds={flaggedIds}
          onSelect={goToQuestion}
          onClose={() => setShowMap(false)}
        />
      )}

      {/* دیالوگ تأیید */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              تأیید اتمام امتحان
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-2">
              <p>
                پاسخ داده شده:{' '}
                <strong>
                  {answeredCount} از {questions.length}
                </strong>
              </p>
              <p>
                بدون پاسخ: <strong>{questions.length - answeredCount}</strong>{' '}
                سوال
              </p>
              {flaggedIds.length > 0 && (
                <p>
                  علامت‌گذاری شده: <strong>{flaggedIds.length}</strong> سوال
                </p>
              )}
              <p className="text-yellow-600 mt-4">
                ⚠️ پس از اتمام نمی‌توانید تغییری دهید.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>بازگشت</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'در حال ارسال...' : 'اتمام قطعی'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
