'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Loader2, User } from 'lucide-react'

type Grade = {
  id: string
  student_id: string
  subject: string
  score: number
  max_score: number
  exam_type: string
  comments?: string
  exam_date: string
  students?: { full_name: string; grade: number }
  profiles?: { full_name: string }
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  general: 'کلی', midterm: 'میان‌ترم', final: 'پایان‌ترم',
  quiz: 'پرسش کلاسی', homework: 'تکلیف', project: 'پروژه',
  oral: 'شفاهی', practical: 'عملی',
}

export default function ParentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/grades')
      .then(r => r.json())
      .then(d => setGrades(d.grades || []))
      .finally(() => setLoading(false))
  }, [])

  // گروه‌بندی بر اساس فرزند
  const byChild: Record<string, { name: string; grades: Grade[] }> = {}
  grades.forEach(g => {
    const id = g.student_id
    if (!byChild[id]) byChild[id] = { name: g.students?.full_name || 'دانش‌آموز', grades: [] }
    byChild[id].grades.push(g)
  })

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="text-green-600" /> نمرات فرزندان
        </h1>
        <p className="text-sm text-gray-500">آخرین نمرات ثبت‌شده برای فرزندان شما</p>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" /></div>
      ) : Object.keys(byChild).length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-400">
          <GraduationCap size={48} className="mx-auto mb-3 opacity-30" />
          هنوز نمره‌ای برای فرزندان شما ثبت نشده است.
        </CardContent></Card>
      ) : (
        Object.entries(byChild).map(([id, child]) => {
          const avg = child.grades.reduce((s, g) => s + (g.score / g.max_score) * 20, 0) / child.grades.length
          return (
            <Card key={id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><User className="text-green-600" /> {child.name}</span>
                  <span className={`text-lg ${avg >= 17 ? 'text-green-600' : avg >= 14 ? 'text-blue-600' : avg >= 10 ? 'text-orange-600' : 'text-red-600'}`}>
                    معدل: {avg.toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {child.grades.map(g => (
                    <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium">{g.subject}</p>
                        <p className="text-xs text-gray-500">
                          {EXAM_TYPE_LABELS[g.exam_type] || g.exam_type} • {new Date(g.exam_date).toLocaleDateString('fa-IR')}
                          {g.profiles?.full_name && ` • معلم: ${g.profiles.full_name}`}
                        </p>
                        {g.comments && <p className="text-xs text-gray-600 mt-1 italic">{g.comments}</p>}
                      </div>
                      <div className={`text-2xl font-bold ${g.score >= g.max_score * 0.85 ? 'text-green-600' : g.score >= g.max_score * 0.5 ? 'text-blue-600' : 'text-red-600'}`}>
                        {g.score}<span className="text-sm text-gray-400">/{g.max_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
