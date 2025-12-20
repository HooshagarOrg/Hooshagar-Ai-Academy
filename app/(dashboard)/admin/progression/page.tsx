'use client'

import { useState } from 'react'

export default function AdminProgressionPage() {
  const [activeTab, setActiveTab] = useState<'lottery' | 'year-end' | 'manual'>('lottery')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Form states
  const [lotteryId, setLotteryId] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [fromGrade, setFromGrade] = useState(7)
  const [academicYear, setAcademicYear] = useState('1403-1404')
  const [minAvgGrade, setMinAvgGrade] = useState(12)
  const [studentId, setStudentId] = useState('')
  const [toGrade, setToGrade] = useState(8)
  const [toClassId, setToClassId] = useState('')
  const [adminNote, setAdminNote] = useState('')

  const handleApplyLottery = async () => {
    if (!lotteryId) {
      alert('لطفاً شناسه قرعه‌کشی را وارد کنید')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/progression/apply-lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotteryId, executeImmediately: true })
      })

      const data = await res.json()
      setResult(data)

      if (data.success) {
        alert(`✅ ${data.message}\nتعداد: ${data.updatedCount}`)
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error(error)
      alert('❌ خطا در اجرا')
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteYearEnd = async () => {
    if (!schoolId || !fromGrade || !academicYear) {
      alert('لطفاً همه فیلدها را پر کنید')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/progression/promote-year-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, fromGrade, academicYear, minAvgGrade })
      })

      const data = await res.json()
      setResult(data)

      if (data.success) {
        alert(`✅ ${data.message}\nارتقا: ${data.promotedCount}\nمردودی: ${data.retainedCount}`)
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error(error)
      alert('❌ خطا در اجرا')
    } finally {
      setLoading(false)
    }
  }

  const handleManualProgress = async () => {
    if (!studentId || !toGrade) {
      alert('لطفاً شناسه دانش‌آموز و پایه را وارد کنید')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/progression/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, toGrade, toClassId: toClassId || null, adminNote })
      })

      const data = await res.json()
      setResult(data)

      if (data.success) {
        alert(`✅ ${data.message}`)
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error(error)
      alert('❌ خطا در اجرا')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎓 مدیریت انتقال دانش‌آموزان
        </h1>
        <p className="text-gray-600">
          انتقال دانش‌آموزان به پایه بالاتر
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('lottery')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'lottery'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          اعمال قرعه‌کشی
        </button>
        <button
          onClick={() => setActiveTab('year-end')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'year-end'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          ارتقا پایان سال
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'manual'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          انتقال دستی
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {activeTab === 'lottery' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">اعمال نتایج قرعه‌کشی</h2>
            <div>
              <label className="block text-sm font-medium mb-2">شناسه قرعه‌کشی (UUID)</label>
              <input
                type="text"
                value={lotteryId}
                onChange={(e) => setLotteryId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={handleApplyLottery}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'در حال اجرا...' : 'اعمال نتایج'}
            </button>
          </div>
        )}

        {activeTab === 'year-end' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">ارتقای دسته‌جمعی پایان سال</h2>
            <div>
              <label className="block text-sm font-medium mb-2">شناسه مدرسه (UUID)</label>
              <input
                type="text"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">پایه فعلی</label>
              <select
                value={fromGrade}
                onChange={(e) => setFromGrade(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    پایه {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">سال تحصیلی</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="1403-1404"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">حداقل میانگین نمرات</label>
              <input
                type="number"
                value={minAvgGrade}
                onChange={(e) => setMinAvgGrade(Number(e.target.value))}
                step="0.5"
                min="0"
                max="20"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={handlePromoteYearEnd}
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'در حال اجرا...' : 'ارتقای دسته‌جمعی'}
            </button>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">انتقال دستی دانش‌آموز</h2>
            <div>
              <label className="block text-sm font-medium mb-2">شناسه دانش‌آموز (UUID)</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">پایه جدید</label>
              <select
                value={toGrade}
                onChange={(e) => setToGrade(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    پایه {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">کلاس جدید (اختیاری - UUID)</label>
              <input
                type="text"
                value={toClassId}
                onChange={(e) => setToClassId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">یادداشت (اختیاری)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={handleManualProgress}
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400"
            >
              {loading ? 'در حال اجرا...' : 'انتقال دانش‌آموز'}
            </button>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="font-bold mb-2">نتیجه:</h3>
          <pre className="text-sm bg-white p-4 rounded border overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

