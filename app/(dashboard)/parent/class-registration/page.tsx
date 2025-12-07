'use client'

import { useState, useEffect } from 'react'
import { 
  GraduationCap, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Info,
  Save,
  Edit,
  Trash2,
  Trophy,
  PartyPopper,
  Frown,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import {
  LotterySetting,
  ClassRegistration,
  Class,
  LOTTERY_STATUS_CONFIG,
  REGISTRATION_STATUS_CONFIG,
  formatLotteryDate,
  gradeToText,
  formatTimeRemaining,
  getTimeRemaining,
  isRegistrationOpen,
} from '@/lib/types/lottery.types'

// داده نمونه دانش‌آموز
const SAMPLE_STUDENT = {
  id: 'student-1',
  full_name: 'علی رضایی',
  current_grade: 1,
  next_grade: 2,
  school_name: 'دبستان نمونه',
}

// داده نمونه تنظیمات قرعه‌کشی
const SAMPLE_LOTTERY_SETTING: LotterySetting & { 
  registration_start_formatted: string;
  registration_end_formatted: string;
} = {
  id: 'lottery-1',
  school_id: 'school-1',
  is_enabled: true,
  registration_start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  registration_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  lottery_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  target_grade: 2,
  academic_year: '1404-1405',
  max_choices: 4,
  allow_edit_until_end: true,
  notify_parents_result: true,
  status: 'open',
  total_registrations: 85,
  successful_assignments: 0,
  failed_assignments: 0,
  executed_at: null,
  executed_by: null,
  created_at: '',
  updated_at: '',
  registration_start_formatted: '',
  registration_end_formatted: '',
}

// داده نمونه کلاس‌ها
const SAMPLE_CLASSES: (Class & { first_choice_count: number; effective_capacity: number })[] = [
  { id: '1', school_id: 'school-1', name: 'دوم الف', grade: 2, section: 'الف', teacher_id: null, teacher_name: 'خانم احمدی', total_capacity: 25, admin_reserved: 2, available_capacity: 23, current_count: 0, academic_year: '1404-1405', is_active: true, description: null, room_number: '101', created_at: '', updated_at: '', first_choice_count: 28, effective_capacity: 23 },
  { id: '2', school_id: 'school-1', name: 'دوم ب', grade: 2, section: 'ب', teacher_id: null, teacher_name: 'خانم محمدی', total_capacity: 25, admin_reserved: 2, available_capacity: 23, current_count: 0, academic_year: '1404-1405', is_active: true, description: null, room_number: '102', created_at: '', updated_at: '', first_choice_count: 22, effective_capacity: 23 },
  { id: '3', school_id: 'school-1', name: 'دوم ج', grade: 2, section: 'ج', teacher_id: null, teacher_name: 'خانم کریمی', total_capacity: 25, admin_reserved: 2, available_capacity: 23, current_count: 0, academic_year: '1404-1405', is_active: true, description: null, room_number: '103', created_at: '', updated_at: '', first_choice_count: 20, effective_capacity: 23 },
  { id: '4', school_id: 'school-1', name: 'دوم د', grade: 2, section: 'د', teacher_id: null, teacher_name: 'خانم رضایی', total_capacity: 25, admin_reserved: 2, available_capacity: 23, current_count: 0, academic_year: '1404-1405', is_active: true, description: null, room_number: '104', created_at: '', updated_at: '', first_choice_count: 15, effective_capacity: 23 },
]

export default function ClassRegistrationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [student, setStudent] = useState(SAMPLE_STUDENT)
  const [lotterySetting, setLotterySetting] = useState<typeof SAMPLE_LOTTERY_SETTING | null>(null)
  const [classes, setClasses] = useState<typeof SAMPLE_CLASSES>([])
  const [existingRegistration, setExistingRegistration] = useState<ClassRegistration | null>(null)
  
  // انتخاب‌ها
  const [choices, setChoices] = useState<(string | null)[]>([null, null, null, null])
  
  // وضعیت
  const [canRegister, setCanRegister] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<'not_started' | 'open' | 'closed'>('open')
  
  // عملیات
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  
  // تایمر
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, expired: false })

  // بارگذاری داده‌ها
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setLotterySetting(SAMPLE_LOTTERY_SETTING)
      setClasses(SAMPLE_CLASSES)
      setCanRegister(true)
      setCanEdit(false)
      setRegistrationStatus('open')
      
      setIsLoading(false)
    }
    loadData()
  }, [])

  // تایمر شمارش معکوس
  useEffect(() => {
    if (!lotterySetting) return
    
    const updateTimer = () => {
      const remaining = getTimeRemaining(lotterySetting.registration_end)
      setTimeRemaining(remaining)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    
    return () => clearInterval(interval)
  }, [lotterySetting])

  // تغییر انتخاب
  const handleChoiceChange = (index: number, classId: string | null) => {
    const newChoices = [...choices]
    newChoices[index] = classId === '' ? null : classId
    setChoices(newChoices)
  }

  // بررسی انتخاب‌های تکراری
  const hasDuplicates = () => {
    const selectedChoices = choices.filter(Boolean)
    return new Set(selectedChoices).size !== selectedChoices.length
  }

  // ثبت‌نام
  const handleSubmit = async () => {
    if (!choices[0]) {
      toast.error('لطفاً حداقل انتخاب اول را مشخص کنید')
      return
    }
    
    if (hasDuplicates()) {
      toast.error('انتخاب‌ها نباید تکراری باشند')
      return
    }
    
    setShowConfirmDialog(true)
  }

  const confirmSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // شبیه‌سازی ثبت‌نام موفق
    setExistingRegistration({
      id: 'reg-1',
      student_id: student.id,
      lottery_setting_id: lotterySetting?.id || '',
      choice_1_class_id: choices[0],
      choice_2_class_id: choices[1],
      choice_3_class_id: choices[2],
      choice_4_class_id: choices[3],
      result_class_id: null,
      assigned_choice: null,
      status: 'pending',
      registered_by: 'parent-1',
      registered_at: new Date().toISOString(),
      last_modified_at: null,
      assigned_at: null,
      admin_note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    
    setCanRegister(false)
    setCanEdit(true)
    setIsSubmitting(false)
    setShowConfirmDialog(false)
    
    toast.success('🎉 ثبت‌نام با موفقیت انجام شد!', {
      description: 'نتیجه بعد از قرعه‌کشی اعلام می‌شود',
    })
  }

  // حذف ثبت‌نام
  const handleDelete = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setExistingRegistration(null)
    setCanRegister(true)
    setCanEdit(false)
    setChoices([null, null, null, null])
    
    setIsSubmitting(false)
    setShowDeleteDialog(false)
    
    toast.success('ثبت‌نام حذف شد')
  }

  // دریافت اسم کلاس
  const getClassName = (classId: string | null) => {
    if (!classId) return null
    const cls = classes.find(c => c.id === classId)
    return cls ? `${cls.name} - ${cls.teacher_name}` : null
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  // اگر قرعه‌کشی فعالی نیست
  if (!lotterySetting) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="py-12">
          <CardContent className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">ثبت‌نام فعالی وجود ندارد</h2>
            <p className="text-muted-foreground">
              در حال حاضر قرعه‌کشی فعالی برای پایه بعدی {student.full_name} وجود ندارد.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // نمایش نتیجه (اگر قرعه‌کشی انجام شده)
  if (lotterySetting.status === 'completed' && existingRegistration) {
    const resultClass = classes.find(c => c.id === existingRegistration.result_class_id)
    const isSuccess = existingRegistration.status === 'assigned'
    const isFailed = existingRegistration.status === 'failed'
    
    return (
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-500" />
          نتیجه قرعه‌کشی
        </h1>
        
        <Card className={`${
          isSuccess ? 'border-green-500 bg-green-50' : 
          isFailed ? 'border-red-500 bg-red-50' : ''
        }`}>
          <CardContent className="py-8 text-center">
            {isSuccess ? (
              <>
                <PartyPopper className="h-20 w-20 mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-green-700 mb-2">
                  🎉 تبریک! {student.full_name}
                </h2>
                <p className="text-lg mb-4">
                  انتخاب {existingRegistration.assigned_choice === 1 ? 'اول' : 
                    existingRegistration.assigned_choice === 2 ? 'دوم' :
                    existingRegistration.assigned_choice === 3 ? 'سوم' : 'چهارم'
                  } شما پذیرفته شد!
                </p>
                <Card className="max-w-md mx-auto bg-white">
                  <CardContent className="py-6">
                    <GraduationCap className="h-12 w-12 mx-auto text-green-600 mb-3" />
                    <p className="text-xl font-bold">{resultClass?.name}</p>
                    <p className="text-muted-foreground">معلم: {resultClass?.teacher_name}</p>
                    <p className="text-sm text-muted-foreground">اتاق {resultClass?.room_number}</p>
                  </CardContent>
                </Card>
              </>
            ) : isFailed ? (
              <>
                <Frown className="h-20 w-20 mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-700 mb-2">
                  متأسفیم
                </h2>
                <p className="text-lg text-red-600">
                  متأسفانه هیچ‌یک از انتخاب‌های شما ظرفیت خالی نداشت.
                </p>
                <p className="text-muted-foreground mt-2">
                  لطفاً با مدرسه تماس بگیرید.
                </p>
              </>
            ) : (
              <>
                <Clock className="h-20 w-20 mx-auto text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">در انتظار نتیجه</h2>
                <p className="text-muted-foreground">
                  قرعه‌کشی هنوز انجام نشده است.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* انتخاب‌ها */}
        <Card>
          <CardHeader>
            <CardTitle>انتخاب‌های شما</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {[
                existingRegistration.choice_1_class_id,
                existingRegistration.choice_2_class_id,
                existingRegistration.choice_3_class_id,
                existingRegistration.choice_4_class_id,
              ].map((classId, index) => {
                if (!classId) return null
                const cls = classes.find(c => c.id === classId)
                const isWinner = existingRegistration.result_class_id === classId
                
                return (
                  <div 
                    key={index}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border
                      ${isWinner ? 'border-green-500 bg-green-50' : 'border-border'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span>{cls?.name} - {cls?.teacher_name}</span>
                    </div>
                    {isWinner && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 ml-1" />
                        پذیرفته شده
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-blue-500" />
          ثبت‌نام کلاس درسی
        </h1>
        <p className="text-muted-foreground mt-1">
          ثبت‌نام {student.full_name} برای پایه {gradeToText(student.next_grade)}
        </p>
      </div>

      {/* اطلاعات قرعه‌کشی */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2">
              <Badge className={`${LOTTERY_STATUS_CONFIG[lotterySetting.status].bgColor} ${LOTTERY_STATUS_CONFIG[lotterySetting.status].color}`}>
                {LOTTERY_STATUS_CONFIG[lotterySetting.status].icon} {LOTTERY_STATUS_CONFIG[lotterySetting.status].label}
              </Badge>
              
              <h2 className="text-lg font-semibold">
                ثبت‌نام پایه {gradeToText(lotterySetting.target_grade)} - سال {lotterySetting.academic_year}
              </h2>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  شروع: {formatLotteryDate(lotterySetting.registration_start)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  پایان: {formatLotteryDate(lotterySetting.registration_end)}
                </span>
              </div>
            </div>
            
            {/* شمارش معکوس */}
            {!timeRemaining.expired && (
              <Card className="bg-white dark:bg-gray-900">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">زمان باقی‌مانده</p>
                  <div className="flex gap-3 justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{timeRemaining.days}</p>
                      <p className="text-xs">روز</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{timeRemaining.hours}</p>
                      <p className="text-xs">ساعت</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{timeRemaining.minutes}</p>
                      <p className="text-xs">دقیقه</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* فرم انتخاب */}
      <Card>
        <CardHeader>
          <CardTitle>انتخاب کلاس‌ها</CardTitle>
          <CardDescription>
            به ترتیب اولویت، کلاس‌های مورد نظر خود را انتخاب کنید.
            در قرعه‌کشی ابتدا انتخاب اول بررسی می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* راهنما */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>راهنمای انتخاب</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>انتخاب اول <strong>اجباری</strong> است</li>
                <li>هر چه انتخاب‌های بیشتری داشته باشید، شانس موفقیت بالاتر است</li>
                <li>کلاس‌هایی که تقاضای بالایی دارند، شانس کمتری دارند</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* انتخاب‌ها */}
          <div className="grid gap-4">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="space-y-2">
                <Label className={index === 0 ? 'text-red-500' : ''}>
                  انتخاب {index + 1} {index === 0 && '(اجباری)'}
                </Label>
                <Select
                  value={choices[index] || ''}
                  onValueChange={(v) => handleChoiceChange(index, v)}
                  disabled={!!existingRegistration && !canEdit}
                >
                  <SelectTrigger className={
                    choices[index] && choices.filter((c, i) => c === choices[index] && i !== index).length > 0
                      ? 'border-red-500'
                      : ''
                  }>
                    <SelectValue placeholder="انتخاب کنید..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- انتخاب نشده --</SelectItem>
                    {classes.map(cls => {
                      const isSelected = choices.some((c, i) => c === cls.id && i !== index)
                      const demandPercentage = Math.round((cls.first_choice_count / cls.effective_capacity) * 100)
                      
                      return (
                        <SelectItem 
                          key={cls.id} 
                          value={cls.id}
                          disabled={isSelected}
                        >
                          <div className="flex justify-between items-center w-full gap-4">
                            <span>{cls.name} - {cls.teacher_name}</span>
                            <Badge 
                              variant="outline" 
                              className={
                                demandPercentage > 100 ? 'text-red-500 border-red-500' :
                                demandPercentage > 80 ? 'text-amber-500 border-amber-500' :
                                'text-green-500 border-green-500'
                              }
                            >
                              {demandPercentage > 100 ? 'پرتقاضا!' :
                               demandPercentage > 80 ? 'متوسط' : 'مناسب'}
                            </Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* هشدار تکراری */}
          {hasDuplicates() && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                انتخاب‌های تکراری مجاز نیستند!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {existingRegistration ? (
            <>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={!canEdit}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف ثبت‌نام
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!canEdit || !choices[0] || hasDuplicates()}
              >
                <Save className="h-4 w-4 ml-2" />
                ذخیره تغییرات
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={!canRegister || !choices[0] || hasDuplicates()}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4 ml-2" />
              ثبت‌نام
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* آمار کلاس‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>میزان تقاضای کلاس‌ها</CardTitle>
          <CardDescription>
            هر چه نوار سبزتر باشد، شانس پذیرش بیشتر است
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {classes.map(cls => {
            const percentage = Math.round((cls.first_choice_count / cls.effective_capacity) * 100)
            return (
              <div key={cls.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{cls.name} - {cls.teacher_name}</span>
                  <span className={
                    percentage > 100 ? 'text-red-500' :
                    percentage > 80 ? 'text-amber-500' : 'text-green-500'
                  }>
                    {cls.first_choice_count} متقاضی / {cls.effective_capacity} ظرفیت
                  </span>
                </div>
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={percentage > 100 ? 'bg-red-100' : ''}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ثبت‌نام موجود */}
      {existingRegistration && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">ثبت‌نام شما انجام شده است</AlertTitle>
          <AlertDescription className="text-green-700">
            <p>انتخاب‌های شما:</p>
            <ul className="list-disc list-inside mt-1">
              {existingRegistration.choice_1_class_id && (
                <li>اول: {getClassName(existingRegistration.choice_1_class_id)}</li>
              )}
              {existingRegistration.choice_2_class_id && (
                <li>دوم: {getClassName(existingRegistration.choice_2_class_id)}</li>
              )}
              {existingRegistration.choice_3_class_id && (
                <li>سوم: {getClassName(existingRegistration.choice_3_class_id)}</li>
              )}
              {existingRegistration.choice_4_class_id && (
                <li>چهارم: {getClassName(existingRegistration.choice_4_class_id)}</li>
              )}
            </ul>
            <p className="mt-2 text-sm">
              {canEdit ? 'می‌توانید تا پایان مهلت، انتخاب‌های خود را ویرایش کنید.' : 
                'زمان ویرایش تمام شده است.'}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* دیالوگ تأیید */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأیید ثبت‌نام</DialogTitle>
            <DialogDescription>
              انتخاب‌های خود را بررسی کنید:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {choices.map((classId, index) => {
              if (!classId) return null
              const cls = classes.find(c => c.id === classId)
              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Badge>{index + 1}</Badge>
                  <span>{cls?.name} - {cls?.teacher_name}</span>
                </div>
              )
            })}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              نتیجه قرعه‌کشی در تاریخ {formatLotteryDate(lotterySetting.lottery_time)} اعلام می‌شود.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              بازگشت
            </Button>
            <Button onClick={confirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
              تأیید و ثبت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ حذف */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-600">حذف ثبت‌نام</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید ثبت‌نام را حذف کنید؟
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              با حذف ثبت‌نام، تمام انتخاب‌های شما پاک می‌شود و باید دوباره ثبت‌نام کنید.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 ml-2" />
              )}
              حذف ثبت‌نام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}












