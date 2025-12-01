'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Download,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Types
interface AttendanceRecord {
  id: string
  date: string
  dayOfWeek: string
  status: 'present' | 'absent' | 'late' | 'excused' | 'sick'
  absence_reason?: string
  absence_note?: string
}

interface MonthlyStats {
  month: string
  presentDays: number
  absentDays: number
  lateDays: number
  sickDays: number
  excusedDays: number
  totalDays: number
  attendancePercentage: number
}

// داده نمونه
const sampleRecords: AttendanceRecord[] = [
  { id: '1', date: '1403/09/15', dayOfWeek: 'یکشنبه', status: 'present' },
  { id: '2', date: '1403/09/14', dayOfWeek: 'شنبه', status: 'present' },
  { id: '3', date: '1403/09/13', dayOfWeek: 'پنج‌شنبه', status: 'present' },
  { id: '4', date: '1403/09/12', dayOfWeek: 'چهارشنبه', status: 'late', absence_note: '10 دقیقه تأخیر' },
  { id: '5', date: '1403/09/11', dayOfWeek: 'سه‌شنبه', status: 'present' },
  { id: '6', date: '1403/09/10', dayOfWeek: 'دوشنبه', status: 'sick', absence_reason: 'مریضی', absence_note: 'سرماخوردگی' },
  { id: '7', date: '1403/09/09', dayOfWeek: 'یکشنبه', status: 'sick', absence_reason: 'مریضی' },
  { id: '8', date: '1403/09/08', dayOfWeek: 'شنبه', status: 'present' },
  { id: '9', date: '1403/09/07', dayOfWeek: 'پنج‌شنبه', status: 'present' },
  { id: '10', date: '1403/09/06', dayOfWeek: 'چهارشنبه', status: 'present' },
  { id: '11', date: '1403/09/05', dayOfWeek: 'سه‌شنبه', status: 'excused', absence_reason: 'مراسم خانوادگی' },
  { id: '12', date: '1403/09/04', dayOfWeek: 'دوشنبه', status: 'present' },
  { id: '13', date: '1403/09/03', dayOfWeek: 'یکشنبه', status: 'present' },
  { id: '14', date: '1403/09/02', dayOfWeek: 'شنبه', status: 'present' },
  { id: '15', date: '1403/09/01', dayOfWeek: 'پنج‌شنبه', status: 'present' },
]

const monthlyTrendData = [
  { month: 'شهریور', rate: 95 },
  { month: 'مهر', rate: 92 },
  { month: 'آبان', rate: 88 },
  { month: 'آذر', rate: 90 },
]

const statusConfig = {
  present: { label: 'حاضر', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  absent: { label: 'غایب', color: 'bg-red-100 text-red-700', icon: XCircle },
  late: { label: 'تأخیر', color: 'bg-orange-100 text-orange-700', icon: Clock },
  excused: { label: 'با اجازه', color: 'bg-blue-100 text-blue-700', icon: FileCheck },
  sick: { label: 'بیمار', color: 'bg-yellow-100 text-yellow-700', icon: Stethoscope },
}

export default function ParentAttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState('1403/09')
  const [records] = useState(sampleRecords)

  // محاسبه آمار
  const stats = useMemo(() => {
    const total = records.length
    const present = records.filter(r => r.status === 'present').length
    const absent = records.filter(r => r.status === 'absent').length
    const late = records.filter(r => r.status === 'late').length
    const sick = records.filter(r => r.status === 'sick').length
    const excused = records.filter(r => r.status === 'excused').length
    
    return {
      total,
      present,
      absent,
      late,
      sick,
      excused,
      attendancePercentage: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  }, [records])

  // داده نمودار دایره‌ای
  const pieData = [
    { name: 'حاضر', value: stats.present, color: '#22c55e' },
    { name: 'غایب', value: stats.absent, color: '#ef4444' },
    { name: 'تأخیر', value: stats.late, color: '#f97316' },
    { name: 'بیمار', value: stats.sick, color: '#eab308' },
    { name: 'با اجازه', value: stats.excused, color: '#3b82f6' },
  ].filter(item => item.value > 0)

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-500" />
            گزارش حضور و غیاب
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            وضعیت حضور فرزند شما: علی رضایی - کلاس ششم الف
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1403/09">آذر 1403</SelectItem>
              <SelectItem value="1403/08">آبان 1403</SelectItem>
              <SelectItem value="1403/07">مهر 1403</SelectItem>
              <SelectItem value="1403/06">شهریور 1403</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            دانلود گزارش
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">حاضر</p>
                <p className="text-3xl font-bold">{stats.present}</p>
                <p className="text-green-100 text-xs">روز</p>
              </div>
              <CheckCircle className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">غایب</p>
                <p className="text-3xl font-bold">{stats.absent}</p>
                <p className="text-red-100 text-xs">روز</p>
              </div>
              <XCircle className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">تأخیر</p>
                <p className="text-3xl font-bold">{stats.late}</p>
                <p className="text-orange-100 text-xs">روز</p>
              </div>
              <Clock className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">بیمار</p>
                <p className="text-3xl font-bold">{stats.sick}</p>
                <p className="text-yellow-100 text-xs">روز</p>
              </div>
              <Stethoscope className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">با اجازه</p>
                <p className="text-3xl font-bold">{stats.excused}</p>
                <p className="text-blue-100 text-xs">روز</p>
              </div>
              <FileCheck className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* جدول حضور */}
          <Card>
            <CardHeader>
              <CardTitle>سوابق حضور و غیاب</CardTitle>
              <CardDescription>لیست کامل وضعیت حضور در ماه جاری</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>روز</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>علت</TableHead>
                      <TableHead>توضیحات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map(record => {
                      const config = statusConfig[record.status]
                      const Icon = config.icon
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.date}</TableCell>
                          <TableCell>{record.dayOfWeek}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={config.color}>
                              <Icon className="w-3 h-3 ml-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.absence_reason || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {record.absence_note || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* نرخ حضور */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نرخ حضور ماهانه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-600">{stats.attendancePercentage}%</p>
                <p className="text-gray-500 text-sm mt-1">از {stats.total} روز</p>
              </div>
              
              <Progress value={stats.attendancePercentage} className="h-3" />
              
              <div className="flex items-center justify-center gap-2 text-sm">
                {stats.attendancePercentage >= 90 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">عالی! وضعیت حضور بسیار خوب است</span>
                  </>
                ) : stats.attendancePercentage >= 75 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600">خوب، اما قابل بهبود است</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">نیاز به توجه بیشتر دارد</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* نمودار دایره‌ای */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">توزیع وضعیت حضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} روز`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* روند ماهانه */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">روند حضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis domain={[70, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'نرخ حضور']} />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}




