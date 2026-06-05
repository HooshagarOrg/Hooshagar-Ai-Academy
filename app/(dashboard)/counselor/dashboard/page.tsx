'use client'

import { useState, useEffect } from 'react'
import { usePersianDateString } from '@/lib/hooks/use-persian-date'
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
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { StatCard } from '@/components/ui/stat-card'
import { GlassCard } from '@/components/ui/glass-card'
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
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/counseling/stats')
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        setData({
          stats: json.stats,
          distributions: json.distributions,
          lists: json.lists,
        })
      } catch {
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const persianDate = usePersianDateString()

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-24 w-full glass-panel-quiet" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 glass-panel-quiet" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 glass-panel-quiet" />
          <Skeleton className="h-80 glass-panel-quiet" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <DashboardPage
      meta={persianDate}
      title={
        <>
          داشبورد مشاوره <span className="text-brand-pink">🧠</span>
        </>
      }
      description="پرونده‌ها، جلسات و اولویت‌های امروز"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="اعلان‌ها">
            <Bell className="w-5 h-5" />
          </Button>
          <Link href="/counselor/records/new">
            <Button className="bg-brand-pink hover:opacity-90 text-space gap-2">
              <Plus className="w-4 h-4" />
              پرونده جدید
            </Button>
          </Link>
        </div>
      }
      animatedSections={false}
    >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="پرونده فعال"
            value={data.stats.active_records}
            hint="فعال"
            icon={<FileText className="w-6 h-6" />}
            accentClass="text-brand-cyan"
          />
          <StatCard
            label="نیازمند توجه فوری"
            value={data.stats.urgent_records}
            hint="فوری"
            icon={<AlertTriangle className="w-6 h-6" />}
            accentClass="text-destructive"
          />
          <StatCard
            label="جلسات امروز"
            value={data.stats.today_sessions}
            hint="امروز"
            icon={<Calendar className="w-6 h-6" />}
            accentClass="text-brand-green"
          />
          <StatCard
            label="بسته شده"
            value={data.stats.closed_this_month}
            hint="این ماه"
            icon={<CheckCircle2 className="w-6 h-6" />}
            accentClass="text-brand-purple"
          />
        </div>

        {/* ==================== Main Grid ==================== */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* ========== Urgent Records ========== */}
          <div className="lg:col-span-2">
            <GlassCard className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-foreground font-bold">
                          {record.student?.full_name.charAt(0) || '؟'}
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{record.student?.full_name || 'نامشخص'}</p>
                          <p className="text-muted-foreground text-xs">پایه {record.student?.grade}</p>
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
                          <span key={idx} className="bg-white/10 text-muted-foreground text-xs px-2 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
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
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>پرونده فوری وجود ندارد</p>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </div>

          {/* ========== Today's Sessions ========== */}
          <GlassCard>
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground flex items-center gap-2">
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
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center text-foreground font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{session.student_name}</p>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span>{SESSION_TYPE_LABELS[session.session_type as keyof typeof SESSION_TYPE_LABELS]}</span>
                        <span>•</span>
                        <span className="font-mono">{formatTime(session.session_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {data.lists.upcoming_sessions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
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
          </GlassCard>
        </div>

        {/* ==================== Charts Row ==================== */}
        <div className="grid lg:grid-cols-2 gap-6">
          <GlassCard>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
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
                        <span className="text-muted-foreground">{category}</span>
                        <span className="text-muted-foreground">{count} مورد ({percentage}%)</span>
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
          </GlassCard>

          <GlassCard>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
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
                    <p className="text-muted-foreground text-sm">{PRIORITY_LABELS[priority as PriorityLevel]}</p>
                    <p className="text-foreground text-2xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </div>

        <GlassCard className="border-brand-purple/25 bg-gradient-to-bl from-brand-purple/15 via-card/90 to-brand-pink/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">تحلیل هوشمند</h3>
                  <p className="text-muted-foreground text-sm">
                    شناسایی الگوهای رفتاری و پیشنهادات مشاوره‌ای با هوش مصنوعی
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/counselor/reports">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-foreground hover:bg-white/20 gap-2">
                    <Activity className="w-4 h-4" />
                    گزارشات
                  </Button>
                </Link>
                <Link href="/counselor/records">
                  <Button className="bg-brand-pink hover:opacity-90 text-space gap-2">
                    <Users className="w-4 h-4" />
                    پرونده‌ها
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        <footer className="text-center text-muted-foreground text-sm py-4">
          <p>سیستم مشاوره هوشاگر</p>
        </footer>
    </DashboardPage>
  )
}







