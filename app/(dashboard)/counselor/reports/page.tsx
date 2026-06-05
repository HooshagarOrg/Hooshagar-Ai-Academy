'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  
  Activity,
  ArrowUp,
  ArrowDown,
  
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import {
  PRIORITY_LABELS,
  
  
  type PriorityLevel,
} from '@/lib/types/counseling.types'

// ==========================================
// Types
// ==========================================
interface ReportStats {
  total_records: number
  active_records: number
  closed_records: number
  referred_records: number
  total_sessions: number
  avg_sessions_per_record: number
  success_rate: number
  avg_duration_days: number
}

interface CategoryData {
  category: string
  count: number
  percentage: number
}

interface MonthlyData {
  month: string
  sessions: number
  new_records: number
  closed_records: number
}

interface TopRecord {
  id: string
  student_name: string
  grade: number
  sessions_count: number
  priority: PriorityLevel
  last_session: string
}

// ==========================================
// Mock Data
// ==========================================
const mockStats: ReportStats = {
  total_records: 57,
  active_records: 45,
  closed_records: 10,
  referred_records: 2,
  total_sessions: 312,
  avg_sessions_per_record: 5.5,
  success_rate: 78,
  avg_duration_days: 45,
}

const mockCategoryData: CategoryData[] = [
  { category: 'تحصیلی', count: 25, percentage: 32 },
  { category: 'رفتاری', count: 18, percentage: 23 },
  { category: 'خانوادگی', count: 15, percentage: 19 },
  { category: 'اضطراب', count: 12, percentage: 15 },
  { category: 'اجتماعی', count: 8, percentage: 10 },
  { category: 'افسردگی', count: 5, percentage: 6 },
  { category: 'عاطفی', count: 4, percentage: 5 },
]

const mockMonthlyData: MonthlyData[] = [
  { month: 'مهر', sessions: 42, new_records: 8, closed_records: 2 },
  { month: 'آبان', sessions: 48, new_records: 10, closed_records: 3 },
  { month: 'آذر', sessions: 55, new_records: 12, closed_records: 4 },
  { month: 'دی', sessions: 52, new_records: 7, closed_records: 5 },
  { month: 'بهمن', sessions: 58, new_records: 9, closed_records: 4 },
  { month: 'اسفند', sessions: 57, new_records: 11, closed_records: 2 },
]

const mockTopRecords: TopRecord[] = [
  { id: '1', student_name: 'علی رضایی', grade: 6, sessions_count: 12, priority: 'urgent', last_session: '۲ روز پیش' },
  { id: '2', student_name: 'سارا احمدی', grade: 5, sessions_count: 10, priority: 'high', last_session: '۳ روز پیش' },
  { id: '3', student_name: 'محمد کریمی', grade: 4, sessions_count: 9, priority: 'high', last_session: '۵ روز پیش' },
  { id: '4', student_name: 'فاطمه نوری', grade: 3, sessions_count: 8, priority: 'medium', last_session: '۱ هفته پیش' },
  { id: '5', student_name: 'امیر صادقی', grade: 6, sessions_count: 7, priority: 'urgent', last_session: 'امروز' },
]

const mockPriorityData = {
  urgent: 8,
  high: 12,
  medium: 15,
  low: 10,
}

const mockRecentClosed = [
  { id: 'c1', student_name: 'زهرا حسینی', sessions: 6, duration: 42, outcome: 'موفق' },
  { id: 'c2', student_name: 'حسین محمدی', sessions: 4, duration: 28, outcome: 'موفق' },
  { id: 'c3', student_name: 'مریم صالحی', sessions: 8, duration: 65, outcome: 'ارجاع' },
]

// ==========================================
// Helper Components
// ==========================================
const StatCard = ({
  title,
  value,
  change,
  icon,
  color,
  subtext,
}: {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color: string
  subtext?: string
}) => (
  <GlassCard className="p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`${color} p-3 rounded-xl text-white`}>{icon}</div>
      {change !== undefined && (
        <div
          className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-brand-green' : 'text-destructive'}`}
        >
          {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <p className="text-muted-foreground text-sm mb-1">{title}</p>
    <p className="text-2xl font-bold tabular-nums">{value}</p>
    {subtext && <p className="text-muted-foreground text-xs mt-1">{subtext}</p>}
  </GlassCard>
)

const ProgressBar = ({ value, color = 'from-purple-500 to-pink-500' }: { value: number; color?: string }) => (
  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
    <div
      className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
      style={{ width: `${value}%` }}
    />
  </div>
)

const getPriorityColor = (priority: PriorityLevel): string => {
  const colors = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[priority]
}

// ==========================================
// Main Component
// ==========================================
export default function CounselorReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  const [categoryData, setCategoryData] = useState(mockCategoryData)
  const [monthlyData, setMonthlyData] = useState(mockMonthlyData)
  const [priorityData, setPriorityData] = useState(mockPriorityData)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/counseling/stats')
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        const s = json.stats
        setStats({
          total_records: (s.active_records || 0) + (s.closed_this_month || 0),
          active_records: s.active_records || 0,
          closed_records: s.closed_this_month || 0,
          referred_records: 0,
          total_sessions: Object.values(json.trends?.monthly_sessions || {}).reduce(
            (a: number, b) => a + (b as number),
            0
          ) as number,
          avg_sessions_per_record: 5,
          success_rate: 78,
          avg_duration_days: 45,
        })
        const cats = json.distributions?.categories || {}
        const totalCat = Object.values(cats).reduce((a: number, b) => a + (b as number), 0) || 1
        setCategoryData(
          Object.entries(cats).map(([category, count]) => ({
            category,
            count: count as number,
            percentage: Math.round(((count as number) / totalCat) * 100),
          }))
        )
        setPriorityData(json.distributions?.priorities || mockPriorityData)
        const monthly = json.trends?.monthly_sessions || {}
        setMonthlyData(
          Object.entries(monthly).map(([month, sessions]) => ({
            month,
            sessions: sessions as number,
            new_records: 0,
            closed_records: 0,
          }))
        )
      } catch {
        setStats(mockStats)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [period])

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-16 w-full glass-panel-quiet" />
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

  if (!stats) return null

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-brand-pink" />
          گزارشات آماری
        </span>
      }
      description="تحلیل و آمار پرونده‌های مشاوره"
      actions={
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">هفته جاری</SelectItem>
              <SelectItem value="month">ماه جاری</SelectItem>
              <SelectItem value="quarter">سه ماهه</SelectItem>
              <SelectItem value="year">سال تحصیلی</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            دانلود Excel
          </Button>
        </div>
      }
      animatedSections={false}
    >

        {/* ==================== Overview Stats ==================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="کل پرونده‌ها"
            value={stats.total_records}
            change={12}
            icon={<FileText className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            subtext="از ابتدای سال"
          />
          <StatCard
            title="پرونده‌های فعال"
            value={stats.active_records}
            change={8}
            icon={<Activity className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <StatCard
            title="کل جلسات"
            value={stats.total_sessions}
            change={15}
            icon={<Calendar className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
          <StatCard
            title="نرخ موفقیت"
            value={`${stats.success_rate}%`}
            change={5}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            color="bg-emerald-500"
          />
        </div>

        {/* ==================== Main Grid ==================== */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Category Distribution */}
          <GlassCard>
            <CardHeader>
              <CardTitle className=" flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                توزیع دسته‌بندی مسائل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryData.map((item) => (
                <div key={item.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.category}</span>
                    <span className="text-muted-foreground">{item.count} پرونده ({item.percentage}%)</span>
                  </div>
                  <ProgressBar value={item.percentage * 3} />
                </div>
              ))}
            </CardContent>
          </GlassCard>

          {/* Priority Distribution */}
          <GlassCard>
            <CardHeader>
              <CardTitle className=" flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                توزیع اولویت‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-muted-foreground text-sm">فوری</span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums">{priorityData.urgent}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {Math.round((priorityData.urgent / stats.active_records) * 100)}% از فعال‌ها
                  </p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground text-sm">بالا</span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums">{priorityData.high}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {Math.round((priorityData.high / stats.active_records) * 100)}% از فعال‌ها
                  </p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground text-sm">متوسط</span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums">{priorityData.medium}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {Math.round((priorityData.medium / stats.active_records) * 100)}% از فعال‌ها
                  </p>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-muted-foreground text-sm">پایین</span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums">{priorityData.low}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {Math.round((priorityData.low / stats.active_records) * 100)}% از فعال‌ها
                  </p>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </div>

        {/* ==================== Monthly Trend ==================== */}
        <GlassCard>
          <CardHeader>
            <CardTitle className=" flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              روند ماهانه جلسات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-4 px-4">
              {monthlyData.map((item, idx) => {
                const maxSessions = Math.max(...monthlyData.map(d => d.sessions))
                const height = (item.sessions / maxSessions) * 100
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative flex items-end justify-center" style={{ height: '200px' }}>
                      <div
                        className="w-full max-w-[60px] bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg transition-all duration-500 hover:from-purple-500 hover:to-pink-400"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-muted-foreground text-xs">
                          {item.sessions}
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">{item.month}</p>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center gap-8 mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span className="text-muted-foreground text-sm">تعداد جلسات</span>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* ==================== Tables Row ==================== */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Active Records (Top 10) */}
          <GlassCard>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className=" flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  پرونده‌های فعال (بیشترین جلسات)
                </CardTitle>
                <Link href="/counselor/records?status=active">
                  <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                    مشاهده همه
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-right">دانش‌آموز</TableHead>
                    <TableHead className="text-muted-foreground text-right">پایه</TableHead>
                    <TableHead className="text-muted-foreground text-right">جلسات</TableHead>
                    <TableHead className="text-muted-foreground text-right">اولویت</TableHead>
                    <TableHead className="text-muted-foreground text-right">آخرین</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTopRecords.map((record) => (
                    <TableRow key={record.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium">
                        <Link href={`/counselor/records/${record.id}`} className="hover:text-purple-400">
                          {record.student_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{record.grade}</TableCell>
                      <TableCell className="text-muted-foreground">{record.sessions_count}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getPriorityColor(record.priority)}`}>
                          {PRIORITY_LABELS[record.priority]}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{record.last_session}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </GlassCard>

          {/* Recently Closed */}
          <GlassCard>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className=" flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  پرونده‌های بسته شده اخیر
                </CardTitle>
                <Link href="/counselor/records?status=closed">
                  <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                    مشاهده همه
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-right">دانش‌آموز</TableHead>
                    <TableHead className="text-muted-foreground text-right">جلسات</TableHead>
                    <TableHead className="text-muted-foreground text-right">مدت (روز)</TableHead>
                    <TableHead className="text-muted-foreground text-right">نتیجه</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecentClosed.map((record) => (
                    <TableRow key={record.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium">{record.student_name}</TableCell>
                      <TableCell className="text-muted-foreground">{record.sessions}</TableCell>
                      <TableCell className="text-muted-foreground">{record.duration}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          record.outcome === 'موفق' 
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {record.outcome}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </GlassCard>
        </div>

        {/* ==================== Additional Stats ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">میانگین جلسات</p>
              <p className="text-white text-2xl font-bold mt-1">{stats.avg_sessions_per_record}</p>
              <p className="text-muted-foreground text-xs">به ازای هر پرونده</p>
            </CardContent>
          </GlassCard>
          <GlassCard>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">میانگین مدت</p>
              <p className="text-white text-2xl font-bold mt-1">{stats.avg_duration_days}</p>
              <p className="text-muted-foreground text-xs">روز</p>
            </CardContent>
          </GlassCard>
          <GlassCard>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">ارجاع شده</p>
              <p className="text-white text-2xl font-bold mt-1">{stats.referred_records}</p>
              <p className="text-muted-foreground text-xs">پرونده</p>
            </CardContent>
          </GlassCard>
          <GlassCard>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">بسته شده</p>
              <p className="text-white text-2xl font-bold mt-1">{stats.closed_records}</p>
              <p className="text-muted-foreground text-xs">این ماه</p>
            </CardContent>
          </GlassCard>
        </div>

        {/* ==================== Export Actions ==================== */}
        <GlassCard className="border-brand-purple/25 bg-gradient-to-bl from-brand-purple/15 via-card/90 to-brand-pink/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">خروجی گزارشات</h3>
                <p className="text-muted-foreground text-sm">دانلود گزارش‌های جامع به فرمت‌های مختلف</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Excel
                </Button>
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </GlassCard>

    </DashboardPage>
  )
}







