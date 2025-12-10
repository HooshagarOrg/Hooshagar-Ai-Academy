'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Wallet,
  ArrowRight,
  User,
  CreditCard,
  FileText,
  Percent,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  Banknote,
  Building,
  Calendar,
  Hash,
  AlertCircle,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
type PaymentType = 'cash' | 'check' | 'discount'
type PaymentStatus = 'completed' | 'pending' | 'bounced'

interface Student {
  id: string
  name: string
  className: string
  totalTuition: number
  discount: number
  paid: number
}

interface Transaction {
  id: string
  studentId: string
  date: string
  type: PaymentType
  amount: number
  documentNo: string
  status: PaymentStatus
  details?: string
}

// ============================================
// فرمت ریالی
// ============================================
function formatRial(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال'
}

function parseRial(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, '')) || 0
}

// ============================================
// داده‌های نمونه
// ============================================
const students: Student[] = [
  { id: '1', name: 'علی محمدی', className: 'چهارم الف', totalTuition: 50000000, discount: 5000000, paid: 30000000 },
  { id: '2', name: 'سارا رضایی', className: 'چهارم الف', totalTuition: 50000000, discount: 0, paid: 50000000 },
  { id: '3', name: 'محمد احمدی', className: 'چهارم ب', totalTuition: 50000000, discount: 10000000, paid: 20000000 },
  { id: '4', name: 'زهرا کریمی', className: 'پنجم الف', totalTuition: 55000000, discount: 5000000, paid: 40000000 },
]

const initialTransactions: Transaction[] = [
  { id: '1', studentId: '1', date: '۱۴۰۳/۰۹/۱۰', type: 'cash', amount: 15000000, documentNo: 'R-001', status: 'completed' },
  { id: '2', studentId: '1', date: '۱۴۰۳/۰۸/۲۰', type: 'cash', amount: 10000000, documentNo: 'R-002', status: 'completed' },
  { id: '3', studentId: '1', date: '۱۴۰۳/۰۷/۱۵', type: 'discount', amount: 5000000, documentNo: 'D-001', status: 'completed', details: 'تخفیف فرزند کارمند' },
  { id: '4', studentId: '1', date: '۱۴۰۳/۰۹/۰۵', type: 'check', amount: 5000000, documentNo: 'CH-001', status: 'pending', details: 'بانک ملت' },
]

const banks = ['بانک ملی', 'بانک ملت', 'بانک صادرات', 'بانک تجارت', 'بانک پارسیان', 'بانک سامان']

// ============================================
// کامپوننت اصلی
// ============================================
export default function PaymentsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('1')
  const [activeTab, setActiveTab] = useState<'cash' | 'check' | 'discount'>('cash')
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // فرم‌ها
  const [cashForm, setCashForm] = useState({ amount: '', date: '', receiptNo: '' })
  const [checkForm, setCheckForm] = useState({ amount: '', checkNo: '', checkDate: '', bank: '' })
  const [discountForm, setDiscountForm] = useState({ type: 'percent', value: '', reason: '' })

  // دانش‌آموز انتخابی
  const selectedStudent = students.find(s => s.id === selectedStudentId)!
  const payable = selectedStudent.totalTuition - selectedStudent.discount
  const remaining = payable - selectedStudent.paid

  // تراکنش‌های دانش‌آموز
  const studentTransactions = useMemo(() =>
    transactions.filter(t => t.studentId === selectedStudentId),
    [transactions, selectedStudentId]
  )

  // ثبت پرداخت
  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      studentId: selectedStudentId,
      date: '۱۴۰۳/۰۹/۱۶',
      type: activeTab,
      amount: activeTab === 'cash' ? parseRial(cashForm.amount) :
              activeTab === 'check' ? parseRial(checkForm.amount) :
              discountForm.type === 'percent' ? (payable * parseInt(discountForm.value) / 100) : parseRial(discountForm.value),
      documentNo: activeTab === 'cash' ? cashForm.receiptNo :
                  activeTab === 'check' ? checkForm.checkNo : 'D-' + Date.now(),
      status: activeTab === 'check' ? 'pending' : 'completed',
      details: activeTab === 'check' ? checkForm.bank : activeTab === 'discount' ? discountForm.reason : undefined,
    }

    setTransactions(prev => [newTransaction, ...prev])
    setIsSubmitting(false)
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 2000)

    // Reset forms
    setCashForm({ amount: '', date: '', receiptNo: '' })
    setCheckForm({ amount: '', checkNo: '', checkDate: '', bank: '' })
    setDiscountForm({ type: 'percent', value: '', reason: '' })
  }

  const getTypeLabel = (type: PaymentType) => {
    switch (type) {
      case 'cash': return 'نقدی'
      case 'check': return 'چک'
      case 'discount': return 'تخفیف'
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'bounced': return 'bg-red-500/20 text-red-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* ==================== Header ==================== */}
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
                <Wallet className="w-8 h-8 text-emerald-400" />
                مدیریت پرداخت‌ها
              </h1>
              <p className="text-white/60 mt-1">
                ثبت و مدیریت پرداخت‌های شهریه دانش‌آموزان
              </p>
            </div>
          </div>
        </header>

        {/* ==================== انتخاب دانش‌آموز ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            انتخاب دانش‌آموز
          </h2>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full md:w-96 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {students.map(s => (
              <option key={s.id} value={s.id} className="bg-slate-800">
                {s.name} - {s.className}
              </option>
            ))}
          </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ==================== ستون چپ: اطلاعات مالی و فرم ==================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* کارت اطلاعات مالی */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-4">وضعیت مالی {selectedStudent.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-white/50 text-sm mb-1">شهریه کل</p>
                  <p className="text-white font-bold">{formatRial(selectedStudent.totalTuition)}</p>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4 text-center border border-purple-500/20">
                  <p className="text-purple-400 text-sm mb-1">تخفیف</p>
                  <p className="text-purple-300 font-bold">{formatRial(selectedStudent.discount)}</p>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-4 text-center border border-blue-500/20">
                  <p className="text-blue-400 text-sm mb-1">قابل پرداخت</p>
                  <p className="text-blue-300 font-bold">{formatRial(payable)}</p>
                </div>
                <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                  <p className="text-green-400 text-sm mb-1">پرداخت شده</p>
                  <p className="text-green-300 font-bold">{formatRial(selectedStudent.paid)}</p>
                </div>
                <div className={`rounded-xl p-4 text-center border ${
                  remaining > 0
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-green-500/10 border-green-500/20'
                }`}>
                  <p className={`text-sm mb-1 ${remaining > 0 ? 'text-red-400' : 'text-green-400'}`}>باقی‌مانده</p>
                  <p className={`font-bold ${remaining > 0 ? 'text-red-300' : 'text-green-300'}`}>
                    {formatRial(remaining)}
                  </p>
                </div>
              </div>
            </div>

            {/* فرم ثبت پرداخت */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {[
                  { key: 'cash', label: 'پرداخت نقدی', icon: Banknote },
                  { key: 'check', label: 'پرداخت چک', icon: CreditCard },
                  { key: 'discount', label: 'ثبت تخفیف', icon: Percent },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as typeof activeTab)}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all ${
                        activeTab === tab.key
                          ? 'bg-white/10 text-white border-b-2 border-emerald-500'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* فرم‌ها */}
              <div className="p-6">
                {/* پرداخت نقدی */}
                {activeTab === 'cash' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">مبلغ (ریال)</label>
                      <input
                        type="text"
                        value={cashForm.amount}
                        onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
                        placeholder="مبلغ پرداختی"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/70 text-sm mb-2 block">تاریخ</label>
                        <input
                          type="text"
                          value={cashForm.date}
                          onChange={(e) => setCashForm({ ...cashForm, date: e.target.value })}
                          placeholder="۱۴۰۳/۰۹/۱۶"
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-white/70 text-sm mb-2 block">شماره رسید</label>
                        <input
                          type="text"
                          value={cashForm.receiptNo}
                          onChange={(e) => setCashForm({ ...cashForm, receiptNo: e.target.value })}
                          placeholder="R-001"
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* پرداخت چک */}
                {activeTab === 'check' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/70 text-sm mb-2 block">مبلغ چک (ریال)</label>
                        <input
                          type="text"
                          value={checkForm.amount}
                          onChange={(e) => setCheckForm({ ...checkForm, amount: e.target.value })}
                          placeholder="مبلغ چک"
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-white/70 text-sm mb-2 block">شماره چک</label>
                        <input
                          type="text"
                          value={checkForm.checkNo}
                          onChange={(e) => setCheckForm({ ...checkForm, checkNo: e.target.value })}
                          placeholder="CH-001"
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/70 text-sm mb-2 block">تاریخ چک</label>
                        <input
                          type="text"
                          value={checkForm.checkDate}
                          onChange={(e) => setCheckForm({ ...checkForm, checkDate: e.target.value })}
                          placeholder="۱۴۰۳/۱۰/۱۵"
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-white/70 text-sm mb-2 block">بانک</label>
                        <select
                          value={checkForm.bank}
                          onChange={(e) => setCheckForm({ ...checkForm, bank: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                          <option value="" className="bg-slate-800">انتخاب بانک...</option>
                          {banks.map(bank => (
                            <option key={bank} value={bank} className="bg-slate-800">{bank}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ثبت تخفیف */}
                {activeTab === 'discount' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">نوع تخفیف</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setDiscountForm({ ...discountForm, type: 'percent' })}
                          className={`flex-1 py-2 rounded-xl border transition-all ${
                            discountForm.type === 'percent'
                              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-white/60'
                          }`}
                        >
                          درصدی
                        </button>
                        <button
                          onClick={() => setDiscountForm({ ...discountForm, type: 'fixed' })}
                          className={`flex-1 py-2 rounded-xl border transition-all ${
                            discountForm.type === 'fixed'
                              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-white/60'
                          }`}
                        >
                          مبلغ ثابت
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">
                        {discountForm.type === 'percent' ? 'درصد تخفیف' : 'مبلغ تخفیف (ریال)'}
                      </label>
                      <input
                        type="text"
                        value={discountForm.value}
                        onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                        placeholder={discountForm.type === 'percent' ? '۱۰' : '۵,۰۰۰,۰۰۰'}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">دلیل تخفیف</label>
                      <input
                        type="text"
                        value={discountForm.reason}
                        onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
                        placeholder="مثال: فرزند کارمند، تخفیف خانوادگی..."
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                )}

                {/* دکمه ثبت */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full mt-6 flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all
                    ${isSubmitting
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : isSubmitted
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال ثبت...
                    </>
                  ) : isSubmitted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      ثبت شد!
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      ثبت {activeTab === 'cash' ? 'پرداخت' : activeTab === 'check' ? 'چک' : 'تخفیف'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ==================== ستون راست: تراکنش‌ها ==================== */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                تراکنش‌ها
              </h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {studentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${
                        transaction.type === 'cash' ? 'bg-green-500/20 text-green-400' :
                        transaction.type === 'check' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {getTypeLabel(transaction.type)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${getStatusBadge(transaction.status)}`}>
                        {transaction.status === 'completed' ? 'تکمیل' : transaction.status === 'pending' ? 'در انتظار' : 'برگشتی'}
                      </span>
                    </div>
                    <p className="text-white font-bold text-lg mb-1">
                      {formatRial(transaction.amount)}
                    </p>
                    <div className="flex items-center justify-between text-white/50 text-xs">
                      <span>{transaction.date}</span>
                      <span>{transaction.documentNo}</span>
                    </div>
                    {transaction.details && (
                      <p className="text-white/40 text-xs mt-2">{transaction.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
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




























