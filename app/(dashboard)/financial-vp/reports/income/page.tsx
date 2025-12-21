'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Calendar, DollarSign, CreditCard, Percent, Download } from 'lucide-react'

interface DailyStat {
  date: string
  total_income: number
  cash_income: number
  check_income: number
  transaction_count: number
}

export default function IncomeReportPage() {
  const [stats, setStats] = useState<DailyStat[]>([])
  const [summary, setSummary] = useState({
    total_income: 0,
    cash_income: 0,
    check_income: 0,
    total_discounts: 0,
    avg_daily_income: 0
  })
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [groupBy, setGroupBy] = useState('day')

  useEffect(() => {
    // تنظیم تاریخ پیش‌فرض (30 روز گذشته)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    setDateTo(today.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadIncome()
    }
  }, [dateFrom, dateTo, groupBy])

  const loadIncome = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/financial/income?date_from=${dateFrom}&date_to=${dateTo}&group_by=${groupBy}`)
      const data = await res.json()
      
      if (data.success) {
        setStats(data.chartData || [])
        setSummary(data.summary || {})
      }
    } catch (error) {
      console.error('خطا در دریافت گزارش درآمد:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatRial = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR')
  }

  if (loading && stats.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">گزارش درآمد</h1>
              <p className="text-white/60 mt-1">تحلیل درآمد و تراکنش‌های مالی</p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">از تاریخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">تا تاریخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">گروه‌بندی</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="day" className="bg-slate-800">روزانه</option>
                <option value="month" className="bg-slate-800">ماهانه</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <span className="text-4xl">💰</span>
            </div>
            <h3 className="text-white/60 text-sm mb-1">کل درآمد</h3>
            <p className="text-white text-2xl font-bold">{formatRial(summary.total_income)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-emerald-400" />
              <span className="text-4xl">💵</span>
            </div>
            <h3 className="text-white/60 text-sm mb-1">نقدی</h3>
            <p className="text-white text-2xl font-bold">{formatRial(summary.cash_income)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-8 h-8 text-blue-400" />
              <span className="text-4xl">💳</span>
            </div>
            <h3 className="text-white/60 text-sm mb-1">چکی</h3>
            <p className="text-white text-2xl font-bold">{formatRial(summary.check_income)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-8 h-8 text-yellow-400" />
              <span className="text-4xl">🎁</span>
            </div>
            <h3 className="text-white/60 text-sm mb-1">تخفیفات</h3>
            <p className="text-white text-2xl font-bold">{formatRial(summary.total_discounts)}</p>
          </div>
        </div>

        {/* Chart (Simple Bar Chart) */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            نمودار درآمد
          </h2>

          <div className="space-y-3">
            {stats.map((stat, index) => {
              const maxIncome = Math.max(...stats.map(s => s.total_income))
              const widthPercent = (stat.total_income / maxIncome) * 100

              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">
                      {formatDate(stat.date)}
                    </span>
                    <span className="text-white font-bold">
                      {formatRial(stat.total_income)}
                    </span>
                  </div>
                  <div className="relative h-10 bg-white/5 rounded-lg overflow-hidden">
                    <div 
                      className="absolute inset-y-0 right-0 bg-gradient-to-l from-green-500 to-emerald-600 rounded-lg transition-all duration-500 group-hover:from-green-400 group-hover:to-emerald-500"
                      style={{ width: `${widthPercent}%` }}
                    >
                      <div className="flex items-center justify-start h-full px-4 gap-3">
                        <span className="text-white text-xs font-medium">
                          💵 {formatRial(stat.cash_income)}
                        </span>
                        <span className="text-white text-xs font-medium">
                          💳 {formatRial(stat.check_income)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-white/70 text-sm border-b border-white/10">
                  <th className="p-4 text-right">تاریخ</th>
                  <th className="p-4 text-right">کل درآمد</th>
                  <th className="p-4 text-right">نقدی</th>
                  <th className="p-4 text-right">چکی</th>
                  <th className="p-4 text-right">تعداد تراکنش</th>
                  <th className="p-4 text-right">میانگین تراکنش</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-4 text-white font-medium">{formatDate(stat.date)}</td>
                    <td className="p-4 text-green-400 font-bold">{formatRial(stat.total_income)}</td>
                    <td className="p-4 text-emerald-400">{formatRial(stat.cash_income)}</td>
                    <td className="p-4 text-blue-400">{formatRial(stat.check_income)}</td>
                    <td className="p-4 text-white/70">{stat.transaction_count}</td>
                    <td className="p-4 text-white/70">
                      {formatRial(stat.transaction_count > 0 ? Math.round(stat.total_income / stat.transaction_count) : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5">
                <tr className="text-white font-bold border-t-2 border-white/20">
                  <td className="p-4">جمع کل</td>
                  <td className="p-4 text-green-400">{formatRial(summary.total_income)}</td>
                  <td className="p-4 text-emerald-400">{formatRial(summary.cash_income)}</td>
                  <td className="p-4 text-blue-400">{formatRial(summary.check_income)}</td>
                  <td className="p-4" colSpan={2}>میانگین روزانه: {formatRial(summary.avg_daily_income)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

