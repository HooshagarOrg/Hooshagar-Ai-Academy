'use client'

import { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'

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

export default function TalentGardenPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addingXP, setAddingXP] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([])
  const [noStudents, setNoStudents] = useState(false)

  // Fetch students list
  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => {
        if (data.students && data.students.length > 0) {
          setStudents(data.students)
          setSelectedStudent(data.students[0].id)
          setNoStudents(false)
        } else {
          setNoStudents(true)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('Error fetching students:', err)
        setNoStudents(true)
        setLoading(false)
      })
  }, [])

  // Fetch profile and leaderboard
  const fetchData = async () => {
    if (!selectedStudent) return
    
    setLoading(true)
    try {
      const [profileRes, leaderboardRes] = await Promise.all([
        fetch(`/api/xp/profile?studentId=${selectedStudent}`),
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
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedStudent) {
      fetchData()
    }
  }, [selectedStudent])

  // Add XP handler
  const handleAddXP = async (actionType: string, xpAmount?: number) => {
    if (!selectedStudent) {
      toast.error('ابتدا یک دانش‌آموز از لیست انتخاب کنید یا دانش‌آموز جدید اضافه کنید')
      return
    }

    setAddingXP(true)
    console.log('🎮 Adding XP:', { studentId: selectedStudent, actionType, xpAmount })
    
    try {
      const response = await fetch('/api/xp/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          actionType,
          xpAmount,
        })
      })

      const result = await response.json()
      console.log('📊 API Response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'خطا در افزودن امتیاز')
      }

      toast.success(result.message, { icon: '🎉' })

      if (result.levelUp) {
        setShowLevelUp(true)
        toast.success(result.levelUpMessage, {
          icon: '🏆',
          duration: 5000,
        })
        setTimeout(() => setShowLevelUp(false), 3000)
      }

      // Refresh data
      fetchData()
    } catch (error: any) {
      console.error('❌ XP Error:', error)
      toast.error(error.message || 'خطای غیرمنتظره')
    } finally {
      setAddingXP(false)
    }
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

  // Get level color
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

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4 md:p-8" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-3xl shadow-2xl animate-bounce-slow text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">سطح بالا رفت!</h2>
            <p className="text-white/90 text-xl">تبریک! به سطح جدید رسیدی!</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 mb-2">
            🏆 باغ استعداد
          </h1>
          <p className="text-purple-200 text-lg">امتیاز جمع کن، سطح بالا ببر، نشان بگیر!</p>
        </div>

        {/* Student Selector */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20">
          <label className="text-white/80 text-sm mb-2 block">انتخاب دانش‌آموز:</label>
          {noStudents ? (
            <div className="text-yellow-400 text-sm">
              ⚠️ هیچ دانش‌آموزی یافت نشد! 
              <a href="/test-students-list" className="underline mr-2 hover:text-yellow-300">
                اول یک دانش‌آموز اضافه کنید
              </a>
            </div>
          ) : (
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full md:w-64 px-4 py-2 rounded-xl bg-white/20 text-white border border-white/30 focus:border-yellow-400 focus:outline-none"
            >
              {students.map(s => (
                <option key={s.id} value={s.id} className="text-gray-800">{s.full_name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${getLevelColor(profile?.xp.level || 1)} flex items-center justify-center shadow-lg ring-4 ring-yellow-400/50`}>
                <span className="text-5xl">👤</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                Lv.{profile?.xp.level || 1}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile?.student.name || 'در حال بارگذاری...'}
              </h2>
              <p className="text-yellow-400 font-semibold text-lg mb-3">
                {profile?.xp.levelTitle || 'تازه‌کار'}
              </p>
              
              {/* XP Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-white/70 mb-1">
                  <span>{profile?.xp.total || 0} XP</span>
                  <span>{profile?.xp.xpForNextLevel || 100} XP تا سطح بعد</span>
                </div>
                <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${profile?.xp.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {(profile?.badges || []).slice(0, 5).map((badge, i) => (
                  <div 
                    key={i}
                    className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1 text-white"
                    title={badge.description}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.name}</span>
                  </div>
                ))}
                {(profile?.badges?.length || 0) === 0 && (
                  <span className="text-white/50 text-sm">هنوز نشانی کسب نکردی!</span>
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
          {/* Leaderboard */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              برترین‌ها
            </h3>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-white/50 text-center py-4">هنوز کسی در لیدربورد نیست!</p>
              ) : (
                leaderboard.map((item, i) => (
                  <div 
                    key={item.studentId}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      item.studentId === selectedStudent 
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
                      <p className="text-white font-semibold">{item.studentName}</p>
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
              فعالیت‌های اخیر
            </h3>
            <div className="space-y-3">
              {(profile?.recentTransactions || []).length === 0 ? (
                <p className="text-white/50 text-center py-4">هنوز فعالیتی ثبت نشده!</p>
              ) : (
                (profile?.recentTransactions || []).slice(0, 5).map((tx, i) => (
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

        {/* Test Buttons */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            دکمه‌های تست
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAddXP('ocr', 10)}
              disabled={addingXP || !selectedStudent}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>🔍</span>
              حل مسئله (+10 XP)
            </button>
            <button
              onClick={() => handleAddXP('study_buddy', 15)}
              disabled={addingXP || !selectedStudent}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>📚</span>
              پرسش (+15 XP)
            </button>
            <button
              onClick={() => handleAddXP('story', 20)}
              disabled={addingXP || !selectedStudent}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>✨</span>
              داستان (+20 XP)
            </button>
            <button
              onClick={() => handleAddXP('daily_login', 5)}
              disabled={addingXP || !selectedStudent}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>🌟</span>
              ورود روزانه (+5 XP)
            </button>
            <button
              onClick={fetchData}
              disabled={loading || !selectedStudent}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              بارگذاری مجدد
            </button>
          </div>
        </div>

        {/* Activity Stats */}
        {profile?.stats && profile.stats.length > 0 && (
          <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              آمار فعالیت‌ها
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.stats.map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
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

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

