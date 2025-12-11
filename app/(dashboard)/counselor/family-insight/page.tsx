'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Home,
  Brain,
  BookOpen,
  Heart,
  Users,
  Target,
  FileText,
  Sparkles,
  Save,
  Printer,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  Eye,
  Edit,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

interface Student {
  id: string
  full_name: string
  grade: number
  class_name: string
  avatar_url?: string
}

interface FormData {
  // دسته الف: محیط خانه
  homeActivities: string
  siblingsCount: number
  siblingsRelation: string
  hasStudySpace: 'yes' | 'no' | 'partial' | ''
  studySpaceNote: string
  timeWithParents: 'high' | 'medium' | 'low' | 'veryLow' | ''
  parentActivities: string

  // دسته ب: رفتار و عادات
  sleepTime: string
  wakeTime: string
  sleepHours: number
  screenTime: number
  hasParentalControl: boolean
  behaviorIssues: string[]
  behaviorNote: string

  // دسته ج: تحصیلی
  parentHelp: 'always' | 'often' | 'sometimes' | 'never' | ''
  parentHelpType: string
  hasPrivateTutor: boolean
  tutorSubjects: string
  talents: string[]
  talentsNote: string

  // دسته د: سلامت
  hasIllness: 'yes' | 'no' | ''
  illnessNote: string
  hasAllergy: 'yes' | 'no' | ''
  allergyNote: string
  usesAids: string[]

  // دسته ه: اجتماعی
  closeFriendsCount: number
  friendActivities: string
  groupParticipation: 'active' | 'normal' | 'shy' | 'isolated' | ''
  hasPeerIssues: 'yes' | 'no' | 'sometimes' | ''
  peerIssuesNote: string

  // دسته و: انتظارات
  parentExpectations: string
  neededSupport: string[]
  supportNote: string

  // دسته ز: سایر
  additionalInfo: string
}

interface AIAnalysis {
  summary: string
  strengths: string[]
  concerns: string[]
  counselorSuggestions: string[]
  parentSuggestions: string[]
  interventionPlan?: string
}

interface SavedForm {
  id: string
  studentId: string
  studentName: string
  filledBy: string
  date: string
  status: 'draft' | 'analyzed' | 'completed'
  completedQuestions: number
}

// ============================================
// داده نمونه
// ============================================

const SAMPLE_STUDENTS: Student[] = [
  { id: '1', full_name: 'علی محمدی', grade: 5, class_name: 'پنجم الف', avatar_url: '' },
  { id: '2', full_name: 'فاطمه احمدی', grade: 4, class_name: 'چهارم ب', avatar_url: '' },
  { id: '3', full_name: 'محمد حسینی', grade: 6, class_name: 'ششم الف', avatar_url: '' },
  { id: '4', full_name: 'زهرا رضایی', grade: 3, class_name: 'سوم الف', avatar_url: '' },
  { id: '5', full_name: 'امیرحسین کریمی', grade: 5, class_name: 'پنجم ب', avatar_url: '' },
]

const SAMPLE_SAVED_FORMS: SavedForm[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'علی محمدی',
    filledBy: 'مادر',
    date: '1403/09/15',
    status: 'completed',
    completedQuestions: 19,
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'فاطمه احمدی',
    filledBy: 'پدر',
    date: '1403/09/10',
    status: 'analyzed',
    completedQuestions: 19,
  },
  {
    id: '3',
    studentId: '3',
    studentName: 'محمد حسینی',
    filledBy: 'مادر',
    date: '1403/09/08',
    status: 'draft',
    completedQuestions: 12,
  },
]

const INITIAL_FORM_DATA: FormData = {
  homeActivities: '',
  siblingsCount: 0,
  siblingsRelation: '',
  hasStudySpace: '',
  studySpaceNote: '',
  timeWithParents: '',
  parentActivities: '',
  sleepTime: '21:00',
  wakeTime: '06:30',
  sleepHours: 9,
  screenTime: 2,
  hasParentalControl: false,
  behaviorIssues: [],
  behaviorNote: '',
  parentHelp: '',
  parentHelpType: '',
  hasPrivateTutor: false,
  tutorSubjects: '',
  talents: [],
  talentsNote: '',
  hasIllness: '',
  illnessNote: '',
  hasAllergy: '',
  allergyNote: '',
  usesAids: [],
  closeFriendsCount: 3,
  friendActivities: '',
  groupParticipation: '',
  hasPeerIssues: '',
  peerIssuesNote: '',
  parentExpectations: '',
  neededSupport: [],
  supportNote: '',
  additionalInfo: '',
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function FamilyInsightPage() {
  // State ها
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentOpen, setStudentOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [expandedSections, setExpandedSections] = useState<string[]>(['home'])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [savedForms, setSavedForms] = useState<SavedForm[]>(SAMPLE_SAVED_FORMS)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<SavedForm | null>(null)

  // محاسبه پیشرفت
  const calculateProgress = useCallback((): number => {
    let completed = 0
    const total = 19

    if (formData.homeActivities) completed++
    if (formData.siblingsCount >= 0 && formData.siblingsRelation) completed++
    if (formData.hasStudySpace) completed++
    if (formData.timeWithParents) completed++
    if (formData.sleepTime && formData.wakeTime) completed++
    if (formData.screenTime >= 0) completed++
    if (formData.behaviorIssues.length > 0 || formData.behaviorNote) completed++
    if (formData.parentHelp) completed++
    if (formData.hasPrivateTutor !== undefined) completed++
    if (formData.talents.length > 0 || formData.talentsNote) completed++
    if (formData.hasIllness) completed++
    if (formData.hasAllergy) completed++
    if (formData.usesAids.length >= 0) completed++
    if (formData.closeFriendsCount >= 0) completed++
    if (formData.groupParticipation) completed++
    if (formData.hasPeerIssues) completed++
    if (formData.parentExpectations) completed++
    if (formData.neededSupport.length > 0 || formData.supportNote) completed++
    if (formData.additionalInfo) completed++

    return Math.round((completed / total) * 100)
  }, [formData])

  const progress = calculateProgress()
  const completedCount = Math.round((progress / 100) * 19)

  // Auto-save
  useEffect(() => {
    if (!selectedStudent) return

    const timer = setInterval(() => {
      handleSaveDraft(true)
    }, 30000) // هر 30 ثانیه

    return () => clearInterval(timer)
  }, [formData, selectedStudent])

  // ذخیره پیش‌نویس
  const handleSaveDraft = async (silent = false) => {
    if (!selectedStudent) {
      if (!silent) toast.error('لطفاً ابتدا دانش‌آموز را انتخاب کنید')
      return
    }

    setIsSaving(true)

    try {
      // TODO: API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setLastSaved(new Date())
      if (!silent) toast.success('پیش‌نویس ذخیره شد')
    } catch (error) {
      if (!silent) toast.error('خطا در ذخیره پیش‌نویس')
    } finally {
      setIsSaving(false)
    }
  }

  // تحلیل هوشمند
  const handleAnalyze = async () => {
    if (!selectedStudent) {
      toast.error('لطفاً ابتدا دانش‌آموز را انتخاب کنید')
      return
    }

    if (progress < 50) {
      toast.error('لطفاً حداقل 50% سوالات را پاسخ دهید')
      return
    }

    setIsAnalyzing(true)

    try {
      // TODO: API call to AI
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // نمونه تحلیل
      setAiAnalysis({
        summary: `${selectedStudent.full_name} دانش‌آموزی با محیط خانوادگی ${formData.timeWithParents === 'high' ? 'پایدار' : 'نیازمند توجه'} است. ${formData.screenTime > 4 ? 'زمان استفاده از صفحه نمایش بالاست و نیاز به مدیریت دارد.' : ''} ${formData.behaviorIssues.length > 2 ? 'برخی مسائل رفتاری نیاز به پیگیری دارند.' : ''}`,
        strengths: [
          formData.talents.includes('math') ? 'استعداد ریاضی' : '',
          formData.talents.includes('art') ? 'استعداد هنری' : '',
          formData.groupParticipation === 'active' ? 'مشارکت فعال در گروه' : '',
          formData.closeFriendsCount >= 3 ? 'روابط اجتماعی خوب' : '',
          formData.hasStudySpace === 'yes' ? 'فضای مطالعه مناسب' : '',
        ].filter(Boolean),
        concerns: [
          formData.screenTime > 5 ? 'استفاده زیاد از صفحه نمایش' : '',
          formData.sleepHours < 8 ? 'کمبود خواب' : '',
          formData.behaviorIssues.includes('anxiety') ? 'نشانه‌های اضطراب' : '',
          formData.behaviorIssues.includes('isolation') ? 'گوشه‌گیری' : '',
          formData.hasPeerIssues === 'yes' ? 'مشکلات ارتباطی با همسالان' : '',
        ].filter(Boolean),
        counselorSuggestions: [
          'جلسات هفتگی با دانش‌آموز برای پیگیری وضعیت',
          'ارتباط منظم با والدین از طریق پیام‌رسان مدرسه',
          formData.behaviorIssues.includes('anxiety') ? 'آموزش تکنیک‌های آرام‌سازی' : '',
          formData.hasPeerIssues === 'yes' ? 'برنامه مهارت‌های اجتماعی' : '',
        ].filter(Boolean),
        parentSuggestions: [
          formData.screenTime > 4 ? 'تعیین محدودیت زمانی برای استفاده از گوشی و تبلت' : '',
          formData.timeWithParents === 'low' ? 'افزایش زمان با کیفیت با فرزند' : '',
          'تشویق فعالیت‌های فیزیکی و هوای آزاد',
          formData.sleepHours < 8 ? 'تنظیم ساعت خواب منظم' : '',
        ].filter(Boolean),
        interventionPlan: formData.behaviorIssues.length > 2 || formData.hasPeerIssues === 'yes'
          ? 'توصیه می‌شود برنامه مداخله‌ای شامل:\n1. ارجاع به روان‌شناس تربیتی\n2. برنامه تقویت مهارت‌های اجتماعی\n3. جلسات مشاوره خانواده'
          : undefined,
      })

      toast.success('تحلیل هوشمند انجام شد')
    } catch (error) {
      toast.error('خطا در تحلیل فرم')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ذخیره نهایی
  const handleSaveFinal = async () => {
    if (!selectedStudent) {
      toast.error('لطفاً ابتدا دانش‌آموز را انتخاب کنید')
      return
    }

    if (progress < 80) {
      toast.error('لطفاً حداقل 80% سوالات را پاسخ دهید')
      return
    }

    setIsSaving(true)

    try {
      // TODO: API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('فرم با موفقیت ذخیره شد')

      // اضافه به لیست
      setSavedForms((prev) => [
        {
          id: Date.now().toString(),
          studentId: selectedStudent.id,
          studentName: selectedStudent.full_name,
          filledBy: 'مشاور',
          date: new Date().toLocaleDateString('fa-IR'),
          status: aiAnalysis ? 'analyzed' : 'completed',
          completedQuestions: completedCount,
        },
        ...prev,
      ])

      // Reset
      setFormData(INITIAL_FORM_DATA)
      setSelectedStudent(null)
      setAiAnalysis(null)
    } catch (error) {
      toast.error('خطا در ذخیره فرم')
    } finally {
      setIsSaving(false)
    }
  }

  // چاپ
  const handlePrint = () => {
    window.print()
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            فرم بینش خانوادگی
          </h1>
          <p className="text-gray-600 mt-2">
            پرسش‌های هدفمند برای شناخت بهتر دانش‌آموز
          </p>
        </div>

        {/* انتخاب دانش‌آموز */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <Label className="text-lg font-semibold mb-3 block">انتخاب دانش‌آموز</Label>
          <Popover open={studentOpen} onOpenChange={setStudentOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={studentOpen}
                className="w-full justify-between h-14 text-lg"
              >
                {selectedStudent ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedStudent.full_name[0]}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{selectedStudent.full_name}</p>
                      <p className="text-sm text-gray-500">{selectedStudent.class_name}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">دانش‌آموز را انتخاب کنید...</span>
                )}
                <Search className="w-5 h-5 text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="جستجوی دانش‌آموز..." />
                <CommandList>
                  <CommandEmpty>دانش‌آموزی یافت نشد</CommandEmpty>
                  <CommandGroup>
                    {SAMPLE_STUDENTS.map((student) => (
                      <CommandItem
                        key={student.id}
                        value={student.full_name}
                        onSelect={() => {
                          setSelectedStudent(student)
                          setStudentOpen(false)
                          setFormData(INITIAL_FORM_DATA)
                          setAiAnalysis(null)
                        }}
                        className="flex items-center gap-3 p-3"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {student.full_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold">{student.full_name}</p>
                          <p className="text-sm text-gray-500">{student.class_name}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Progress */}
        {selectedStudent && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">پیشرفت تکمیل فرم</span>
              <span className="text-purple-600 font-bold">{completedCount}/19 سوال</span>
            </div>
            <Progress value={progress} className="h-3" />
            {lastSaved && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                آخرین ذخیره: {lastSaved.toLocaleTimeString('fa-IR')}
              </p>
            )}
          </div>
        )}

        {/* فرم اصلی */}
        {selectedStudent && (
          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="space-y-4"
          >
            {/* دسته الف: محیط خانه */}
            <AccordionItem value="home" className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Home className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-bold text-lg">الف: محیط خانه</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                {/* سوال 1 */}
                <div className="space-y-2">
                  <Label className="font-semibold">1. دانش‌آموز در خانه به چه فعالیت‌هایی علاقه دارد؟</Label>
                  <Textarea
                    value={formData.homeActivities}
                    onChange={(e) => setFormData({ ...formData, homeActivities: e.target.value })}
                    placeholder="مثال: بازی، مطالعه، نقاشی..."
                    className="min-h-[100px]"
                  />
                </div>

                {/* سوال 2 */}
                <div className="space-y-2">
                  <Label className="font-semibold">2. چند خواهر و برادر دارد؟ رابطه با آن‌ها چگونه است؟</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">تعداد</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.siblingsCount}
                        onChange={(e) => setFormData({ ...formData, siblingsCount: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">توضیح رابطه</Label>
                      <Textarea
                        value={formData.siblingsRelation}
                        onChange={(e) => setFormData({ ...formData, siblingsRelation: e.target.value })}
                        placeholder="مثال: رابطه خوبی دارند..."
                      />
                    </div>
                  </div>
                </div>

                {/* سوال 3 */}
                <div className="space-y-2">
                  <Label className="font-semibold">3. آیا فضای مناسب برای مطالعه در خانه دارد؟</Label>
                  <RadioGroup
                    value={formData.hasStudySpace}
                    onValueChange={(v) => setFormData({ ...formData, hasStudySpace: v as 'yes' | 'no' | 'partial' })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="study-yes" />
                      <Label htmlFor="study-yes">بله</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="study-no" />
                      <Label htmlFor="study-no">خیر</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="partial" id="study-partial" />
                      <Label htmlFor="study-partial">تا حدی</Label>
                    </div>
                  </RadioGroup>
                  <Textarea
                    value={formData.studySpaceNote}
                    onChange={(e) => setFormData({ ...formData, studySpaceNote: e.target.value })}
                    placeholder="توضیحات بیشتر..."
                    className="mt-2"
                  />
                </div>

                {/* سوال 4 */}
                <div className="space-y-2">
                  <Label className="font-semibold">4. چقدر زمان با والدین می‌گذراند؟</Label>
                  <Select
                    value={formData.timeWithParents}
                    onValueChange={(v) => setFormData({ ...formData, timeWithParents: v as 'high' | 'medium' | 'low' | 'veryLow' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">زیاد (بیش از 3 ساعت در روز)</SelectItem>
                      <SelectItem value="medium">متوسط (1-3 ساعت)</SelectItem>
                      <SelectItem value="low">کم (کمتر از 1 ساعت)</SelectItem>
                      <SelectItem value="veryLow">خیلی کم (فقط آخر هفته‌ها)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={formData.parentActivities}
                    onChange={(e) => setFormData({ ...formData, parentActivities: e.target.value })}
                    placeholder="چه فعالیت‌هایی با والدین انجام می‌دهد؟"
                    className="mt-2"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* دسته ب: رفتار و عادات */}
            <AccordionItem value="behavior" className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-bold text-lg">ب: رفتار و عادات</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                {/* سوال 5 */}
                <div className="space-y-2">
                  <Label className="font-semibold">5. ساعت خواب معمولی چیست؟</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">ساعت خواب</Label>
                      <Input
                        type="time"
                        value={formData.sleepTime}
                        onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">ساعت بیداری</Label>
                      <Input
                        type="time"
                        value={formData.wakeTime}
                        onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">میانگین ساعات خواب</Label>
                      <Input
                        type="number"
                        min={4}
                        max={14}
                        value={formData.sleepHours}
                        onChange={(e) => setFormData({ ...formData, sleepHours: parseInt(e.target.value) || 8 })}
                      />
                    </div>
                  </div>
                </div>

                {/* سوال 6 */}
                <div className="space-y-2">
                  <Label className="font-semibold">6. استفاده از تلفن/تبلت/کامپیوتر چقدر است؟</Label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">ساعت در روز</span>
                        <span className="font-bold text-purple-600">{formData.screenTime} ساعت</span>
                      </div>
                      <Slider
                        value={[formData.screenTime]}
                        onValueChange={([v]) => setFormData({ ...formData, screenTime: v })}
                        min={0}
                        max={10}
                        step={0.5}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="parental-control"
                        checked={formData.hasParentalControl}
                        onCheckedChange={(checked) => setFormData({ ...formData, hasParentalControl: checked as boolean })}
                      />
                      <Label htmlFor="parental-control">والدین کنترل و نظارت دارند</Label>
                    </div>
                  </div>
                </div>

                {/* سوال 7 */}
                <div className="space-y-2">
                  <Label className="font-semibold">7. آیا مشکلات رفتاری در خانه دارد؟</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'anger', label: 'عصبانیت سریع' },
                      { id: 'isolation', label: 'گوشه‌گیری' },
                      { id: 'focus', label: 'عدم تمرکز' },
                      { id: 'anxiety', label: 'اضطراب' },
                      { id: 'sleep', label: 'مشکل خواب' },
                      { id: 'other', label: 'سایر' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`behavior-${item.id}`}
                          checked={formData.behaviorIssues.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, behaviorIssues: [...formData.behaviorIssues, item.id] })
                            } else {
                              setFormData({ ...formData, behaviorIssues: formData.behaviorIssues.filter((i) => i !== item.id) })
                            }
                          }}
                        />
                        <Label htmlFor={`behavior-${item.id}`}>{item.label}</Label>
                      </div>
                    ))}
                  </div>
                  <Textarea
                    value={formData.behaviorNote}
                    onChange={(e) => setFormData({ ...formData, behaviorNote: e.target.value })}
                    placeholder="توضیحات بیشتر..."
                    className="mt-3"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* دسته ج: تحصیلی */}
            <AccordionItem value="academic" className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-bold text-lg">ج: تحصیلی</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                {/* سوال 8 */}
                <div className="space-y-2">
                  <Label className="font-semibold">8. والدین چقدر در تکالیف کمک می‌کنند؟</Label>
                  <Select
                    value={formData.parentHelp}
                    onValueChange={(v) => setFormData({ ...formData, parentHelp: v as 'always' | 'often' | 'sometimes' | 'never' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">همیشه</SelectItem>
                      <SelectItem value="often">اغلب</SelectItem>
                      <SelectItem value="sometimes">گاهی</SelectItem>
                      <SelectItem value="never">هرگز</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={formData.parentHelpType}
                    onChange={(e) => setFormData({ ...formData, parentHelpType: e.target.value })}
                    placeholder="چه نوع کمکی؟"
                    className="mt-2"
                  />
                </div>

                {/* سوال 9 */}
                <div className="space-y-2">
                  <Label className="font-semibold">9. آیا کلاس خصوصی دارد؟</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="tutor-yes"
                        checked={formData.hasPrivateTutor}
                        onCheckedChange={(checked) => setFormData({ ...formData, hasPrivateTutor: checked as boolean })}
                      />
                      <Label htmlFor="tutor-yes">بله</Label>
                    </div>
                  </div>
                  {formData.hasPrivateTutor && (
                    <Textarea
                      value={formData.tutorSubjects}
                      onChange={(e) => setFormData({ ...formData, tutorSubjects: e.target.value })}
                      placeholder="چه دروسی؟"
                      className="mt-2"
                    />
                  )}
                </div>

                {/* سوال 10 */}
                <div className="space-y-2">
                  <Label className="font-semibold">10. علایق و استعدادهای خاص:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'math', label: 'ریاضی' },
                      { id: 'science', label: 'علوم' },
                      { id: 'art', label: 'هنر' },
                      { id: 'music', label: 'موسیقی' },
                      { id: 'sports', label: 'ورزش' },
                      { id: 'literature', label: 'ادبیات' },
                      { id: 'tech', label: 'فناوری' },
                      { id: 'language', label: 'زبان' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`talent-${item.id}`}
                          checked={formData.talents.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, talents: [...formData.talents, item.id] })
                            } else {
                              setFormData({ ...formData, talents: formData.talents.filter((i) => i !== item.id) })
                            }
                          }}
                        />
                        <Label htmlFor={`talent-${item.id}`}>{item.label}</Label>
                      </div>
                    ))}
                  </div>
                  <Textarea
                    value={formData.talentsNote}
                    onChange={(e) => setFormData({ ...formData, talentsNote: e.target.value })}
                    placeholder="توضیحات بیشتر..."
                    className="mt-3"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* دسته د: سلامت */}
            <AccordionItem value="health" className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="font-bold text-lg">د: سلامت</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                {/* سوال 11 */}
                <div className="space-y-2">
                  <Label className="font-semibold">11. آیا بیماری خاصی دارد؟</Label>
                  <RadioGroup
                    value={formData.hasIllness}
                    onValueChange={(v) => setFormData({ ...formData, hasIllness: v as 'yes' | 'no' })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="illness-yes" />
                      <Label htmlFor="illness-yes">بله</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="illness-no" />
                      <Label htmlFor="illness-no">خیر</Label>
                    </div>
                  </RadioGroup>
                  {formData.hasIllness === 'yes' && (
                    <Textarea
                      value={formData.illnessNote}
                      onChange={(e) => setFormData({ ...formData, illnessNote: e.target.value })}
                      placeholder="توضیحات بیماری و داروها..."
                      className="mt-2"
                    />
                  )}
                </div>

                {/* سوال 12 */}
                <div className="space-y-2">
                  <Label className="font-semibold">12. آیا آلرژی خاصی دارد؟</Label>
                  <RadioGroup
                    value={formData.hasAllergy}
                    onValueChange={(v) => setFormData({ ...formData, hasAllergy: v as 'yes' | 'no' })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="allergy-yes" />
                      <Label htmlFor="allergy-yes">بله</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="allergy-no" />
                      <Label htmlFor="allergy-no">خیر</Label>
                    </div>
                  </RadioGroup>
                  {formData.hasAllergy === 'yes' && (
                    <Textarea
                      value={formData.allergyNote}
                      onChange={(e) => setFormData({ ...formData, allergyNote: e.target.value })}
                      placeholder="نوع آلرژی..."
                      className="mt-2"
                    />
                  )}
                </div>

                {/* سوال 13 */}
                <div className="space-y-2">
                  <Label className="font-semibold">13. آیا عینک یا سمعک استفاده می‌کند؟</Label>
                  <div className="flex gap-6">
                    {[
                      { id: 'glasses', label: 'عینک' },
                      { id: 'hearing', label: 'سمعک' },
                      { id: 'none', label: 'هیچکدام' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`aid-${item.id}`}
                          checked={formData.usesAids.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              if (item.id === 'none') {
                                setFormData({ ...formData, usesAids: ['none'] })
                              } else {
                                setFormData({ ...formData, usesAids: [...formData.usesAids.filter((i) => i !== 'none'), item.id] })
                              }
                            } else {
                              setFormData({ ...formData, usesAids: formData.usesAids.filter((i) => i !== item.id) })
                            }
                          }}
                        />
                        <Label htmlFor={`aid-${item.id}`}>{item.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* دسته ه: اجتماعی */}
            <AccordionItem value="social" className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-600" />
                  </div>
                  <span className="font-bold text-lg">ه: اجتماعی</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                {/* سوال 14 */}
                <div className="space-y-2">
                  <Label className="font-semibold">14. تعداد دوستان نزدیک:</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.closeFriendsCount}
                    onChange={(e) => setFormData({ ...formData, closeFriendsCount: parseInt(e.target.value) || 0 })}
                    className="max-w-[150px]"
                  />
                  <Textarea
                    value={formData.friendActivities}
                    onChange={(e) => setFormData({ ...formData, friendActivities: e.target.value })}
                    placeholder="چگونه با دوستان وقت می‌گذراند؟"
                    className="mt-2"
                  />
                </div>

                {/* سوال 15 */}
                <div className="space-y-2">
                  <Label className="font-semibold">15. در فعالیت‌های گروهی چگونه است؟</Label>
                  <RadioGroup
                    value={formData.groupParticipation}
                    onValueChange={(v) => setFormData({ ...formData, groupParticipation: v as 'active' | 'normal' | 'shy' | 'isolated' })}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {[
                      { value: 'active', label: 'فعال', color: 'text-green-600' },
                      { value: 'normal', label: 'معمولی', color: 'text-blue-600' },
                      { value: 'shy', label: 'کم‌رو', color: 'text-yellow-600' },
                      { value: 'isolated', label: 'گوشه‌گیر', color: 'text-red-600' },
                    ].map((item) => (
                      <div key={item.value} className="flex items-center gap-2">
                        <RadioGroupItem value={item.value} id={`group-${item.value}`} />
                        <Label htmlFor={`group-${item.value}`} className={item.color}>{item.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* سوال 16 */}
                <div className="space-y-2">
                  <Label className="font-semibold">16. آیا مشکلی در ارتباط با همسالان دارد؟</Label>
                  <RadioGroup
                    value={formData.hasPeerIssues}
                    onValueChange={(v) => setFormData({ ...formData, hasPeerIssues: v as 'yes' | 'no' | 'sometimes' })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="peer-yes" />
                      <Label htmlFor="peer-yes">بله</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="peer-no" />
                      <Label htmlFor="peer-no">خیر</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="sometimes" id="peer-sometimes" />
                      <Label htmlFor="peer-sometimes">گاهی</Label>
                    </div>
                  </RadioGroup>
                  {formData.hasPeerIssues !== 'no' && formData.hasPeerIssues && (
                    <Textarea
                      value={formData.peerIssuesNote}
                      onChange={(e) => setFormData({ ...formData, peerIssuesNote: e.target.value })}
                      placeholder="توضیحات..."
                      className="mt-2"
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* دسته و: انتظارات */}
            <AccordionItem value="expectations" className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-bold text-lg">و: انتظارات و اهداف</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                {/* سوال 17 */}
                <div className="space-y-2">
                  <Label className="font-semibold">17. انتظارات والدین از مدرسه چیست؟</Label>
                  <Textarea
                    value={formData.parentExpectations}
                    onChange={(e) => setFormData({ ...formData, parentExpectations: e.target.value })}
                    placeholder="توضیحات..."
                    className="min-h-[100px]"
                  />
                </div>

                {/* سوال 18 */}
                <div className="space-y-2">
                  <Label className="font-semibold">18. چه حمایت‌هایی از مدرسه نیاز دارند؟</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'academic', label: 'تقویت درسی' },
                      { id: 'counseling', label: 'مشاوره روانشناسی' },
                      { id: 'extracurricular', label: 'فوق‌برنامه' },
                      { id: 'financial', label: 'کمک مالی' },
                      { id: 'special', label: 'نیازهای ویژه' },
                      { id: 'other', label: 'سایر' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`support-${item.id}`}
                          checked={formData.neededSupport.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, neededSupport: [...formData.neededSupport, item.id] })
                            } else {
                              setFormData({ ...formData, neededSupport: formData.neededSupport.filter((i) => i !== item.id) })
                            }
                          }}
                        />
                        <Label htmlFor={`support-${item.id}`}>{item.label}</Label>
                      </div>
                    ))}
                  </div>
                  <Textarea
                    value={formData.supportNote}
                    onChange={(e) => setFormData({ ...formData, supportNote: e.target.value })}
                    placeholder="توضیحات بیشتر..."
                    className="mt-3"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* دسته ز: سایر */}
            <AccordionItem value="other" className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-bold text-lg">ز: سایر اطلاعات</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                {/* سوال 19 */}
                <div className="space-y-2">
                  <Label className="font-semibold">19. اطلاعات دیگری که مشاور باید بداند:</Label>
                  <Textarea
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    placeholder="هر اطلاعات مهم دیگری..."
                    className="min-h-[150px]"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* دکمه‌های عمل */}
        {selectedStudent && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => handleSaveDraft(false)}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                ذخیره پیش‌نویس
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || progress < 50}
                className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                تحلیل هوشمند
              </Button>
              <Button
                onClick={handleSaveFinal}
                disabled={isSaving || progress < 80}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                ذخیره نهایی
              </Button>
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                چاپ
              </Button>
            </div>
          </div>
        )}

        {/* نتیجه تحلیل AI */}
        {aiAnalysis && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
            <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6" />
              تحلیل هوشمند
            </h2>

            <div className="space-y-4">
              {/* خلاصه */}
              <div className="bg-white rounded-xl p-4">
                <h3 className="font-semibold mb-2">📋 خلاصه وضعیت</h3>
                <p className="text-gray-700 leading-relaxed">{aiAnalysis.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* نقاط قوت */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold text-green-700 mb-2">✅ نقاط قوت</h3>
                  <ul className="space-y-1">
                    {aiAnalysis.strengths.map((item, i) => (
                      <li key={i} className="text-green-600 flex items-start gap-2">
                        <span className="mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* نقاط نگرانی */}
                <div className="bg-orange-50 rounded-xl p-4">
                  <h3 className="font-semibold text-orange-700 mb-2">⚠️ نقاط نیازمند توجه</h3>
                  <ul className="space-y-1">
                    {aiAnalysis.concerns.map((item, i) => (
                      <li key={i} className="text-orange-600 flex items-start gap-2">
                        <span className="mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* پیشنهادات مشاور */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-blue-700 mb-2">💡 پیشنهادات برای مشاور</h3>
                <ul className="space-y-1">
                  {aiAnalysis.counselorSuggestions.map((item, i) => (
                    <li key={i} className="text-blue-600 flex items-start gap-2">
                      <span className="mt-1">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* پیشنهادات والدین */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-purple-700 mb-2">👨‍👩‍👧 پیشنهادات برای والدین</h3>
                <ul className="space-y-1">
                  {aiAnalysis.parentSuggestions.map((item, i) => (
                    <li key={i} className="text-purple-600 flex items-start gap-2">
                      <span className="mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* برنامه مداخله */}
              {aiAnalysis.interventionPlan && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h3 className="font-semibold text-red-700 mb-2">🚨 برنامه مداخله پیشنهادی</h3>
                  <p className="text-red-600 whitespace-pre-line">{aiAnalysis.interventionPlan}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* فرم‌های قبلی */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            فرم‌های ثبت شده
          </h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>دانش‌آموز</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>پرکننده</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تکمیل</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.studentName}</TableCell>
                  <TableCell>{form.date}</TableCell>
                  <TableCell>{form.filledBy}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        form.status === 'completed'
                          ? 'default'
                          : form.status === 'analyzed'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {form.status === 'completed'
                        ? 'تکمیل شده'
                        : form.status === 'analyzed'
                        ? 'تحلیل شده'
                        : 'پیش‌نویس'}
                    </Badge>
                  </TableCell>
                  <TableCell>{form.completedQuestions}/19</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedForm(form)
                          setViewDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog مشاهده */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>مشاهده فرم - {selectedForm?.studentName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              تاریخ ثبت: {selectedForm?.date}
              <br />
              پرکننده: {selectedForm?.filledBy}
            </p>
            <p className="text-sm text-gray-500">
              این قابلیت در حال توسعه است...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}




























