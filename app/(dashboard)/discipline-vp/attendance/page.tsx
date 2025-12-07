'use client'

import { useState, useMemo } from 'react'
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  Phone,
  Calendar,
  Filter,
  Download,
  Users,
  Clock,
  XCircle,
  TrendingDown,
  TrendingUp,
  FileText,
  BarChart3,
  RefreshCw,
  MessageSquare,
  UserX,
  School
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Types
interface PendingFollowup {
  id: string
  date: string
  student_name: string
  student_id: string
  class_name: string
  status: 'absent' | 'late'
  absence_reason?: string
  followed_up: boolean
  parent_phone?: string
}

interface AttendanceRecord {
  id: string
  date: string
  student_name: string
  class_name: string
  status: string
  absence_reason?: string
  followed_up: boolean
  follow_up_note?: string
  followed_up_by?: string
  followed_up_at?: string
}

// داده نمونه موارد نیازمند پیگیری
const samplePendingFollowups: PendingFollowup[] = [
  { id: '1', date: '1403/09/15', student_name: 'علی رضایی', student_id: 's1', class_name: 'ششم الف', status: 'absent', absence_reason: undefined, followed_up: false, parent_phone: '09121234567' },
  { id: '2', date: '1403/09/15', student_name: 'سارا احمدی', student_id: 's2', class_name: 'ششم ب', status: 'absent', absence_reason: 'sickness', followed_up: false, parent_phone: '09129876543' },
  { id: '3', date: '1403/09/14', student_name: 'محمد کریمی', student_id: 's3', class_name: 'پنجم الف', status: 'late', absence_reason: undefined, followed_up: false, parent_phone: '09131112233' },
  { id: '4', date: '1403/09/14', student_name: 'فاطمه حسینی', student_id: 's4', class_name: 'ششم الف', status: 'absent', absence_reason: 'unknown', followed_up: false, parent_phone: '09144455566' },
  { id: '5', date: '1403/09/13', student_name: 'امیرحسین نوری', student_id: 's5', class_name: 'پنجم ب', status: 'absent', absence_reason: undefined, followed_up: false, parent_phone: '09157778899' },
]

// داده نمونه همه موارد
const sampleAllRecords: AttendanceRecord[] = [
  { id: '1', date: '1403/09/15', student_name: 'علی رضایی', class_name: 'ششم الف', status: 'absent', followed_up: false },
  { id: '2', date: '1403/09/15', student_name: 'سارا احمدی', class_name: 'ششم ب', status: 'absent', absence_reason: 'مریضی', followed_up: true, follow_up_note: 'با والدین تماس گرفته شد', followed_up_by: 'معاون انضباطی', followed_up_at: '1403/09/15 10:30' },
  { id: '3', date: '1403/09/14', student_name: 'محمد کریمی', class_name: 'پنجم الف', status: 'late', followed_up: false },
  { id: '4', date: '1403/09/14', student_name: 'زهرا محمدی', class_name: 'ششم الف', status: 'absent', absence_reason: 'مرخصی', followed_up: true, follow_up_note: 'والدین قبلاً اطلاع داده بودند', followed_up_by: 'معاون انضباطی', followed_up_at: '1403/09/14 09:15' },
  { id: '5', date: '1403/09/13', student_name: 'رضا علیزاده', class_name: 'ششم ب', status: 'absent', followed_up: true, follow_up_note: 'بیماری - گواهی پزشک ارائه شد', followed_up_by: 'معاون انضباطی', followed_up_at: '1403/09/13 11:00' },
]

// داده نمودار روند ماهانه
const monthlyTrendData = [
  { name: 'هفته 1', absent: 45, late: 23, excused: 12 },
  { name: 'هفته 2', absent: 52, late: 18, excused: 15 },
  { name: 'هفته 3', absent: 38, late: 25, excused: 10 },
  { name: 'هفته 4', absent: 41, late: 20, excused: 14 },
]

// داده مقایسه کلاس‌ها
const classComparisonData = [
  { name: 'ششم الف', absent: 15, late: 8 },
  { name: 'ششم ب', absent: 12, late: 5 },
  { name: 'پنجم الف', absent: 18, late: 10 },
  { name: 'پنجم ب', absent: 10, late: 6 },
  { name: 'چهارم الف', absent: 8, late: 4 },
  { name: 'چهارم ب', absent: 14, late: 7 },
]

// داده توزیع علل غیبت
const reasonDistributionData = [
  { name: 'مریضی', value: 45, color: '#eab308' },
  { name: 'مرخصی با اجازه', value: 25, color: '#3b82f6' },
  { name: 'بدون اجازه', value: 15, color: '#ef4444' },
  { name: 'مراسم خانوادگی', value: 10, color: '#8b5cf6' },
  { name: 'سایر', value: 5, color: '#6b7280' },
]

// کلاس‌ها
const classes = [
  { id: 'all', name: 'همه کلاس‌ها' },
  { id: '1', name: 'ششم الف' },
  { id: '2', name: 'ششم ب' },
  { id: '3', name: 'پنجم الف' },
  { id: '4', name: 'پنجم ب' },
]

// نتایج تماس
const callResults = [
  { value: 'answered_resolved', label: 'پاسخ داد - علت مشخص شد' },
  { value: 'no_answer', label: 'پاسخ نداد' },
  { value: 'wrong_number', label: 'شماره اشتباه' },
  { value: 'needs_followup', label: 'نیاز به پیگیری بیشتر' },
]

// علل غیبت
const absenceReasons = [
  { value: 'sickness', label: 'مریضی' },
  { value: 'parent_permission', label: 'مرخصی با اجازه والدین' },
  { value: 'family_event', label: 'مراسم خانوادگی' },
  { value: 'travel', label: 'مسافرت' },
  { value: 'without_permission', label: 'بدون اجازه' },
  { value: 'other', label: 'سایر' },
]

export default function DisciplineVPAttendancePage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [dateRange, setDateRange] = useState('today')
  const [selectedClass, setSelectedClass] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pendingItems, setPendingItems] = useState(samplePendingFollowups)
  
  // Dialog state
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PendingFollowup | null>(null)
  
  // Form state
  const [callResult, setCallResult] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [followupNote, setFollowupNote] = useState('')
  const [notifyCounselor, setNotifyCounselor] = useState(false)
  const [addToDisciplinaryRecord, setAddToDisciplinaryRecord] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // فیلتر موارد
  const filteredPendingItems = useMemo(() => {
    return pendingItems.filter(item => {
      if (selectedClass !== 'all' && item.class_name !== classes.find(c => c.id === selectedClass)?.name) {
        return false
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [pendingItems, selectedClass, statusFilter])

  // باز کردن dialog پیگیری
  const openFollowupDialog = (item: PendingFollowup) => {
    setSelectedItem(item)
    setCallResult('')
    setSelectedReason(item.absence_reason || '')
    setFollowupNote('')
    setNotifyCounselor(false)
    setAddToDisciplinaryRecord(false)
    setFollowupDialogOpen(true)
  }

  // باز کردن dialog جزئیات
  const openDetailsDialog = (item: PendingFollowup) => {
    setSelectedItem(item)
    setDetailsDialogOpen(true)
  }

  // تماس با والدین
  const callParent = (phone: string) => {
    window.location.href = `tel:${phone}`
    toast.info(`در حال تماس با ${phone}...`)
  }

  // ذخیره پیگیری
  const saveFollowup = async () => {
    if (!callResult) {
      toast.error('لطفاً نتیجه تماس را انتخاب کنید')
      return
    }
    if (!followupNote) {
      toast.error('لطفاً یادداشت پیگیری را وارد کنید')
      return
    }

    setIsSaving(true)
    
    // شبیه‌سازی ذخیره
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // حذف از لیست نیازمند پیگیری
    if (selectedItem) {
      setPendingItems(prev => prev.filter(item => item.id !== selectedItem.id))
    }
    
    setIsSaving(false)
    setFollowupDialogOpen(false)
    toast.success('پیگیری با موفقیت ثبت شد')
  }

  // آمار
  const stats = {
    today: { absent: 15, late: 8, pending: pendingItems.length },
    week: { absent: 89, late: 45 },
    month: { absent: 234, late: 123 },
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-orange-500" />
            پیگیری حضور و غیاب
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            بررسی و پیگیری موارد غیبت و تأخیر دانش‌آموزان
          </p>
        </div>
        
        <Badge variant="destructive" className="text-base px-4 py-2 gap-2">
          <AlertTriangle className="w-5 h-5" />
          {pendingItems.length} مورد نیاز به پیگیری
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            نیاز به پیگیری
            <Badge variant="secondary" className="mr-1">{pendingItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="w-4 h-4" />
            همه موارد
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            گزارش‌ها
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            آمار
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: نیاز به پیگیری */}
        <TabsContent value="pending" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="w-48">
                  <Label className="mb-2 block">بازه زمانی</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">امروز</SelectItem>
                      <SelectItem value="yesterday">دیروز</SelectItem>
                      <SelectItem value="week">این هفته</SelectItem>
                      <SelectItem value="month">این ماه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-48">
                  <Label className="mb-2 block">کلاس</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-48">
                  <Label className="mb-2 block">نوع</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="absent">غایب</SelectItem>
                      <SelectItem value="late">تأخیر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Table */}
          <Card>
            <CardHeader>
              <CardTitle>موارد نیازمند پیگیری</CardTitle>
              <CardDescription>غیبت و تأخیرهایی که هنوز پیگیری نشده‌اند</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>دانش‌آموز</TableHead>
                      <TableHead>کلاس</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>علت</TableHead>
                      <TableHead>پیگیری</TableHead>
                      <TableHead className="text-left">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                          همه موارد پیگیری شده‌اند! 🎉
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPendingItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs">
                                  {item.student_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {item.student_name}
                            </div>
                          </TableCell>
                          <TableCell>{item.class_name}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'absent' ? 'destructive' : 'warning'}>
                              {item.status === 'absent' ? (
                                <><XCircle className="w-3 h-3 ml-1" /> غایب</>
                              ) : (
                                <><Clock className="w-3 h-3 ml-1" /> تأخیر</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.absence_reason ? (
                              <span className="text-sm">{absenceReasons.find(r => r.value === item.absence_reason)?.label || item.absence_reason}</span>
                            ) : (
                              <Badge variant="outline" className="text-red-500 border-red-300">
                                ؟ نامشخص
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-red-500 border-red-300">
                              ❌ انجام نشده
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDetailsDialog(item)}
                                title="مشاهده جزئیات"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openFollowupDialog(item)}
                                title="ثبت پیگیری"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => item.parent_phone && callParent(item.parent_phone)}
                                title="تماس با والدین"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: همه موارد */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>همه موارد حضور و غیاب</CardTitle>
                  <CardDescription>تاریخچه کامل غیبت و تأخیر</CardDescription>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  خروجی Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>دانش‌آموز</TableHead>
                      <TableHead>کلاس</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>علت</TableHead>
                      <TableHead>پیگیری</TableHead>
                      <TableHead>یادداشت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleAllRecords.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{record.student_name}</TableCell>
                        <TableCell>{record.class_name}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'absent' ? 'destructive' : 'warning'}>
                            {record.status === 'absent' ? 'غایب' : 'تأخیر'}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.absence_reason || '-'}</TableCell>
                        <TableCell>
                          {record.followed_up ? (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              ✅ انجام شده
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-500 border-red-300">
                              ❌ انجام نشده
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                          {record.follow_up_note || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: گزارش‌ها */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* نمودار روند ماهانه */}
            <Card>
              <CardHeader>
                <CardTitle>روند غیبت و تأخیر ماهانه</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="absent" name="غایب" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="late" name="تأخیر" stroke="#f97316" strokeWidth={2} />
                      <Line type="monotone" dataKey="excused" name="با اجازه" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* نمودار مقایسه کلاس‌ها */}
            <Card>
              <CardHeader>
                <CardTitle>مقایسه کلاس‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="absent" name="غایب" fill="#ef4444" />
                      <Bar dataKey="late" name="تأخیر" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* نمودار توزیع علل غیبت */}
            <Card>
              <CardHeader>
                <CardTitle>توزیع علل غیبت</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reasonDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        dataKey="value"
                      >
                        {reasonDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* دانش‌آموزان پرغیبت */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-red-500" />
                  دانش‌آموزان پرغیبت این ماه
                </CardTitle>
                <CardDescription>بیش از 5 روز غیبت</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'علی رضایی', class: 'ششم الف', days: 8 },
                    { name: 'محمد کریمی', class: 'ششم ب', days: 7 },
                    { name: 'سارا احمدی', class: 'پنجم ب', days: 6 },
                    { name: 'فاطمه حسینی', class: 'پنجم الف', days: 5 },
                  ].map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.class}</p>
                        </div>
                      </div>
                      <Badge variant="destructive">
                        {student.days} روز غیبت
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: آمار */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  امروز
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">غیبت</span>
                    <span className="text-2xl font-bold text-red-500">{stats.today.absent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">تأخیر</span>
                    <span className="text-2xl font-bold text-orange-500">{stats.today.late}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">نیاز به پیگیری</span>
                    <Badge variant="destructive">{stats.today.pending}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  این هفته
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">غیبت</span>
                    <span className="text-2xl font-bold text-red-500">{stats.week.absent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">تأخیر</span>
                    <span className="text-2xl font-bold text-orange-500">{stats.week.late}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    10% کمتر از هفته قبل
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  این ماه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">غیبت</span>
                    <span className="text-2xl font-bold text-red-500">{stats.month.absent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">تأخیر</span>
                    <span className="text-2xl font-bold text-orange-500">{stats.month.late}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    5% بیشتر از ماه قبل
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">کل دانش‌آموزان</p>
                    <p className="text-3xl font-bold">280</p>
                  </div>
                  <Users className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">نرخ حضور امروز</p>
                    <p className="text-3xl font-bold">87.5%</p>
                  </div>
                  <CheckCircle className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">پیگیری‌های انجام شده</p>
                    <p className="text-3xl font-bold">45</p>
                  </div>
                  <Phone className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">ارجاع به مشاور</p>
                    <p className="text-3xl font-bold">12</p>
                  </div>
                  <MessageSquare className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Followup Dialog */}
      <Dialog open={followupDialogOpen} onOpenChange={setFollowupDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ثبت پیگیری: {selectedItem?.student_name}</DialogTitle>
            <DialogDescription>
              تاریخ غیبت: {selectedItem?.date} | وضعیت: {selectedItem?.status === 'absent' ? 'غایب' : 'تأخیر'}
              {!selectedItem?.absence_reason && ' - بدون اجازه'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>نتیجه تماس *</Label>
              <RadioGroup value={callResult} onValueChange={setCallResult}>
                {callResults.map(result => (
                  <div key={result.value} className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value={result.value} id={result.value} />
                    <Label htmlFor={result.value}>{result.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>علت غیبت *</Label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید..." />
                </SelectTrigger>
                <SelectContent>
                  {absenceReasons.map(reason => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>یادداشت پیگیری *</Label>
              <Textarea
                placeholder="نتیجه تماس و توضیحات را بنویسید..."
                value={followupNote}
                onChange={(e) => setFollowupNote(e.target.value)}
                rows={4}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="notify-counselor"
                  checked={notifyCounselor}
                  onCheckedChange={(checked) => setNotifyCounselor(checked as boolean)}
                />
                <Label htmlFor="notify-counselor">اطلاع به مشاور</Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="add-disciplinary"
                  checked={addToDisciplinaryRecord}
                  onCheckedChange={(checked) => setAddToDisciplinaryRecord(checked as boolean)}
                />
                <Label htmlFor="add-disciplinary" className="text-red-600">
                  ثبت در پرونده انضباطی
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowupDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={saveFollowup} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              ثبت پیگیری
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>جزئیات: {selectedItem?.student_name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">تاریخ</Label>
                <p className="font-medium">{selectedItem?.date}</p>
              </div>
              <div>
                <Label className="text-gray-500">کلاس</Label>
                <p className="font-medium">{selectedItem?.class_name}</p>
              </div>
              <div>
                <Label className="text-gray-500">وضعیت</Label>
                <Badge variant={selectedItem?.status === 'absent' ? 'destructive' : 'warning'}>
                  {selectedItem?.status === 'absent' ? 'غایب' : 'تأخیر'}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500">علت</Label>
                <p className="font-medium">
                  {selectedItem?.absence_reason 
                    ? absenceReasons.find(r => r.value === selectedItem.absence_reason)?.label 
                    : 'نامشخص'}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-gray-500">شماره تماس والدین</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium">{selectedItem?.parent_phone}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedItem?.parent_phone && callParent(selectedItem.parent_phone)}
                  className="gap-1"
                >
                  <Phone className="w-3 h-3" />
                  تماس
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              بستن
            </Button>
            <Button onClick={() => {
              setDetailsDialogOpen(false)
              if (selectedItem) openFollowupDialog(selectedItem)
            }} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              ثبت پیگیری
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}













