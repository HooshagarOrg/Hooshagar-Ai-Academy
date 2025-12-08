'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, UserX, TrendingUp, Eye, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface HighAbsenceStudent {
  id: string
  name: string
  class_name: string
  absent_days: number
  avatar_url?: string
  trend: 'up' | 'down' | 'same'
  last_counseling?: string
}

interface CounselorAttendanceCardProps {
  schoolId?: string
}

export default function CounselorAttendanceCard({ schoolId }: CounselorAttendanceCardProps) {
  const [students, setStudents] = useState<HighAbsenceStudent[]>([
    { id: '1', name: 'علی رضایی', class_name: 'ششم الف', absent_days: 8, trend: 'up', last_counseling: '1403/09/10' },
    { id: '2', name: 'محمد کریمی', class_name: 'ششم ب', absent_days: 7, trend: 'same' },
    { id: '3', name: 'سارا احمدی', class_name: 'پنجم ب', absent_days: 6, trend: 'down', last_counseling: '1403/09/05' },
    { id: '4', name: 'فاطمه حسینی', class_name: 'پنجم الف', absent_days: 6, trend: 'up' },
    { id: '5', name: 'امیرحسین نوری', class_name: 'ششم الف', absent_days: 5, trend: 'same', last_counseling: '1403/09/12' },
  ])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // دریافت داده واقعی از API
  }, [schoolId])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-red-500" />
      case 'down':
        return <TrendingUp className="w-3 h-3 text-green-500 rotate-180" />
      default:
        return <span className="w-3 h-3 text-gray-400">−</span>
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-red-500'
      case 'down':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            دانش‌آموزان پرغیبت
          </CardTitle>
          <Badge variant="warning" className="gap-1">
            <UserX className="w-3 h-3" />
            {students.length} نفر
          </Badge>
        </div>
        <CardDescription>
          دانش‌آموزانی که بیش از 5 روز غیبت دارند و نیاز به توجه دارند
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-3">
            {students.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {index < 3 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.class_name}</p>
                    {student.last_counseling && (
                      <p className="text-xs text-blue-500">
                        آخرین جلسه: {student.last_counseling}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {student.absent_days}
                      </span>
                      <span className="text-xs text-gray-500">روز</span>
                      {getTrendIcon(student.trend)}
                    </div>
                    <p className={`text-xs ${getTrendColor(student.trend)}`}>
                      {student.trend === 'up' && 'در حال افزایش'}
                      {student.trend === 'down' && 'رو به بهبود'}
                      {student.trend === 'same' && 'بدون تغییر'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="مشاهده پرونده">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="ثبت جلسه مشاوره">
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* آمار خلاصه */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
            <p className="text-red-600 font-bold">{students.filter(s => s.trend === 'up').length}</p>
            <p className="text-xs text-gray-500">رو به وخامت</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
            <p className="text-yellow-600 font-bold">{students.filter(s => s.trend === 'same').length}</p>
            <p className="text-xs text-gray-500">ثابت</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <p className="text-green-600 font-bold">{students.filter(s => s.trend === 'down').length}</p>
            <p className="text-xs text-gray-500">رو به بهبود</p>
          </div>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/counselor/attendance">
            مشاهده همه
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}


















