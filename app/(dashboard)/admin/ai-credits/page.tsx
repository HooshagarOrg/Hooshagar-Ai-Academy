'use client'

import { useState, useMemo } from 'react'
import {
  Cpu, Building2, Coins, TrendingUp, TrendingDown, Edit2, Save, X,
  Users, BarChart3, PieChart, Search,
  Database, Sparkles, Brain, BookOpen, Camera, Wand2,
  RefreshCw, Download, AlertTriangle, Clock
} from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'

// ============================================
// داده‌های نمونه (Mock Data)
// ============================================

// مدارس و اعتبار آن‌ها
const mockSchools = [
  { 
    id: '1', 
    name: 'دبستان تلاش', 
    totalCredits: 10000, 
    usedCredits: 3500, 
    lastUpdate: '1403/09/05',
    students: 120,
    staff: 15
  },
  { 
    id: '2', 
    name: 'دبستان امیدان تلاش', 
    totalCredits: 8000, 
    usedCredits: 2100, 
    lastUpdate: '1403/09/04',
    students: 95,
    staff: 12
  },
  { 
    id: '3', 
    name: 'دبستان پیوند ۲', 
    totalCredits: 5000, 
    usedCredits: 1800, 
    lastUpdate: '1403/09/03',
    students: 75,
    staff: 10
  },
  { 
    id: '4', 
    name: 'پیش دبستانی تلاش', 
    totalCredits: 3000, 
    usedCredits: 500, 
    lastUpdate: '1403/09/02',
    students: 45,
    staff: 8
  },
]

// مصرف ابزارهای AI
const aiToolsUsage = [
  { name: 'تحلیل دانش‌آموز', value: 450, color: '#8B5CF6', icon: Brain },
  { name: 'حل مسئله OCR', value: 320, color: '#F59E0B', icon: Camera },
  { name: 'داستان‌ساز', value: 280, color: '#EC4899', icon: Wand2 },
  { name: 'دستیار مطالعه', value: 210, color: '#10B981', icon: BookOpen },
]

// پرمصرف‌ترین کاربران
const topUsers = [
  { id: '1', name: 'آقای احمدی', role: 'معلم', school: 'دبستان تلاش', requests: 145, credits: 580 },
  { id: '2', name: 'خانم رضایی', role: 'مشاور', school: 'دبستان امیدان تلاش', requests: 120, credits: 480 },
  { id: '3', name: 'آقای محمدی', role: 'معلم', school: 'دبستان پیوند ۲', requests: 98, credits: 392 },
  { id: '4', name: 'خانم حسینی', role: 'معلم', school: 'دبستان تلاش', requests: 87, credits: 348 },
  { id: '5', name: 'آقای کریمی', role: 'مدیر', school: 'پیش دبستانی تلاش', requests: 75, credits: 300 },
  { id: '6', name: 'خانم نوری', role: 'معلم', school: 'دبستان امیدان تلاش', requests: 68, credits: 272 },
  { id: '7', name: 'آقای صادقی', role: 'معلم', school: 'دبستان پیوند ۲', requests: 62, credits: 248 },
  { id: '8', name: 'خانم فرهادی', role: 'مشاور', school: 'دبستان تلاش', requests: 55, credits: 220 },
  { id: '9', name: 'آقای جعفری', role: 'معلم', school: 'پیش دبستانی تلاش', requests: 48, credits: 192 },
  { id: '10', name: 'خانم علوی', role: 'معلم', school: 'دبستان امیدان تلاش', requests: 42, credits: 168 },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function AICreditsPage() {
  const [schools, setSchools] = useState(mockSchools)
  const [editingSchool, setEditingSchool] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [schoolFilter, setSchoolFilter] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<string>('30')
  const [searchQuery, setSearchQuery] = useState('')

  // محاسبات آماری
  const totalAllocated = useMemo(() => 
    schools.reduce((sum, s) => sum + s.totalCredits, 0), [schools])
  const totalUsed = useMemo(() => 
    schools.reduce((sum, s) => sum + s.usedCredits, 0), [schools])
  const totalRemaining = totalAllocated - totalUsed
  const totalRequests = useMemo(() => 
    aiToolsUsage.reduce((sum, t) => sum + t.value, 0), [])

  // فیلتر کاربران
  const filteredUsers = useMemo(() => {
    let users = topUsers
    if (schoolFilter !== 'all') {
      users = users.filter(u => u.school === schoolFilter)
    }
    if (searchQuery) {
      users = users.filter(u => 
        u.name.includes(searchQuery) || 
        u.school.includes(searchQuery) ||
        u.role.includes(searchQuery)
      )
    }
    return users
  }, [schoolFilter, searchQuery])

  // شروع ویرایش
  const startEditing = (schoolId: string, currentCredits: number) => {
    setEditingSchool(schoolId)
    setEditValue(currentCredits)
  }

  // ذخیره تغییرات
  const saveCredits = (schoolId: string) => {
    setSchools(prev => prev.map(s => 
      s.id === schoolId 
        ? { ...s, totalCredits: editValue, lastUpdate: '1403/09/06' }
        : s
    ))
    setEditingSchool(null)
  }

  // لغو ویرایش
  const cancelEditing = () => {
    setEditingSchool(null)
    setEditValue(0)
  }

  // محاسبه درصد مصرف
  const getUsagePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100)
  }

  // رنگ بر اساس درصد مصرف
  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-400'
    if (percentage >= 60) return 'text-yellow-400'
    return 'text-green-400'
  }

  // Progress bar color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-red-500 to-red-600'
    if (percentage >= 60) return 'from-yellow-500 to-yellow-600'
    return 'from-green-500 to-green-600'
  }

  return (
    <DashboardPage
      className="max-w-7xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-brand-cyan to-brand-purple p-3 rounded-xl">
            <Cpu className="w-6 h-6 text-white" />
          </span>
          مدیریت اعتبار هوش مصنوعی
        </span>
      }
      description="مدیریت و نظارت بر اعتبار و مصرف ابزارهای هوش مصنوعی در مدارس"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 glass-panel-quiet">
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            خروجی گزارش
          </Button>
        </div>
      }
      animatedSections={false}
    >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="کل اعتبار تخصیص‌یافته"
            value={totalAllocated.toLocaleString('fa-IR')}
            hint="+۱۲٪"
            icon={<Coins className="w-5 h-5" />}
            accentClass="text-brand-cyan"
          />
          <StatCard
            label="کل اعتبار مصرف‌شده"
            value={totalUsed.toLocaleString('fa-IR')}
            hint="امروز"
            icon={<TrendingDown className="w-5 h-5" />}
            accentClass="text-brand-orange"
          />
          <StatCard
            label="اعتبار باقی‌مانده"
            value={totalRemaining.toLocaleString('fa-IR')}
            hint={`${Math.round((totalRemaining / totalAllocated) * 100)}٪`}
            icon={<Database className="w-5 h-5" />}
            accentClass="text-brand-green"
          />
          <StatCard
            label="کل درخواست‌های AI"
            value={totalRequests.toLocaleString('fa-IR')}
            hint="+۸٪"
            icon={<Sparkles className="w-5 h-5" />}
            accentClass="text-brand-purple"
          />
        </div>

        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              تنظیم اعتبار مدارس
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/60 text-sm border-b border-white/10">
                  <th className="text-right pb-3 font-medium">نام مدرسه</th>
                  <th className="text-center pb-3 font-medium">اعتبار فعلی</th>
                  <th className="text-center pb-3 font-medium">مصرف شده</th>
                  <th className="text-center pb-3 font-medium">درصد مصرف</th>
                  <th className="text-center pb-3 font-medium">آخرین بروزرسانی</th>
                  <th className="text-center pb-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {schools.map((school) => {
                  const percentage = getUsagePercentage(school.usedCredits, school.totalCredits)
                  const isEditing = editingSchool === school.id
                  
                  return (
                    <tr key={school.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {school.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium">{school.name}</p>
                            <p className="text-white/50 text-xs">
                              {school.students} دانش‌آموز | {school.staff} کارکنان
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-24 bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-white text-center focus:outline-none focus:border-blue-400"
                          />
                        ) : (
                          <span className="text-white font-bold">
                            {school.totalCredits.toLocaleString('fa-IR')}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-white/70">
                          {school.usedCredits.toLocaleString('fa-IR')}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${getProgressColor(percentage)} rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${getUsageColor(percentage)}`}>
                            {percentage}٪
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-center text-white/50 text-sm">
                        {school.lastUpdate}
                      </td>
                      <td className="py-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => saveCredits(school.id)}
                              className="p-2 bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-all"
                            >
                              <Save className="w-4 h-4 text-green-400" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(school.id, school.totalCredits)}
                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                          >
                            <Edit2 className="w-4 h-4 text-white/70" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-green-400" />
              مصرف اعتبار به تفکیک مدرسه
            </h2>
            
            <div className="space-y-4">
              {schools.map((school) => {
                const percentage = getUsagePercentage(school.usedCredits, school.totalCredits)
                return (
                  <div key={school.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">{school.name}</span>
                      <span className="text-white/60 text-xs">
                        {school.usedCredits.toLocaleString('fa-IR')} / {school.totalCredits.toLocaleString('fa-IR')}
                      </span>
                    </div>
                    <div className="relative h-8 bg-white/10 rounded-lg overflow-hidden">
                      <div
                        className={`absolute inset-y-0 right-0 bg-gradient-to-l ${getProgressColor(percentage)} rounded-lg transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{percentage}٪</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-purple-400" />
              مصرف به تفکیک ابزار AI
            </h2>
            
            {/* Pie Chart CSS-based */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {aiToolsUsage.reduce((acc, tool, index) => {
                    const percentage = (tool.value / totalRequests) * 100
                    const prevPercentage = aiToolsUsage
                      .slice(0, index)
                      .reduce((sum, t) => sum + (t.value / totalRequests) * 100, 0)
                    
                    acc.push(
                      <circle
                        key={tool.name}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={tool.color}
                        strokeWidth="20"
                        strokeDasharray={`${percentage * 2.51} 251`}
                        strokeDashoffset={`${-prevPercentage * 2.51}`}
                        className="transition-all duration-500"
                      />
                    )
                    return acc
                  }, [] as JSX.Element[])}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold">{totalRequests}</p>
                    <p className="text-white/50 text-xs">درخواست</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3">
              {aiToolsUsage.map((tool) => {
                const Icon = tool.icon
                const percentage = Math.round((tool.value / totalRequests) * 100)
                return (
                  <div
                    key={tool.name}
                    className="bg-white/5 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${tool.color}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: tool.color }} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{tool.name}</p>
                      <p className="text-white/50 text-xs">
                        {tool.value.toLocaleString('fa-IR')} ({percentage}٪)
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-400" />
              پرمصرف‌ترین کاربران
            </h2>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* جستجو */}
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl pr-10 pl-4 py-2 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-400 w-40"
                />
              </div>

              {/* فیلتر مدرسه */}
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-400 appearance-none cursor-pointer"
              >
                <option value="all" className="bg-slate-800">همه مدارس</option>
                {schools.map(s => (
                  <option key={s.id} value={s.name} className="bg-slate-800">
                    {s.name}
                  </option>
                ))}
              </select>

              {/* فیلتر زمانی */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-400 appearance-none cursor-pointer"
              >
                <option value="7" className="bg-slate-800">۷ روز اخیر</option>
                <option value="30" className="bg-slate-800">۳۰ روز اخیر</option>
                <option value="90" className="bg-slate-800">۹۰ روز اخیر</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/60 text-sm border-b border-white/10">
                  <th className="text-center pb-3 font-medium w-12">رتبه</th>
                  <th className="text-right pb-3 font-medium">نام کاربر</th>
                  <th className="text-center pb-3 font-medium">نقش</th>
                  <th className="text-center pb-3 font-medium">مدرسه</th>
                  <th className="text-center pb-3 font-medium">تعداد درخواست</th>
                  <th className="text-center pb-3 font-medium">اعتبار مصرفی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                          index === 1 ? 'bg-gray-400/20 text-[var(--lux-text-muted)]' : 
                          index === 2 ? 'bg-orange-500/20 text-orange-400' : 
                          'bg-white/10 text-white/60'}`}
                      >
                        {(index + 1).toLocaleString('fa-IR')}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs
                        ${user.role === 'معلم' ? 'bg-blue-500/20 text-blue-300' :
                          user.role === 'مشاور' ? 'bg-pink-500/20 text-pink-300' :
                          user.role === 'مدیر' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-white/20 text-white/70'}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-center text-white/70 text-sm">
                      {user.school}
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-white font-bold">
                        {user.requests.toLocaleString('fa-IR')}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-emerald-400 font-bold">
                        {user.credits.toLocaleString('fa-IR')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-white/50">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
              <p>کاربری با این فیلتر یافت نشد</p>
            </div>
          )}
        </GlassCard>

        <footer className="text-center text-muted-foreground text-sm py-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
    </DashboardPage>
  )
}
