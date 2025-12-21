'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PerformanceSummary {
  total_xp: number
  final_level: number
  badges_earned: number
  avg_grade: number
  total_grades: number
  attendance_rate: number
  ai_analyses_count: number
  summary_generated_at: string
}

interface HistoryRecord {
  grade: number
  academic_year: string
  class_name: string
  progression_type: string
  performance_summary: PerformanceSummary
  progression_date: string
}

interface StudentInfo {
  id: string
  full_name: string
  grade: number
  class: {
    name: string
    teacher_name: string
  }
}

export default function AcademicHistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [currentPerformance, setCurrentPerformance] = useState<PerformanceSummary | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      // دریافت اطلاعات کاربر
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) {
        router.push('/login')
        return
      }
      const userData = await userRes.json()

      // دریافت student_id
      const studentRes = await fetch(`/api/students/by-user/${userData.user.id}`)
      if (!studentRes.ok) {
        throw new Error('دانش‌آموز یافت نشد')
      }
      const studentData = await studentRes.json()
      const studentId = studentData.student.id

      // دریافت تاریخچه
      const historyRes = await fetch(`/api/progression/history?studentId=${studentId}`)
      if (!historyRes.ok) {
        throw new Error('خطا در دریافت تاریخچه')
      }
      const historyData = await historyRes.json()

      setStudent(historyData.student)
      setCurrentPerformance(historyData.currentPerformance)
      setHistory(historyData.history || [])
    } catch (err: any) {
      console.error('❌ Error loading history:', err)
      setError(err.message || 'خطا در بارگذاری تاریخچه')
    } finally {
      setLoading(false)
    }
  }

  const getProgressionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      normal: 'ارتقای عادی',
      lottery: 'قرعه‌کشی',
      manual: 'انتقال دستی',
      transfer: 'انتقال از مدرسه دیگر'
    }
    return labels[type] || type
  }

  const getGradeLabel = (grade: number) => {
    const labels: Record<number, string> = {
      1: 'اول', 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم', 6: 'ششم',
      7: 'هفتم', 8: 'هشتم', 9: 'نهم', 10: 'دهم', 11: 'یازدهم', 12: 'دوازدهم'
    }
    return labels[grade] || `پایه ${grade}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">در حال بارگذاری تاریخچه...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 bg-red-50 p-8 rounded-lg">
          <div className="text-5xl">❌</div>
          <h2 className="text-xl font-bold text-red-600">خطا در بارگذاری</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadHistory}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl">📚</div>
          <h1 className="text-3xl font-bold text-gray-900">تاریخچه تحصیلی من</h1>
        </div>
        <p className="text-gray-600">
          مشاهده کامل پیشرفت تحصیلی از اول تا الان
        </p>
      </div>

      {/* اطلاعات فعلی */}
      {student && (
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{student.full_name}</h2>
              <p className="text-blue-100">
                پایه {getGradeLabel(student.grade)} - کلاس {student.class?.name || 'نامشخص'}
              </p>
              {student.class?.teacher_name && (
                <p className="text-blue-100 text-sm">
                  معلم: {student.class.teacher_name}
                </p>
              )}
            </div>
            <div className="text-6xl">🎓</div>
          </div>

          {currentPerformance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{currentPerformance.total_xp}</div>
                <div className="text-xs text-blue-100">امتیاز کل</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{currentPerformance.final_level}</div>
                <div className="text-xs text-blue-100">سطح فعلی</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{currentPerformance.avg_grade}</div>
                <div className="text-xs text-blue-100">میانگین نمرات</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{currentPerformance.badges_earned}</div>
                <div className="text-xs text-blue-100">نشان‌ها</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* تاریخچه */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📖 سوابق تحصیلی ({history.length} سال)
        </h2>

        {history.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600">هنوز سابقه‌ای ثبت نشده است</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {record.grade}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        پایه {getGradeLabel(record.grade)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        سال تحصیلی {record.academic_year}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {getProgressionTypeLabel(record.progression_type)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(record.progression_date).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>

                {/* کلاس */}
                {record.class_name && (
                  <div className="mb-4 text-gray-700">
                    <span className="font-semibold">کلاس:</span> {record.class_name}
                  </div>
                )}

                {/* آمار عملکرد */}
                {record.performance_summary && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {record.performance_summary.total_xp}
                      </div>
                      <div className="text-xs text-gray-600">XP کل</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {record.performance_summary.final_level}
                      </div>
                      <div className="text-xs text-gray-600">سطح</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {record.performance_summary.avg_grade}
                      </div>
                      <div className="text-xs text-gray-600">میانگین</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {record.performance_summary.badges_earned}
                      </div>
                      <div className="text-xs text-gray-600">نشان</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {record.performance_summary.attendance_rate}%
                      </div>
                      <div className="text-xs text-gray-600">حضور</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* خلاصه کلی */}
      {history.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
          <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>📊</span>
            خلاصه کلی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">تعداد سال‌های تحصیل</p>
              <p className="text-2xl font-bold text-blue-600">{history.length} سال</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">پایه فعلی</p>
              <p className="text-2xl font-bold text-purple-600">
                {student ? getGradeLabel(student.grade) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">امتیاز کل</p>
              <p className="text-2xl font-bold text-green-600">
                {currentPerformance?.total_xp || 0} XP
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




