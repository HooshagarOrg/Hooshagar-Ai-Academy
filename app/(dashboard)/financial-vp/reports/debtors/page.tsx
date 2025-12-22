'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  ArrowRight,
  Users,
  AlertTriangle,
  Filter,
  Download,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface Debtor {
  id: string
  studentName: string
  className: string
  parentName: string
  parentPhone: string
  totalTuition: number
  paid: number
  remaining: number
  daysOverdue: number
}

// ============================================
// داده‌های نمونه
// ============================================
const debtors: Debtor[] = [
  {
    id: '1',
    studentName: 'علی محمدی',
    className: 'چهارم الف',
    parentName: 'محمد محمدی',
    parentPhone: '09123456789',
    totalTuition: 50000000,
    paid: 30000000,
    remaining: 20000000,
    daysOverdue: 45,
  },
  {
    id: '2',
    studentName: 'محمد احمدی',
    className: 'چهارم ب',
    parentName: 'احمد احمدی',
    parentPhone: '09121234567',
    totalTuition: 50000000,
    paid: 20000000,
    remaining: 30000000,
    daysOverdue: 60,
  },
  {
    id: '3',
    studentName: 'زهرا کریمی',
    className: 'پنجم الف',
    parentName: 'حسین کریمی',
    parentPhone: '09129876543',
    totalTuition: 55000000,
    paid: 40000000,
    remaining: 15000000,
    daysOverdue: 30,
  },
  {
    id: '4',
    studentName: 'فاطمه رضایی',
    className: 'پنجم ب',
    parentName: 'رضا رضایی',
    parentPhone: '09122345678',
    totalTuition: 55000000,
    paid: 35000000,
    remaining: 20000000,
    daysOverdue: 50,
  },
]

// ============================================
// فرمت ریالی
// ============================================
function formatRial(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال'
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function DebtorsPage() {
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterDays, setFilterDays] = useState<string>('all')
  const [selectedDebtors, setSelectedDebtors] = useState<Set<string>>(new Set())
  const [isSendingSMS, setIsSendingSMS] = useState(false)
  const [smsSent, setSmsSent] = useState(false)

  // محاسبات
  const totalDebt = debtors.reduce((sum, d) => sum + d.remaining, 0)
  const totalDebtors = debtors.length

  // فیلتر
  const filteredDebtors = debtors.filter(d => {
    if (filterClass !== 'all' && !d.className.includes(filterClass)) return false
    if (filterDays === '30' && d.daysOverdue < 30) return false
    if (filterDays === '60' && d.daysOverdue < 60) return false
    return true
  })

  // انتخاب همه
  const handleSelectAll = () => {
    if (selectedDebtors.size === filteredDebtors.length) {
      setSelectedDebtors(new Set())
    } else {
      setSelectedDebtors(new Set(filteredDebtors.map(d => d.id)))
    }
  }

  // انتخاب یکی
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedDebtors)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDebtors(newSelected)
  }

  // ارسال پیامک گروهی
  const handleSendBulkSMS = async () => {
    setIsSendingSMS(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSendingSMS(false)
    setSmsSent(true)
    setTimeout(() => {
      setSmsSent(false)
      setSelectedDebtors(new Set())
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-amber-900 p-4 md:p-6 lg:p-8" dir="rtl">
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
                <AlertTriangle className="w-8 h-8 text-red-400" />
                گزارش بدهکاران
              </h1>
              <p className="text-white/60 mt-1">
                مدیریت و پیگیری بدهی‌های شهریه
              </p>
            </div>
          </div>
        </header>

        {/* آمار کلی */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-red-400" />
              <h3 className="text-white/70">تعداد بدهکاران</h3>
            </div>
            <p className="text-3xl font-bold text-white">{totalDebtors.toLocaleString('fa-IR')}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-orange-400" />
              <h3 className="text-white/70">مجموع بدهی</h3>
            </div>
            <p className="text-3xl font-bold text-white">{formatRial(totalDebt)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <h3 className="text-white/70">انتخاب شده</h3>
            </div>
            <p className="text-3xl font-bold text-white">{selectedDebtors.size.toLocaleString('fa-IR')}</p>
          </div>
        </div>

        {/* فیلترها و اقدامات */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-wrap items-center gap-4">
            {/* فیلتر پایه */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/70" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="all" className="bg-slate-800">همه پایه‌ها</option>
                <option value="چهارم" className="bg-slate-800">چهارم</option>
                <option value="پنجم" className="bg-slate-800">پنجم</option>
                <option value="ششم" className="bg-slate-800">ششم</option>
              </select>
            </div>

            {/* فیلتر تعداد روز */}
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="all" className="bg-slate-800">همه بدهکاران</option>
              <option value="30" className="bg-slate-800">بیش از ۳۰ روز</option>
              <option value="60" className="bg-slate-800">بیش از ۶۰ روز</option>
            </select>

            <div className="flex-1"></div>

            {/* دکمه‌های اقدام */}
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all text-sm">
              <Download className="w-4 h-4" />
              دانلود اکسل
            </button>

            <button
              onClick={handleSendBulkSMS}
              disabled={selectedDebtors.size === 0 || isSendingSMS}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all ${
                selectedDebtors.size === 0 || isSendingSMS
                  ? 'bg-white/20 text-white/50 cursor-not-allowed'
                  : smsSent
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
              }`}
            >
              {isSendingSMS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : smsSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  ارسال شد!
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  ارسال پیامک گروهی ({selectedDebtors.size})
                </>
              )}
            </button>
          </div>
        </div>

        {/* جدول بدهکاران */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedDebtors.size === filteredDebtors.length && filteredDebtors.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-red-500 focus:ring-red-500/50"
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">نام دانش‌آموز</th>
                  <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">پایه</th>
                  <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">نام ولی</th>
                  <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">شماره تماس</th>
                  <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">شهریه کل</th>
                  <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">پرداخت شده</th>
                  <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">باقی‌مانده</th>
                  <th className="px-4 py-3 text-right text-white/70 text-sm font-medium">روز تاخیر</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebtors.map((debtor) => (
                  <tr key={debtor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedDebtors.has(debtor.id)}
                        onChange={() => handleToggleSelect(debtor.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-red-500 focus:ring-red-500/50"
                      />
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{debtor.studentName}</td>
                    <td className="px-4 py-3 text-white/70">{debtor.className}</td>
                    <td className="px-4 py-3 text-white/70">{debtor.parentName}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{debtor.parentPhone}</td>
                    <td className="px-4 py-3 text-white/70">{formatRial(debtor.totalTuition)}</td>
                    <td className="px-4 py-3 text-green-400">{formatRial(debtor.paid)}</td>
                    <td className="px-4 py-3 text-red-400 font-bold">{formatRial(debtor.remaining)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        debtor.daysOverdue >= 60
                          ? 'bg-red-500/20 text-red-400'
                          : debtor.daysOverdue >= 30
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {debtor.daysOverdue.toLocaleString('fa-IR')} روز
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

