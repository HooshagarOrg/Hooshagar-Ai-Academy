'use client'

import { useState, useEffect } from 'react'
import { 
  AlertCircle,
  Send,
  Download,
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  Search,
  Filter as FilterIcon
} from 'lucide-react'

interface Debtor {
  student_id: string
  student_name: string
  class_name: string
  parent_name: string
  parent_phone: string
  total_tuition: number
  discount_amount: number
  paid_amount: number
  remaining_amount: number
}

export default function DebtorsReportPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [summary, setSummary] = useState({
    total_debtors: 0,
    total_debt: 0,
    avg_debt: 0
  })
  const [loading, setLoading] = useState(true)
  const [minDebt, setMinDebt] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>([])
  const [showSMSModal, setShowSMSModal] = useState(false)
  const [smsMessage, setSmsMessage] = useState('والد گرامی {parent_name}، بدهی شهریه فرزندتان {student_name} ({class_name}) به مبلغ {amount} ریال می‌باشد. لطفاً در اسرع وقت پرداخت فرمایید. مدرسه هوشاگر')

  useEffect(() => {
    loadDebtors()
  }, [minDebt])

  const loadDebtors = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/financial/debtors?min_debt=${minDebt}`)
      const data = await res.json()
      
      if (data.success) {
        setDebtors(data.debtors || [])
        setSummary(data.summary || { total_debtors: 0, total_debt: 0, avg_debt: 0 })
      }
    } catch (error) {
      console.error('خطا در دریافت بدهکاران:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendSMS = async () => {
    const recipients = selectedDebtors.map(studentId => {
      const debtor = debtors.find(d => d.student_id === studentId)
      return {
        phone: debtor?.parent_phone,
        name: debtor?.parent_name,
        student_id: studentId
      }
    })

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          message: smsMessage
        })
      })

      const data = await res.json()
      
      if (data.success) {
        alert(`✅ ${data.sent} پیامک ارسال شد`)
        setShowSMSModal(false)
        setSelectedDebtors([])
      } else {
        alert(`❌ خطا: ${data.error}`)
      }
    } catch (error) {
      console.error('خطا در ارسال پیامک:', error)
      alert('❌ خطا در ارسال پیامک')
    }
  }

  const handleSelectAll = () => {
    if (selectedDebtors.length === filteredDebtors.length) {
      setSelectedDebtors([])
    } else {
      setSelectedDebtors(filteredDebtors.map(d => d.student_id))
    }
  }

  const filteredDebtors = debtors.filter(d => 
    d.student_name.includes(searchQuery) || 
    d.parent_name.includes(searchQuery) ||
    d.class_name.includes(searchQuery)
  )

  const formatRial = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">گزارش بدهکاران</h1>
              <p className="text-white/60 mt-1">لیست دانش‌آموزان با بدهی شهریه</p>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-red-400" />
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="text-white/60 text-sm mb-1">تعداد بدهکاران</h3>
            <p className="text-white text-3xl font-bold">{summary.total_debtors}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-orange-400" />
              <span className="text-4xl">💰</span>
            </div>
            <h3 className="text-white/60 text-sm mb-1">مجموع بدهی</h3>
            <p className="text-white text-2xl font-bold">{formatRial(summary.total_debt)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-yellow-400" />
              <span className="text-4xl">📊</span>
            </div>
            <h3 className="text-white/60 text-sm mb-1">میانگین بدهی</h3>
            <p className="text-white text-2xl font-bold">{formatRial(summary.avg_debt)}</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* فیلتر حداقل بدهی */}
            <div className="flex-1">
              <label className="text-white/70 text-sm mb-2 block">حداقل بدهی (ریال)</label>
              <input
                type="number"
                value={minDebt}
                onChange={(e) => setMinDebt(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* جستجو */}
            <div className="flex-1">
              <label className="text-white/70 text-sm mb-2 block">جستجو</label>
              <div className="relative">
                <Search className="absolute right-3 top-2.5 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="نام دانش‌آموز یا والد..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl pr-10 pl-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
            </div>

            {/* دکمه‌های اقدام */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSMSModal(true)}
                disabled={selectedDebtors.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  selectedDebtors.length > 0
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
                ارسال پیامک ({selectedDebtors.length})
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-white/70 text-sm border-b border-white/10">
                  <th className="p-4 text-right">
                    <input
                      type="checkbox"
                      checked={selectedDebtors.length === filteredDebtors.length && filteredDebtors.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5"
                    />
                  </th>
                  <th className="p-4 text-right">دانش‌آموز</th>
                  <th className="p-4 text-right">کلاس</th>
                  <th className="p-4 text-right">والد</th>
                  <th className="p-4 text-right">تلفن</th>
                  <th className="p-4 text-right">شهریه کل</th>
                  <th className="p-4 text-right">پرداخت شده</th>
                  <th className="p-4 text-right">بدهی</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebtors.map(debtor => (
                  <tr key={debtor.student_id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedDebtors.includes(debtor.student_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDebtors([...selectedDebtors, debtor.student_id])
                          } else {
                            setSelectedDebtors(selectedDebtors.filter(id => id !== debtor.student_id))
                          }
                        }}
                        className="w-5 h-5"
                      />
                    </td>
                    <td className="p-4 text-white font-medium">{debtor.student_name}</td>
                    <td className="p-4 text-white/70">{debtor.class_name}</td>
                    <td className="p-4 text-white/70">{debtor.parent_name}</td>
                    <td className="p-4 text-white/70 font-mono text-sm">{debtor.parent_phone}</td>
                    <td className="p-4 text-white/70">{formatRial(debtor.total_tuition)}</td>
                    <td className="p-4 text-green-400">{formatRial(debtor.paid_amount)}</td>
                    <td className="p-4 text-red-400 font-bold">{formatRial(debtor.remaining_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SMS Modal */}
        {showSMSModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-2xl w-full border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">ارسال پیامک به بدهکاران</h2>
              
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-white/70 text-sm mb-2">تعداد گیرندگان:</p>
                <p className="text-white text-2xl font-bold">{selectedDebtors.length} نفر</p>
              </div>

              <div className="mb-4">
                <label className="text-white/70 text-sm mb-2 block">متن پیامک</label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                />
                <p className="text-white/50 text-xs mt-1">
                  متغیرها: {'{parent_name}'}, {'{student_name}'}, {'{class_name}'}, {'{amount}'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendSMS}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl text-white font-bold transition-all"
                >
                  <Send className="w-5 h-5" />
                  ارسال پیامک
                </button>
                <button
                  onClick={() => setShowSMSModal(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

