'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Student {
  id: string
  full_name: string
  grade: number
  parent_email?: string
  created_at: string
}

export default function TestStudentsList() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      const data = await response.json()
      setStudents(data.students || [])
    } catch (error) {
      toast.error('خطا در دریافت لیست')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.get('full_name'),
          grade: parseInt(formData.get('grade') as string),
          parent_email: formData.get('parent_email') || undefined,
        }),
      })

      const result = await response.json()

      // چک کردن دقیق
      if (!response.ok) {
        throw new Error(result.error || 'خطا در افزودن')
      }

      // موفقیت
      toast.success('✅ دانش‌آموز با موفقیت اضافه شد!')
      setShowForm(false)
      await fetchStudents()
      
    } catch (error: any) {
      toast.error(`❌ ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return

    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' })
      toast.success('حذف شد!')
      fetchStudents()
    } catch (error) {
      toast.error('خطا در حذف')
    }
  }

  const handleAnalyze = async (studentId: string) => {
    setAnalyzing(true)
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'خطا')
      }

      setCurrentAnalysis(result)
      toast.success('✅ تحلیل انجام شد!')
      
    } catch (error: any) {
      toast.error(`❌ ${error.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  if (isLoading) return <div className="p-8">در حال بارگذاری...</div>

  return (
    <div className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">لیست دانش‌آموزان 📚</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {showForm ? 'لغو' : '+ افزودن دانش‌آموز'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">دانش‌آموز جدید</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <input
                name="full_name"
                placeholder="نام کامل"
                required
                className="w-full p-2 border rounded"
              />
              <input
                name="grade"
                type="number"
                min="1"
                max="12"
                placeholder="پایه (1-12)"
                required
                className="w-full p-2 border rounded"
              />
              <input
                name="parent_email"
                type="email"
                placeholder="ایمیل والد (اختیاری)"
                className="w-full p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
              >
                ذخیره
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">نام</th>
                <th className="px-4 py-3 text-right">پایه</th>
                <th className="px-4 py-3 text-right">ایمیل والد</th>
                <th className="px-4 py-3 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    هنوز دانش‌آموزی ثبت نشده است
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{student.full_name}</td>
                    <td className="px-4 py-3">پایه {student.grade}</td>
                    <td className="px-4 py-3">{student.parent_email || '-'}</td>
                    <td className="px-4 py-3 space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleAnalyze(student.id)}
                        className="text-blue-500 hover:text-blue-700 ml-2"
                      >
                        🤖 تحلیل
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️ حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {currentAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" dir="rtl">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  🤖 تحلیل AI: {currentAnalysis.student.full_name}
                </h2>
                <button
                  onClick={() => setCurrentAnalysis(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* تحلیل کلی */}
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">📋 تحلیل کلی:</h3>
                  <p>{currentAnalysis.analysis.analysis}</p>
                </div>

                {/* نقاط قوت */}
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">💪 نقاط قوت:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {currentAnalysis.analysis.strengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* نقاط ضعف */}
                <div className="bg-orange-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">⚠️ نقاط قابل بهبود:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {currentAnalysis.analysis.weaknesses.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>

                {/* توصیه‌ها */}
                <div className="bg-purple-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">💡 توصیه‌ها:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {currentAnalysis.analysis.recommendations.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* سطح ریسک */}
                <div className={`p-4 rounded ${
                  currentAnalysis.analysis.risk_level === 'low' ? 'bg-green-100' :
                  currentAnalysis.analysis.risk_level === 'medium' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <h3 className="font-semibold">
                    📊 سطح ریسک: {
                      currentAnalysis.analysis.risk_level === 'low' ? '🟢 پایین' :
                      currentAnalysis.analysis.risk_level === 'medium' ? '🟡 متوسط' :
                      '🔴 بالا'
                    }
                  </h3>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  مدل: {currentAnalysis.model}
                </p>
              </div>
            </div>
          </div>
        )}

        {analyzing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="animate-spin text-4xl mb-4">🤖</div>
              <p className="text-lg">در حال تحلیل...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



