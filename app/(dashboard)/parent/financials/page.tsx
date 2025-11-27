'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Wallet,
  ArrowRight,
  CreditCard,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Percent,
  Info,
  Download,
  Banknote,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
type PaymentType = 'cash' | 'check' | 'discount'
type PaymentStatus = 'completed' | 'pending' | 'bounced'

interface Transaction {
  id: string
  date: string
  type: PaymentType
  amount: number
  documentNo: string
  status: PaymentStatus
  details?: string
}

interface FinancialSummary {
  totalTuition: number
  discount: number
  paid: number
  remaining: number
}

// ============================================
// فرمت ریالی
// ============================================
function formatRial(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال'
}

// ============================================
// داده‌های نمونه
// ============================================
const financialData: FinancialSummary = {
  totalTuition: 50000000,
  discount: 5000000,
  paid: 30000000,
  remaining: 15000000,
}

const transactions: Transaction[] = [
  { id: '1', date: '۱۴۰۳/۰۹/۱۰', type: 'cash', amount: 15000000, documentNo: 'R-001', status: 'completed' },
  { id: '2', date: '۱۴۰۳/۰۸/۲۰', type: 'cash', amount: 10000000, documentNo: 'R-002', status: 'completed' },
  { id: '3', date: '۱۴۰۳/۰۷/۱۵', type: 'discount', amount: 5000000, documentNo: 'D-001', status: 'completed', details: 'تخفیف فرزند کارمند' },
  { id: '4', date: '۱۴۰۳/۰۹/۰۵', type: 'check', amount: 5000000, documentNo: 'CH-001', status: 'pending', details: 'بانک ملت - سررسید ۱۴۰۳/۱۰/۱۵' },
]

const studentName = 'علی محمدی'
const className = 'چهارم الف'

// ============================================
// کامپوننت اصلی
// ============================================
export default function ParentFinancialsPage() {
  const payable = financialData.totalTuition - financialData.discount
  const paidPercent = Math.round((financialData.paid / payable) * 100)

  const getTypeLabel = (type: PaymentType) => {
    switch (type) {
      case 'cash': return 'نقدی'
      case 'check': return 'چک'
      case 'discount': return 'تخفیف'
    }
  }

  const getTypeIcon = (type: PaymentType) => {
    switch (type) {
      case 'cash': return Banknote
      case 'check': return CreditCard
      case 'discount': return Percent
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'completed': return { bg: 'bg-green-500/20 text-green-400', label: 'تکمیل شده', icon: CheckCircle2 }
      case 'pending': return { bg: 'bg-yellow-500/20 text-yellow-400', label: 'در انتظار', icon: Clock }
      case 'bounced': return { bg: 'bg-red-500/20 text-red-400', label: 'برگشتی', icon: AlertCircle }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/parent"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Wallet className="w-8 h-8 text-purple-400" />
                امور مالی
              </h1>
              <p className="text-white/60 mt-1">
                وضعیت مالی {studentName} - {className}
              </p>
            </div>
          </div>
        </header>

        {/* ==================== کارت‌های خلاصه مالی ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-white/50 text-sm">شهریه کل</p>
            <p className="text-white text-lg font-bold mt-1">{formatRial(financialData.totalTuition)}</p>
          </div>

          <div className="bg-purple-500/20 backdrop-blur-lg rounded-2xl p-5 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-purple-300 text-sm">تخفیف</p>
            <p className="text-white text-lg font-bold mt-1">{formatRial(financialData.discount)}</p>
          </div>

          <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-5 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-green-300 text-sm">پرداخت شده</p>
            <p className="text-white text-lg font-bold mt-1">{formatRial(financialData.paid)}</p>
          </div>

          <div className={`backdrop-blur-lg rounded-2xl p-5 border ${
            financialData.remaining > 0
              ? 'bg-red-500/20 border-red-500/30'
              : 'bg-green-500/20 border-green-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                financialData.remaining > 0 ? 'bg-red-500/20' : 'bg-green-500/20'
              }`}>
                <AlertCircle className={`w-5 h-5 ${financialData.remaining > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
            </div>
            <p className={`text-sm ${financialData.remaining > 0 ? 'text-red-300' : 'text-green-300'}`}>
              باقی‌مانده
            </p>
            <p className="text-white text-lg font-bold mt-1">{formatRial(financialData.remaining)}</p>
          </div>
        </div>

        {/* ==================== نمودار پیشرفت پرداخت ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              پیشرفت پرداخت
            </h2>
            <span className="text-white/60 text-sm">
              {formatRial(financialData.paid)} از {formatRial(payable)}
            </span>
          </div>

          <div className="relative">
            <div className="h-8 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 flex items-center justify-end px-3"
                style={{ width: `${paidPercent}%` }}
              >
                <span className="text-white text-sm font-bold">{paidPercent}%</span>
              </div>
            </div>
            
            {/* Milestones */}
            <div className="flex justify-between mt-2 text-xs text-white/40">
              <span>۰٪</span>
              <span>۲۵٪</span>
              <span>۵۰٪</span>
              <span>۷۵٪</span>
              <span>۱۰۰٪</span>
            </div>
          </div>

          {financialData.remaining > 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex items-start gap-2">
              <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-sm">
                مبلغ {formatRial(financialData.remaining)} باقی‌مانده است. لطفاً برای پرداخت به واحد مالی مراجعه فرمایید.
              </p>
            </div>
          )}
        </div>

        {/* ==================== جدول تراکنش‌ها ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              تاریخچه تراکنش‌ها
            </h2>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg text-sm transition-all">
              <Download className="w-4 h-4" />
              دانلود
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/50 border-b border-white/10">
                  <th className="text-right py-3 px-4 font-medium">تاریخ</th>
                  <th className="text-right py-3 px-4 font-medium">نوع</th>
                  <th className="text-right py-3 px-4 font-medium">مبلغ</th>
                  <th className="text-right py-3 px-4 font-medium">شماره سند</th>
                  <th className="text-center py-3 px-4 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((transaction) => {
                  const TypeIcon = getTypeIcon(transaction.type)
                  const status = getStatusBadge(transaction.status)
                  const StatusIcon = status.icon

                  return (
                    <tr key={transaction.id} className="hover:bg-white/5 transition-all">
                      <td className="py-4 px-4 text-white">{transaction.date}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                          transaction.type === 'cash' ? 'bg-green-500/20 text-green-400' :
                          transaction.type === 'check' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          <TypeIcon className="w-3 h-3" />
                          {getTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white font-medium">
                        {formatRial(transaction.amount)}
                      </td>
                      <td className="py-4 px-4 text-white/60">{transaction.documentNo}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${status.bg}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {transactions.some(t => t.details) && (
            <div className="mt-4 space-y-2">
              {transactions.filter(t => t.details).map(t => (
                <div key={t.id} className="text-white/40 text-xs flex items-center gap-2">
                  <span className="text-white/60">{t.documentNo}:</span>
                  {t.details}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==================== اطلاع‌رسانی پرداخت ==================== */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">نحوه پرداخت</h3>
              <p className="text-white/70 leading-relaxed mb-4">
                برای پرداخت شهریه می‌توانید به یکی از روش‌های زیر اقدام نمایید:
              </p>
              <ul className="text-white/60 text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  مراجعه حضوری به واحد مالی مدرسه
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  واریز به شماره حساب: ۱۲۳۴-۵۶۷۸-۹۰۱۲ بانک ملت
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  تحویل چک به واحد مالی
                </li>
              </ul>
              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-yellow-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  پس از واریز، فیش پرداختی را به واحد مالی ارائه دهید.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== دکمه تماس ==================== */}
        <div className="mt-6 text-center">
          <a
            href="tel:02112345678"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
          >
            <span>📞</span>
            تماس با واحد مالی: ۰۲۱-۱۲۳۴۵۶۷۸
          </a>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}

