'use client'

import { useState } from 'react'
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Tag,
  BarChart3,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

// داده نمونه
const sampleQuestions: Question[] = [
  {
    id: '1',
    text: 'حاصل 125 + 378 کدام است؟',
    type: 'multiple_choice',
    subject: 'ریاضی',
    grade: 6,
    chapter: 'فصل 1',
    topic: 'جمع و تفریق',
    difficulty: 'easy',
    options: [
      { id: 'a', text: '403', isCorrect: false },
      { id: 'b', text: '503', isCorrect: true },
      { id: 'c', text: '603', isCorrect: false },
      { id: 'd', text: '703', isCorrect: false },
    ],
    points: 2,
    explanation: 'برای جمع دو عدد، ابتدا یکان‌ها را جمع می‌کنیم...',
    tags: ['جمع', 'اعداد', 'پایه'],
    usageCount: 25,
    correctRate: 85,
    isVerified: true,
  },
  {
    id: '2',
    text: 'تعریف اسم در دستور زبان فارسی چیست؟',
    type: 'essay',
    subject: 'فارسی',
    grade: 6,
    chapter: 'فصل 3',
    topic: 'دستور زبان',
    difficulty: 'medium',
    points: 3,
    explanation: 'اسم کلمه‌ای است که به موجود، شخص، مکان یا مفهوم انتزاعی اشاره دارد.',
    tags: ['دستور', 'اسم', 'تعریف'],
    usageCount: 12,
    correctRate: 72,
    isVerified: true,
  },
  {
    id: '3',
    text: 'معادله x² - 4 = 0 چند ریشه حقیقی دارد؟',
    type: 'multiple_choice',
    subject: 'ریاضی',
    grade: 6,
    chapter: 'فصل 5',
    topic: 'معادلات',
    difficulty: 'hard',
    options: [
      { id: 'a', text: 'یک ریشه', isCorrect: false },
      { id: 'b', text: 'دو ریشه', isCorrect: true },
      { id: 'c', text: 'سه ریشه', isCorrect: false },
      { id: 'd', text: 'ریشه ندارد', isCorrect: false },
    ],
    points: 4,
    explanation: 'با حل معادله x² = 4 به ریشه‌های x = 2 و x = -2 می‌رسیم.',
    tags: ['معادله', 'درجه دوم', 'ریشه'],
    usageCount: 8,
    correctRate: 45,
    isVerified: false,
  },
  {
    id: '4',
    text: 'پایتخت ایران کدام شهر است؟',
    type: 'short_answer',
    subject: 'اجتماعی',
    grade: 6,
    chapter: 'فصل 2',
    topic: 'جغرافیا',
    difficulty: 'easy',
    correctAnswer: 'تهران',
    points: 1,
    explanation: 'تهران پایتخت و بزرگترین شهر ایران است.',
    tags: ['پایتخت', 'ایران', 'جغرافیا'],
    usageCount: 30,
    correctRate: 95,
    isVerified: true,
  },
  {
    id: '5',
    text: 'کره زمین به دور خورشید می‌چرخد.',
    type: 'true_false',
    subject: 'علوم',
    grade: 6,
    chapter: 'فصل 8',
    topic: 'منظومه شمسی',
    difficulty: 'easy',
    correctAnswer: 'صحیح',
    points: 1,
    explanation: 'زمین در مداری بیضی‌شکل به دور خورشید می‌گردد.',
    tags: ['زمین', 'خورشید', 'گردش'],
    usageCount: 22,
    correctRate: 90,
    isVerified: true,
  },
]

const subjects = ['ریاضی', 'فارسی', 'علوم', 'اجتماعی', 'قرآن', 'عربی', 'انگلیسی', 'هنر', 'ورزش']
const grades = [1, 2, 3, 4, 5, 6]
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
  const [questions, setQuestions] = useState(sampleQuestions)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null)

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
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
  })
  const [tagInput, setTagInput] = useState('')

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

  const handleSaveQuestion = () => {
    // Validation
    if (!newQuestion.text.trim()) {
      toast.error('متن سوال الزامی است')
      return
    }
    if (!newQuestion.subject) {
      toast.error('درس را انتخاب کنید')
      return
    }

    const question: Question = {
      id: `q-${Date.now()}`,
      text: newQuestion.text,
      type: newQuestion.type,
      subject: newQuestion.subject,
      grade: newQuestion.grade,
      chapter: newQuestion.chapter,
      topic: newQuestion.topic,
      difficulty: newQuestion.difficulty,
      options: newQuestion.type === 'multiple_choice' ? newQuestion.options : undefined,
      correctAnswer: newQuestion.correctAnswer,
      points: newQuestion.points,
      explanation: newQuestion.explanation,
      tags: newQuestion.tags,
      usageCount: 0,
      correctRate: 0,
      isVerified: false,
    }

    setQuestions(prev => [question, ...prev])
    setIsAddDialogOpen(false)
    toast.success('سوال با موفقیت ثبت شد')

    // Reset form
    setNewQuestion({
      text: '',
      type: 'multiple_choice',
      subject: '',
      grade: 6,
      chapter: '',
      topic: '',
      difficulty: 'medium',
      options: [
        { id: 'a', text: '', isCorrect: false },
        { id: 'b', text: '', isCorrect: false },
        { id: 'c', text: '', isCorrect: false },
        { id: 'd', text: '', isCorrect: false },
      ],
      correctAnswer: '',
      points: 1,
      explanation: '',
      tags: [],
    })
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
    toast.success('سوال حذف شد')
  }

  const handlePreview = (question: Question) => {
    setPreviewQuestion(question)
    setIsPreviewDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            بانک سوالات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            مدیریت و سازماندهی سوالات امتحانی
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                سوال جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>افزودن سوال جدید</DialogTitle>
                <DialogDescription>
                  سوال جدید را با جزئیات کامل وارد کنید
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
                        {subjects.map(s => (
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
                        {grades.map(g => (
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
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={handleSaveQuestion}>
                  ذخیره سوال
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-500">کل سوالات</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.easy}</p>
              <p className="text-sm text-gray-500">🟢 آسان</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.medium}</p>
              <p className="text-sm text-gray-500">🟡 متوسط</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.hard}</p>
              <p className="text-sm text-gray-500">🔴 سخت</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.verified}</p>
              <p className="text-sm text-gray-500">✓ تأیید شده</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                {subjects.map(s => (
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
                {grades.map(g => (
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

      {/* Questions Table */}
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
                {filteredQuestions.map((q, index) => (
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
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
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

          {filteredQuestions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              سوالی با این فیلترها پیدا نشد
            </div>
          )}

          {selectedQuestions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
              <span>{selectedQuestions.length} سوال انتخاب شده</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">ایجاد امتحان</Button>
                <Button variant="outline" size="sm">Export</Button>
                <Button variant="destructive" size="sm">حذف</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
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

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
    </div>
  )
}








































