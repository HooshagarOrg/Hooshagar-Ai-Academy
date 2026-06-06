'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award, TrendingUp, Star } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'

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
      <DashboardPage className="max-w-4xl mx-auto" title="جدول افتخارات" animatedSections={false}>
        <div className="flex items-center justify-center py-20 text-muted-foreground text-xl">
          در حال بارگذاری...
        </div>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      className="max-w-4xl mx-auto"
      title="🏆 جدول افتخارات"
      description="برترین دانش‌آموزان باغ استعداد"
      meta={
        <div className="p-3 rounded-full glass-panel-quiet inline-flex">
          <Trophy className="w-10 h-10 text-brand-yellow" />
        </div>
      }
      animatedSections={false}
    >
        {currentUserRank && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-brand-green" />
                <span className="font-bold">رتبه شما:</span>
              </div>
              <span className="text-2xl font-black text-brand-yellow">
                #{currentUserRank}
              </span>
            </div>
          </GlassCard>
        )}

      <div className="space-y-3">
        {leaderboard.length === 0 ? (
          <div className="text-center text-white text-xl py-12">
            هنوز هیچ رکوردی ثبت نشده است
          </div>
        ) : (
          leaderboard.map((entry) => (
            <GlassCard
              key={entry.student_id}
              className={`p-5 transition-all duration-300 hover:scale-[1.01] ${
                entry.rank <= 3 ? 'ring-2 ring-brand-yellow/50' : ''
              }`}
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
            </GlassCard>
          ))
        )}
      </div>

      <p className="text-center text-muted-foreground text-sm mt-8">
        ✨ با انجام تکالیف و فعالیت‌ها امتیاز بگیر و در جدول افتخارات بالاتر برو!
      </p>
    </DashboardPage>
  )
}

