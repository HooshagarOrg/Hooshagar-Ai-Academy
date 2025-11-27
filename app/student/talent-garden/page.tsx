'use client'

import { useState, useEffect } from 'react'

// Hardcoded student ID for testing
const STUDENT_ID = '855b70c4-f6c5-4208-a1ab-93122025c0d1'

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
  badges: Badge[]
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

  // For testing: directly set hardcoded student ID
  useEffect(() => {
    setStudentId(STUDENT_ID)
  }, [])

  // Fetch profile and leaderboard when studentId is available
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
        } else {
          setError(profileData.error || 'خطا در دریافت پروفایل')
        }

        if (leaderboardRes.ok && leaderboardData.success) {
          setLeaderboard(leaderboardData.leaderboard)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('خطا در برقراری ارتباط با سرور')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [studentId])

  // Format date to relative time
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

  // Get level color gradient
  const getLevelColor = (level: number) => {
    if (level <= 1) return 'from-gray-400 to-gray-500'
    if (level <= 2) return 'from-green-400 to-green-600'
    if (level <= 3) return 'from-blue-400 to-blue-600'
    if (level <= 4) return 'from-purple-400 to-purple-600'
    if (level <= 5) return 'from-yellow-400 to-yellow-600'
    return 'from-yellow-400 to-orange-500'
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-red-500/50 max-w-md text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-white mb-2">خطا</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 mb-2">
            🏆 باغ استعداد
          </h1>
          <p className="text-purple-200 text-lg">امتیاز جمع کن، سطح بالا ببر، نشان بگیر!</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${getLevelColor(profile?.xp.level || 1)} flex items-center justify-center shadow-lg ring-4 ring-yellow-400/50`}>
                <span className="text-5xl">🎓</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                Lv.{profile?.xp.level || 1}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile?.student.name || 'دانش‌آموز'}
              </h2>
              <p className="text-yellow-400 font-semibold text-lg mb-1">
                {profile?.xp.levelTitle || 'تازه‌کار'}
              </p>
              <p className="text-white/60 text-sm mb-3">
                پایه {profile?.student.grade || '-'} • رتبه #{profile?.xp.rank || '-'}
              </p>

              {/* XP Progress Bar */}
              <div className="max-w-md">
                <div className="flex justify-between text-sm text-white/70 mb-1">
                  <span>{profile?.xp.total || 0} XP</span>
                  <span>{profile?.xp.xpForNextLevel || 100} XP تا سطح بعد</span>
                </div>
                <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${profile?.xp.progressPercent || 0}%` }}
                  />
                </div>
                <p className="text-white/50 text-xs mt-1 text-left">
                  {profile?.xp.progressPercent || 0}% پیشرفت
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
                {(profile?.badges || []).map((badge, i) => (
                  <div
                    key={i}
                    className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1 text-white hover:bg-white/30 transition-all cursor-default"
                    title={badge.description}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.name}</span>
                  </div>
                ))}
                {(profile?.badges?.length || 0) === 0 && (
                  <span className="text-white/50 text-sm">هنوز نشانی کسب نکردی! 🎯</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'کل امتیاز', value: profile?.xp.total || 0, icon: '⭐', color: 'from-yellow-500 to-orange-500' },
            { label: 'سطح فعلی', value: profile?.xp.level || 1, icon: '🏅', color: 'from-blue-500 to-purple-500' },
            { label: 'رتبه', value: `#${profile?.xp.rank || '-'}`, icon: '🏆', color: 'from-green-500 to-teal-500' },
            { label: 'تعداد فعالیت', value: profile?.stats?.reduce((a, s) => a + s.count, 0) || 0, icon: '📊', color: 'from-pink-500 to-rose-500' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 hover:scale-105 transition-transform"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="text-white/60 text-sm">{stat.label}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Leaderboard - Top 10 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              برترین‌های مدرسه
            </h3>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-white/50 text-center py-4">هنوز کسی در لیدربورد نیست!</p>
              ) : (
                leaderboard.map((item, i) => (
                  <div
                    key={item.studentId}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      item.studentId === studentId
                        ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900' :
                      i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                      i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900' :
                      'bg-white/20 text-white'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : item.rank}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-white font-semibold">
                        {item.studentName}
                        {item.studentId === studentId && (
                          <span className="text-yellow-400 text-xs mr-2">(شما)</span>
                        )}
                      </p>
                      <p className="text-white/60 text-sm">{item.levelTitle}</p>
                    </div>

                    {/* XP */}
                    <div className="text-left">
                      <p className="text-yellow-400 font-bold">{item.totalXp} XP</p>
                      <p className="text-white/60 text-xs">Lv.{item.level}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📜</span>
              فعالیت‌های اخیر من
            </h3>
            <div className="space-y-3">
              {(profile?.recentTransactions || []).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🚀</div>
                  <p className="text-white/50">هنوز فعالیتی ثبت نشده!</p>
                  <p className="text-white/30 text-sm mt-1">با استفاده از ابزارهای هوشگر امتیاز کسب کن</p>
                </div>
              ) : (
                (profile?.recentTransactions || []).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-xl">{getActionIcon(tx.actionType)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{tx.actionName}</p>
                      <p className="text-white/50 text-xs">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-green-400 font-bold">+{tx.xpEarned} XP</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        {profile?.stats && profile.stats.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              آمار فعالیت‌ها
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.stats.map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-all">
                  <div className="text-3xl mb-2">{getActionIcon(stat.action)}</div>
                  <p className="text-white font-semibold">{stat.actionName}</p>
                  <p className="text-yellow-400">{stat.count} بار</p>
                  <p className="text-white/50 text-sm">{stat.totalXp} XP</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-white/40 text-sm">
          باغ استعداد - سیستم گیمیفیکیشن هوشگر
        </div>
      </div>
    </div>
  )
}
