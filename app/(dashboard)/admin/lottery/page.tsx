'use client'

import { useState, useEffect } from 'react'
import { 
  Ticket, 
  Calendar,
  Users,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Settings,
  BarChart3,
  History,
  ChevronRight,
  AlertTriangle,
  Trophy,
  Eye,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  LotterySetting,
  ClassRegistration,
  LotteryStats,
  Class,
  LOTTERY_STATUS_CONFIG,
  REGISTRATION_STATUS_CONFIG,
  formatLotteryDate,
  gradeToText,
  formatTimeRemaining,
  isRegistrationOpen,
} from '@/lib/types/lottery.types'

// داده نمونه قرعه‌کشی‌ها
const SAMPLE_LOTTERIES: LotterySetting[] = [
  {
    id: '1',
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
  },
  {
    id: '2',
    school_id: 'school-1',
    is_enabled: false,
    registration_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    registration_end: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lottery_time: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    target_grade: 3,
    academic_year: '1403-1404',
    max_choices: 4,
    allow_edit_until_end: true,
    notify_parents_result: true,
    status: 'completed',
    total_registrations: 92,
    successful_assignments: 88,
    failed_assignments: 4,
    executed_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    executed_by: 'admin-1',
    created_at: '',
    updated_at: '',
  },
]

// داده نمونه کلاس‌ها
const SAMPLE_CLASSES: Class[] = [
  { id: '1', school_id: 'school-1', name: 'دوم الف', grade: 2, section: 'الف', teacher_id: null, teacher_name: 'خانم احمدی', total_capacity: 25, admin_reserved: 2, available_capacity: 23, current_count: 0, academic_year: '1404-1405', is_active: true, description: null, room_number: '101', created_at: '', updated_at: '' },
  { id: '2', school_id: 'school-1', name: 'دوم ب', grade: 2, section: 'ب', teacher_id: null, teacher_name: 'خانم محمدی', total_capacity: 25, admin_reserved: 2, available_capacity: 23, current_count: 0, academic_year: '1404-1405', is_active: true, description: null, room_number: '102', created_at: '', updated_at: '' },
  { id: '3', school_id: 'school-1', name: 'دوم ج', grade: 2, section: 'ج', teacher_id: null, teacher_name: 'خانم کریمی', total_capacity: 25, admin_reserved: 2, available_capacity: 23, current_count: 0, academic_year: '1404-1405', is_active: true, description: null, room_number: '103', created_at: '', updated_at: '' },
  { id: '4', school_id: 'school-1', name: 'دوم د', grade: 2, section: 'د', teacher_id: null, teacher_name: 'خانم رضایی', total_capacity: 25, admin_reserved: 2, available_capacity: 23, current_count: 0, academic_year: '1404-1405', is_active: true, description: null, room_number: '104', created_at: '', updated_at: '' },
]

// داده نمونه ثبت‌نام‌ها
const SAMPLE_REGISTRATIONS: (ClassRegistration & { student: { full_name: string } })[] = [
  { id: '1', student_id: 's1', lottery_setting_id: '1', choice_1_class_id: '1', choice_2_class_id: '2', choice_3_class_id: '3', choice_4_class_id: null, result_class_id: null, assigned_choice: null, status: 'pending', registered_by: 'p1', registered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), last_modified_at: null, assigned_at: null, admin_note: null, created_at: '', updated_at: '', student: { full_name: 'علی رضایی' } },
  { id: '2', student_id: 's2', lottery_setting_id: '1', choice_1_class_id: '2', choice_2_class_id: '1', choice_3_class_id: '4', choice_4_class_id: '3', result_class_id: null, assigned_choice: null, status: 'pending', registered_by: 'p2', registered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), last_modified_at: null, assigned_at: null, admin_note: null, created_at: '', updated_at: '', student: { full_name: 'سارا احمدی' } },
  { id: '3', student_id: 's3', lottery_setting_id: '1', choice_1_class_id: '1', choice_2_class_id: '3', choice_3_class_id: null, choice_4_class_id: null, result_class_id: null, assigned_choice: null, status: 'pending', registered_by: 'p3', registered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), last_modified_at: null, assigned_at: null, admin_note: null, created_at: '', updated_at: '', student: { full_name: 'محمد حسینی' } },
]

// داده نمونه آمار
const SAMPLE_STATS: LotteryStats = {
  total_registrations: 85,
  pending_count: 85,
  assigned_count: 0,
  failed_count: 0,
  class_stats: [
    { class_id: '1', teacher_name: 'خانم احمدی', total_capacity: 23, registered_count: 28, assigned_count: 0 },
    { class_id: '2', teacher_name: 'خانم محمدی', total_capacity: 23, registered_count: 22, assigned_count: 0 },
    { class_id: '3', teacher_name: 'خانم کریمی', total_capacity: 23, registered_count: 20, assigned_count: 0 },
    { class_id: '4', teacher_name: 'خانم رضایی', total_capacity: 23, registered_count: 15, assigned_count: 0 },
  ],
}

export default function LotteryManagementPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [lotteries, setLotteries] = useState<LotterySetting[]>([])
  const [selectedLottery, setSelectedLottery] = useState<LotterySetting | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [registrations, setRegistrations] = useState<(ClassRegistration & { student: { full_name: string } })[]>([])
  const [stats, setStats] = useState<LotteryStats | null>(null)
  
  // دیالوگ‌ها
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRunDialog, setShowRunDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  
  // فرم ایجاد
  const [formData, setFormData] = useState({
    target_grade: 2,
    academic_year: '1404-1405',
    registration_start: '',
    registration_end: '',
    lottery_time: '',
    max_choices: 4,
    allow_edit_until_end: true,
    notify_parents_result: true,
  })
  
  // عملیات
  const [isRunning, setIsRunning] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // بارگذاری
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLotteries(SAMPLE_LOTTERIES)
      setIsLoading(false)
    }
    loadData()
  }, [])

  // انتخاب قرعه‌کشی
  const handleSelectLottery = (lottery: LotterySetting) => {
    setSelectedLottery(lottery)
    setClasses(SAMPLE_CLASSES)
    setRegistrations(SAMPLE_REGISTRATIONS)
    setStats(SAMPLE_STATS)
    setShowDetailsDialog(true)
  }

  // فعال/غیرفعال کردن
  const handleToggleEnabled = async (lottery: LotterySetting) => {
    setLotteries(prev => prev.map(l => 
      l.id === lottery.id ? { ...l, is_enabled: !l.is_enabled } : l
    ))
    toast.success(lottery.is_enabled ? 'غیرفعال شد' : 'فعال شد')
  }

  // اجرای قرعه‌کشی
  const handleRunLottery = async () => {
    if (!selectedLottery) return
    
    setIsRunning(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // شبیه‌سازی نتیجه
    setSelectedLottery({
      ...selectedLottery,
      status: 'completed',
      successful_assignments: 81,
      failed_assignments: 4,
      executed_at: new Date().toISOString(),
    })
    
    setStats({
      ...SAMPLE_STATS,
      pending_count: 0,
      assigned_count: 81,
      failed_count: 4,
    })
    
    setIsRunning(false)
    setShowRunDialog(false)
    
    toast.success('🎉 قرعه‌کشی با موفقیت انجام شد!', {
      description: '81 دانش‌آموز تخصیص یافتند، 4 ناموفق',
      duration: 5000,
    })
  }

  // ایجاد قرعه‌کشی جدید
  const handleCreate = async () => {
    setIsCreating(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newLottery: LotterySetting = {
      id: Date.now().toString(),
      school_id: 'school-1',
      ...formData,
      registration_start: new Date(formData.registration_start).toISOString(),
      registration_end: new Date(formData.registration_end).toISOString(),
      lottery_time: new Date(formData.lottery_time).toISOString(),
      is_enabled: false,
      status: 'pending',
      total_registrations: 0,
      successful_assignments: 0,
      failed_assignments: 0,
      executed_at: null,
      executed_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    setLotteries(prev => [newLottery, ...prev])
    setIsCreating(false)
    setShowCreateDialog(false)
    
    toast.success('قرعه‌کشی جدید ایجاد شد')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="h-8 w-8 text-purple-500" />
            مدیریت قرعه‌کشی کلاس‌ها
          </h1>
          <p className="text-muted-foreground mt-1">
            مدیریت ثبت‌نام و قرعه‌کشی کلاس‌های درسی
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          قرعه‌کشی جدید
        </Button>
      </div>

      {/* لیست قرعه‌کشی‌ها */}
      <div className="grid gap-4">
        {lotteries.map(lottery => {
          const statusConfig = LOTTERY_STATUS_CONFIG[lottery.status]
          const isOpen = isRegistrationOpen(lottery)
          
          return (
            <Card 
              key={lottery.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                lottery.status === 'completed' ? 'border-green-200 bg-green-50/50' :
                lottery.status === 'open' ? 'border-blue-200 bg-blue-50/50' : ''
              }`}
              onClick={() => handleSelectLottery(lottery)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  {/* اطلاعات اصلی */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">
                        پایه {gradeToText(lottery.target_grade)} - {lottery.academic_year}
                      </h3>
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.icon} {statusConfig.label}
                      </Badge>
                      {lottery.is_enabled && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          فعال
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        شروع: {formatLotteryDate(lottery.registration_start)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        پایان: {formatLotteryDate(lottery.registration_end)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        قرعه‌کشی: {formatLotteryDate(lottery.lottery_time)}
                      </span>
                    </div>
                    
                    {isOpen && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTimeRemaining(lottery.registration_end)} تا پایان ثبت‌نام
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* آمار و دکمه‌ها */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {lottery.total_registrations}
                      </p>
                      <p className="text-xs text-muted-foreground">ثبت‌نام</p>
                    </div>
                    
                    {lottery.status === 'completed' && (
                      <>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {lottery.successful_assignments}
                          </p>
                          <p className="text-xs text-muted-foreground">موفق</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {lottery.failed_assignments}
                          </p>
                          <p className="text-xs text-muted-foreground">ناموفق</p>
                        </div>
                      </>
                    )}
                    
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Switch
                        checked={lottery.is_enabled}
                        onCheckedChange={() => handleToggleEnabled(lottery)}
                        disabled={lottery.status === 'completed'}
                      />
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {lotteries.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">قرعه‌کشی‌ای وجود ندارد</h3>
            <p className="text-muted-foreground mb-4">
              اولین قرعه‌کشی را ایجاد کنید
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 ml-2" />
              قرعه‌کشی جدید
            </Button>
          </CardContent>
        </Card>
      )}

      {/* دیالوگ جزئیات */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              جزئیات قرعه‌کشی پایه {selectedLottery && gradeToText(selectedLottery.target_grade)}
            </DialogTitle>
          </DialogHeader>

          {selectedLottery && (
            <Tabs defaultValue="stats" className="space-y-4">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="stats">آمار</TabsTrigger>
                <TabsTrigger value="classes">کلاس‌ها</TabsTrigger>
                <TabsTrigger value="registrations">ثبت‌نام‌ها</TabsTrigger>
                <TabsTrigger value="settings">تنظیمات</TabsTrigger>
              </TabsList>

              {/* تب آمار */}
              <TabsContent value="stats" className="space-y-4">
                {/* کارت‌های آمار */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                      <p className="text-2xl font-bold">{stats?.total_registrations || 0}</p>
                      <p className="text-sm text-muted-foreground">کل ثبت‌نام</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                      <p className="text-2xl font-bold">{stats?.pending_count || 0}</p>
                      <p className="text-sm text-muted-foreground">در انتظار</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                      <p className="text-2xl font-bold">{stats?.assigned_count || 0}</p>
                      <p className="text-sm text-muted-foreground">تخصیص یافته</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                      <p className="text-2xl font-bold">{stats?.failed_count || 0}</p>
                      <p className="text-sm text-muted-foreground">ناموفق</p>
                    </CardContent>
                  </Card>
                </div>

                {/* آمار کلاس‌ها */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">توزیع انتخاب‌ها</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats?.class_stats.map(cls => {
                      const percentage = Math.round((cls.registered_count / cls.total_capacity) * 100)
                      return (
                        <div key={cls.class_id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{cls.teacher_name}</span>
                            <span className={percentage > 100 ? 'text-red-500' : ''}>
                              {cls.registered_count} / {cls.total_capacity}
                              {percentage > 100 && ' (تقاضای بالا!)'}
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

                {/* دکمه اجرا */}
                {selectedLottery.status !== 'completed' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>آماده اجرا</AlertTitle>
                    <AlertDescription className="flex justify-between items-center">
                      <span>
                        {stats?.pending_count || 0} ثبت‌نام در انتظار قرعه‌کشی هستند
                      </span>
                      <Button onClick={() => setShowRunDialog(true)}>
                        <Play className="h-4 w-4 ml-2" />
                        اجرای قرعه‌کشی
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* تب کلاس‌ها */}
              <TabsContent value="classes">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام کلاس</TableHead>
                      <TableHead className="text-right">معلم</TableHead>
                      <TableHead className="text-right">ظرفیت</TableHead>
                      <TableHead className="text-right">سهمیه مدیر</TableHead>
                      <TableHead className="text-right">اتاق</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map(cls => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.teacher_name}</TableCell>
                        <TableCell>{cls.available_capacity}</TableCell>
                        <TableCell>{cls.admin_reserved}</TableCell>
                        <TableCell>{cls.room_number}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* تب ثبت‌نام‌ها */}
              <TabsContent value="registrations">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">دانش‌آموز</TableHead>
                      <TableHead className="text-right">انتخاب 1</TableHead>
                      <TableHead className="text-right">انتخاب 2</TableHead>
                      <TableHead className="text-right">انتخاب 3</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">نتیجه</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map(reg => {
                      const statusConfig = REGISTRATION_STATUS_CONFIG[reg.status]
                      return (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.student.full_name}</TableCell>
                          <TableCell>
                            {classes.find(c => c.id === reg.choice_1_class_id)?.teacher_name || '-'}
                          </TableCell>
                          <TableCell>
                            {classes.find(c => c.id === reg.choice_2_class_id)?.teacher_name || '-'}
                          </TableCell>
                          <TableCell>
                            {classes.find(c => c.id === reg.choice_3_class_id)?.teacher_name || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                              {statusConfig.icon} {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reg.result_class_id 
                              ? classes.find(c => c.id === reg.result_class_id)?.name 
                              : '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* تب تنظیمات */}
              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>شروع ثبت‌نام</Label>
                    <p className="text-lg">{formatLotteryDate(selectedLottery.registration_start)}</p>
                  </div>
                  <div>
                    <Label>پایان ثبت‌نام</Label>
                    <p className="text-lg">{formatLotteryDate(selectedLottery.registration_end)}</p>
                  </div>
                  <div>
                    <Label>زمان قرعه‌کشی</Label>
                    <p className="text-lg">{formatLotteryDate(selectedLottery.lottery_time)}</p>
                  </div>
                  <div>
                    <Label>حداکثر انتخاب</Label>
                    <p className="text-lg">{selectedLottery.max_choices}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>ویرایش تا پایان</span>
                    <Badge variant={selectedLottery.allow_edit_until_end ? 'default' : 'secondary'}>
                      {selectedLottery.allow_edit_until_end ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>اطلاع‌رسانی نتیجه</span>
                    <Badge variant={selectedLottery.notify_parents_result ? 'default' : 'secondary'}>
                      {selectedLottery.notify_parents_result ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* دیالوگ اجرای قرعه‌کشی */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              تأیید اجرای قرعه‌کشی
            </DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید قرعه‌کشی را اجرا کنید؟
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>هشدار</AlertTitle>
            <AlertDescription>
              این عملیات قابل برگشت نیست. پس از اجرا، نتایج برای همه قابل مشاهده خواهد بود.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p><strong>تعداد ثبت‌نام:</strong> {stats?.total_registrations || 0} نفر</p>
            <p><strong>تعداد کلاس:</strong> {classes.length} کلاس</p>
            <p><strong>کل ظرفیت:</strong> {classes.reduce((sum, c) => sum + c.available_capacity, 0)} نفر</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRunDialog(false)}>
              انصراف
            </Button>
            <Button 
              onClick={handleRunLottery} 
              disabled={isRunning}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  در حال اجرا...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 ml-2" />
                  اجرای قرعه‌کشی
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ ایجاد */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ایجاد قرعه‌کشی جدید</DialogTitle>
            <DialogDescription>
              تنظیمات قرعه‌کشی کلاس‌های درسی
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>پایه تحصیلی</Label>
                <Select 
                  value={formData.target_grade.toString()}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, target_grade: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                      <SelectItem key={g} value={g.toString()}>
                        {gradeToText(g)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>سال تحصیلی</Label>
                <Input 
                  value={formData.academic_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                  placeholder="1404-1405"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>شروع ثبت‌نام</Label>
              <Input 
                type="datetime-local"
                value={formData.registration_start}
                onChange={(e) => setFormData(prev => ({ ...prev, registration_start: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>پایان ثبت‌نام</Label>
              <Input 
                type="datetime-local"
                value={formData.registration_end}
                onChange={(e) => setFormData(prev => ({ ...prev, registration_end: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>زمان قرعه‌کشی</Label>
              <Input 
                type="datetime-local"
                value={formData.lottery_time}
                onChange={(e) => setFormData(prev => ({ ...prev, lottery_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>حداکثر تعداد انتخاب</Label>
              <Select 
                value={formData.max_choices.toString()}
                onValueChange={(v) => setFormData(prev => ({ ...prev, max_choices: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} انتخاب
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>امکان ویرایش تا پایان</Label>
              <Switch
                checked={formData.allow_edit_until_end}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, allow_edit_until_end: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>اطلاع‌رسانی نتیجه به والدین</Label>
              <Switch
                checked={formData.notify_parents_result}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, notify_parents_result: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 ml-2" />
              )}
              ایجاد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}





































