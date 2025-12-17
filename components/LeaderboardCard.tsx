import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Crown, Medal, Trophy } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  student_id: string
  full_name: string
  avatar_url: string | null
  total_xp: number
  level: number
}

interface LeaderboardCardProps {
  entry: LeaderboardEntry
  isCurrentUser?: boolean
}

export default function LeaderboardCard({ entry, isCurrentUser = false }: LeaderboardCardProps) {
  // آیکون رتبه
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />
      default:
        return null
    }
  }

  // رنگ بر اساس رتبه
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300'
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300'
      default:
        return isCurrentUser ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
    }
  }

  // حرف اول نام برای avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card
      className={`relative p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${getRankColor(entry.rank)} ${
        isCurrentUser ? 'ring-4 ring-blue-500 shadow-blue-200' : ''
      } border-2`}
    >
      {/* شماره رتبه در گوشه */}
      <div className="absolute -top-3 -right-3 z-10">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
          entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
          entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
          entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
          'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}>
          <span className="text-xl font-black text-white">#{entry.rank}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* آیکون رتبه بزرگ */}
        <div className="flex items-center justify-center">
          {getRankIcon(entry.rank) || (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-2xl font-black text-gray-700">
                {entry.rank}
              </span>
            </div>
          )}
        </div>

        {/* آواتار با Border رنگی */}
        <Avatar className={`h-16 w-16 border-4 shadow-xl ${
          entry.rank === 1 ? 'border-yellow-400' :
          entry.rank === 2 ? 'border-gray-400' :
          entry.rank === 3 ? 'border-orange-500' :
          isCurrentUser ? 'border-blue-500' : 'border-white'
        }`}>
          <AvatarImage src={entry.avatar_url || undefined} alt={entry.full_name} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-black text-lg">
            {getInitials(entry.full_name)}
          </AvatarFallback>
        </Avatar>

        {/* اطلاعات */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-black text-xl text-gray-800 truncate">
              {entry.full_name}
            </h3>
            {isCurrentUser && (
              <span className="px-3 py-1 text-xs font-black bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg animate-pulse">
                ⭐ شما
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full font-bold">
              <Trophy className="h-4 w-4" />
              Level {entry.level}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full font-bold">
              ⚡ {entry.total_xp.toLocaleString('fa-IR')} XP
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

