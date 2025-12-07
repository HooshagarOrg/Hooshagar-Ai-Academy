'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Activity,
  Download,
  Mail,
  RefreshCw,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Settings,
  Eye,
  AlertCircle,
  Zap,
  CreditCard,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { AI_FEATURES } from '@/lib/check-ai-limit'

// ============================================
// داده‌های نمونه
// ============================================

const USAGE_TREND_DATA = [
  { date: '۱', usage: 1234, credits: 4567 },
  { date: '۲', usage: 1456, credits: 5234 },
  { date: '۳', usage: 1678, credits: 6012 },
  { date: '۴', usage: 1234, credits: 4567 },
  { date: '۵', usage: 1890, credits: 6789 },
  { date: '۶', usage: 2100, credits: 7890 },
  { date: '۷', usage: 1567, credits: 5678 },
  { date: '۸', usage: 1345, credits: 4890 },
  { date: '۹', usage: 1678, credits: 6234 },
  { date: '۱۰', usage: 1890, credits: 6890 },
  { date: '۱۱', usage: 2200, credits: 8100 },
  { date: '۱۲', usage: 2456, credits: 9012 },
  { date: '۱۳', usage: 2100, credits: 7890 },
  { date: '۱۴', usage: 1890, credits: 6890 },
  { date: '۱۵', usage: 2300, credits: 8456 },
  { date: '۱۶', usage: 2100, credits: 7890 },
  { date: '۱۷', usage: 1900, credits: 6890 },
  { date: '۱۸', usage: 2400, credits: 8900 },
  { date: '۱۹', usage: 2200, credits: 8100 },
  { date: '۲۰', usage: 2600, credits: 9500 },
  { date: '۲۱', usage: 2100, credits: 7890 },
  { date: '۲۲', usage: 1890, credits: 6890 },
  { date: '۲۳', usage: 2300, credits: 8456 },
  { date: '۲۴', usage: 2500, credits: 9200 },
  { date: '۲۵', usage: 2700, credits: 9900 },
  { date: '۲۶', usage: 2400, credits: 8900 },
  { date: '۲۷', usage: 2200, credits: 8100 },
  { date: '۲۸', usage: 2600, credits: 9500 },
  { date: '۲۹', usage: 2800, credits: 10200 },
  { date: '۳۰', usage: 3000, credits: 11000 },
]

const FEATURE_USAGE_DATA = [
  { name: 'OCR', label: 'حل مسئله با OCR', count: 4567, color: '#3b82f6' },
  { name: 'Story', label: 'تولید داستان', count: 3234, color: '#8b5cf6' },
  { name: 'Study', label: 'دستیار مطالعه', count: 2890, color: '#10b981' },
  { name: 'Analyzer', label: 'تحلیل دانش‌آموز', count: 1456, color: '#f59e0b' },
  { name: 'Content', label: 'تولید محتوا', count: 890, color: '#ef4444' },
  { name: 'Exam', label: 'تولید آزمون', count: 567, color: '#06b6d4' },
  { name: 'Others', label: 'سایر', count: 852, color: '#6b7280' },
]

const ROLE_USAGE_DATA = [
  { name: 'دانش‌آموز', value: 65, count: 21000, color: '#3b82f6' },
  { name: 'معلم', value: 20, count: 6500, color: '#10b981' },
  { name: 'والد', value: 10, count: 3200, color: '#f59e0b' },
  { name: 'سایر', value: 5, count: 1756, color: '#6b7280' },
]

const TOP_USERS = [
  { rank: 1, name: 'علی رضایی', role: 'دانش‌آموز', roleIcon: '🎓', today: 15, week: 89, month: 345 },
  { rank: 2, name: 'سارا احمدی', role: 'معلم', roleIcon: '👨‍🏫', today: 12, week: 76, month: 298 },
  { rank: 3, name: 'محمد کریمی', role: 'دانش‌آموز', roleIcon: '🎓', today: 18, week: 67, month: 267 },
  { rank: 4, name: 'فاطمه محمدی', role: 'دانش‌آموز', roleIcon: '🎓', today: 10, week: 56, month: 234 },
  { rank: 5, name: 'امیر حسینی', role: 'معلم', roleIcon: '👨‍🏫', today: 8, week: 45, month: 198 },
]

const BLOCKED_REQUESTS = [
  { time: '۱۴:۳۰', user: 'علی', feature: 'تولید داستان', reason: 'روزانه', remaining: '۵ ساعت' },
  { time: '۱۲:۱۵', user: 'سارا', feature: 'OCR', reason: 'اعتبار', remaining: '۱۲ روز' },
  { time: '۱۱:۴۵', user: 'محمد', feature: 'دستیار مطالعه', reason: 'هفتگی', remaining: '۲ روز' },
  { time: '۱۰:۲۰', user: 'فاطمه', feature: 'تحلیل', reason: 'ماهانه', remaining: '۸ روز' },
]

// ============================================
// کامپوننت اصلی
// ============================================

export default function AIUsageDashboardPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [roleFilter, setRoleFilter] = useState('all')
  const [featureFilter, setFeatureFilter] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // آمار خلاصه
  const summaryStats = {
    today: { value: 1234, change: 12, up: true },
    week: { value: 8567, change: 8, up: true },
    month: { value: 32456, change: 3, up: false },
    costToday: { value: 15.50, change: 5, up: true },
    avgDaily: { value: 1234, change: 0, up: true },
    blocked: { value: 234, change: 15, up: false },
  }

  // بروزرسانی داده‌ها
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  // دانلود گزارش
  const handleExport = (format: 'excel' | 'pdf') => {
    console.log('Exporting:', format)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              داشبورد مصرف هوش مصنوعی
            </h1>
            <p className="text-gray-500 mt-2">
              آمار و تحلیل استفاده از قابلیت‌های AI
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36">
                <Calendar className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">۷ روز اخیر</SelectItem>
                <SelectItem value="30d">۳۰ روز اخیر</SelectItem>
                <SelectItem value="90d">۳ ماه اخیر</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* کارت‌های آمار */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard
            title="امروز"
            value={summaryStats.today.value.toLocaleString('fa-IR')}
            subtitle="بار استفاده"
            change={summaryStats.today.change}
            up={summaryStats.today.up}
            icon={<Activity className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="این هفته"
            value={summaryStats.week.value.toLocaleString('fa-IR')}
            subtitle="بار استفاده"
            change={summaryStats.week.change}
            up={summaryStats.week.up}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="این ماه"
            value={summaryStats.month.value.toLocaleString('fa-IR')}
            subtitle="بار استفاده"
            change={summaryStats.month.change}
            up={summaryStats.month.up}
            icon={<Calendar className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="هزینه امروز"
            value={`$${summaryStats.costToday.value}`}
            subtitle=""
            change={summaryStats.costToday.change}
            up={summaryStats.costToday.up}
            icon={<CreditCard className="w-5 h-5" />}
            color="yellow"
          />
          <StatCard
            title="میانگین روزانه"
            value={summaryStats.avgDaily.value.toLocaleString('fa-IR')}
            subtitle=""
            change={summaryStats.avgDaily.change}
            up={summaryStats.avgDaily.up}
            icon={<BarChart3 className="w-5 h-5" />}
            color="cyan"
          />
          <StatCard
            title="مسدود شده"
            value={summaryStats.blocked.value.toLocaleString('fa-IR')}
            subtitle="این ماه"
            change={summaryStats.blocked.change}
            up={summaryStats.blocked.up}
            icon={<AlertCircle className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* نمودارها */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* نمودار روند استفاده */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                روند استفاده ۳۰ روز گذشته
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={USAGE_TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl',
                    }}
                    formatter={(value: number, name: string) => [
                      value.toLocaleString('fa-IR'),
                      name === 'usage' ? 'استفاده' : 'اعتبار'
                    ]}
                  />
                  <Legend
                    formatter={(value) => value === 'usage' ? 'تعداد استفاده' : 'Credit مصرفی'}
                  />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="credits"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* نمودار توزیع قابلیت‌ها */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                پرکاربردترین قابلیت‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={FEATURE_USAGE_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl',
                    }}
                    formatter={(value: number) => [value.toLocaleString('fa-IR'), 'تعداد']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {FEATURE_USAGE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ردیف دوم نمودارها */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* نمودار دایره‌ای توزیع نقش‌ها */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                استفاده به تفکیک نقش
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ROLE_USAGE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {ROLE_USAGE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, entry: any) => [
                      `${value}% (${entry.payload.count.toLocaleString('fa-IR')})`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {ROLE_USAGE_DATA.map((role) => (
                  <div key={role.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <span>{role.name}</span>
                    <span className="text-gray-500">
                      ({role.count.toLocaleString('fa-IR')})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* جدول Top کاربران */}
          <Card className="col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  🏆 پرمصرف‌ترین کاربران این ماه
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue placeholder="نقش" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="student">دانش‌آموز</SelectItem>
                      <SelectItem value="teacher">معلم</SelectItem>
                      <SelectItem value="parent">والد</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={featureFilter} onValueChange={setFeatureFilter}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue placeholder="قابلیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      {Object.entries(AI_FEATURES).map(([key, feature]) => (
                        <SelectItem key={key} value={key}>
                          {feature.icon} {feature.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12 text-center">رتبه</TableHead>
                    <TableHead>نام کاربر</TableHead>
                    <TableHead>نقش</TableHead>
                    <TableHead className="text-center">امروز</TableHead>
                    <TableHead className="text-center">هفته</TableHead>
                    <TableHead className="text-center">ماه</TableHead>
                    <TableHead className="w-20">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TOP_USERS.map((user) => (
                    <TableRow key={user.rank}>
                      <TableCell className="text-center">
                        {user.rank <= 3 ? (
                          <span className="text-xl">
                            {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="text-gray-500">{user.rank}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {user.roleIcon} {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{user.today}</TableCell>
                      <TableCell className="text-center">{user.week}</TableCell>
                      <TableCell className="text-center font-medium">{user.month}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* موارد مسدود شده و دکمه‌های عملیات */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* جدول موارد مسدود شده */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                🚫 موارد مسدود شده امروز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-50">
                    <TableHead>زمان</TableHead>
                    <TableHead>کاربر</TableHead>
                    <TableHead>قابلیت</TableHead>
                    <TableHead>دلیل</TableHead>
                    <TableHead>باقی‌مانده</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BLOCKED_REQUESTS.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-gray-500">{item.time}</TableCell>
                      <TableCell>{item.user}</TableCell>
                      <TableCell>{item.feature}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            item.reason === 'روزانه' && 'bg-yellow-100 text-yellow-700',
                            item.reason === 'هفتگی' && 'bg-orange-100 text-orange-700',
                            item.reason === 'ماهانه' && 'bg-red-100 text-red-700',
                            item.reason === 'اعتبار' && 'bg-purple-100 text-purple-700'
                          )}
                        >
                          {item.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">{item.remaining}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* دکمه‌های عملیات */}
          <Card>
            <CardHeader>
              <CardTitle>دانلود و گزارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => handleExport('excel')}
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                دانلود گزارش Excel
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => handleExport('pdf')}
              >
                <FileText className="w-4 h-4 text-red-600" />
                دانلود PDF
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                ارسال گزارش ایمیل
              </Button>

              <Separator className="my-4" />

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">آخرین بروزرسانی</h4>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 gap-1"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
                  بروزرسانی
                </Button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-blue-800 mb-2">💡 نکته</h4>
                <p className="text-sm text-blue-600">
                  برای تنظیم محدودیت‌ها به صفحه
                  <Button
                    variant="link"
                    className="h-auto p-0 mx-1"
                    onClick={() => window.location.href = '/admin/ai-limits'}
                  >
                    مدیریت محدودیت‌ها
                  </Button>
                  بروید.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت کارت آمار
// ============================================

function StatCard({
  title,
  value,
  subtitle,
  change,
  up,
  icon,
  color,
}: {
  title: string
  value: string
  subtitle: string
  change: number
  up: boolean
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'cyan' | 'red'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  }

  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    yellow: 'text-yellow-500',
    cyan: 'text-cyan-500',
    red: 'text-red-500',
  }

  return (
    <Card className={cn('border', colors[color])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={cn('opacity-75', iconColors[color])}>{icon}</span>
          {change !== 0 && (
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}
            >
              {up ? <ArrowUpRight className="w-3 h-3 ml-0.5" /> : <ArrowDownRight className="w-3 h-3 ml-0.5" />}
              {change}%
            </Badge>
          )}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}















