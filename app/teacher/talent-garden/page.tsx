'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface StudentWithXP {
  id: string
  full_name: string
  grade: number
  totalXp: number
  level: number
  levelTitle: string
  badges: string[]
  lastActivity: string | null
}

interface StudentDetail {
  student: { id: string; name: string; grade: number }
  xp: {
    total: number
    level: number
    levelTitle: string
    rank: number
    progressPercent: number
  }
  badges: { id: string; name: string; icon: string }[]
  recentTransactions: {
    id: string
    actionType: string
    actionName: string
    xpEarned: number
    createdAt: string
  }[]
  stats: { action: string; actionName: string; count: number; totalXp: number }[]
}

type SortField = 'xp' | 'level' | 'name' | 'grade'
type SortOrder = 'asc' | 'desc'

export default function TeacherTalentGardenPage() {
  const [students, setStudents] = useState<StudentWithXP[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | null>(null)
  const [sortField, setSortField] = useState<SortField>('xp')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Verify teacher role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [supabase, router])

  // Fetch all students with XP data
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      try {
        // Get all students
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, full_name, grade')
          .order('full_name')

        if (studentsError) throw studentsError

        // Get XP data for all students
        const { data: xpData, error: xpError } = await supabase
          .from('student_xp')
          .select('student_id, total_xp, level, badges')

        if (xpError) throw xpError

        // Get latest transaction for each student
        const { data: latestTx } = await supabase
          .from('xp_transactions')
          .select('student_id, created_at')
          .order('created_at', { ascending: false })

        // Create XP lookup
        const xpLookup = new Map(xpData?.map(x => [x.student_id, x]) || [])
        const txLookup = new Map<string, string>()
        latestTx?.forEach(tx => {
          if (!txLookup.has(tx.student_id)) {
            txLookup.set(tx.student_id, tx.created_at)
          }
        })

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

        // Merge data
        const mergedStudents: StudentWithXP[] = (studentsData || []).map(s => {
          const xp = xpLookup.get(s.id)
          return {
            id: s.id,
            full_name: s.full_name,
            grade: s.grade,
            totalXp: xp?.total_xp || 0,
            level: xp?.level || 1,
            levelTitle: getLevelTitle(xp?.level || 1),
            badges: xp?.badges || [],
            lastActivity: txLookup.get(s.id) || null,
          }
        })

        setStudents(mergedStudents)
      } catch (err) {
        console.error('Error fetching students:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [supabase])

  // Fetch student detail
  const fetchStudentDetail = async (studentId: string) => {
    setDetailLoading(true)
    try {
      const response = await fetch(`/api/xp/profile?studentId=${studentId}`)
      const data = await response.json()
      if (response.ok && data.success) {
        setStudentDetail(data)
      }
    } catch (err) {
      console.error('Error fetching detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetail(selectedStudent)
    } else {
      setStudentDetail(null)
    }
  }, [selectedStudent])

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let result = [...students]

    // Search filter
    if (searchQuery) {
      result = result.filter(s => 
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Level filter
    if (levelFilter !== null) {
      result = result.filter(s => s.level === levelFilter)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'xp':
          comparison = a.totalXp - b.totalXp
          break
        case 'level':
          comparison = a.level - b.level
          break
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name, 'fa')
          break
        case 'grade':
          comparison = a.grade - b.grade
          break
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return result
  }, [students, searchQuery, levelFilter, sortField, sortOrder])

  // Get unique levels for filter
  const uniqueLevels = useMemo(() => {
    const levels = new Set(students.map(s => s.level))
    return Array.from(levels).sort((a, b) => a - b)
  }, [students])

  // Stats
  const stats = useMemo(() => ({
    totalStudents: students.length,
    activeStudents: students.filter(s => s.totalXp > 0).length,
    totalXP: students.reduce((sum, s) => sum + s.totalXp, 0),
    avgXP: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.totalXp, 0) / students.length) : 0,
  }), [students])

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'امروز'
    if (days === 1) return 'دیروز'
    if (days < 7) return `${days} روز پیش`
    return date.toLocaleDateString('fa-IR')
  }

  // Get level color
  const getLevelColor = (level: number) => {
    if (level <= 1) return 'bg-slate-500'
    if (level <= 2) return 'bg-emerald-500'
    if (level <= 3) return 'bg-sky-500'
    if (level <= 4) return 'bg-violet-500'
    if (level <= 5) return 'bg-amber-500'
    return 'bg-orange-500'
  }

  // Get action icon
  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      'ocr': '🔍', 'study_buddy': '📚', 'story': '✨',
      'daily_login': '🌟', 'analysis': '📊', 'quiz_complete': '🏆', 'homework_submit': '📝',
    }
    return icons[action] || '⭐'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              🏆 مدیریت باغ استعداد
            </h1>
            <p className="text-slate-400 text-sm">نمای کلی امتیازات و پیشرفت دانش‌آموزان</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm flex items-center gap-2"
            >
              <span>🔄</span> بروزرسانی
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'کل دانش‌آموزان', value: stats.totalStudents, icon: '👨‍🎓', color: 'from-sky-500 to-sky-600' },
            { label: 'دانش‌آموزان فعال', value: stats.activeStudents, icon: '⚡', color: 'from-emerald-500 to-emerald-600' },
            { label: 'مجموع امتیازات', value: stats.totalXP.toLocaleString('fa-IR'), icon: '⭐', color: 'from-amber-500 to-amber-600' },
            { label: 'میانگین امتیاز', value: stats.avgXP.toLocaleString('fa-IR'), icon: '📊', color: 'from-violet-500 to-violet-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <p className="text-slate-400 text-xs">{stat.label}</p>
              <p className="text-white text-xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Students List */}
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700">
            {/* Filters */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="🔍 جستجوی نام دانش‌آموز..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-sky-500 focus:outline-none text-sm"
                  />
                </div>
                
                {/* Level Filter */}
                <select
                  value={levelFilter ?? ''}
                  onChange={(e) => setLevelFilter(e.target.value ? Number(e.target.value) : null)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-sky-500 focus:outline-none text-sm"
                >
                  <option value="">همه سطوح</option>
                  {uniqueLevels.map(level => (
                    <option key={level} value={level}>سطح {level}</option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-') as [SortField, SortOrder]
                    setSortField(field)
                    setSortOrder(order)
                  }}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-sky-500 focus:outline-none text-sm"
                >
                  <option value="xp-desc">بیشترین امتیاز</option>
                  <option value="xp-asc">کمترین امتیاز</option>
                  <option value="level-desc">بالاترین سطح</option>
                  <option value="level-asc">پایین‌ترین سطح</option>
                  <option value="name-asc">نام (الف-ی)</option>
                  <option value="name-desc">نام (ی-الف)</option>
                  <option value="grade-asc">پایه (صعودی)</option>
                  <option value="grade-desc">پایه (نزولی)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 text-slate-400 text-xs">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium">رتبه</th>
                    <th className="text-right px-4 py-3 font-medium">دانش‌آموز</th>
                    <th className="text-center px-4 py-3 font-medium">پایه</th>
                    <th className="text-center px-4 py-3 font-medium">سطح</th>
                    <th className="text-center px-4 py-3 font-medium">امتیاز</th>
                    <th className="text-center px-4 py-3 font-medium">آخرین فعالیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        دانش‌آموزی یافت نشد
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <tr 
                        key={student.id}
                        onClick={() => setSelectedStudent(student.id)}
                        className={`cursor-pointer transition-all ${
                          selectedStudent === student.id 
                            ? 'bg-sky-500/20' 
                            : 'hover:bg-slate-700/50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            index === 0 ? 'bg-amber-500 text-amber-900' :
                            index === 1 ? 'bg-slate-300 text-slate-700' :
                            index === 2 ? 'bg-orange-500 text-orange-900' :
                            'bg-slate-600 text-slate-300'
                          }`}>
                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${getLevelColor(student.level)} flex items-center justify-center text-white text-xs font-bold`}>
                              {student.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{student.full_name}</p>
                              <p className="text-slate-500 text-xs">{student.levelTitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-300 text-sm">{student.grade}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(student.level)} text-white`}>
                            {student.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-amber-400 font-semibold text-sm">{student.totalXp.toLocaleString('fa-IR')}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-400 text-xs">{formatDate(student.lastActivity)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 text-slate-400 text-sm">
              نمایش {filteredStudents.length} از {students.length} دانش‌آموز
            </div>
          </div>

          {/* Detail Panel */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 h-fit">
            {!selectedStudent ? (
              <div className="p-8 text-center text-slate-500">
                <div className="text-4xl mb-3">👈</div>
                <p>یک دانش‌آموز را انتخاب کنید</p>
              </div>
            ) : detailLoading ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-400 text-sm">در حال بارگذاری...</p>
              </div>
            ) : studentDetail ? (
              <div>
                {/* Profile Header */}
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${getLevelColor(studentDetail.xp.level)} flex items-center justify-center text-white font-bold`}>
                      {studentDetail.student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold">{studentDetail.student.name}</h3>
                      <p className="text-amber-400 text-sm">{studentDetail.xp.levelTitle}</p>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-700">
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-amber-400 text-xl font-bold">{studentDetail.xp.total}</p>
                    <p className="text-slate-400 text-xs">امتیاز کل</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-sky-400 text-xl font-bold">#{studentDetail.xp.rank}</p>
                    <p className="text-slate-400 text-xs">رتبه</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-violet-400 text-xl font-bold">{studentDetail.xp.level}</p>
                    <p className="text-slate-400 text-xs">سطح</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-emerald-400 text-xl font-bold">{studentDetail.badges.length}</p>
                    <p className="text-slate-400 text-xs">نشان</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="p-4 border-b border-slate-700">
                  <p className="text-slate-400 text-xs mb-2">پیشرفت به سطح بعد</p>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      style={{ width: `${studentDetail.xp.progressPercent}%` }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-1 text-left">{studentDetail.xp.progressPercent}%</p>
                </div>

                {/* Badges */}
                {studentDetail.badges.length > 0 && (
                  <div className="p-4 border-b border-slate-700">
                    <p className="text-slate-400 text-xs mb-2">نشان‌ها</p>
                    <div className="flex flex-wrap gap-1">
                      {studentDetail.badges.map((badge, i) => (
                        <span key={i} className="bg-slate-700 px-2 py-1 rounded text-xs text-white">
                          {badge.icon} {badge.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="p-4">
                  <p className="text-slate-400 text-xs mb-2">فعالیت‌های اخیر</p>
                  <div className="space-y-2">
                    {studentDetail.recentTransactions.slice(0, 5).map(tx => (
                      <div key={tx.id} className="flex items-center gap-2 text-sm">
                        <span>{getActionIcon(tx.actionType)}</span>
                        <span className="text-white flex-1">{tx.actionName}</span>
                        <span className="text-emerald-400 text-xs">+{tx.xpEarned}</span>
                      </div>
                    ))}
                    {studentDetail.recentTransactions.length === 0 && (
                      <p className="text-slate-500 text-xs">فعالیتی ثبت نشده</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>خطا در بارگذاری</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

