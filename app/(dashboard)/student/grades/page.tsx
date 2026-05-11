'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'

type Grade = {
  id: string
  subject: string
  score: number
  max_score: number
  exam_type: string
  comments?: string
  exam_date: string
  profiles?: { full_name: string }
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  general: 'کلی', midterm: 'میان‌ترم', final: 'پایان‌ترم',
  quiz: 'پرسش کلاسی', homework: 'تکلیف', project: 'پروژه',
  oral: 'شفاهی', practical: 'عملی',
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/grades')
      .then(r => r.json())
      .then(d => setGrades(d.grades || []))
      .finally(() => setLoading(false))
  }, [])

  const avg = grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.score / g.max_score) * 20, 0) / grades.length
    : 0

  const subjectAverages: Record<string, { sum: number; count: number; max: number }> = {}
  grades.forEach(g => {
    if (!subjectAverages[g.subject]) subjectAverages[g.subject] = { sum: 0, count: 0, max: 20 }
    subjectAverages[g.subject].sum += (g.score / g.max_score) * 20
    subjectAverages[g.subject].count += 1
  })

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="text-blue-600" /> نمرات من
        </h1>
        <p className="text-sm text-gray-500">آخرین نمرات ثبت‌شده توسط معلمان</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">معدل کل</p>
          <p className={`text-3xl font-bold ${avg >= 17 ? 'text-green-600' : avg >= 14 ? 'text-blue-600' : avg >= 10 ? 'text-orange-600' : 'text-red-600'}`}>
            {avg.toFixed(2)}
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">تعداد نمرات</p>
          <p className="text-3xl font-bold">{grades.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">دروس</p>
          <p className="text-3xl font-bold">{Object.keys(subjectAverages).length}</p>
        </CardContent></Card>
      </div>

      {Object.keys(subjectAverages).length > 0 && (
        <Card>
          <CardHeader><CardTitle>میانگین هر درس</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(subjectAverages).map(([sub, s]) => {
                const a = s.sum / s.count
                return (
                  <div key={sub} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{sub}</span>
                    <span className={`font-bold ${a >= 17 ? 'text-green-600' : a >= 14 ? 'text-blue-600' : a >= 10 ? 'text-orange-600' : 'text-red-600'}`}>
                      {a.toFixed(2)}
                      {a >= 17 && <TrendingUp className="inline mr-1" size={16} />}
                      {a < 10 && <TrendingDown className="inline mr-1" size={16} />}
                      {a >= 10 && a < 17 && <Minus className="inline mr-1" size={16} />}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>تاریخچه نمرات</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" /></div>
          ) : grades.length === 0 ? (
            <p className="text-center py-12 text-gray-400">هنوز نمره‌ای ثبت نشده</p>
          ) : (
            <div className="space-y-2">
              {grades.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium">{g.subject}</p>
                    <p className="text-xs text-gray-500">
                      {EXAM_TYPE_LABELS[g.exam_type] || g.exam_type} • {new Date(g.exam_date).toLocaleDateString('fa-IR')}
                      {g.profiles?.full_name && ` • ${g.profiles.full_name}`}
                    </p>
                    {g.comments && <p className="text-xs text-gray-600 mt-1 italic">{g.comments}</p>}
                  </div>
                  <div className={`text-2xl font-bold ${g.score >= g.max_score * 0.85 ? 'text-green-600' : g.score >= g.max_score * 0.5 ? 'text-blue-600' : 'text-red-600'}`}>
                    {g.score}<span className="text-sm text-gray-400">/{g.max_score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
