'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { School, TrendingUp, TrendingDown, BarChart3, Award, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface SchoolAttendance {
  id: string
  name: string
  attendanceRate: number
  totalStudents: number
  absentToday: number
  trend: 'up' | 'down' | 'same'
}

export default function AdminAttendanceCard() {
  const [schools, setSchools] = useState<SchoolAttendance[]>([
    { id: '1', name: 'دبستان تلاش', attendanceRate: 87, totalStudents: 280, absentToday: 36, trend: 'up' },
    { id: '2', name: 'دبستان شهید باهنر', attendanceRate: 92, totalStudents: 320, absentToday: 26, trend: 'up' },
    { id: '3', name: 'دبستان فردوسی', attendanceRate: 85, totalStudents: 250, absentToday: 38, trend: 'down' },
    { id: '4', name: 'دبستان سعدی', attendanceRate: 89, totalStudents: 290, absentToday: 32, trend: 'same' },
  ])

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // دریافت داده واقعی از API
  }, [])

  // مرتب‌سازی بر اساس نرخ حضور
  const sortedSchools = [...schools].sort((a, b) => b.attendanceRate - a.attendanceRate)
  const bestSchool = sortedSchools[0]
  const worstSchool = sortedSchools[sortedSchools.length - 1]
  const averageRate = Math.round(schools.reduce((sum, s) => sum + s.attendanceRate, 0) / schools.length)

  // داده نمودار
  const chartData = schools.map(s => ({
    name: s.name.replace('دبستان ', ''),
    rate: s.attendanceRate,
    color: s.attendanceRate >= 90 ? '#22c55e' : s.attendanceRate >= 85 ? '#eab308' : '#ef4444'
  }))

  const getBarColor = (rate: number) => {
    if (rate >= 90) return '#22c55e'
    if (rate >= 85) return '#eab308'
    return '#ef4444'
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <School className="w-5 h-5 text-purple-500" />
            مقایسه حضور مدارس
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            میانگین: {averageRate}%
          </Badge>
        </div>
        <CardDescription>
          نرخ حضور امروز در مدارس تحت نظارت
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* بهترین و ضعیف‌ترین */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">بهترین</span>
            </div>
            <p className="font-semibold text-sm truncate">{bestSchool?.name}</p>
            <p className="text-xl font-bold text-green-600">{bestSchool?.attendanceRate}%</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-600 font-medium">نیاز به توجه</span>
            </div>
            <p className="font-semibold text-sm truncate">{worstSchool?.name}</p>
            <p className="text-xl font-bold text-red-600">{worstSchool?.attendanceRate}%</p>
          </div>
        </div>

        {/* نمودار مقایسه */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                width={60}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'نرخ حضور']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Separator />

        {/* لیست مدارس */}
        <div className="space-y-2">
          {sortedSchools.map((school, index) => (
            <div 
              key={school.id} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}
                `}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-sm">{school.name}</p>
                  <p className="text-xs text-gray-500">{school.totalStudents} دانش‌آموز</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <p className="font-bold text-sm">{school.attendanceRate}%</p>
                  <p className="text-xs text-gray-500">{school.absentToday} غایب</p>
                </div>
                {school.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : school.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <span className="w-4 h-4 text-gray-400">−</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/admin/attendance">
            مشاهده گزارش کامل
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}









































