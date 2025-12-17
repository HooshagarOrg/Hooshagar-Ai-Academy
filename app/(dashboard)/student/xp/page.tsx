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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">💎 داشبورد امتیازات</h1>
        <Button onClick={loadStudentAndXP} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 ml-2" />
          بروزرسانی
        </Button>
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

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎯 چطوری XP جمع کنم؟</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• ✅ حل تکالیف</p>
            <p>• 📝 شرکت در آزمون‌ها</p>
            <p>• 📚 حضور در کلاس</p>
            <p>• 🏆 دریافت نشان‌ها</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⭐ مزایای XP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• 🔓 باز کردن نشان‌ها</p>
            <p>• 📊 بالا رفتن رتبه</p>
            <p>• 🎁 دریافت جوایز</p>
            <p>• 💪 افزایش سطح</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏆 سطح شما</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>سطح فعلی: <strong>{xpData.level}</strong></p>
            <p>
              {xpData.level < 5 && '🌱 تازه‌کار'}
              {xpData.level >= 5 && xpData.level < 10 && '⭐ درحال پیشرفت'}
              {xpData.level >= 10 && xpData.level < 20 && '🔥 ماهر'}
              {xpData.level >= 20 && '👑 استاد'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

