'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  
  ChevronLeft,
  Bell,
  Brain,
  CheckCircle2,
  Plus,
  Eye,
  Target,
  Activity,
  PieChart,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PRIORITY_LABELS,
  SESSION_TYPE_LABELS,
  type PriorityLevel,
} from '@/lib/types/counseling.types'

// ==========================================
// Types
// ==========================================
interface DashboardStats {
  active_records: number
  urgent_records: number
  high_priority_records: number
  today_sessions: number
  closed_this_month: number
  pending_follow_ups: number
}

interface UpcomingSession {
  id: string
  session_date: string
  session_type: string
  student_name: string
}

interface UrgentRecord {
  id: string
  priority_level: PriorityLevel
  issue_categories: string[]
  updated_at: string
  student: {
    id: string
    full_name: string
    grade: number
    avatar_url?: string
  } | null
}

interface DashboardData {
  stats: DashboardStats
  distributions: {
    categories: Record<string, number>
    priorities: Record<string, number>
  }
  lists: {
    upcoming_sessions: UpcomingSession[]
    urgent_records: UrgentRecord[]
  }
}

// ==========================================
// Mock Data (تا زمان اتصال به API)
// ==========================================
const mockData: DashboardData = {
  stats: {
    active_records: 45,
    urgent_records: 8,
    high_priority_records: 12,
    today_sessions: 6,
    closed_this_month: 12,
    pending_follow_ups: 5,
  },
  distributions: {
    categories: {
      'رفتاری': 18,
      'تحصیلی': 25,
      'خانوادگی': 12,
      'اجتماعی': 8,
      'اضطراب': 15,
      'افسردگی': 5,
    },
    priorities: {
      low: 10,
      medium: 15,
      high: 12,
      urgent: 8,
    },
  },
  lists: {
    upcoming_sessions: [
      { id: '1', session_date: new Date().toISOString(), session_type: 'individual', student_name: 'علی رضایی' },
      { id: '2', session_date: new Date(Date.now() + 3600000).toISOString(), session_type: 'family', student_name: 'سارا احمدی' },
      { id: '3', session_date: new Date(Date.now() + 7200000).toISOString(), session_type: 'individual', student_name: 'محمد کریمی' },
    ],
    urgent_records: [
      { id: '1', priority_level: 'urgent', issue_categories: ['رفتاری', 'خانوادگی'], updated_at: new Date().toISOString(), student: { id: '1', full_name: 'علی رضایی', grade: 6 } },
      { id: '2', priority_level: 'urgent', issue_categories: ['اضطراب'], updated_at: new Date(Date.now() - 86400000).toISOString(), student: { id: '2', full_name: 'زهرا حسینی', grade: 5 } },
      { id: '3', priority_level: 'high', issue_categories: ['تحصیلی'], updated_at: new Date(Date.now() - 172800000).toISOString(), student: { id: '3', full_name: 'امیر صادقی', grade: 4 } },
    ],
  },
}

// ==========================================
// Helper Functions
// ==========================================
const getPriorityColor = (priority: PriorityLevel): string => {
  const colors: Record<PriorityLevel, string> = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  }
  return colors[priority]
}

const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatRelativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'امروز'
  if (days === 1) return 'دیروز'
  return `${days} روز پیش`
}

// ==========================================
// Main Component
// ==========================================
export default function CounselorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API call
    // fetchDashboardData()
    setTimeout(() => {
      setData(mockData)
      setIsLoading(false)
    }, 500)
  }, [])

  const formatPersianDate = (): string => {
    return new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full bg-white/10" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 bg-white/10" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 bg-white/10" />
            <Skeleton className="h-80 bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ==================== Header ==================== */}
        <header className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                داشبورد مشاوره 🧠
              </h1>
              <p className="text-white/60 text-sm">{formatPersianDate()}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                <Bell className="w-5 h-5" />
              </Button>
              <Link href="/counselor/records/new">
                <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  پرونده جدید
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* ==================== Stats Cards ==================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Records */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-blue-500/20 p-3 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-xs text-white/40">فعال</span>
              </div>
              <p className="text-white/60 text-sm mb-1">پرونده فعال</p>
              <p className="text-white text-3xl font-bold">{data.stats.active_records}</p>
            </CardContent>
          </Card>

          {/* Urgent Records */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-red-500/20 p-3 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-xs text-red-400 animate-pulse">فوری</span>
              </div>
              <p className="text-white/60 text-sm mb-1">نیازمند توجه فوری</p>
              <p className="text-white text-3xl font-bold">{data.stats.urgent_records}</p>
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-green-500/20 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-xs text-white/40">امروز</span>
              </div>
              <p className="text-white/60 text-sm mb-1">جلسات امروز</p>
              <p className="text-white text-3xl font-bold">{data.stats.today_sessions}</p>
            </CardContent>
          </Card>

          {/* Closed This Month */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-purple-500/20 p-3 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-xs text-white/40">این ماه</span>
              </div>
              <p className="text-white/60 text-sm mb-1">بسته شده</p>
              <p className="text-white text-3xl font-bold">{data.stats.closed_this_month}</p>
            </CardContent>
          </Card>
        </div>

        {/* ==================== Main Grid ==================== */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* ========== Urgent Records ========== */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    پرونده‌های نیازمند توجه
                    <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                      {data.stats.urgent_records + data.stats.high_priority_records}
                    </span>
                  </CardTitle>
                  <Link href="/counselor/records?priority=urgent,high">
                    <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 gap-1">
                      مشاهده همه
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lists.urgent_records.map((record) => (
                  <div
                    key={record.id}
                    className={`bg-white/5 rounded-xl p-4 border-r-4 hover:bg-white/10 transition-colors ${
                      record.priority_level === 'urgent' ? 'border-red-500' : 'border-orange-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {record.student?.full_name.charAt(0) || '؟'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{record.student?.full_name || 'نامشخص'}</p>
                          <p className="text-white/50 text-xs">پایه {record.student?.grade}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          record.priority_level === 'urgent' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {PRIORITY_LABELS[record.priority_level]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-1 flex-wrap">
                        {record.issue_categories.map((cat, idx) => (
                          <span key={idx} className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(record.updated_at)}
                        </span>
                        <Link href={`/counselor/records/${record.id}`}>
                          <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {data.lists.urgent_records.length === 0 && (
                  <div className="text-center py-8 text-white/40">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>پرونده فوری وجود ندارد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ========== Today's Sessions ========== */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-400" />
                جلسات امروز
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.lists.upcoming_sessions.map((session, idx) => (
                <div
                  key={session.id}
                  className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{session.student_name}</p>
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <span>{SESSION_TYPE_LABELS[session.session_type as keyof typeof SESSION_TYPE_LABELS]}</span>
                        <span>•</span>
                        <span className="font-mono">{formatTime(session.session_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {data.lists.upcoming_sessions.length === 0 && (
                <div className="text-center py-6 text-white/40">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>جلسه‌ای برای امروز ثبت نشده</p>
                </div>
              )}

              <Link href="/counselor/sessions/new" className="block">
                <Button variant="outline" className="w-full bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 gap-2">
                  <Plus className="w-4 h-4" />
                  افزودن جلسه
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* ==================== Charts Row ==================== */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                توزیع دسته‌بندی مسائل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data.distributions.categories).map(([category, count]) => {
                  const total = Object.values(data.distributions.categories).reduce((a, b) => a + b, 0)
                  const percentage = Math.round((count / total) * 100)
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/70">{category}</span>
                        <span className="text-white/50">{count} مورد ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                توزیع اولویت‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(data.distributions.priorities).map(([priority, count]) => (
                  <div
                    key={priority}
                    className={`p-4 rounded-xl border ${
                      priority === 'urgent' ? 'bg-red-500/10 border-red-500/30' :
                      priority === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                      priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-green-500/10 border-green-500/30'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mb-2 ${getPriorityColor(priority as PriorityLevel)}`} />
                    <p className="text-white/60 text-sm">{PRIORITY_LABELS[priority as PriorityLevel]}</p>
                    <p className="text-white text-2xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==================== Quick Actions ==================== */}
        <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">تحلیل هوشمند</h3>
                  <p className="text-white/60 text-sm">
                    شناسایی الگوهای رفتاری و پیشنهادات مشاوره‌ای با هوش مصنوعی
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/counselor/reports">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2">
                    <Activity className="w-4 h-4" />
                    گزارشات
                  </Button>
                </Link>
                <Link href="/counselor/records">
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
                    <Users className="w-4 h-4" />
                    پرونده‌ها
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/30 text-sm py-4">
          <p>سیستم مشاوره هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}







