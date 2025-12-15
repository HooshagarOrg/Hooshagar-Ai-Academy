'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface AttendanceStats {
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number
  trend: 'up' | 'down' | 'same'
  trendPercentage: number
}

interface WeeklyData {
  day: string
  rate: number
}

interface PrincipalAttendanceCardProps {
  schoolId?: string
}

export default function PrincipalAttendanceCard({ schoolId }: PrincipalAttendanceCardProps) {
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 280,
    presentCount: 245,
    absentCount: 25,
    lateCount: 10,
    attendanceRate: 87.5,
    trend: 'up',
    trendPercentage: 2.5,
  })

  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([
    { day: 'شنبه', rate: 92 },
    { day: 'یکشنبه', rate: 88 },
    { day: 'دوشنبه', rate: 85 },
    { day: 'سه‌شنبه', rate: 90 },
    { day: 'چهارشنبه', rate: 87 },
  ])

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // دریافت داده واقعی از API
  }, [schoolId])

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            حضور امروز
          </CardTitle>
          <div className="flex items-center gap-1">
            {stats.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${stats.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {stats.trendPercentage}%
            </span>
          </div>
        </div>
        <CardDescription>
          وضعیت کلی حضور دانش‌آموزان مدرسه
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* کارت‌های آمار */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 opacity-80" />
              <span className="text-xs opacity-80">حاضر</span>
            </div>
            <p className="text-2xl font-bold">{stats.presentCount}</p>
            <p className="text-xs opacity-80">
              {((stats.presentCount / stats.totalStudents) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3 text-white">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 opacity-80" />
              <span className="text-xs opacity-80">غایب</span>
            </div>
            <p className="text-2xl font-bold">{stats.absentCount}</p>
            <p className="text-xs opacity-80">
              {((stats.absentCount / stats.totalStudents) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 opacity-80" />
              <span className="text-xs opacity-80">تأخیر</span>
            </div>
            <p className="text-2xl font-bold">{stats.lateCount}</p>
            <p className="text-xs opacity-80">
              {((stats.lateCount / stats.totalStudents) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* نرخ حضور کلی */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">نرخ حضور کلی</span>
            <span className={`text-2xl font-bold ${getAttendanceColor(stats.attendanceRate)}`}>
              {stats.attendanceRate}%
            </span>
          </div>
          <Progress value={stats.attendanceRate} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>کل دانش‌آموزان: {stats.totalStudents} نفر</span>
            <span>حاضر: {stats.presentCount}/{stats.totalStudents}</span>
          </div>
        </div>

        <Separator />

        {/* نمودار روند هفتگی */}
        <div>
          <p className="text-sm font-medium mb-2">روند حضور هفتگی</p>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[70, 100]} 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'نرخ حضور']}
                  contentStyle={{ fontSize: 12 }}
                />
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
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/principal/attendance">
            مشاهده گزارش کامل
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}









































