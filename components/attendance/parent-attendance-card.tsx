'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface AttendanceStats {
  presentDays: number
  absentDays: number
  lateDays: number
  sickDays: number
  excusedDays: number
  totalDays: number
  attendancePercentage: number
  lastAbsenceDate?: string
  lastAbsenceReason?: string
  unexcusedAbsences: number
}

interface ParentAttendanceCardProps {
  studentId?: string
  studentName?: string
}

export default function ParentAttendanceCard({ studentId, studentName }: ParentAttendanceCardProps) {
  const [stats, setStats] = useState<AttendanceStats>({
    presentDays: 18,
    absentDays: 1,
    lateDays: 0,
    sickDays: 1,
    excusedDays: 0,
    totalDays: 20,
    attendancePercentage: 90,
    lastAbsenceDate: '1403/09/10',
    lastAbsenceReason: 'مریضی',
    unexcusedAbsences: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // در اینجا می‌توان داده واقعی را از API دریافت کرد
    // const fetchStats = async () => {
    //   const response = await fetch(`/api/attendance/stats?studentId=${studentId}`)
    //   const data = await response.json()
    //   setStats(data)
    // }
    // fetchStats()
  }, [studentId])

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-blue-500" />
            حضور و غیاب
          </CardTitle>
          {stats.unexcusedAbsences > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-3 h-3 ml-1" />
              {stats.unexcusedAbsences} غیبت بدون اجازه
            </Badge>
          )}
        </div>
        <CardDescription>
          {studentName ? `وضعیت حضور ${studentName}` : 'وضعیت حضور این ماه'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* آمار اصلی */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">حاضر</span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">
              {stats.presentDays} روز
            </p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">غایب</span>
            </div>
            <p className="text-xl font-bold text-red-700 dark:text-red-400">
              {stats.absentDays + stats.sickDays} روز
            </p>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">تأخیر</span>
            </div>
            <p className="text-xl font-bold text-orange-700 dark:text-orange-400">
              {stats.lateDays} روز
            </p>
          </div>
        </div>

        {/* نوار پیشرفت */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">نرخ حضور</span>
            <span className={`font-bold ${getAttendanceColor(stats.attendancePercentage)}`}>
              {stats.attendancePercentage}%
            </span>
          </div>
          <div className="relative">
            <Progress value={stats.attendancePercentage} className="h-3" />
            <div 
              className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(stats.attendancePercentage)}`}
              style={{ width: `${stats.attendancePercentage}%` }}
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <TrendingUp className="w-3 h-3 text-green-500" />
            از ماه قبل بهتر شده
          </div>
        </div>

        <Separator />

        {/* آخرین غیبت */}
        {stats.lastAbsenceDate && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">آخرین غیبت</p>
            <div className="flex items-center justify-between">
              <span className="font-medium">{stats.lastAbsenceDate}</span>
              <Badge variant="outline">{stats.lastAbsenceReason}</Badge>
            </div>
          </div>
        )}

        {/* هشدار غیبت بدون اجازه */}
        {stats.unexcusedAbsences > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">توجه!</p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {stats.unexcusedAbsences} غیبت بدون اجازه ثبت شده است. لطفاً با مدرسه تماس بگیرید.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* دکمه جزئیات */}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/parent/attendance">
            مشاهده جزئیات
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}


















