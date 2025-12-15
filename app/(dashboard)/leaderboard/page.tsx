'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award, TrendingUp, Star } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  student_id: string
  student_name: string
  xp_points: number
  level: number
  grade: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/xp/leaderboard?limit=20')
      const result = await response.json()

      if (result.success) {
        setLeaderboard(result.data.leaderboard)
        setCurrentUserRank(result.data.current_user_rank)
      }
    } catch (error) {
      console.error('خطا در دریافت رتبه‌بندی:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return <Trophy className="w-8 h-8 text-yellow-400" />
    if (rank === 2)
      return <Medal className="w-7 h-7 text-gray-400" />
    if (rank === 3)
      return <Award className="w-7 h-7 text-orange-400" />
    return <span className="text-2xl font-bold text-gray-400">#{rank}</span>
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600'
    return 'bg-gradient-to-r from-blue-400 to-purple-500'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">در حال بارگذاری...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
              <Trophy className="w-16 h-16 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            🏆 جدول افتخارات
          </h1>
          <p className="text-blue-200 text-lg">
            برترین دانش‌آموزان باغ استعداد
          </p>
        </div>

        {/* رتبه کاربر فعلی */}
        {currentUserRank && (
          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <span className="text-white font-bold">رتبه شما:</span>
              </div>
              <span className="text-2xl font-black text-yellow-400">
                #{currentUserRank}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard List */}
      <div className="max-w-4xl mx-auto space-y-3">
        {leaderboard.length === 0 ? (
          <div className="text-center text-white text-xl py-12">
            هنوز هیچ رکوردی ثبت نشده است
          </div>
        ) : (
          leaderboard.map((entry) => (
            <div
              key={entry.student_id}
              className={`
                bg-white/10 backdrop-blur-md rounded-2xl p-5 
                border border-white/20 
                hover:bg-white/15 transition-all duration-300
                hover:scale-[1.02] hover:shadow-2xl
                ${entry.rank <= 3 ? 'ring-2 ring-yellow-400/50' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                {/* رتبه و آیکون */}
                <div className="flex items-center gap-4">
                  <div className="w-16 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {entry.student_name}
                    </h3>
                    <p className="text-sm text-blue-200">
                      پایه {entry.grade} • سطح {entry.level}
                    </p>
                  </div>
                </div>

                {/* امتیاز */}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl font-black text-white">
                      {entry.xp_points.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200">امتیاز کل</p>
                </div>
              </div>

              {/* Progress Bar برای 3 نفر اول */}
              {entry.rank <= 3 && (
                <div className="mt-4">
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRankBadgeColor(entry.rank)} transition-all duration-1000`}
                      style={{
                        width: `${Math.min((entry.xp_points / (leaderboard[0]?.xp_points || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <p className="text-blue-200 text-sm">
          ✨ با انجام تکالیف و فعالیت‌ها امتیاز بگیر و در جدول افتخارات بالاتر برو!
        </p>
      </div>
    </div>
  )
}

