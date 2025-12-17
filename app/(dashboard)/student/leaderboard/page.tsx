'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LeaderboardCard from '@/components/LeaderboardCard'
import { RefreshCw, Trophy, TrendingUp, Users } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  student_id: string
  full_name: string
  avatar_url: string | null
  total_xp: number
  level: number
  class_id?: string
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  stats: {
    total_students: number
    highest_xp: number
    average_xp: number
  }
  scope: string
  updated_at: string
}

export default function LeaderboardPage() {
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null)
  const [classId, setClassId] = useState<string | null>(null)
  const [classData, setClassData] = useState<LeaderboardData | null>(null)
  const [schoolData, setSchoolData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('class')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStudentInfo()
  }, [])

  useEffect(() => {
    if (classId) {
      loadLeaderboard('class')
    }
  }, [classId])

  const loadStudentInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      // دریافت اطلاعات دانش‌آموز
      const authResponse = await fetch('/api/auth/me')
      if (!authResponse.ok) {
        throw new Error('Failed to load student info')
      }

      const authData = await authResponse.json()
      const studentId = authData.student?.id
      const cid = authData.student?.class_id

      if (!studentId || !cid) {
        throw new Error('Student ID or Class ID not found')
      }

      setCurrentStudentId(studentId)
      setClassId(cid)
    } catch (err) {
      console.error('❌ Error loading student info:', err)
      setError('خطا در بارگذاری اطلاعات')
      setLoading(false)
    }
  }

  const loadLeaderboard = async (scope: 'class' | 'school') => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        scope,
        limit: '50'
      })

      if (scope === 'class' && classId) {
        params.append('classId', classId)
      }

      const response = await fetch(`/api/leaderboard?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load leaderboard')
      }

      const data = await response.json()

      if (scope === 'class') {
        setClassData(data)
      } else {
        setSchoolData(data)
      }
    } catch (err) {
      console.error('❌ Error loading leaderboard:', err)
      setError('خطا در بارگذاری رتبه‌بندی')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'school' && !schoolData) {
      loadLeaderboard('school')
    }
  }

  const renderLeaderboard = (data: LeaderboardData | null) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => loadLeaderboard(activeTab as any)} className="mt-4">
            <RefreshCw className="w-4 h-4 ml-2" />
            تلاش مجدد
          </Button>
        </div>
      )
    }

    if (!data || data.leaderboard.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">هنوز رتبه‌بندی وجود ندارد</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {data.leaderboard.map((entry) => (
          <LeaderboardCard
            key={entry.student_id}
            entry={entry}
            isCurrentUser={entry.student_id === currentStudentId}
          />
        ))}
      </div>
    )
  }

  const currentData = activeTab === 'class' ? classData : schoolData

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header با گرادیانت زیبا */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Trophy className="h-10 w-10 text-yellow-300" />
                </div>
                🏆 تابلوی افتخارات
              </h1>
              <p className="text-white/90 text-lg">برترین‌های کلاس و مدرسه را کشف کن!</p>
            </div>
            <Button 
              onClick={() => loadLeaderboard(activeTab as any)} 
              className="bg-white text-purple-600 hover:bg-white/90 font-bold shadow-lg"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              بروزرسانی
            </Button>
          </div>
        </div>

        {/* Stats Cards با انیمیشن */}
        {currentData && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white transform hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  تعداد رقبا
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-4xl font-black">
                  {currentData.stats.total_students.toLocaleString('fa-IR')}
                </p>
                <p className="text-sm text-white/70 mt-1">دانش‌آموز</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white transform hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  رکورد طلایی
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-4xl font-black">
                  {currentData.stats.highest_xp.toLocaleString('fa-IR')}
                </p>
                <p className="text-sm text-white/70 mt-1">XP</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white transform hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  میانگین کلاس
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-4xl font-black">
                  {currentData.stats.average_xp.toLocaleString('fa-IR')}
                </p>
                <p className="text-sm text-white/70 mt-1">XP</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs با استایل زیبا */}
        <Card className="border-0 shadow-xl">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 h-auto">
              <TabsTrigger 
                value="class" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white py-3 text-base font-bold"
              >
                🏫 رتبه‌بندی کلاس
              </TabsTrigger>
              <TabsTrigger 
                value="school"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white py-3 text-base font-bold"
              >
                🌟 رتبه‌بندی مدرسه
              </TabsTrigger>
            </TabsList>

            <CardContent className="mt-6">
              <TabsContent value="class" className="mt-0">
                {renderLeaderboard(classData)}
              </TabsContent>

              <TabsContent value="school" className="mt-0">
                {renderLeaderboard(schoolData)}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

