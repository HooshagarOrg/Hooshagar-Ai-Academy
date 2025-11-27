'use client'

import { useState, useEffect, useMemo } from 'react'

interface StudentWithXP {
  id: string
  full_name: string
  grade: number
  totalXp: number
  level: number
  levelTitle: string
}

interface StudentDetail {
  student: { id: string; name: string; grade: number }
  xp: {
    total: number
    level: number
    levelTitle: string
    rank: number
    progressPercent: number
    xpForNextLevel: number
  }
  badges: { id: string; name: string; icon: string; description: string }[]
  recentTransactions: {
    id: string
    actionType: string
    actionName: string
    xpEarned: number
    createdAt: string
  }[]
  stats: { action: string; actionName: string; count: number; totalXp: number }[]
}

type SortOption = 'xp-desc' | 'xp-asc' | 'name-asc'

export default function TeacherTalentGardenPage() {
  const [students, setStudents] = useState<StudentWithXP[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sortOption, setSortOption] = useState<SortOption>('xp-desc')

  // Modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Level title helper
  const getLevelTitle = (level: number): string => {
    if (level <= 1) return 'تازه‌کار'
    if (level <= 2) return 'کنجکاو'
    if (level <= 3) return 'پژوهشگر'
    if (level <= 4) return 'دانشمند'
    if (level <= 5) return 'نابغه'
    if (level <= 7) return 'استاد'
    if (level <= 10) return 'افسانه‌ای'
    return 'اسطوره'
  }

  // Fetch all students with XP data from API
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch students from API
        const studentsRes = await fetch('/api/students')
        const studentsJson = await studentsRes.json()
        
        if (!studentsRes.ok) {
          throw new Error(studentsJson.error || 'خطا در دریافت دانش‌آموزان')
        }

        // Fetch leaderboard for XP data
        const xpRes = await fetch('/api/xp/leaderboard?limit=1000')
        const xpJson = await xpRes.json()
        
        // Create XP lookup map from leaderboard
        const xpLookup = new Map<string, { totalXp: number; level: number }>(
          (xpJson.leaderboard || []).map((x: any) => [x.studentId, { totalXp: x.totalXp, level: x.level }])
        )

        // Merge data
        const mergedStudents: StudentWithXP[] = (studentsJson.students || []).map((s: any) => {
          const xp = xpLookup.get(s.id)
          return {
            id: s.id,
            full_name: s.full_name,
            grade: s.grade,
            totalXp: xp?.totalXp || 0,
            level: xp?.level || 1,
            levelTitle: getLevelTitle(xp?.level || 1),
          }
        })

        setStudents(mergedStudents)
      } catch (err: any) {
        console.error('Error fetching students:', err)
        setError('خطا در دریافت لیست دانش‌آموزان')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // Fetch student detail for modal
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentDetail(null)
      return
    }

    const fetchDetail = async () => {
      setDetailLoading(true)
      try {
        const response = await fetch(`/api/xp/profile?studentId=${selectedStudentId}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setStudentDetail(data)
        } else {
          setStudentDetail(null)
        }
      } catch (err) {
        console.error('Error fetching detail:', err)
        setStudentDetail(null)
      } finally {
        setDetailLoading(false)
      }
    }

    fetchDetail()
  }, [selectedStudentId])

  // Get unique levels for filter dropdown
  const uniqueLevels = useMemo(() => {
    const levels = new Set(students.map(s => s.level))
    return Array.from(levels).sort((a, b) => a - b)
  }, [students])

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let result = [...students]

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Level filter
    if (levelFilter !== 'all') {
      result = result.filter(s => s.level === parseInt(levelFilter))
    }

    // Sort
    switch (sortOption) {
      case 'xp-desc':
        result.sort((a, b) => b.totalXp - a.totalXp)
        break
      case 'xp-asc':
        result.sort((a, b) => a.totalXp - b.totalXp)
        break
      case 'name-asc':
        result.sort((a, b) => a.full_name.localeCompare(b.full_name, 'fa'))
        break
    }

    return result
  }, [students, searchQuery, levelFilter, sortOption])

  // Get level color
  const getLevelColor = (level: number) => {
    if (level <= 1) return 'bg-gray-500'
    if (level <= 2) return 'bg-green-500'
    if (level <= 3) return 'bg-blue-500'
    if (level <= 4) return 'bg-purple-500'
    if (level <= 5) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  // Get action icon
  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      'ocr': '🔍',
      'study_buddy': '📚',
      'story': '✨',
      'daily_login': '🌟',
      'analysis': '📊',
      'quiz_complete': '🏆',
      'homework_submit': '📝',
    }
    return icons[action] || '⭐'
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'همین الان'
    if (minutes < 60) return `${minutes} دقیقه پیش`
    if (hours < 24) return `${hours} ساعت پیش`
    return `${days} روز پیش`
  }

  // Close modal
  const closeModal = () => {
    setSelectedStudentId(null)
    setStudentDetail(null)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            🏆 مدیریت باغ استعداد
          </h1>
          <p className="text-slate-400">مشاهده و مدیریت امتیازات دانش‌آموزان</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <p className="text-slate-400 text-sm">کل دانش‌آموزان</p>
            <p className="text-white text-2xl font-bold">{students.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <p className="text-slate-400 text-sm">دانش‌آموزان فعال</p>
            <p className="text-green-400 text-2xl font-bold">
              {students.filter(s => s.totalXp > 0).length}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <p className="text-slate-400 text-sm">مجموع امتیازات</p>
            <p className="text-yellow-400 text-2xl font-bold">
              {students.reduce((sum, s) => sum + s.totalXp, 0).toLocaleString('fa-IR')}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <p className="text-slate-400 text-sm">میانگین امتیاز</p>
            <p className="text-blue-400 text-2xl font-bold">
              {students.length > 0
                ? Math.round(students.reduce((sum, s) => sum + s.totalXp, 0) / students.length).toLocaleString('fa-IR')
                : 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 جستجوی نام دانش‌آموز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 text-white rounded-xl border border-white/20 focus:border-blue-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/10 text-white rounded-xl border border-white/20 focus:border-blue-500 focus:outline-none min-w-[140px]"
            >
              <option value="all" className="bg-slate-800">همه سطوح</option>
              {uniqueLevels.map(level => (
                <option key={level} value={level} className="bg-slate-800">
                  سطح {level}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-4 py-2.5 bg-white/10 text-white rounded-xl border border-white/20 focus:border-blue-500 focus:outline-none min-w-[160px]"
            >
              <option value="xp-desc" className="bg-slate-800">بیشترین امتیاز</option>
              <option value="xp-asc" className="bg-slate-800">کمترین امتیاز</option>
              <option value="name-asc" className="bg-slate-800">نام (الفبایی)</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-slate-400 text-sm">
                  <th className="text-right px-4 py-3 font-medium">رتبه</th>
                  <th className="text-right px-4 py-3 font-medium">دانش‌آموز</th>
                  <th className="text-center px-4 py-3 font-medium">پایه</th>
                  <th className="text-center px-4 py-3 font-medium">سطح</th>
                  <th className="text-center px-4 py-3 font-medium">امتیاز</th>
                  <th className="text-center px-4 py-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      دانش‌آموزی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-500 text-orange-900' :
                          'bg-white/10 text-white'
                        }`}>
                          {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${getLevelColor(student.level)} flex items-center justify-center text-white font-bold`}>
                            {student.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium">{student.full_name}</p>
                            <p className="text-slate-500 text-xs">{student.levelTitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">{student.grade}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(student.level)} text-white`}>
                          Lv.{student.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-yellow-400 font-semibold">
                          {student.totalXp.toLocaleString('fa-IR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedStudentId(student.id)
                          }}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 text-sm"
                        >
                          جزئیات
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10 text-slate-400 text-sm">
            نمایش {filteredStudents.length} از {students.length} دانش‌آموز
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedStudentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">در حال بارگذاری...</p>
              </div>
            ) : studentDetail ? (
              <>
                {/* Modal Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">جزئیات دانش‌آموز</h2>
                    <button
                      onClick={closeModal}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full ${getLevelColor(studentDetail.xp.level)} flex items-center justify-center text-white text-2xl font-bold`}>
                      {studentDetail.student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{studentDetail.student.name}</h3>
                      <p className="text-yellow-400">{studentDetail.xp.levelTitle}</p>
                      <p className="text-slate-400 text-sm">پایه {studentDetail.student.grade}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-6 border-b border-white/10">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-yellow-400 text-xl font-bold">{studentDetail.xp.total}</p>
                      <p className="text-slate-400 text-xs">امتیاز کل</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-blue-400 text-xl font-bold">#{studentDetail.xp.rank}</p>
                      <p className="text-slate-400 text-xs">رتبه</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-purple-400 text-xl font-bold">{studentDetail.xp.level}</p>
                      <p className="text-slate-400 text-xs">سطح</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate-400 mb-1">
                      <span>پیشرفت به سطح بعد</span>
                      <span>{studentDetail.xp.progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                        style={{ width: `${studentDetail.xp.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Badges */}
                {studentDetail.badges.length > 0 && (
                  <div className="p-6 border-b border-white/10">
                    <h4 className="text-white font-semibold mb-3">🏅 نشان‌ها</h4>
                    <div className="flex flex-wrap gap-2">
                      {studentDetail.badges.map((badge, i) => (
                        <span
                          key={i}
                          className="bg-white/10 px-3 py-1 rounded-full text-sm text-white flex items-center gap-1"
                          title={badge.description}
                        >
                          {badge.icon} {badge.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="p-6 border-b border-white/10">
                  <h4 className="text-white font-semibold mb-3">📜 فعالیت‌های اخیر</h4>
                  <div className="space-y-2">
                    {studentDetail.recentTransactions.length === 0 ? (
                      <p className="text-slate-500 text-sm">فعالیتی ثبت نشده</p>
                    ) : (
                      studentDetail.recentTransactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="flex items-center gap-2 text-sm">
                          <span>{getActionIcon(tx.actionType)}</span>
                          <span className="text-white flex-1">{tx.actionName}</span>
                          <span className="text-green-400">+{tx.xpEarned}</span>
                          <span className="text-slate-500 text-xs">{formatDate(tx.createdAt)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Activity Stats */}
                {studentDetail.stats.length > 0 && (
                  <div className="p-6">
                    <h4 className="text-white font-semibold mb-3">📊 آمار فعالیت‌ها</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {studentDetail.stats.map((stat, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
                          <div className="text-xl mb-1">{getActionIcon(stat.action)}</div>
                          <p className="text-white text-sm">{stat.actionName}</p>
                          <p className="text-yellow-400 text-xs">{stat.count} بار • {stat.totalXp} XP</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="text-4xl mb-4">❌</div>
                <p className="text-slate-400">خطا در بارگذاری اطلاعات</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
