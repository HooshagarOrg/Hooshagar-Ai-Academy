'use client'

import { useState, useEffect } from 'react'
import BadgeCard from '@/components/BadgeCard'
import { toast } from 'sonner'

interface Badge {
  id: string
  name: string
  name_fa: string
  description_fa: string
  icon: string
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  xp_reward: number
  requirement_value?: number
}

interface StudentBadge {
  id: string
  unlocked_at: string
  progress: number
  badges: Badge
}

export default function StudentBadgesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [badges, setBadges] = useState<StudentBadge[]>([])
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [totalXp, setTotalXp] = useState(0)
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([])

  // دریافت studentId از session
  const [studentId, setStudentId] = useState<string>('')

  useEffect(() => {
    loadStudentId()
  }, [])

  useEffect(() => {
    if (studentId) {
      loadBadges()
    }
  }, [studentId])

  const loadStudentId = async () => {
    try {
      console.log('🔍 Fetching student ID...')
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      
      console.log('📦 Response:', data)
      
      if (data.student?.id) {
        console.log('✅ Student ID:', data.student.id)
        setStudentId(data.student.id)
      } else {
        console.error('❌ No student found in response')
        toast.error('دانش‌آموز یافت نشد')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('❌ Error loading student:', error)
      toast.error('خطا در بارگذاری اطلاعات')
      setIsLoading(false)
    }
  }

  const loadBadges = async () => {
    try {
      setIsLoading(true)
      
      console.log('🎖️ Loading badges for student:', studentId)
      const res = await fetch(`/api/badges/student?studentId=${studentId}`)
      const data = await res.json()

      console.log('📊 Badges response:', data)

      if (res.ok) {
        setBadges(data.badges || [])
        setTotalXp(data.totalXp || 0)
        setAvailableBadges(data.availableBadges || [])
        
        console.log('✅ Student badges loaded:', data.badges?.length || 0)
        
        // دریافت لیست کل badge‌ها
        const allRes = await fetch('/api/badges')
        const allData = await allRes.json()
        setAllBadges(allData.badges || [])
        
        console.log('✅ All badges loaded:', allData.badges?.length || 0)
      } else {
        console.error('❌ Error loading badges:', data.error)
        toast.error(data.error || 'خطا در بارگذاری نشان‌ها')
      }
    } catch (error) {
      console.error('❌ Error loading badges:', error)
      toast.error('خطا در بارگذاری نشان‌ها')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlockBadge = async (badgeId: string) => {
    try {
      const res = await fetch('/api/badges/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, badgeId })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(data.message || 'نشان دریافت شد! 🎉')
        loadBadges() // بارگذاری مجدد
      } else {
        toast.error(data.message || 'خطا در دریافت نشان')
      }
    } catch (error) {
      console.error('Error unlocking badge:', error)
      toast.error('خطا در دریافت نشان')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Badge‌های قفل شده
  const lockedBadges = allBadges.filter(badge => 
    !badges.find(sb => sb.badges.id === badge.id)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🏆 نشان‌های من
          </h1>
          <p className="text-xl text-white/80">
            {badges.length} از {allBadges.length} نشان دریافت شده
          </p>
          <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
            <span className="text-2xl font-bold text-yellow-300">
              ⭐ {totalXp} XP
            </span>
          </div>
        </div>

        {/* Badge‌های قابل دریافت (Available) */}
        {availableBadges.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-4xl">🎁</span>
              آماده دریافت!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {availableBadges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlocked={false}
                  currentXp={totalXp}
                  onClick={() => handleUnlockBadge(badge.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Badge‌های دریافت شده */}
        {badges.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-4xl">✅</span>
              دریافت شده
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {badges.map(studentBadge => (
                <BadgeCard
                  key={studentBadge.id}
                  badge={studentBadge.badges}
                  unlocked={true}
                  unlockedAt={studentBadge.unlocked_at}
                />
              ))}
            </div>
          </div>
        )}

        {/* Badge‌های قفل شده */}
        {lockedBadges.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-4xl">🔒</span>
              قفل شده
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {lockedBadges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlocked={false}
                  currentXp={totalXp}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {badges.length === 0 && lockedBadges.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🎖️</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              هنوز نشانی وجود ندارد
            </h2>
            <p className="text-xl text-white/70">
              با کسب امتیاز، نشان‌های خود را دریافت کن!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
