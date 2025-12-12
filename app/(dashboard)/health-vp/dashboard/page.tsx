'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, addDays, startOfWeek } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'
import {
  Stethoscope,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Eye,
  Ear,
  Activity,
  Syringe,
  Heart,
  TrendingUp,
  Clock,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

// Types
interface FollowupItem {
  id: string
  studentName: string
  className: string
  checkupType: string
  followupDate: string
  daysOverdue: number
  recommendations: string
}

interface ScheduleItem {
  id: string
  time: string
  title: string
  type: string
  className?: string
}

interface DaySchedule {
  day: string
  date: string
  items: ScheduleItem[]
}

// داده نمونه
const sampleFollowups: FollowupItem[] = [
  { id: '1', studentName: 'علی رضایی', className: 'ششم الف', checkupType: 'vision', followupDate: '1403/09/12', daysOverdue: 3, recommendations: 'ارجاع به چشم‌پزشک' },
  { id: '2', studentName: 'سارا احمدی', className: 'پنجم ب', checkupType: 'vaccination', followupDate: '1403/09/15', daysOverdue: 0, recommendations: 'واکسن MMR نوبت 2' },
  { id: '3', studentName: 'محمد کریمی', className: 'ششم ب', checkupType: 'dental', followupDate: '1403/09/08', daysOverdue: 7, recommendations: 'پوسیدگی دندان - مراجعه به دندان‌پزشک' },
  { id: '4', studentName: 'فاطمه حسینی', className: 'چهارم الف', checkupType: 'growth', followupDate: '1403/09/14', daysOverdue: 1, recommendations: 'بررسی وزن کم' },
  { id: '5', studentName: 'امیر نوری', className: 'پنجم الف', checkupType: 'hearing', followupDate: '1403/09/10', daysOverdue: 5, recommendations: 'ارجاع به شنوایی‌سنج' },
]

const weekSchedule: DaySchedule[] = [
  {
    day: 'شنبه',
    date: '1403/09/17',
    items: [
      { id: '1', time: '08:00', title: 'بینایی‌سنجی', type: 'vision', className: 'ششم الف' },
      { id: '2', time: '10:00', title: 'واکسیناسیون گروهی', type: 'vaccination' },
    ]
  },
  {
    day: 'یکشنبه',
    date: '1403/09/18',
    items: [
      { id: '3', time: '09:00', title: 'معاینه دندان', type: 'dental', className: 'پنجم ب' },
      { id: '4', time: '14:00', title: 'قد و وزن', type: 'growth', className: 'چهارم الف' },
    ]
  },
  {
    day: 'دوشنبه',
    date: '1403/09/19',
    items: [
      { id: '5', time: '08:30', title: 'شنوایی‌سنجی', type: 'hearing', className: 'ششم ب' },
    ]
  },
  {
    day: 'سه‌شنبه',
    date: '1403/09/20',
    items: [
      { id: '6', time: '09:00', title: 'معاینه عمومی', type: 'general', className: 'سوم الف' },
      { id: '7', time: '11:00', title: 'قد و وزن', type: 'growth', className: 'سوم ب' },
    ]
  },
  {
    day: 'چهارشنبه',
    date: '1403/09/21',
    items: [
      { id: '8', time: '08:00', title: 'بینایی‌سنجی', type: 'vision', className: 'چهارم ب' },
    ]
  },
]

const monthlyCheckupsData = [
  { month: 'مهر', count: 45 },
  { month: 'آبان', count: 62 },
  { month: 'آذر', count: 38 },
  { month: 'دی', count: 0 },
  { month: 'بهمن', count: 0 },
  { month: 'اسفند', count: 0 },
]

const checkupTypeIcons: Record<string, React.ElementType> = {
  vision: Eye,
  hearing: Ear,
  dental: Activity,
  growth: TrendingUp,
  vaccination: Syringe,
  general: Stethoscope,
  mental_health: Heart,
}

const checkupTypeLabels: Record<string, string> = {
  vision: 'بینایی‌سنجی',
  hearing: 'شنوایی‌سنجی',
  dental: 'معاینه دندان',
  growth: 'قد و وزن',
  vaccination: 'واکسیناسیون',
  general: 'معاینه عمومی',
  mental_health: 'سلامت روان',
}

const checkupTypeColors: Record<string, string> = {
  vision: 'bg-blue-100 text-blue-700',
  hearing: 'bg-purple-100 text-purple-700',
  dental: 'bg-pink-100 text-pink-700',
  growth: 'bg-green-100 text-green-700',
  vaccination: 'bg-orange-100 text-orange-700',
  general: 'bg-teal-100 text-teal-700',
  mental_health: 'bg-red-100 text-red-700',
}

export default function HealthVPDashboardPage() {
  const [followups, setFollowups] = useState(sampleFollowups)
  const [currentWeek, setCurrentWeek] = useState(0)

  // آمار
  const stats = {
    totalStudents: 280,
    pendingFollowups: followups.length,
    checkupsThisWeek: 45,
    appointmentsToday: 8,
  }

  // تکمیل پیگیری
  const completeFollowup = (id: string) => {
    setFollowups(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-teal-500" />
            داشبورد بهداشت
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            مدیریت سلامت دانش‌آموزان مدرسه
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/health-vp/reports">
              <FileText className="w-4 h-4 ml-2" />
              گزارش‌ها
            </Link>
          </Button>
          <Button asChild>
            <Link href="/health-vp/students">
              <Users className="w-4 h-4 ml-2" />
              پرونده دانش‌آموزان
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">کل دانش‌آموزان</p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
              </div>
              <Users className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">نیاز به پیگیری</p>
                <p className="text-3xl font-bold">{stats.pendingFollowups}</p>
              </div>
              <AlertTriangle className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">معاینات این هفته</p>
                <p className="text-3xl font-bold">{stats.checkupsThisWeek}</p>
              </div>
              <CheckCircle className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">نوبت‌های امروز</p>
                <p className="text-3xl font-bold">{stats.appointmentsToday}</p>
              </div>
              <Calendar className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Followups */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    نیاز به پیگیری فوری
                  </CardTitle>
                  <CardDescription>
                    دانش‌آموزانی که موعد پیگیری‌شان رسیده یا گذشته
                  </CardDescription>
                </div>
                <Badge variant="destructive">{followups.length} مورد</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {followups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  همه پیگیری‌ها انجام شده است! 🎉
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {followups.map(item => {
                      const Icon = checkupTypeIcons[item.checkupType] || Stethoscope
                      const colorClass = checkupTypeColors[item.checkupType] || 'bg-gray-100 text-gray-700'
                      
                      return (
                        <div 
                          key={item.id}
                          className={`p-4 rounded-lg border ${
                            item.daysOverdue > 0 
                              ? 'border-red-200 bg-red-50 dark:bg-red-900/20' 
                              : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-500 text-white">
                                  {item.studentName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{item.studentName}</p>
                                <p className="text-sm text-gray-500">{item.className}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className={colorClass}>
                                    <Icon className="w-3 h-3 ml-1" />
                                    {checkupTypeLabels[item.checkupType]}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>موعد: {item.followupDate}</span>
                              </div>
                              {item.daysOverdue > 0 && (
                                <Badge variant="destructive" className="mt-1">
                                  {item.daysOverdue} روز گذشته
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 bg-white dark:bg-gray-800 rounded p-2">
                            📋 {item.recommendations}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/health-vp/students/${item.id}`}>
                                <Eye className="w-4 h-4 ml-1" />
                                مشاهده پرونده
                              </Link>
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => completeFollowup(item.id)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              انجام شد
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Monthly Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                روند معاینات ماهانه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyCheckupsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="تعداد معاینات" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  برنامه هفته
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(prev => prev - 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(prev => prev + 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {weekSchedule.map(day => (
                    <div key={day.day}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                        <span className="font-semibold">{day.day}</span>
                        <span className="text-sm text-gray-500">{day.date}</span>
                      </div>
                      
                      {day.items.length === 0 ? (
                        <p className="text-sm text-gray-400 mr-4">برنامه‌ای ثبت نشده</p>
                      ) : (
                        <div className="space-y-2 mr-4">
                          {day.items.map(item => {
                            const Icon = checkupTypeIcons[item.type] || Stethoscope
                            const colorClass = checkupTypeColors[item.type] || 'bg-gray-100 text-gray-700'
                            
                            return (
                              <div 
                                key={item.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{item.title}</p>
                                  {item.className && (
                                    <p className="text-xs text-gray-500">{item.className}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  {item.time}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href="/health-vp/schedule">
                  <Plus className="w-4 h-4" />
                  افزودن برنامه جدید
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">دسترسی سریع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/health-vp/checkup/new">
                  <Plus className="w-4 h-4" />
                  ثبت معاینه جدید
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/health-vp/visit/new">
                  <Stethoscope className="w-4 h-4" />
                  ثبت ویزیت بهداری
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/health-vp/vaccination">
                  <Syringe className="w-4 h-4" />
                  ثبت واکسیناسیون
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/health-vp/reports">
                  <FileText className="w-4 h-4" />
                  گزارش‌گیری
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}





























