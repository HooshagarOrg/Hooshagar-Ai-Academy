'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'
import { 
  Calendar, 
  Download, 
  Printer, 
  Save, 
  Users, 
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Stethoscope,
  MessageSquare,
  Upload,
  Send,
  BarChart3,
  RefreshCw,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

// Types
interface Student {
  id: string
  full_name: string
  avatar_url?: string
  student_code: string
}

interface AttendanceRecord {
  student_id: string
  status: 'present' | 'absent' | 'late' | 'excused' | 'sick'
  absence_reason?: string
  absence_note?: string
  medical_certificate_url?: string
  notify_parent?: boolean
  notify_vp?: boolean
}

interface ClassInfo {
  id: string
  name: string
  grade: number
  student_count: number
}

// داده نمونه کلاس‌ها
const sampleClasses: ClassInfo[] = [
  { id: '1', name: 'ششم الف', grade: 6, student_count: 25 },
  { id: '2', name: 'ششم ب', grade: 6, student_count: 23 },
  { id: '3', name: 'پنجم الف', grade: 5, student_count: 27 },
  { id: '4', name: 'پنجم ب', grade: 5, student_count: 24 },
]

// داده نمونه دانش‌آموزان
const sampleStudents: Student[] = [
  { id: '1', full_name: 'علی رضایی', student_code: '1001', avatar_url: '' },
  { id: '2', full_name: 'سارا احمدی', student_code: '1002', avatar_url: '' },
  { id: '3', full_name: 'محمد کریمی', student_code: '1003', avatar_url: '' },
  { id: '4', full_name: 'فاطمه حسینی', student_code: '1004', avatar_url: '' },
  { id: '5', full_name: 'امیرحسین نوری', student_code: '1005', avatar_url: '' },
  { id: '6', full_name: 'زهرا محمدی', student_code: '1006', avatar_url: '' },
  { id: '7', full_name: 'رضا علیزاده', student_code: '1007', avatar_url: '' },
  { id: '8', full_name: 'مریم صادقی', student_code: '1008', avatar_url: '' },
  { id: '9', full_name: 'حسین جعفری', student_code: '1009', avatar_url: '' },
  { id: '10', full_name: 'نرگس اکبری', student_code: '1010', avatar_url: '' },
  { id: '11', full_name: 'مهدی قاسمی', student_code: '1011', avatar_url: '' },
  { id: '12', full_name: 'لیلا موسوی', student_code: '1012', avatar_url: '' },
  { id: '13', full_name: 'امین رحیمی', student_code: '1013', avatar_url: '' },
  { id: '14', full_name: 'سمیه کاظمی', student_code: '1014', avatar_url: '' },
  { id: '15', full_name: 'پویا شریفی', student_code: '1015', avatar_url: '' },
  { id: '16', full_name: 'آیدا نجفی', student_code: '1016', avatar_url: '' },
  { id: '17', full_name: 'سینا حیدری', student_code: '1017', avatar_url: '' },
  { id: '18', full_name: 'نازنین طاهری', student_code: '1018', avatar_url: '' },
  { id: '19', full_name: 'ارشیا صالحی', student_code: '1019', avatar_url: '' },
  { id: '20', full_name: 'هانیه زارعی', student_code: '1020', avatar_url: '' },
  { id: '21', full_name: 'کیان ملکی', student_code: '1021', avatar_url: '' },
  { id: '22', full_name: 'یاسمن خسروی', student_code: '1022', avatar_url: '' },
  { id: '23', full_name: 'پارسا امیری', student_code: '1023', avatar_url: '' },
  { id: '24', full_name: 'درسا فرهادی', student_code: '1024', avatar_url: '' },
  { id: '25', full_name: 'آرش کمالی', student_code: '1025', avatar_url: '' },
]

// علل غیبت
const absenceReasons = [
  { value: 'sickness', label: 'مریضی' },
  { value: 'parent_permission', label: 'مرخصی با اجازه والدین' },
  { value: 'family_event', label: 'مراسم خانوادگی' },
  { value: 'travel', label: 'مسافرت' },
  { value: 'medical_appointment', label: 'ویزیت پزشک' },
  { value: 'without_permission', label: 'بدون اجازه' },
  { value: 'unknown', label: 'نامشخص' },
  { value: 'other', label: 'سایر' },
]

// رنگ‌های وضعیت
const statusColors = {
  present: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  absent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  late: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  excused: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  sick: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
}

const statusLabels = {
  present: 'حاضر',
  absent: 'غایب',
  late: 'تأخیر',
  excused: 'با اجازه',
  sick: 'بیمار',
}

const statusIcons = {
  present: CheckCircle2,
  absent: XCircle,
  late: Clock,
  excused: FileCheck,
  sick: Stethoscope,
}

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isListLoaded, setIsListLoaded] = useState(false)
  
  // Dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [tempNote, setTempNote] = useState('')
  const [tempCertificate, setTempCertificate] = useState<File | null>(null)
  const [notifyParent, setNotifyParent] = useState(true)
  const [notifyVP, setNotifyVP] = useState(false)

  // بارگذاری لیست دانش‌آموزان
  const loadStudentList = async () => {
    if (!selectedClass) {
      toast.error('لطفاً ابتدا کلاس را انتخاب کنید')
      return
    }

    setIsLoading(true)
    
    // شبیه‌سازی API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setStudents(sampleStudents)
    
    // مقداردهی اولیه همه به حاضر
    const initialAttendance = new Map<string, AttendanceRecord>()
    sampleStudents.forEach(student => {
      initialAttendance.set(student.id, {
        student_id: student.id,
        status: 'present',
      })
    })
    setAttendance(initialAttendance)
    setIsListLoaded(true)
    setIsLoading(false)
    
    toast.success('لیست دانش‌آموزان بارگذاری شد')
  }

  // تغییر وضعیت دانش‌آموز
  const updateStatus = (studentId: string, status: AttendanceRecord['status']) => {
    const current = attendance.get(studentId) || { student_id: studentId, status: 'present' }
    attendance.set(studentId, { ...current, status })
    setAttendance(new Map(attendance))
  }

  // تغییر علت غیبت
  const updateReason = (studentId: string, reason: string) => {
    const current = attendance.get(studentId) || { student_id: studentId, status: 'absent' }
    attendance.set(studentId, { ...current, absence_reason: reason })
    setAttendance(new Map(attendance))
  }

  // باز کردن dialog یادداشت
  const openNoteDialog = (student: Student) => {
    setSelectedStudent(student)
    const record = attendance.get(student.id)
    setTempNote(record?.absence_note || '')
    setNotifyParent(record?.notify_parent ?? true)
    setNotifyVP(record?.notify_vp ?? false)
    setNoteDialogOpen(true)
  }

  // ذخیره یادداشت
  const saveNote = () => {
    if (!selectedStudent) return
    
    const current = attendance.get(selectedStudent.id) || { student_id: selectedStudent.id, status: 'absent' }
    attendance.set(selectedStudent.id, {
      ...current,
      absence_note: tempNote,
      notify_parent: notifyParent,
      notify_vp: notifyVP,
    })
    setAttendance(new Map(attendance))
    setNoteDialogOpen(false)
    toast.success('یادداشت ذخیره شد')
  }

  // همه حاضر
  const markAllPresent = () => {
    students.forEach(student => {
      attendance.set(student.id, { student_id: student.id, status: 'present' })
    })
    setAttendance(new Map(attendance))
    toast.success('همه دانش‌آموزان حاضر ثبت شدند')
  }

  // همه غایب
  const markAllAbsent = () => {
    students.forEach(student => {
      attendance.set(student.id, { student_id: student.id, status: 'absent' })
    })
    setAttendance(new Map(attendance))
    toast.info('همه دانش‌آموزان غایب ثبت شدند')
  }

  // ذخیره همه
  const saveAll = async () => {
    setIsSaving(true)
    
    // شبیه‌سازی ذخیره
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSaving(false)
    toast.success('حضور و غیاب با موفقیت ذخیره شد')
  }

  // ارسال به معاون
  const sendToVP = async () => {
    toast.success('گزارش به معاون انضباطی ارسال شد')
  }

  // چاپ
  const printList = () => {
    window.print()
  }

  // دانلود Excel
  const downloadExcel = () => {
    toast.success('فایل Excel در حال دانلود...')
  }

  // محاسبه آمار
  const stats = useMemo(() => {
    const total = students.length
    let present = 0, absent = 0, late = 0, excused = 0, sick = 0

    attendance.forEach(record => {
      switch (record.status) {
        case 'present': present++; break
        case 'absent': absent++; break
        case 'late': late++; break
        case 'excused': excused++; break
        case 'sick': sick++; break
      }
    })

    return {
      total,
      present,
      absent,
      late,
      excused,
      sick,
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
      absentPercentage: total > 0 ? Math.round(((absent + sick + excused) / total) * 100) : 0,
      latePercentage: total > 0 ? Math.round((late / total) * 100) : 0,
    }
  }, [students, attendance])

  // داده نمودار
  const chartData = [
    { name: 'حاضر', value: stats.present, color: '#22c55e' },
    { name: 'غایب', value: stats.absent, color: '#ef4444' },
    { name: 'تأخیر', value: stats.late, color: '#f97316' },
    { name: 'با اجازه', value: stats.excused, color: '#3b82f6' },
    { name: 'بیمار', value: stats.sick, color: '#eab308' },
  ].filter(item => item.value > 0)

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            ثبت حضور و غیاب
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: faIR })}
          </p>
        </div>
        
        <Button variant="outline" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          گزارش‌ها
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle>انتخاب کلاس و تاریخ</CardTitle>
              <CardDescription>ابتدا کلاس و تاریخ مورد نظر را انتخاب کنید</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>کلاس *</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کلاس..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.student_count} نفر)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>تاریخ *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-right">
                        <Calendar className="ml-2 h-4 w-4" />
                        {format(selectedDate, 'yyyy/MM/dd', { locale: faIR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={loadStudentList} 
                    className="w-full gap-2"
                    disabled={isLoading || !selectedClass}
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    بارگذاری لیست
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          {isListLoaded && (
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>لیست دانش‌آموزان</CardTitle>
                    <CardDescription>وضعیت حضور هر دانش‌آموز را مشخص کنید</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={markAllPresent} className="gap-1">
                      <Check className="w-4 h-4 text-green-500" />
                      همه حاضر
                    </Button>
                    <Button variant="outline" size="sm" onClick={markAllAbsent} className="gap-1">
                      <X className="w-4 h-4 text-red-500" />
                      همه غایب
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="w-16">تصویر</TableHead>
                        <TableHead>نام دانش‌آموز</TableHead>
                        <TableHead className="w-[300px]">وضعیت</TableHead>
                        <TableHead className="w-[150px]">علت غیبت</TableHead>
                        <TableHead className="w-[100px]">یادداشت</TableHead>
                        <TableHead className="w-12">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => {
                        const record = attendance.get(student.id)
                        const status = record?.status || 'present'
                        const showReason = status !== 'present'
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={student.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                  {student.full_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{student.full_name}</p>
                                <p className="text-xs text-gray-500">کد: {student.student_code}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <RadioGroup
                                value={status}
                                onValueChange={(value) => updateStatus(student.id, value as AttendanceRecord['status'])}
                                className="flex flex-wrap gap-2"
                              >
                                {(['present', 'absent', 'late', 'excused', 'sick'] as const).map(s => {
                                  const Icon = statusIcons[s]
                                  const colors = statusColors[s]
                                  return (
                                    <div key={s} className="flex items-center">
                                      <RadioGroupItem
                                        value={s}
                                        id={`${student.id}-${s}`}
                                        className="peer sr-only"
                                      />
                                      <Label
                                        htmlFor={`${student.id}-${s}`}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer text-xs border transition-all
                                          ${status === s ? `${colors.bg} ${colors.text} ${colors.border}` : 'border-gray-200 hover:bg-gray-50'}
                                        `}
                                      >
                                        <Icon className="w-3 h-3" />
                                        {statusLabels[s]}
                                      </Label>
                                    </div>
                                  )
                                })}
                              </RadioGroup>
                            </TableCell>
                            <TableCell>
                              {showReason ? (
                                <Select
                                  value={record?.absence_reason || ''}
                                  onValueChange={(value) => updateReason(student.id, value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="انتخاب..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {absenceReasons.map(reason => (
                                      <SelectItem key={reason.value} value={reason.value}>
                                        {reason.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {record?.absence_note ? (
                                <Badge variant="outline" className="text-xs">
                                  دارد
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openNoteDialog(student)}
                                title="افزودن یادداشت"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
                  <Button onClick={saveAll} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    ذخیره همه
                  </Button>
                  <Button variant="outline" onClick={sendToVP} className="gap-2">
                    <Send className="w-4 h-4" />
                    ارسال به معاون
                  </Button>
                  <Button variant="outline" onClick={printList} className="gap-2">
                    <Printer className="w-4 h-4" />
                    چاپ لیست
                  </Button>
                  <Button variant="outline" onClick={downloadExcel} className="gap-2">
                    <Download className="w-4 h-4" />
                    دانلود Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {isListLoaded && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  خلاصه امروز
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">کل دانش‌آموزان</p>
                  <p className="text-3xl font-bold">{stats.total} نفر</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">حاضر</span>
                    </div>
                    <div className="text-left">
                      <span className="font-semibold">{stats.present} نفر</span>
                      <span className="text-gray-500 text-sm mr-1">({stats.presentPercentage}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm">غایب</span>
                    </div>
                    <div className="text-left">
                      <span className="font-semibold">{stats.absent} نفر</span>
                      <span className="text-gray-500 text-sm mr-1">({stats.absentPercentage}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-sm">تأخیر</span>
                    </div>
                    <div className="text-left">
                      <span className="font-semibold">{stats.late} نفر</span>
                      <span className="text-gray-500 text-sm mr-1">({stats.latePercentage}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">با اجازه</span>
                    </div>
                    <span className="font-semibold">{stats.excused} نفر</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">بیمار</span>
                    </div>
                    <span className="font-semibold">{stats.sick} نفر</span>
                  </div>
                </div>

                <Separator />

                {/* Mini Pie Chart */}
                {chartData.length > 0 && (
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} نفر`, name]}
                          contentStyle={{ fontFamily: 'inherit' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Attendance Rate */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">نرخ حضور</p>
                  <div className="flex items-center gap-3">
                    <Progress value={stats.presentPercentage} className="flex-1" />
                    <span className="font-bold text-lg">{stats.presentPercentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">راهنمای سریع</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 space-y-2">
              <p>• ابتدا کلاس و تاریخ را انتخاب کنید</p>
              <p>• وضعیت هر دانش‌آموز را مشخص کنید</p>
              <p>• برای غیبت، علت را انتخاب کنید</p>
              <p>• در پایان حتماً ذخیره کنید</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>یادداشت غیبت: {selectedStudent?.full_name}</DialogTitle>
            <DialogDescription>
              تاریخ: {format(selectedDate, 'yyyy/MM/dd', { locale: faIR })}
              {selectedStudent && attendance.get(selectedStudent.id) && (
                <span className="mr-2">
                  | وضعیت: {statusLabels[attendance.get(selectedStudent.id)?.status || 'present']}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                placeholder="توضیحات مربوط به غیبت را وارد کنید..."
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>گواهی پزشک (اختیاری)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">برای آپلود فایل کلیک کنید</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setTempCertificate(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="notify-parent"
                  checked={notifyParent}
                  onCheckedChange={(checked) => setNotifyParent(checked as boolean)}
                />
                <Label htmlFor="notify-parent" className="text-sm">
                  ارسال اطلاع‌رسانی به والدین
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="notify-vp"
                  checked={notifyVP}
                  onCheckedChange={(checked) => setNotifyVP(checked as boolean)}
                />
                <Label htmlFor="notify-vp" className="text-sm">
                  ارسال به معاون انضباطی
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={saveNote} className="gap-2">
              <Save className="w-4 h-4" />
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}






