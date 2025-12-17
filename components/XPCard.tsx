import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles, TrendingUp } from 'lucide-react'

interface XPCardProps {
  totalXp: number
  level: number
  xpToNextLevel: number
  percentage: number
}

export default function XPCard({ totalXp, level, xpToNextLevel, percentage }: XPCardProps) {
  const currentLevelXp = (level - 1) * 100
  const xpInCurrentLevel = totalXp - currentLevelXp
  const xpNeededForLevel = xpToNextLevel - currentLevelXp

  return (
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          امتیاز تجربه (XP)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 text-white font-bold text-lg">
              {level}
            </div>
            <div>
              <p className="text-sm text-gray-600">سطح فعلی</p>
              <p className="text-xs text-gray-500">Level {level}</p>
            </div>
          </div>
          
          <div className="text-left">
            <p className="text-2xl font-bold text-yellow-600">{totalXp.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500">امتیاز کل</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">تا سطح بعدی:</span>
            <span className="font-medium text-yellow-600">
              {xpInCurrentLevel.toLocaleString('fa-IR')} / {xpNeededForLevel.toLocaleString('fa-IR')} XP
            </span>
          </div>
          <Progress value={percentage} className="h-3" />
          <p className="text-xs text-center text-gray-500">
            {(xpNeededForLevel - xpInCurrentLevel).toLocaleString('fa-IR')} امتیاز تا سطح {level + 1}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg bg-white/50 p-3 text-center">
            <TrendingUp className="mx-auto h-5 w-5 text-green-500 mb-1" />
            <p className="text-xs text-gray-600">رتبه کلاس</p>
            <p className="text-lg font-bold text-gray-800">-</p>
          </div>
          <div className="rounded-lg bg-white/50 p-3 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-purple-500 mb-1" />
            <p className="text-xs text-gray-600">نشان‌ها</p>
            <p className="text-lg font-bold text-gray-800">-</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

