/**
 * LeaderboardCard Component
 * 
 * نمایش لیدربورد برترین‌ها
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface LeaderboardEntry {
  rank: number
  user_id: string
  full_name: string
  avatar_url: string | null
  xp: number
  level: number
  current_streak: number
  is_current_user: boolean
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  user_rank: number | null
  pagination: {
    limit: number
    offset: number
    has_more: boolean
  }
}

export default function LeaderboardCard() {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/leaderboard?limit=10')
      
      if (!res.ok) {
        throw new Error('خطا در دریافت لیدربورد')
      }
      
      const result = await res.json()
      setData(result)
      setError(null)
    } catch (err) {
      console.error('خطا در دریافت لیدربورد:', err)
      setError('خطا در بارگذاری لیدربورد')
    } finally {
      setLoading(false)
    }
  }

  const getRankEmoji = (rank: number): string => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `${rank}`
  }

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50'
    if (rank === 2) return 'text-gray-600 bg-gray-50'
    if (rank === 3) return 'text-orange-600 bg-orange-50'
    return 'text-gray-500 bg-gray-50'
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-center text-red-600">{error || 'خطا در بارگذاری'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold">🏆 لیدربورد برترین‌ها</span>
          {data.user_rank && data.user_rank > 10 && (
            <span className="text-sm text-gray-600">
              رتبه شما: {data.user_rank.toLocaleString('fa-IR')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.leaderboard.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                entry.is_current_user
                  ? 'bg-purple-50 border-2 border-purple-300 shadow-md'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Rank */}
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${getRankColor(
                  entry.rank
                )}`}
              >
                {getRankEmoji(entry.rank)}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback>
                  {entry.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {entry.full_name}
                  {entry.is_current_user && (
                    <span className="mr-2 text-xs text-purple-600">(شما)</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  سطح {entry.level.toLocaleString('fa-IR')}
                  {entry.current_streak > 0 && (
                    <span className="mr-2">
                      🔥 {entry.current_streak.toLocaleString('fa-IR')}
                    </span>
                  )}
                </div>
              </div>

              {/* XP */}
              <div className="text-left">
                <div className="font-bold text-purple-600 text-lg">
                  {entry.xp.toLocaleString('fa-IR')}
                </div>
                <div className="text-xs text-gray-500">امتیاز</div>
              </div>
            </div>
          ))}
        </div>

        {data.pagination.has_more && (
          <div className="text-center mt-4">
            <button
              onClick={fetchLeaderboard}
              className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
            >
              مشاهده بیشتر ←
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

