'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  ChevronRight,
  Save,
  User,
  Target,
  Plus,
  X,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ISSUE_CATEGORIES,
  PRIORITY_LABELS,
  type IssueCategory,
  type PriorityLevel,
  type CounselingGoal,
} from '@/lib/types/counseling.types'

// ==========================================
// Mock Students (for demo)
// ==========================================
const mockStudents = [
  { id: '1', name: 'علی رضایی', grade: 6, class_name: '۶ الف' },
  { id: '2', name: 'سارا احمدی', grade: 5, class_name: '۵ ب' },
  { id: '3', name: 'محمد کریمی', grade: 4, class_name: '۴ الف' },
  { id: '4', name: 'فاطمه نوری', grade: 3, class_name: '۳ ب' },
  { id: '5', name: 'امیر صادقی', grade: 6, class_name: '۶ ب' },
]

// ==========================================
// Main Component
// ==========================================
export default function NewCounselingRecordPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<IssueCategory[]>([])
  const [priority, setPriority] = useState<PriorityLevel>('medium')
  const [summary, setSummary] = useState('')
  const [initialAssessment, setInitialAssessment] = useState('')
  const [goals, setGoals] = useState<Partial<CounselingGoal>[]>([])
  const [newGoal, setNewGoal] = useState('')

  const filteredStudents = mockStudents.filter(s =>
    s.name.includes(studentSearch) || studentSearch === ''
  )

  const toggleCategory = (cat: IssueCategory) => {
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    )
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals(prev => [...prev, {
        id: Date.now().toString(),
        goal: newGoal,
        target_date: '',
        status: 'pending',
        progress: 0,
      }])
      setNewGoal('')
    }
  }

  const removeGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const updateGoalDate = (id: string, date: string) => {
    setGoals(prev => prev.map(g =>
      g.id === id ? { ...g, target_date: date } : g
    ))
  }

  const handleSubmit = async () => {
    if (!selectedStudent) {
      alert('لطفاً دانش‌آموز را انتخاب کنید')
      return
    }
    if (selectedCategories.length === 0) {
      alert('حداقل یک دسته‌بندی انتخاب کنید')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/counseling/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          issue_categories: selectedCategories,
          priority_level: priority,
          summary,
          initial_assessment: initialAssessment,
          goals: goals.filter(g => g.goal),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/counselor/records/${data.record.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'خطا در ایجاد پرونده')
      }
    } catch (error) {
      console.error('Error:', error)
      // For demo, redirect anyway
      router.push('/counselor/records')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* ==================== Breadcrumb ==================== */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/counselor/dashboard" className="text-white/50 hover:text-white">داشبورد</Link>
          <ChevronRight className="w-4 h-4 text-white/30" />
          <Link href="/counselor/records" className="text-white/50 hover:text-white">پرونده‌ها</Link>
          <ChevronRight className="w-4 h-4 text-white/30" />
          <span className="text-white">پرونده جدید</span>
        </div>

        {/* ==================== Header ==================== */}
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-3 rounded-xl">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ایجاد پرونده مشاوره جدید</h1>
            <p className="text-white/60 text-sm">اطلاعات دانش‌آموز و وضعیت مشاوره را وارد کنید</p>
          </div>
        </div>

        {/* ==================== Student Selection ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              انتخاب دانش‌آموز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedStudent ? (
              <>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="جستجوی نام دانش‌آموز..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors text-right"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{student.name}</p>
                        <p className="text-white/50 text-xs">پایه {student.grade} - {student.class_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between bg-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedStudent.name}</p>
                    <p className="text-white/60 text-sm">پایه {selectedStudent.grade} - {selectedStudent.class_name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedStudent(null)}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ==================== Issue Categories ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              دسته‌بندی مسئله
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/50 text-sm mb-4">حداقل یک دسته‌بندی انتخاب کنید</p>
            <div className="flex flex-wrap gap-2">
              {ISSUE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedCategories.includes(cat)
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ==================== Priority ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">اولویت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {(Object.keys(PRIORITY_LABELS) as PriorityLevel[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-3 rounded-xl text-sm transition-colors ${
                    priority === p
                      ? p === 'urgent' ? 'bg-red-500 text-white' :
                        p === 'high' ? 'bg-orange-500 text-white' :
                        p === 'medium' ? 'bg-yellow-500 text-black' :
                        'bg-green-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ==================== Summary & Assessment ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">توضیحات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white/70">خلاصه وضعیت</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="شرح مختصر مسئله دانش‌آموز..."
                className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-24"
              />
            </div>
            <div>
              <Label className="text-white/70">ارزیابی اولیه</Label>
              <Textarea
                value={initialAssessment}
                onChange={(e) => setInitialAssessment(e.target.value)}
                placeholder="نتیجه بررسی اولیه و پیشنهادات..."
                className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-24"
              />
            </div>
          </CardContent>
        </Card>

        {/* ==================== Goals ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              اهداف مشاوره
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="هدف جدید..."
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              />
              <Button onClick={addGoal} className="bg-green-500 hover:bg-green-600 text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {goals.length > 0 && (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div key={goal.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                    <div className="flex-1">
                      <p className="text-white">{goal.goal}</p>
                    </div>
                    <Input
                      type="date"
                      value={goal.target_date}
                      onChange={(e) => updateGoalDate(goal.id!, e.target.value)}
                      className="w-40 bg-white/5 border-white/20 text-white text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGoal(goal.id!)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {goals.length === 0 && (
              <p className="text-center text-white/40 py-4 text-sm">
                هنوز هدفی اضافه نشده است
              </p>
            )}
          </CardContent>
        </Card>

        {/* ==================== Submit ==================== */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedStudent || selectedCategories.length === 0}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-6 gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'در حال ذخیره...' : 'ایجاد پرونده'}
          </Button>
          <Link href="/counselor/records" className="flex-1">
            <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 py-6">
              انصراف
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}







