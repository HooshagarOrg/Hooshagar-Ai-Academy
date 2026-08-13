'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  CheckCircle,
  Tag,
  Copy,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  GRADE_LEVELS,
  SUBJECTS,
  type QuestionBankItem,
} from '@/lib/types/exam.types'

// Types
interface Question {
  id: string
  text: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank'
  subject: string
  grade: number
  chapter: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  options?: { id: string; text: string; isCorrect: boolean }[]
  correctAnswer?: string
  points: number
  explanation: string
  tags: string[]
  usageCount: number
  correctRate: number
  isVerified: boolean
}

const QUESTION_TYPE_VALUES: Question['type'][] = [
  'multiple_choice',
  'true_false',
  'short_answer',
  'essay',
  'fill_blank',
]

function mapApiQuestion(row: QuestionBankItem): Question {
  const type = QUESTION_TYPE_VALUES.includes(row.question_type as Question['type'])
    ? (row.question_type as Question['type'])
    : 'short_answer'

  return {
    id: row.id,
    text: row.question_text,
    type,
    subject: row.subject,
    grade: row.grade_level,
    chapter: row.chapter ?? '',
    topic: row.topic ?? '',
    difficulty: row.difficulty,
    options: row.options?.map((opt) => ({
      id: opt.id,
      text: opt.text,
      isCorrect: Boolean(opt.is_correct),
    })),
    correctAnswer: row.correct_answer ?? undefined,
    points: row.points,
    explanation: row.explanation ?? '',
    tags: row.tags ?? [],
    usageCount: row.usage_count ?? 0,
    correctRate: Math.round(row.correct_rate ?? 0),
    isVerified: Boolean(row.is_verified),
  }
}

const emptyForm = {
  text: '',
  type: 'multiple_choice' as Question['type'],
  subject: '',
  grade: 6,
  chapter: '',
  topic: '',
  difficulty: 'medium' as Question['difficulty'],
  options: [
    { id: 'a', text: '', isCorrect: false },
    { id: 'b', text: '', isCorrect: false },
    { id: 'c', text: '', isCorrect: false },
    { id: 'd', text: '', isCorrect: false },
  ],
  correctAnswer: '',
  points: 1,
  explanation: '',
  tags: [] as string[],
}
const questionTypes = [
  { value: 'multiple_choice', label: 'چند گزینه‌ای' },
  { value: 'true_false', label: 'صحیح/غلط' },
  { value: 'short_answer', label: 'کوتاه پاسخ' },
  { value: 'essay', label: 'تشریحی' },
  { value: 'fill_blank', label: 'جای خالی' },
]

const difficultyConfig = {
  easy: { label: 'آسان', color: 'bg-green-100 text-green-700', emoji: '🟢' },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-700', emoji: '🟡' },
  hard: { label: 'سخت', color: 'bg-red-100 text-red-700', emoji: '🔴' },
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null)
  const [newQuestion, setNewQuestion] = useState(emptyForm)
  const [tagInput, setTagInput] = useState('')

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/question-bank?limit=100')
      const data = (await res.json()) as {
        questions?: QuestionBankItem[]
        error?: string
      }
      if (!res.ok) {
        toast.error(data.error || 'دریافت سوالات ناموفق بود')
        setQuestions([])
        return
      }
      setQuestions((data.questions ?? []).map(mapApiQuestion))
    } catch {
      toast.error('خطای شبکه در دریافت سوالات')
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQuestions()
  }, [loadQuestions])

  function buildPayload() {
    const correctOption = newQuestion.options.find((opt) => opt.isCorrect)
    return {
      question_text: newQuestion.text.trim(),
      question_type: newQuestion.type,
      subject: newQuestion.subject,
      grade_level: newQuestion.grade,
      chapter: newQuestion.chapter || undefined,
      topic: newQuestion.topic || undefined,
      difficulty: newQuestion.difficulty,
      options:
        newQuestion.type === 'multiple_choice'
          ? newQuestion.options.map((opt) => ({
              id: opt.id,
              text: opt.text,
              is_correct: opt.isCorrect,
            }))
          : undefined,
      correct_answer:
        newQuestion.type === 'multiple_choice'
          ? correctOption?.id
          : newQuestion.correctAnswer || undefined,
      points: newQuestion.points,
      explanation: newQuestion.explanation || undefined,
      tags: newQuestion.tags,
    }
  }

  function resetForm() {
    setNewQuestion(emptyForm)
    setTagInput('')
    setEditingId(null)
  }

  function fillFormFromQuestion(question: Question) {
    setNewQuestion({
      text: question.text,
      type: question.type,
      subject: question.subject,
      grade: question.grade,
      chapter: question.chapter,
      topic: question.topic,
      difficulty: question.difficulty,
      options: question.options ?? emptyForm.options,
      correctAnswer: question.correctAnswer ?? '',
      points: question.points,
      explanation: question.explanation,
      tags: question.tags,
    })
  }

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.includes(searchQuery) || q.tags.some(t => t.includes(searchQuery))
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter
    const matchesGrade = gradeFilter === 'all' || q.grade === parseInt(gradeFilter)
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter
    const matchesType = typeFilter === 'all' || q.type === typeFilter
    
    return matchesSearch && matchesSubject && matchesGrade && matchesDifficulty && matchesType
  })

  // Stats
  const stats = {
    total: questions.length,
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
    verified: questions.filter(q => q.isVerified).length,
  }

  const handleSelectQuestion = (id: string) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([])
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id))
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !newQuestion.tags.includes(tagInput.trim())) {
      setNewQuestion(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setNewQuestion(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSetCorrectOption = (optionId: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map(opt => ({
        ...opt,
        isCorrect: opt.id === optionId
      }))
    }))
  }

  const handleUpdateOption = (optionId: string, text: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId ? { ...opt, text } : opt
      )
    }))
  }

  const handleSaveQuestion = async () => {
    if (!newQuestion.text.trim()) {
      toast.error('متن سوال الزامی است')
      return
    }
    if (!newQuestion.subject) {
      toast.error('درس را انتخاب کنید')
      return
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/question-bank/${editingId}` : '/api/question-bank'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error || 'ذخیره سوال ناموفق بود')
        return
      }
      toast.success(editingId ? 'سوال بروزرسانی شد' : 'سوال در بانک مدرسه ثبت شد')
      setIsAddDialogOpen(false)
      resetForm()
      await loadQuestions()
    } catch {
      toast.error('خطای شبکه در ذخیره سوال')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('آیا از حذف این سوال مطمئن هستید؟')) return
    try {
      const res = await fetch(`/api/question-bank/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('حذف سوال ناموفق بود')
        return
      }
      toast.success('سوال حذف شد')
      setSelectedQuestions((prev) => prev.filter((qid) => qid !== id))
      await loadQuestions()
    } catch {
      toast.error('خطای شبکه در حذف سوال')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return
    if (!confirm(`آیا از حذف ${selectedQuestions.length} سوال مطمئن هستید؟`)) return
    try {
      const results = await Promise.all(
        selectedQuestions.map((id) => fetch(`/api/question-bank/${id}`, { method: 'DELETE' }))
      )
      if (results.some((res) => !res.ok)) {
        toast.error('حذف برخی سوالات ناموفق بود')
      } else {
        toast.success('سوال‌های انتخاب‌شده حذف شدند')
      }
      setSelectedQuestions([])
      await loadQuestions()
    } catch {
      toast.error('خطای شبکه در حذف گروهی')
    }
  }

  const handleCopyQuestion = async (question: Question) => {
    try {
      const res = await fetch('/api/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: question.text,
          question_type: question.type,
          subject: question.subject,
          grade_level: question.grade,
          chapter: question.chapter || undefined,
          topic: question.topic || undefined,
          difficulty: question.difficulty,
          options: question.options?.map((opt) => ({
            id: opt.id,
            text: opt.text,
            is_correct: opt.isCorrect,
          })),
          correct_answer: question.correctAnswer,
          points: question.points,
          explanation: question.explanation || undefined,
          tags: question.tags,
        }),
      })
      if (!res.ok) {
        toast.error('کپی سوال ناموفق بود')
        return
      }
      toast.success('سوال در بانک کپی شد')
      await loadQuestions()
    } catch {
      toast.error('خطای شبکه در کپی سوال')
    }
  }

  const handleEditQuestion = (question: Question) => {
    setEditingId(question.id)
    fillFormFromQuestion(question)
    setIsAddDialogOpen(true)
  }

  const handleComingSoonFile = () => {
    toast.message('ورود و خروج فایل به‌زودی فعال می‌شود')
  }

  const handlePreview = (question: Question) => {
    setPreviewQuestion(question)
    setIsPreviewDialogOpen(true)
  }

  const pageTitle = (
    <span className="flex items-center gap-3">
      <BookOpen className="w-8 h-8 text-[var(--lux-secondary)]" />
      بانک سوالات
    </span>
  )

  const pageActions = (
    <div className="flex gap-2">
      <Button variant="outline" className="gap-2" onClick={handleComingSoonFile}>
        <Upload className="w-4 h-4" />
        ورود فایل
      </Button>
      <Button variant="outline" className="gap-2" onClick={handleComingSoonFile}>
        <Download className="w-4 h-4" />
        خروجی
      </Button>
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            سوال جدید
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'ویرایش سوال' : 'افزودن سوال جدید'}</DialogTitle>
            <DialogDescription>
              سوال در بانک مدرسه ذخیره می‌شود و برای آزمون‌ها قابل استفاده است
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع سوال *</Label>
                <Select
                  value={newQuestion.type}
                  onValueChange={(v) => setNewQuestion(prev => ({ ...prev, type: v as Question['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>درس *</Label>
                <Select
                  value={newQuestion.subject}
                  onValueChange={(v) => setNewQuestion(prev => ({ ...prev, subject: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>پایه *</Label>
                <Select
                  value={newQuestion.grade.toString()}
                  onValueChange={(v) => setNewQuestion(prev => ({ ...prev, grade: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map(g => (
                      <SelectItem key={g} value={g.toString()}>پایه {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>سطح دشواری *</Label>
                <Select
                  value={newQuestion.difficulty}
                  onValueChange={(v) => setNewQuestion(prev => ({ ...prev, difficulty: v as Question['difficulty'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">🟢 آسان</SelectItem>
                    <SelectItem value="medium">🟡 متوسط</SelectItem>
                    <SelectItem value="hard">🔴 سخت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>فصل</Label>
                <Input
                  value={newQuestion.chapter}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, chapter: e.target.value }))}
                  placeholder="فصل 1: عدد و الگو"
                />
              </div>
              <div className="space-y-2">
                <Label>موضوع</Label>
                <Input
                  value={newQuestion.topic}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="جمع و تفریق"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>متن سوال *</Label>
              <Textarea
                value={newQuestion.text}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                placeholder="حاصل 125 + 378 کدام است؟"
                rows={3}
              />
            </div>

            {newQuestion.type === 'multiple_choice' && (
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Label>گزینه‌ها (گزینه صحیح را انتخاب کنید)</Label>
                {newQuestion.options.map((opt, index) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <RadioGroup
                      value={newQuestion.options.find(o => o.isCorrect)?.id || ''}
                      onValueChange={handleSetCorrectOption}
                    >
                      <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} />
                    </RadioGroup>
                    <span className="w-6">{index + 1})</span>
                    <Input
                      value={opt.text}
                      onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                      placeholder={`گزینه ${index + 1}`}
                      className={cn(
                        opt.isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      )}
                    />
                    {opt.isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {(newQuestion.type === 'short_answer' || newQuestion.type === 'true_false') && (
              <div className="space-y-2">
                <Label>پاسخ صحیح *</Label>
                {newQuestion.type === 'true_false' ? (
                  <RadioGroup
                    value={newQuestion.correctAnswer}
                    onValueChange={(v) => setNewQuestion(prev => ({ ...prev, correctAnswer: v }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="صحیح" id="true" />
                      <Label htmlFor="true">صحیح</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="غلط" id="false" />
                      <Label htmlFor="false">غلط</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <Input
                    value={newQuestion.correctAnswer}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    placeholder="پاسخ صحیح"
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>توضیح پاسخ</Label>
              <Textarea
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="توضیح نحوه حل سوال..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>امتیاز</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newQuestion.points}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>تگ‌ها</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="تگ جدید"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>+</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {newQuestion.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <span className="text-red-500">×</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm() }}>
              انصراف
            </Button>
            <Button onClick={() => void handleSaveQuestion()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : null}
              {editingId ? 'ذخیره تغییرات' : 'ذخیره سوال'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return (
    <DashboardPage
      title={pageTitle}
      description="مدیریت و سازماندهی سوالات امتحانی"
      actions={pageActions}
    >
      <DashboardSectionBlock>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--lux-primary)]">{stats.total}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">کل سوالات</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.easy}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">🟢 آسان</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.medium}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">🟡 متوسط</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.hard}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">🔴 سخت</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.verified}</p>
              <p className="text-sm text-[var(--lux-text-muted)]">✓ تأیید شده</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--lux-text-muted)]" />
                <Input
                  placeholder="جستجو در سوالات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="درس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دروس</SelectItem>
                {SUBJECTS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="پایه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه پایه‌ها</SelectItem>
                {GRADE_LEVELS.map(g => (
                  <SelectItem key={g} value={g.toString()}>پایه {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="سطح" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سطوح</SelectItem>
                <SelectItem value="easy">🟢 آسان</SelectItem>
                <SelectItem value="medium">🟡 متوسط</SelectItem>
                <SelectItem value="hard">🔴 سخت</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                {questionTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        </Card>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
        <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>سوال</TableHead>
                  <TableHead className="w-24">نوع</TableHead>
                  <TableHead className="w-24">سطح</TableHead>
                  <TableHead className="w-20">استفاده</TableHead>
                  <TableHead className="w-24">موفقیت</TableHead>
                  <TableHead className="w-32">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--lux-secondary)]" />
                    </TableCell>
                  </TableRow>
                ) : filteredQuestions.map((q, index) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedQuestions.includes(q.id)}
                        onCheckedChange={() => handleSelectQuestion(q.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="truncate">{q.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{q.subject}</Badge>
                          <Badge variant="outline" className="text-xs">پایه {q.grade}</Badge>
                          {q.isVerified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {questionTypes.find(t => t.value === q.type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', difficultyConfig[q.difficulty].color)}>
                        {difficultyConfig[q.difficulty].emoji} {difficultyConfig[q.difficulty].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{q.usageCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={q.correctRate} className="h-2 w-16" />
                        <span className="text-sm">{q.correctRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(q)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(q)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void handleCopyQuestion(q)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredQuestions.length === 0 && (
            <div className="text-center py-8 text-[var(--lux-text-muted)]">
              {questions.length === 0
                ? 'هنوز سوالی در بانک مدرسه ثبت نشده است. اولین سوال را از دکمه «سوال جدید» اضافه کنید.'
                : 'سوالی با این فیلترها پیدا نشد'}
            </div>
          )}

          {selectedQuestions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
              <span>{selectedQuestions.length} سوال انتخاب شده</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.message('اتصال انتخاب سوال به آزمون‌ساز به‌زودی فعال می‌شود')}
                >
                  ایجاد امتحان
                </Button>
                <Button variant="outline" size="sm" onClick={handleComingSoonFile}>خروجی</Button>
                <Button variant="destructive" size="sm" onClick={() => void handleBulkDelete()}>حذف</Button>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </DashboardSectionBlock>

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>پیش‌نمایش سوال</DialogTitle>
          </DialogHeader>
          {previewQuestion && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge>{previewQuestion.subject}</Badge>
                <Badge variant="outline">پایه {previewQuestion.grade}</Badge>
                <Badge className={difficultyConfig[previewQuestion.difficulty].color}>
                  {difficultyConfig[previewQuestion.difficulty].label}
                </Badge>
                <Badge variant="secondary">{previewQuestion.points} نمره</Badge>
              </div>

              <div className="p-4 bg-[var(--lux-surface)] dark:bg-gray-800 rounded-lg">
                <p className="font-medium text-lg">{previewQuestion.text}</p>
              </div>

              {previewQuestion.type === 'multiple_choice' && previewQuestion.options && (
                <div className="space-y-2">
                  {previewQuestion.options.map((opt, index) => (
                    <div
                      key={opt.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        opt.isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20"
                      )}
                    >
                      {index + 1}) {opt.text}
                      {opt.isCorrect && <CheckCircle className="inline w-4 h-4 mr-2 text-green-500" />}
                    </div>
                  ))}
                </div>
              )}

              {previewQuestion.correctAnswer && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="font-medium">پاسخ صحیح: </span>
                  {previewQuestion.correctAnswer}
                </div>
              )}

              {previewQuestion.explanation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="font-medium">توضیح: </span>
                  {previewQuestion.explanation}
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {previewQuestion.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardPage>
  )
}












































