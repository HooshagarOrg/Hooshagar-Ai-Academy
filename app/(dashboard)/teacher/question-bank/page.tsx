'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Copy,
  Image,
} from 'lucide-react';
import {
  type QuestionBankItem,
  type ExamQuestionType,
  type DifficultyLevel,
  type QuestionOption,
  type CreateQuestionInput,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_ICONS,
  SUBJECTS,
  GRADE_LEVELS,
} from '@/lib/types/exam.types';

// کامپوننت فرم ایجاد سوال
function CreateQuestionForm({
  onClose,
  onSubmit,
  editQuestion,
}: {
  onClose: () => void;
  onSubmit: (data: CreateQuestionInput) => Promise<void>;
  editQuestion?: QuestionBankItem | null;
}) {
  const [loading, setLoading] = useState(false);
  const [questionType, setQuestionType] =
    useState<ExamQuestionType>('multiple_choice');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: 'a', text: '', is_correct: false },
    { id: 'b', text: '', is_correct: false },
    { id: 'c', text: '', is_correct: false },
    { id: 'd', text: '', is_correct: false },
  ]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    question_text: editQuestion?.question_text || '',
    subject: editQuestion?.subject || '',
    grade_level: editQuestion?.grade_level?.toString() || '',
    chapter: editQuestion?.chapter || '',
    topic: editQuestion?.topic || '',
    points: editQuestion?.points?.toString() || '1',
    explanation: editQuestion?.explanation || '',
    hint: editQuestion?.hint || '',
    correct_answer: editQuestion?.correct_answer || '',
  });

  useEffect(() => {
    if (editQuestion) {
      setQuestionType(editQuestion.question_type);
      setDifficulty(editQuestion.difficulty);
      setTags(editQuestion.tags || []);
      if (editQuestion.options) {
        setOptions(editQuestion.options);
        const correctIdx = editQuestion.options.findIndex((o) => o.is_correct);
        if (correctIdx >= 0) setCorrectAnswerIndex(correctIdx);
      }
    }
  }, [editQuestion]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updatedOptions = options.map((opt, idx) => ({
        ...opt,
        is_correct: idx === correctAnswerIndex,
      }));

      await onSubmit({
        question_text: formData.question_text,
        question_type: questionType,
        subject: formData.subject,
        grade_level: parseInt(formData.grade_level),
        chapter: formData.chapter || undefined,
        topic: formData.topic || undefined,
        difficulty,
        options:
          questionType === 'multiple_choice' ? updatedOptions : undefined,
        correct_answer:
          questionType === 'multiple_choice'
            ? updatedOptions[correctAnswerIndex].id
            : formData.correct_answer,
        points: parseFloat(formData.points),
        explanation: formData.explanation || undefined,
        hint: formData.hint || undefined,
        tags,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    const newId = String.fromCharCode(97 + options.length);
    setOptions([...options, { id: newId, text: '', is_correct: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
    if (correctAnswerIndex >= index && correctAnswerIndex > 0) {
      setCorrectAnswerIndex(correctAnswerIndex - 1);
    }
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text };
    setOptions(newOptions);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      {/* نوع سوال */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>نوع سوال *</Label>
          <Select
            value={questionType}
            onValueChange={(v) => setQuestionType(v as ExamQuestionType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>سطح دشواری *</Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as DifficultyLevel)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {DIFFICULTY_ICONS[key as DifficultyLevel]} {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* درس و پایه */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>درس *</Label>
          <Select
            value={formData.subject}
            onValueChange={(v) => setFormData({ ...formData, subject: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب درس" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>پایه تحصیلی *</Label>
          <Select
            value={formData.grade_level}
            onValueChange={(v) => setFormData({ ...formData, grade_level: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب پایه" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((grade) => (
                <SelectItem key={grade} value={grade.toString()}>
                  پایه {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* فصل و موضوع */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>فصل</Label>
          <Input
            value={formData.chapter}
            onChange={(e) =>
              setFormData({ ...formData, chapter: e.target.value })
            }
            placeholder="مثال: فصل 1: اعداد"
          />
        </div>

        <div className="space-y-2">
          <Label>موضوع</Label>
          <Input
            value={formData.topic}
            onChange={(e) =>
              setFormData({ ...formData, topic: e.target.value })
            }
            placeholder="مثال: جمع و تفریق"
          />
        </div>
      </div>

      {/* متن سوال */}
      <div className="space-y-2">
        <Label>متن سوال *</Label>
        <Textarea
          value={formData.question_text}
          onChange={(e) =>
            setFormData({ ...formData, question_text: e.target.value })
          }
          placeholder="متن سوال را وارد کنید..."
          className="min-h-[100px]"
        />
      </div>

      {/* گزینه‌ها (برای چندگزینه‌ای) */}
      {questionType === 'multiple_choice' && (
        <div className="space-y-4">
          <Label>گزینه‌ها *</Label>
          <RadioGroup
            value={correctAnswerIndex.toString()}
            onValueChange={(v) => setCorrectAnswerIndex(parseInt(v))}
          >
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-3">
                <RadioGroupItem
                  value={index.toString()}
                  id={`option-${index}`}
                />
                <span className="w-6 text-center font-bold">{option.id})</span>
                <Input
                  value={option.text}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`گزینه ${option.id}`}
                  className={`flex-1 ${
                    correctAnswerIndex === index
                      ? 'border-green-500 bg-green-50'
                      : ''
                  }`}
                />
                {index === correctAnswerIndex && (
                  <Badge variant="default" className="bg-green-600">
                    صحیح
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </RadioGroup>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            disabled={options.length >= 6}
          >
            <Plus className="w-4 h-4 ml-1" />
            افزودن گزینه
          </Button>
        </div>
      )}

      {/* پاسخ صحیح (برای سایر انواع) */}
      {questionType !== 'multiple_choice' &&
        questionType !== 'essay' &&
        questionType !== 'matching' && (
          <div className="space-y-2">
            <Label>پاسخ صحیح *</Label>
            <Input
              value={formData.correct_answer}
              onChange={(e) =>
                setFormData({ ...formData, correct_answer: e.target.value })
              }
              placeholder={
                questionType === 'true_false'
                  ? 'صحیح یا غلط'
                  : questionType === 'numerical'
                  ? 'عدد پاسخ'
                  : 'پاسخ صحیح'
              }
            />
          </div>
        )}

      {/* امتیاز */}
      <div className="space-y-2">
        <Label>امتیاز (نمره)</Label>
        <Input
          type="number"
          min="0.5"
          step="0.5"
          value={formData.points}
          onChange={(e) => setFormData({ ...formData, points: e.target.value })}
          className="w-32"
        />
      </div>

      {/* توضیح پاسخ */}
      <div className="space-y-2">
        <Label>توضیح پاسخ</Label>
        <Textarea
          value={formData.explanation}
          onChange={(e) =>
            setFormData({ ...formData, explanation: e.target.value })
          }
          placeholder="توضیح نحوه حل سوال..."
          className="min-h-[80px]"
        />
      </div>

      {/* راهنمایی */}
      <div className="space-y-2">
        <Label>راهنمایی (hint)</Label>
        <Input
          value={formData.hint}
          onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
          placeholder="راهنمایی برای دانش‌آموز..."
        />
      </div>

      {/* تگ‌ها */}
      <div className="space-y-2">
        <Label>تگ‌ها</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="تگ جدید..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            افزودن
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                className="hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* دکمه‌ها */}
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          انصراف
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? '...' : editQuestion ? 'بروزرسانی' : 'ذخیره'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// صفحه اصلی
export default function QuestionBankPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<QuestionBankItem | null>(
    null
  );
  const [viewQuestion, setViewQuestion] = useState<QuestionBankItem | null>(
    null
  );

  // فیلترها
  const [filters, setFilters] = useState({
    subject: '',
    grade_level: '',
    difficulty: '',
    question_type: '',
    search: '',
  });

  // بارگذاری سوالات
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const params = new URLSearchParams();
        if (filters.subject) params.set('subject', filters.subject);
        if (filters.grade_level) params.set('grade_level', filters.grade_level);
        if (filters.difficulty) params.set('difficulty', filters.difficulty);
        if (filters.question_type)
          params.set('question_type', filters.question_type);
        if (filters.search) params.set('search', filters.search);

        const res = await fetch(`/api/question-bank?${params}`);
        const data = await res.json();

        setQuestions(data.questions || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error(error);
        toast({
          title: 'خطا',
          description: 'دریافت سوالات با مشکل مواجه شد',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [filters, toast]);

  // ایجاد/ویرایش سوال
  const handleSubmitQuestion = async (data: CreateQuestionInput) => {
    try {
      const url = editQuestion
        ? `/api/question-bank/${editQuestion.id}`
        : '/api/question-bank';
      const method = editQuestion ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('خطا');

      toast({
        title: 'موفق',
        description: editQuestion ? 'سوال بروزرسانی شد' : 'سوال ایجاد شد',
      });

      // رفرش
      setFilters({ ...filters });
      setEditQuestion(null);
    } catch (error) {
      console.error(error);
      toast({
        title: 'خطا',
        description: 'ذخیره سوال با مشکل مواجه شد',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // حذف سوال
  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این سوال مطمئن هستید؟')) return;

    try {
      const res = await fetch(`/api/question-bank/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('خطا');

      toast({ title: 'موفق', description: 'سوال حذف شد' });
      setFilters({ ...filters });
    } catch (error) {
      console.error(error);
      toast({
        title: 'خطا',
        description: 'حذف سوال با مشکل مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const pageTitle = (
    <span className="flex items-center gap-2">
      <BookOpen className="w-6 h-6" />
      بانک سوالات
    </span>
  );

  const pageActions = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 ml-1" />
        خروجی
      </Button>
      <Button variant="outline" size="sm">
        <Upload className="w-4 h-4 ml-1" />
        ورود
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              setEditQuestion(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 ml-1" />
            سوال جدید
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editQuestion ? 'ویرایش سوال' : 'افزودن سوال جدید'}
            </DialogTitle>
            <DialogDescription>
              اطلاعات سوال را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <CreateQuestionForm
            onClose={() => {
              setDialogOpen(false);
              setEditQuestion(null);
            }}
            onSubmit={handleSubmitQuestion}
            editQuestion={editQuestion}
          />
        </DialogContent>
      </Dialog>
    </div>
  );

  if (loading) {
    return (
      <DashboardPage
        title={pageTitle}
        description="مدیریت و سازماندهی سوالات امتحانی"
      >
        <DashboardSectionBlock className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </DashboardSectionBlock>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title={pageTitle}
      description="مدیریت و سازماندهی سوالات امتحانی"
      actions={pageActions}
    >
      <DashboardSectionBlock>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select
              value={filters.subject}
              onValueChange={(v) =>
                setFilters({ ...filters, subject: v === 'all' ? '' : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="درس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دروس</SelectItem>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.grade_level}
              onValueChange={(v) =>
                setFilters({ ...filters, grade_level: v === 'all' ? '' : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="پایه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه پایه‌ها</SelectItem>
                {GRADE_LEVELS.map((g) => (
                  <SelectItem key={g} value={g.toString()}>
                    پایه {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.difficulty}
              onValueChange={(v) =>
                setFilters({ ...filters, difficulty: v === 'all' ? '' : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="سطح" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سطوح</SelectItem>
                {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {DIFFICULTY_ICONS[k as DifficultyLevel]} {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.question_type}
              onValueChange={(v) =>
                setFilters({ ...filters, question_type: v === 'all' ? '' : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pr-10"
              />
            </div>
          </div>
          </CardContent>
        </Card>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>سوال</TableHead>
                <TableHead className="w-24">نوع</TableHead>
                <TableHead className="w-24">سطح</TableHead>
                <TableHead className="w-24">استفاده</TableHead>
                <TableHead className="w-24">موفقیت</TableHead>
                <TableHead className="w-24">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    سوالی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q, i) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono">{i + 1}</TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="truncate">{q.question_text}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {q.subject}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            پایه {q.grade_level}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {QUESTION_TYPE_LABELS[q.question_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={DIFFICULTY_COLORS[q.difficulty]}>
                        {DIFFICULTY_ICONS[q.difficulty]}{' '}
                        {DIFFICULTY_LABELS[q.difficulty]}
                      </Badge>
                    </TableCell>
                    <TableCell>{q.usage_count} بار</TableCell>
                    <TableCell>
                      {q.correct_rate !== null ? (
                        <span
                          className={
                            (q.correct_rate || 0) >= 50
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {q.correct_rate?.toFixed(0)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setViewQuestion(q)}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            مشاهده
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditQuestion(q);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            ویرایش
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 ml-2" />
                            کپی
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(q.id)}
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        </Card>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{total}</div>
            <div className="text-sm text-muted-foreground">کل سوالات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {questions.filter((q) => q.difficulty === 'easy').length}
            </div>
            <div className="text-sm text-muted-foreground">آسان</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {questions.filter((q) => q.difficulty === 'medium').length}
            </div>
            <div className="text-sm text-muted-foreground">متوسط</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {questions.filter((q) => q.difficulty === 'hard').length}
            </div>
            <div className="text-sm text-muted-foreground">سخت</div>
          </CardContent>
        </Card>
        </div>
      </DashboardSectionBlock>

      <Dialog open={!!viewQuestion} onOpenChange={() => setViewQuestion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>مشاهده سوال</DialogTitle>
          </DialogHeader>
          {viewQuestion && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">متن سوال:</Label>
                <p className="mt-1">{viewQuestion.question_text}</p>
              </div>
              {viewQuestion.options && (
                <div>
                  <Label className="text-muted-foreground">گزینه‌ها:</Label>
                  <div className="space-y-1 mt-1">
                    {viewQuestion.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded ${
                          opt.is_correct ? 'bg-green-100' : 'bg-muted'
                        }`}
                      >
                        {opt.id}) {opt.text}
                        {opt.is_correct && (
                          <CheckCircle className="w-4 h-4 inline mr-2 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewQuestion.explanation && (
                <div>
                  <Label className="text-muted-foreground">توضیح:</Label>
                  <p className="mt-1 text-sm">{viewQuestion.explanation}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Badge>{DIFFICULTY_LABELS[viewQuestion.difficulty]}</Badge>
                <Badge variant="outline">{viewQuestion.subject}</Badge>
                <Badge variant="outline">پایه {viewQuestion.grade_level}</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardPage>
  );
}
