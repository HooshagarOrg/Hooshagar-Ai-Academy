'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  ArrowRight,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Download,
  Filter,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface DailyIncome {
  date: string
  cash: number
  check: number
  total: number
  transactionCount: number
}

interface MonthlyStats {
  month: string
  income: number
  students: number
}

// ============================================
// داده‌های نمونه
// ============================================
const dailyIncomes: DailyIncome[] = [
  { date: '۱۴۰۳/۰۹/۱۶', cash: 45000000, check: 15000000, total: 60000000, transactionCount: 12 },
  { date: '۱۴۰۳/۰۹/۱۵', cash: 38000000, check: 20000000, total: 58000000, transactionCount: 10 },
  { date: '۱۴۰۳/۰۹/۱۴', cash: 52000000, check: 10000000, total: 62000000, transactionCount: 15 },
  { date: '۱۴۰۳/۰۹/۱۳', cash: 40000000, check: 25000000, total: 65000000, transactionCount: 11 },
  { date: '۱۴۰۳/۰۹/۱۲', cash: 48000000, check: 12000000, total: 60000000, transactionCount: 13 },
]

const monthlyStats: MonthlyStats[] = [
  { month: 'آذر ۱۴۰۳', income: 1800000000, students: 580 },
  { month: 'آبان ۱۴۰۳', income: 1750000000, students: 575 },
  { month: 'مهر ۱۴۰۳', income: 1900000000, students: 590 },
]

// ============================================
// فرمت ریالی
// ============================================
function formatRial(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال'
}

function formatRialShort(amount: number): string {
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1) + ' میلیارد ریال'
  } else if (amount >= 1000000) {
    return (amount / 1000000).toFixed(0) + ' میلیون ریال'
  }
  return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال'
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function IncomePage() {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  const [filterPeriod, setFilterPeriod] = useState<string>('week')

  // محاسبات
  const totalIncome = dailyIncomes.reduce((sum, d) => sum + d.total, 0)
  const totalCash = dailyIncomes.reduce((sum, d) => sum + d.cash, 0)
  const totalCheck = dailyIncomes.reduce((sum, d) => sum + d.check, 0)
  const totalTransactions = dailyIncomes.reduce((sum, d) => sum + d.transactionCount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/financial-vp"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
                گزارش درآمد
              </h1>
              <p className="text-white/60 mt-1">
                تحلیل و بررسی درآمد شهریه
              </p>
            </div>
          </div>
        </header>

        {/* آمار کلی */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              <h3 className="text-white/70 text-sm">مجموع درآمد</h3>
            </div>
            <p className="text-2xl font-bold text-white">{formatRialShort(totalIncome)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              <h3 className="text-white/70 text-sm">نقدی</h3>
            </div>
            <p className="text-2xl font-bold text-white">{formatRialShort(totalCash)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-blue-400" />
              <h3 className="text-white/70 text-sm">چک</h3>
            </div>
            <p className="text-2xl font-bold text-white">{formatRialShort(totalCheck)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-cyan-400" />
              <h3 className="text-white/70 text-sm">تراکنش‌ها</h3>
            </div>
            <p className="text-2xl font-bold text-white">{totalTransactions.toLocaleString('fa-IR')}</p>
          </div>
        </div>

        {/* فیلترها */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-wrap items-center gap-4">
            {/* نوع نمایش */}
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-white/70" />
              <div className="flex bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    viewMode === 'daily'
                      ? 'bg-emerald-500 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  روزانه
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    viewMode === 'monthly'
                      ? 'bg-emerald-500 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  ماهانه
                </button>
              </div>
            </div>

            {/* فیلتر بازه */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/70" />
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="week" className="bg-slate-800">هفته اخیر</option>
                <option value="month" className="bg-slate-800">ماه اخیر</option>
                <option value="3months" className="bg-slate-800">۳ ماه اخیر</option>
                <option value="year" className="bg-slate-800">سال اخیر</option>
              </select>
            </div>

            <div className="flex-1"></div>

            {/* دکمه دانلود */}
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all text-sm">
              <Download className="w-4 h-4" />
              دانلود گزارش
            </button>
          </div>
        </div>

        {/* نمودار یا جدول */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            {viewMode === 'daily' ? 'درآمد روزانه' : 'درآمد ماهانه'}
          </h2>

          {/* نمایش روزانه */}
          {viewMode === 'daily' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">تاریخ</th>
                    <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">نقدی</th>
                    <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">چک</th>
                    <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">جمع کل</th>
                    <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">تعداد تراکنش</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyIncomes.map((income, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{income.date}</td>
                      <td className="px-4 py-3 text-green-400">{formatRial(income.cash)}</td>
                      <td className="px-4 py-3 text-blue-400">{formatRial(income.check)}</td>
                      <td className="px-4 py-3 text-white font-bold">{formatRial(income.total)}</td>
                      <td className="px-4 py-3 text-white/70">{income.transactionCount.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* نمایش ماهانه */}
          {viewMode === 'monthly' && (
            <div className="space-y-4">
              {monthlyStats.map((stat, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{stat.month}</h3>
                      <p className="text-white/50 text-sm mt-1">{stat.students.toLocaleString('fa-IR')} دانش‌آموز</p>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-emerald-400">{formatRialShort(stat.income)}</p>
                      <p className="text-white/50 text-sm mt-1">درآمد کل</p>
                    </div>
                  </div>
                  {/* نوار پیشرفت */}
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full"
                      style={{ width: `${(stat.income / 2000000000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* نمودار نموداری ساده */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6">روند درآمد هفتگی</h2>
          <div className="flex items-end justify-between h-64 gap-4">
            {dailyIncomes.map((income, index) => {
              const maxIncome = Math.max(...dailyIncomes.map(d => d.total))
              const height = (income.total / maxIncome) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-emerald-500 to-teal-600 rounded-t-lg transition-all hover:from-emerald-600 hover:to-teal-700"
                    style={{ height: `${height}%` }}
                  >
                  </div>
                  <p className="text-white/70 text-xs">{income.date.split('/')[2]}</p>
                  <p className="text-white/50 text-xs">{formatRialShort(income.total)}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}

