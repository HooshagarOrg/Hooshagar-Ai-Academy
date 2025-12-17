'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import XPCard from '@/components/XPCard'
import XPHistory from '@/components/XPHistory'
import { RefreshCw } from 'lucide-react'

export default function XPDashboardPage() {
  const [studentId, setStudentId] = useState<string | null>(null)
  const [xpData, setXpData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStudentAndXP()
  }, [])

  const loadStudentAndXP = async () => {
    try {
      setLoading(true)
      setError(null)

      // دریافت اطلاعات دانش‌آموز
      const authResponse = await fetch('/api/auth/me')
      if (!authResponse.ok) {
        throw new Error('Failed to load student info')
      }

      const authData = await authResponse.json()
      const sid = authData.student?.id

      if (!sid) {
        throw new Error('Student ID not found')
      }

      setStudentId(sid)

      // دریافت موجودی XP
      const xpResponse = await fetch(`/api/xp/balance?studentId=${sid}`)
      if (!xpResponse.ok) {
        throw new Error('Failed to load XP balance')
      }

      const xpBalance = await xpResponse.json()
      setXpData(xpBalance)
    } catch (err) {
      console.error('❌ Error loading XP dashboard:', err)
      setError('خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !studentId || !xpData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500 text-center">
              {error || 'خطا در بارگذاری اطلاعات'}
            </p>
            <Button onClick={loadStudentAndXP} className="mt-4 mx-auto block">
              <RefreshCw className="w-4 h-4 ml-2" />
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header حرفه‌ای */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  💎
                </div>
                داشبورد امتیازات
              </h1>
              <p className="text-white/90 text-lg">پیشرفت خود را دنبال کن!</p>
            </div>
            <Button 
              onClick={loadStudentAndXP} 
              className="bg-white text-purple-600 hover:bg-white/90 font-bold shadow-lg"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              بروزرسانی
            </Button>
          </div>
        </div>

      {/* Grid Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* XP Card */}
        <XPCard
          totalXp={xpData.total_xp}
          level={xpData.level}
          xpToNextLevel={xpData.xp_to_next_level}
          percentage={xpData.percentage}
        />

        {/* XP History */}
        <XPHistory studentId={studentId} limit={10} />
      </div>

        {/* Info Cards با انیمیشن */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-400 to-emerald-600 text-white transform hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                🎯 راه‌های کسب XP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base font-medium">
              <p className="flex items-center gap-2">✅ حل تکالیف</p>
              <p className="flex items-center gap-2">📝 شرکت در آزمون‌ها</p>
              <p className="flex items-center gap-2">📚 حضور در کلاس</p>
              <p className="flex items-center gap-2">🏆 دریافت نشان‌ها</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-400 to-red-600 text-white transform hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                ⭐ مزایای XP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-base font-medium">
              <p className="flex items-center gap-2">🔓 باز کردن نشان‌ها</p>
              <p className="flex items-center gap-2">📊 بالا رفتن رتبه</p>
              <p className="flex items-center gap-2">🎁 دریافت جوایز</p>
              <p className="flex items-center gap-2">💪 افزایش سطح</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white transform hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                🏆 سطح شما
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-5xl font-black">{xpData.level}</p>
              <p className="text-2xl font-bold">
                {xpData.level < 5 && '🌱 تازه‌کار'}
                {xpData.level >= 5 && xpData.level < 10 && '⭐ درحال پیشرفت'}
                {xpData.level >= 10 && xpData.level < 20 && '🔥 ماهر'}
                {xpData.level >= 20 && '👑 استاد'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

