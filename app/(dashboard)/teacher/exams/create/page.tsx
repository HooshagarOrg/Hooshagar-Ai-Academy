'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Check,
  Shuffle,
  Clock,
  BookOpen,
  Settings,
  Eye,
  Sparkles,
  Calculator,
  FileText,
} from 'lucide-react';
import {
  type QuestionBankItem,
  type DifficultyDistribution,
  type CreateExamInput,
  type ExamConfig,
  SUBJECTS,
  GRADE_LEVELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_ICONS,
  QUESTION_TYPE_LABELS,
} from '@/lib/types/exam.types';
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page';

// کامپوننت Stepper
function Stepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${
              index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
          </div>
          <span
            className={`mx-2 hidden md:block ${
              index === currentStep ? 'font-bold' : 'text-muted-foreground'
            }`}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-1 rounded ${
                index < currentStep ? 'bg-green-500' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// مرحله 1: مشخصات امتحان
function Step1({
  data,
  onChange,
}: {
  data: CreateExamInput;
  onChange: (data: Partial<CreateExamInput>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>عنوان امتحان *</Label>
        <Input
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="مثال: امتحان میان‌ترم ریاضی"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>درس *</Label>
          <Select
            value={data.subject}
            onValueChange={(v) => onChange({ subject: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب درس" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>پایه تحصیلی *</Label>
          <Select
            value={data.grade?.toString()}
            onValueChange={(v) => onChange({ grade: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب پایه" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((g) => (
                <SelectItem key={g} value={g.toString()}>
                  پایه {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>تاریخ برگزاری *</Label>
          <Input
            type="date"
            value={data.exam_date}
            onChange={(e) => onChange({ exam_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>مدت زمان (دقیقه) *</Label>
          <Input
            type="number"
            min={10}
            max={180}
            value={data.duration_minutes}
            onChange={(e) =>
              onChange({ duration_minutes: parseInt(e.target.value) })
            }
          />
        </div>
      </div>
    </div>
  );
}

// مرحله 2: تنظیمات و توزیع سطح دشواری
function Step2({
  distribution,
  config,
  onDistributionChange,
  onConfigChange,
  totalQuestions,
  onTotalChange,
}: {
  distribution: DifficultyDistribution;
  config: Partial<ExamConfig>;
  onDistributionChange: (d: DifficultyDistribution) => void;
  onConfigChange: (c: Partial<ExamConfig>) => void;
  totalQuestions: number;
  onTotalChange: (n: number) => void;
}) {
  const total = distribution.easy + distribution.medium + distribution.hard;

  const updateDistribution = (
    level: keyof DifficultyDistribution,
    value: number
  ) => {
    const newDist = { ...distribution, [level]: value };
    const newTotal = newDist.easy + newDist.medium + newDist.hard;
    if (newTotal <= totalQuestions) {
      onDistributionChange(newDist);
    }
  };

  return (
    <div className="space-y-8">
      {/* تعداد سوالات */}
      <div className="space-y-4">
        <Label>تعداد کل سوالات</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[totalQuestions]}
            onValueChange={([v]) => onTotalChange(v)}
            min={5}
            max={50}
            step={1}
            className="flex-1"
          />
          <span className="text-2xl font-bold w-16 text-center">
            {totalQuestions}
          </span>
        </div>
      </div>

      {/* توزیع سطح دشواری */}
      <div className="space-y-4">
        <Label>توزیع سطح دشواری</Label>
        <div className="grid grid-cols-3 gap-4">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <Card key={level}>
              <CardContent className="p-4 text-center">
                <div className="text-4xl mb-2">{DIFFICULTY_ICONS[level]}</div>
                <div className="text-lg font-bold">
                  {DIFFICULTY_LABELS[level]}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateDistribution(level, Math.max(0, distribution[level] - 1))
                    }
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold w-12">
                    {distribution[level]}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateDistribution(level, distribution[level] + 1)
                    }
                  >
                    +
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  ({Math.round((distribution[level] / totalQuestions) * 100)}%)
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Progress value={(total / totalQuestions) * 100} className="h-2" />
        <p className="text-sm text-center text-muted-foreground">
          {total} از {totalQuestions} سوال انتخاب شده
        </p>
      </div>

      {/* تنظیمات امتحان */}
      <div className="space-y-4">
        <Label>تنظیمات امتحان</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Shuffle className="w-4 h-4" />
              <span>تصادفی سوالات</span>
            </div>
            <Switch
              checked={config.shuffle_questions}
              onCheckedChange={(v) => onConfigChange({ shuffle_questions: v })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Shuffle className="w-4 h-4" />
              <span>تصادفی گزینه‌ها</span>
            </div>
            <Switch
              checked={config.shuffle_options}
              onCheckedChange={(v) => onConfigChange({ shuffle_options: v })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>نمایش فوری نمره</span>
            </div>
            <Switch
              checked={config.show_score_immediately}
              onCheckedChange={(v) =>
                onConfigChange({ show_score_immediately: v })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>بررسی بعد از امتحان</span>
            </div>
            <Switch
              checked={config.allow_review}
              onCheckedChange={(v) => onConfigChange({ allow_review: v })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span>ماشین‌حساب</span>
            </div>
            <Switch
              checked={config.calculator_allowed}
              onCheckedChange={(v) => onConfigChange({ calculator_allowed: v })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>نمره قبولی (درصد)</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[config.passing_score || 50]}
              onValueChange={([v]) => onConfigChange({ passing_score: v })}
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="text-xl font-bold w-16 text-center">
              {config.passing_score || 50}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// مرحله 3: انتخاب سوالات
function Step3({
  questions,
  selectedIds,
  onToggle,
  onAutoGenerate,
  distribution,
  loading,
}: {
  questions: QuestionBankItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAutoGenerate: () => void;
  distribution: DifficultyDistribution;
  loading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<string>('easy');

  const selectedByDifficulty = {
    easy: selectedIds.filter((id) =>
      questions.find((q) => q.id === id && q.difficulty === 'easy')
    ).length,
    medium: selectedIds.filter((id) =>
      questions.find((q) => q.id === id && q.difficulty === 'medium')
    ).length,
    hard: selectedIds.filter((id) =>
      questions.find((q) => q.id === id && q.difficulty === 'hard')
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          سوالات را انتخاب کنید یا به صورت خودکار تولید کنید
        </p>
        <Button onClick={onAutoGenerate} disabled={loading} className="gap-2">
          <Sparkles className="w-4 h-4" />
          {loading ? 'در حال تولید...' : 'تولید خودکار'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <TabsTrigger key={level} value={level} className="flex-1">
              {DIFFICULTY_ICONS[level]} {DIFFICULTY_LABELS[level]}
              <Badge variant="secondary" className="mr-2">
                {selectedByDifficulty[level]}/{distribution[level]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {(['easy', 'medium', 'hard'] as const).map((level) => (
          <TabsContent key={level} value={level}>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {questions
                .filter((q) => q.difficulty === level)
                .map((q) => (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedIds.includes(q.id)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => onToggle(q.id)}
                  >
                    <Checkbox checked={selectedIds.includes(q.id)} />
                    <div className="flex-1">
                      <p className="text-sm line-clamp-2">{q.question_text}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {QUESTION_TYPE_LABELS[q.question_type]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {q.points} نمره
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              {questions.filter((q) => q.difficulty === level).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  سوالی در این سطح یافت نشد
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-center">
        <Progress
          value={(selectedIds.length / (distribution.easy + distribution.medium + distribution.hard)) * 100}
          className="w-64 h-2"
        />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {selectedIds.length} از{' '}
        {distribution.easy + distribution.medium + distribution.hard} سوال
        انتخاب شده
      </p>
    </div>
  );
}

// مرحله 4: بررسی نهایی
function Step4({
  examData,
  distribution,
  config,
  selectedQuestions,
}: {
  examData: CreateExamInput;
  distribution: DifficultyDistribution;
  config: Partial<ExamConfig>;
  selectedQuestions: QuestionBankItem[];
}) {
  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>خلاصه امتحان</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">عنوان:</span>
              <span className="mr-2 font-medium">{examData.title}</span>
            </div>
            <div>
              <span className="text-muted-foreground">درس:</span>
              <span className="mr-2 font-medium">
                {examData.subject} - پایه {examData.grade}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">تاریخ:</span>
              <span className="mr-2 font-medium">{examData.exam_date}</span>
            </div>
            <div>
              <span className="text-muted-foreground">زمان:</span>
              <span className="mr-2 font-medium">
                {examData.duration_minutes} دقیقه
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>توزیع سوالات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl">{DIFFICULTY_ICONS.easy}</div>
              <div className="font-bold">{distribution.easy} سوال</div>
              <div className="text-sm text-muted-foreground">آسان</div>
            </div>
            <div>
              <div className="text-2xl">{DIFFICULTY_ICONS.medium}</div>
              <div className="font-bold">{distribution.medium} سوال</div>
              <div className="text-sm text-muted-foreground">متوسط</div>
            </div>
            <div>
              <div className="text-2xl">{DIFFICULTY_ICONS.hard}</div>
              <div className="font-bold">{distribution.hard} سوال</div>
              <div className="text-sm text-muted-foreground">سخت</div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted text-center">
            <span className="text-muted-foreground">نمره کل:</span>
            <span className="mr-2 text-2xl font-bold">{totalPoints}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تنظیمات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {config.shuffle_questions ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <span className="w-4" />
              )}
              تصادفی سوالات
            </div>
            <div className="flex items-center gap-2">
              {config.shuffle_options ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <span className="w-4" />
              )}
              تصادفی گزینه‌ها
            </div>
            <div className="flex items-center gap-2">
              {config.show_score_immediately ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <span className="w-4" />
              )}
              نمایش فوری نمره
            </div>
            <div className="flex items-center gap-2">
              {config.allow_review ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <span className="w-4" />
              )}
              بررسی بعد از امتحان
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-muted-foreground">نمره قبولی:</span>
            <span className="mr-2 font-bold">{config.passing_score}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>پیش‌نمایش سوالات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {selectedQuestions.map((q, i) => (
              <div
                key={q.id}
                className="flex items-center gap-2 p-2 rounded bg-muted text-sm"
              >
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{q.question_text}</span>
                <Badge variant="outline" className="text-xs">
                  {q.points} نمره
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// صفحه اصلی
export default function CreateExamPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [examData, setExamData] = useState<CreateExamInput>({
    title: '',
    subject: '',
    grade: 6,
    exam_date: '',
    duration_minutes: 60,
  });

  const [distribution, setDistribution] = useState<DifficultyDistribution>({
    easy: 6,
    medium: 10,
    hard: 4,
  });

  const [totalQuestions, setTotalQuestions] = useState(20);

  const [config, setConfig] = useState<Partial<ExamConfig>>({
    shuffle_questions: true,
    shuffle_options: false,
    show_score_immediately: true,
    allow_review: true,
    negative_marking: false,
    passing_score: 50,
    calculator_allowed: false,
  });

  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const steps = ['مشخصات امتحان', 'تنظیمات', 'انتخاب سوالات', 'بررسی نهایی'];

  // بارگذاری سوالات
  useEffect(() => {
    if (currentStep === 2 && examData.subject && examData.grade) {
      fetchQuestions();
    }
  }, [currentStep, examData.subject, examData.grade]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(
        `/api/question-bank?subject=${examData.subject}&grade_level=${examData.grade}&limit=100`
      );
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleQuestion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAutoGenerate = async () => {
    setLoading(true);
    try {
      // انتخاب تصادفی سوالات بر اساس توزیع
      const newSelected: string[] = [];

      (['easy', 'medium', 'hard'] as const).forEach((level) => {
        const levelQuestions = questions.filter((q) => q.difficulty === level);
        const shuffled = [...levelQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, distribution[level]);
        newSelected.push(...selected.map((q) => q.id));
      });

      setSelectedIds(newSelected);
      toast({
        title: 'موفق',
        description: `${newSelected.length} سوال به صورت تصادفی انتخاب شد`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...examData,
          exam_config: config,
          difficulty_distribution: distribution,
          question_ids: selectedIds,
        }),
      });

      if (!res.ok) throw new Error('خطا');

      const exam = await res.json();
      toast({
        title: 'موفق',
        description: 'امتحان با موفقیت ایجاد شد',
      });
      router.push(`/teacher/exams/${exam.id}`);
    } catch (error) {
      console.error(error);
      toast({
        title: 'خطا',
        description: 'ایجاد امتحان با مشکل مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          examData.title &&
          examData.subject &&
          examData.grade &&
          examData.exam_date &&
          examData.duration_minutes
        );
      case 1:
        return distribution.easy + distribution.medium + distribution.hard > 0;
      case 2:
        return selectedIds.length > 0;
      default:
        return true;
    }
  };

  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));

  return (
    <DashboardPage
      className="max-w-4xl mx-auto"
      title={
        <span className="flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-[var(--lux-primary)]" />
          ایجاد امتحان جدید
        </span>
      }
      description="با استفاده از این ویزارد، امتحان خود را ایجاد کنید"
    >
      <DashboardSectionBlock>
      <Card>
        <CardContent className="pt-6">
          <Stepper steps={steps} currentStep={currentStep} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && (
                <Step1
                  data={examData}
                  onChange={(d) => setExamData({ ...examData, ...d })}
                />
              )}
              {currentStep === 1 && (
                <Step2
                  distribution={distribution}
                  config={config}
                  onDistributionChange={setDistribution}
                  onConfigChange={(c) => setConfig({ ...config, ...c })}
                  totalQuestions={totalQuestions}
                  onTotalChange={setTotalQuestions}
                />
              )}
              {currentStep === 2 && (
                <Step3
                  questions={questions}
                  selectedIds={selectedIds}
                  onToggle={handleToggleQuestion}
                  onAutoGenerate={handleAutoGenerate}
                  distribution={distribution}
                  loading={loading}
                />
              )}
              {currentStep === 3 && (
                <Step4
                  examData={examData}
                  distribution={distribution}
                  config={config}
                  selectedQuestions={selectedQuestions}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              قبلی
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceed()}
              >
                بعدی
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'در حال ایجاد...' : 'ایجاد امتحان'}
                <Check className="w-4 h-4 mr-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </DashboardSectionBlock>
    </DashboardPage>
  );
}
