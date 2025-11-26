'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface StudentXP {
  total: number
  level: number
  levelTitle: string
  rank: number
  xpInCurrentLevel: number
  xpForNextLevel: number
  progressPercent: number
  thresholds: { current: number; next: number }
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
}

interface Transaction {
  id: string
  actionType: string
  actionName: string
  xpEarned: number
  createdAt: string
}

interface LeaderboardItem {
  rank: number
  studentId: string
  studentName: string
  totalXp: number
  level: number
  levelTitle: string
}

interface Profile {
  student: { id: string; name: string; grade: number }
  xp: StudentXP
  badges: Badge[]
  recentTransactions: Transaction[]
  stats: { action: string; actionName: string; count: number; totalXp: number }[]
}

export default function StudentTalentGardenPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Get logged-in student
  useEffect(() => {
    const getStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get student record linked to this user
      const { data: student, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (error || !student) {
        setError('پروفایل دانش‌آموز یافت نشد')
        setLoading(false)
        return
      }

      setStudentId(student.id)
    }

    getStudent()
  }, [supabase, router])

  // Fetch profile and leaderboard
  useEffect(() => {
    if (!studentId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [profileRes, leaderboardRes] = await Promise.all([
          fetch(`/api/xp/profile?studentId=${studentId}`),
          fetch('/api/xp/leaderboard?limit=10')
        ])

        const profileData = await profileRes.json()
        const leaderboardData = await leaderboardRes.json()

        if (profileRes.ok && profileData.success) {
          setProfile(profileData)
        }

        if (leaderboardRes.ok && leaderboardData.success) {
          setLeaderboard(leaderboardData.leaderboard)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [studentId])

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

  // Get level color
  const getLevelColor = (level: number) => {
    if (level <= 1) return 'from-slate-400 to-slate-500'
    if (level <= 2) return 'from-emerald-400 to-emerald-600'
    if (level <= 3) return 'from-sky-400 to-sky-600'
    if (level <= 4) return 'from-violet-400 to-violet-600'
    if (level <= 5) return 'from-amber-400 to-amber-600'
    return 'from-amber-400 to-orange-500'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center bg-red-500/20 border border-red-500/50 rounded-2xl p-8">
          <p className="text-red-400 text-xl mb-4">❌ {error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            بازگشت به ورود
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 mb-2">
            🏆 باغ استعداد من
          </h1>
          <p className="text-slate-400">امتیازات و پیشرفت تحصیلی</p>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 mb-6 border border-slate-700">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar & Level */}
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getLevelColor(profile?.xp.level || 1)} flex items-center justify-center shadow-xl ring-4 ring-amber-400/30`}>
                <span className="text-4xl">🎓</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                سطح {profile?.xp.level || 1}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile?.student.name || 'دانش‌آموز'}
              </h2>
              <p className="text-amber-400 font-medium mb-1">
                {profile?.xp.levelTitle || 'تازه‌کار'}
              </p>
              <p className="text-slate-400 text-sm mb-4">
                پایه {profile?.student.grade || '-'} • رتبه #{profile?.xp.rank || '-'}
              </p>
              
              {/* XP Progress */}
              <div className="max-w-md">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>{profile?.xp.total || 0} امتیاز</span>
                  <span>{profile?.xp.xpForNextLevel || 100} امتیاز تا سطح بعد</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                    style={{ width: `${profile?.xp.progressPercent || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 md:flex-col">
              <div className="text-center bg-slate-700/50 rounded-xl p-3 min-w-[80px]">
                <p className="text-2xl font-bold text-amber-400">{profile?.xp.total || 0}</p>
                <p className="text-xs text-slate-400">امتیاز</p>
              </div>
              <div className="text-center bg-slate-700/50 rounded-xl p-3 min-w-[80px]">
                <p className="text-2xl font-bold text-sky-400">#{profile?.xp.rank || '-'}</p>
                <p className="text-xs text-slate-400">رتبه</p>
              </div>
            </div>
          </div>

          {/* Badges */}
          {profile?.badges && profile.badges.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm text-slate-400 mb-3">نشان‌های کسب شده:</h3>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((badge, i) => (
                  <div 
                    key={i}
                    className="bg-slate-700/50 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 text-white border border-slate-600"
                    title={badge.description}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🏆</span>
              برترین‌های مدرسه
            </h3>
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-slate-500 text-center py-8">لیدربورد خالی است</p>
              ) : (
                leaderboard.map((item, i) => (
                  <div 
                    key={item.studentId}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      item.studentId === studentId 
                        ? 'bg-amber-500/20 border border-amber-500/30' 
                        : 'bg-slate-700/30 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? 'bg-amber-500 text-amber-900' :
                      i === 1 ? 'bg-slate-300 text-slate-700' :
                      i === 2 ? 'bg-orange-500 text-orange-900' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : item.rank}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${item.studentId === studentId ? 'text-amber-300' : 'text-white'}`}>
                        {item.studentName}
                        {item.studentId === studentId && <span className="text-xs mr-2">(شما)</span>}
                      </p>
                      <p className="text-slate-500 text-xs">{item.levelTitle}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-amber-400 font-semibold text-sm">{item.totalXp}</p>
                      <p className="text-slate-500 text-xs">Lv.{item.level}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📋</span>
              فعالیت‌های اخیر
            </h3>
            <div className="space-y-2">
              {(profile?.recentTransactions || []).length === 0 ? (
                <p className="text-slate-500 text-center py-8">هنوز فعالیتی نداشتی!</p>
              ) : (
                (profile?.recentTransactions || []).map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <span>{getActionIcon(tx.actionType)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{tx.actionName}</p>
                      <p className="text-slate-500 text-xs">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-emerald-400 font-semibold text-sm">+{tx.xpEarned}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        {profile?.stats && profile.stats.length > 0 && (
          <div className="mt-6 bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📊</span>
              آمار فعالیت‌ها
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.stats.map((stat, i) => (
                <div key={i} className="bg-slate-700/30 rounded-xl p-4 text-center hover:bg-slate-700/50 transition-all">
                  <div className="text-2xl mb-2">{getActionIcon(stat.action)}</div>
                  <p className="text-white text-sm font-medium">{stat.actionName}</p>
                  <p className="text-amber-400 font-bold">{stat.count} بار</p>
                  <p className="text-slate-500 text-xs">{stat.totalXp} امتیاز</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

