'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users, BookOpen, TrendingUp, Award, BarChart3,
  GraduationCap, CheckCircle2, XCircle, Star
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    total_students: number
    total_teachers: number
    total_parents: number
    total_schools: number
  }
  grades: {
    average_score: number
    total_grades: number
    passing_rate: number
    subject_averages: { subject: string; avg: number }[]
  }
  attendance: {
    average_rate: number
    total_records: number
    absent_count: number
  }
  gamification: {
    total_xp_awarded: number
    active_users: number
    badges_awarded: number
    avg_level: number
  }
  exams: {
    total_exams: number
    avg_pass_rate: number
    recent_count: number
  }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/analytics')
        const json = await res.json()
        if (!json.error) setData(json)
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  const overview = data?.overview
  const grades   = data?.grades
  const attend   = data?.attendance
  const game     = data?.gamification
  const exams    = data?.exams

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-purple-100 p-3 rounded-xl">
          <BarChart3 className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">گزارش تحلیلی</h1>
          <p className="text-gray-500 text-sm">آمار و تحلیل جامع سیستم</p>
        </div>
      </div>

      {/* کارت‌های خلاصه */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700">{overview?.total_students ?? '—'}</span>
            </div>
            <p className="text-sm text-blue-600 font-medium">دانش‌آموز</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-green-700">{overview?.total_teachers ?? '—'}</span>
            </div>
            <p className="text-sm text-green-600 font-medium">معلم</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-700">{overview?.total_parents ?? '—'}</span>
            </div>
            <p className="text-sm text-purple-600 font-medium">والدین</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-700">{overview?.total_schools ?? '—'}</span>
            </div>
            <p className="text-sm text-orange-600 font-medium">مدرسه</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* آمار نمرات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="w-5 h-5 text-yellow-500" />
              آمار نمرات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">میانگین کلی</span>
              <span className={`text-xl font-bold ${
                (grades?.average_score ?? 0) >= 14 ? 'text-green-600' : 'text-red-600'
              }`}>
                {grades?.average_score?.toFixed(1) ?? '—'} / ۲۰
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">نرخ قبولی</span>
              <span className="text-xl font-bold text-blue-600">
                {grades?.passing_rate?.toFixed(0) ?? '—'}٪
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">تعداد نمرات ثبت شده</span>
              <span className="text-lg font-semibold text-gray-800">
                {grades?.total_grades?.toLocaleString('fa-IR') ?? '—'}
              </span>
            </div>
            {grades?.subject_averages && grades.subject_averages.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">میانگین هر درس</p>
                {grades.subject_averages.slice(0, 5).map(s => (
                  <div key={s.subject} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-24 truncate">{s.subject}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.avg >= 14 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${(s.avg / 20) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{s.avg.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* آمار حضور */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              آمار حضور و غیاب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">نرخ حضور</span>
              <span className={`text-xl font-bold ${
                (attend?.average_rate ?? 0) >= 80 ? 'text-green-600' : 'text-red-600'
              }`}>
                {attend?.average_rate?.toFixed(1) ?? '—'}٪
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">کل رکوردهای ثبت شده</span>
              <span className="text-lg font-semibold text-gray-800">
                {attend?.total_records?.toLocaleString('fa-IR') ?? '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">تعداد غیبت‌ها</span>
              <span className="text-xl font-bold text-red-600">
                {attend?.absent_count?.toLocaleString('fa-IR') ?? '—'}
              </span>
            </div>
            {attend && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">حضور</span>
                  <XCircle className="w-4 h-4 text-red-500 mr-4" />
                  <span className="text-sm text-gray-600">غیبت</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${attend.average_rate}%` }}
                  />
                  <div
                    className="h-full bg-red-400"
                    style={{ width: `${100 - attend.average_rate}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* گیمیفیکیشن */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-5 h-5 text-yellow-500" />
              آمار گیمیفیکیشن
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">کل XP اهدایی</span>
              <span className="text-xl font-bold text-yellow-600">
                {game?.total_xp_awarded?.toLocaleString('fa-IR') ?? '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">کاربران فعال</span>
              <span className="text-xl font-bold text-green-600">
                {game?.active_users?.toLocaleString('fa-IR') ?? '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">نشان اهدا شده</span>
              <span className="text-xl font-bold text-purple-600">
                {game?.badges_awarded?.toLocaleString('fa-IR') ?? '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">میانگین سطح</span>
              <span className="text-xl font-bold text-blue-600">
                {game?.avg_level?.toFixed(1) ?? '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* آزمون‌ها */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              آمار آزمون‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">کل آزمون‌ها</span>
              <span className="text-xl font-bold text-blue-600">
                {exams?.total_exams?.toLocaleString('fa-IR') ?? '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">میانگین نرخ قبولی</span>
              <span className={`text-xl font-bold ${
                (exams?.avg_pass_rate ?? 0) >= 70 ? 'text-green-600' : 'text-red-600'
              }`}>
                {exams?.avg_pass_rate?.toFixed(0) ?? '—'}٪
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">آزمون‌های اخیر (۳۰ روز)</span>
              <span className="text-xl font-bold text-gray-800">
                {exams?.recent_count?.toLocaleString('fa-IR') ?? '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
