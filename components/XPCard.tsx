/**
 * XPCard Component
 * 
 * نمایش موجودی XP، Level، و پیشرفت به level بعدی
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface XPData {
  xp: number
  level: number
  coins: number
  current_streak: number
  longest_streak: number
  total_active_days: number
  xp_progress: {
    current: number
    needed: number
    total: number
    next_level: number
  }
}

export default function XPCard() {
  const [xpData, setXpData] = useState<XPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchXPData()
  }, [])

  const fetchXPData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/xp/balance')
      
      if (!res.ok) {
        throw new Error('خطا در دریافت اطلاعات')
      }
      
      const data = await res.json()
      setXpData(data)
      setError(null)
    } catch (err) {
      console.error('خطا در دریافت XP:', err)
      setError('خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !xpData) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-center text-red-600">{error || 'خطا در بارگذاری'}</p>
        </CardContent>
      </Card>
    )
  }

  const progressPercent = (xpData.xp_progress.current / xpData.xp_progress.needed) * 100

  return (
    <Card className="w-full bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold">🎯 امتیازات من</span>
          <span className="text-3xl font-bold text-purple-600">
            سطح {xpData.level}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {xpData.xp_progress.current.toLocaleString('fa-IR')} / {xpData.xp_progress.needed.toLocaleString('fa-IR')} XP
            </span>
            <span className="font-semibold text-purple-600">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-gray-500 text-center">
            {xpData.xp_progress.needed - xpData.xp_progress.current} XP تا سطح {xpData.level + 1}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {xpData.xp.toLocaleString('fa-IR')}
            </div>
            <div className="text-xs text-gray-600 mt-1">کل امتیاز</div>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {xpData.coins.toLocaleString('fa-IR')} 🪙
            </div>
            <div className="text-xs text-gray-600 mt-1">سکه</div>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {xpData.current_streak} 🔥
            </div>
            <div className="text-xs text-gray-600 mt-1">روز متوالی</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="flex justify-around text-center text-sm text-gray-600 pt-2 border-t">
          <div>
            <div className="font-semibold text-gray-800">
              {xpData.longest_streak}
            </div>
            <div className="text-xs">بیشترین استریک</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              {xpData.total_active_days}
            </div>
            <div className="text-xs">روز فعال</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

