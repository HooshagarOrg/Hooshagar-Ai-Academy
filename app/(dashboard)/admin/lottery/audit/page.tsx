'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Shield,
  ArrowRight,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Printer,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface LotteryAudit {
  id: string
  targetGrade: number
  academicYear: string
  status: string
  totalRegistrations: number
  successful: number
  failed: number
  executedAt: string
  executedBy: string
}

interface LotteryLog {
  id: string
  type: string
  message: string
  timestamp: string
  studentName?: string
  className?: string
}

// ============================================
// داده‌های نمونه
// ============================================
const sampleLotteries: LotteryAudit[] = [
  {
    id: '1',
    targetGrade: 2,
    academicYear: '۱۴۰۳-۱۴۰۴',
    status: 'completed',
    totalRegistrations: 120,
    successful: 115,
    failed: 5,
    executedAt: '۱۴۰۳/۰۳/۱۵ - ۱۰:۰۰',
    executedBy: 'محمد رضایی (مدیر)',
  },
  {
    id: '2',
    targetGrade: 3,
    academicYear: '۱۴۰۳-۱۴۰۴',
    status: 'completed',
    totalRegistrations: 95,
    successful: 92,
    failed: 3,
    executedAt: '۱۴۰۳/۰۳/۱۶ - ۱۱:۳۰',
    executedBy: 'محمد رضایی (مدیر)',
  },
]

const sampleLogs: LotteryLog[] = [
  { id: '1', type: 'started', message: 'قرعه‌کشی شروع شد', timestamp: '۱۴۰۳/۰۳/۱۵ - ۱۰:۰۰:۰۰' },
  { id: '2', type: 'assigned', message: 'تخصیص به انتخاب 1', timestamp: '۱۴۰۳/۰۳/۱۵ - ۱۰:۰۰:۰۵', studentName: 'علی محمدی', className: 'دوم الف' },
  { id: '3', type: 'assigned', message: 'تخصیص به انتخاب 2', timestamp: '۱۴۰۳/۰۳/۱۵ - ۱۰:۰۰:۰۶', studentName: 'سارا رضایی', className: 'دوم ب' },
  { id: '4', type: 'failed', message: 'ظرفیت کلاس‌های انتخابی تکمیل شده', timestamp: '۱۴۰۳/۰۳/۱۵ - ۱۰:۰۰:۰۷', studentName: 'محمد احمدی' },
  { id: '5', type: 'completed', message: 'قرعه‌کشی با موفقیت انجام شد', timestamp: '۱۴۰۳/۰۳/۱۵ - ۱۰:۰۱:۳۰' },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function LotteryAuditPage() {
  const [selectedLottery, setSelectedLottery] = useState<string>('1')
  const [showDetailedLog, setShowDetailedLog] = useState(false)

  const selectedData = sampleLotteries.find(l => l.id === selectedLottery)
  const successRate = selectedData ? ((selectedData.successful / selectedData.totalRegistrations) * 100).toFixed(1) : '0'

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'started': return <Clock className="w-4 h-4 text-blue-400" />
      case 'assigned': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'started': return 'bg-blue-500/20 text-blue-400'
      case 'assigned': return 'bg-green-500/20 text-green-400'
      case 'failed': return 'bg-red-500/20 text-red-400'
      case 'completed': return 'bg-emerald-500/20 text-emerald-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/lottery"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-emerald-400" />
                ممیزی و بازرسی قرعه‌کشی
              </h1>
              <p className="text-white/60 mt-1">
                مشاهده جزئیات کامل، لاگ‌ها و گزارش‌های قابل چاپ
              </p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all">
                <Printer className="w-4 h-4" />
                چاپ گزارش
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all">
                <Download className="w-4 h-4" />
                دانلود PDF
              </button>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ستون چپ: لیست قرعه‌کشی‌ها */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                قرعه‌کشی‌های انجام شده
              </h2>
              <div className="space-y-3">
                {sampleLotteries.map((lottery) => (
                  <button
                    key={lottery.id}
                    onClick={() => setSelectedLottery(lottery.id)}
                    className={`w-full text-right p-4 rounded-xl border transition-all ${
                      selectedLottery === lottery.id
                        ? 'bg-emerald-500/20 border-emerald-500/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold">پایه {lottery.targetGrade}</span>
                      <span className="px-2 py-0.5 rounded-lg text-xs bg-green-500/20 text-green-400">
                        تکمیل شده
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">{lottery.academicYear}</p>
                    <p className="text-white/40 text-xs mt-2">{lottery.executedAt}</p>
                    <div className="flex gap-2 mt-3 text-xs">
                      <span className="text-green-400">✓ {lottery.successful}</span>
                      <span className="text-red-400">✗ {lottery.failed}</span>
                      <span className="text-white/60">از {lottery.totalRegistrations}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ستون راست: جزئیات */}
          <div className="lg:col-span-2 space-y-6">
            {selectedData && (
              <>
                {/* کارت اطلاعات کلی */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">اطلاعات کلی</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/60 text-sm mb-1">پایه تحصیلی</p>
                      <p className="text-2xl font-bold text-white">پایه {selectedData.targetGrade}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/60 text-sm mb-1">سال تحصیلی</p>
                      <p className="text-2xl font-bold text-white">{selectedData.academicYear}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/60 text-sm mb-1">زمان اجرا</p>
                      <p className="text-white font-bold">{selectedData.executedAt}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/60 text-sm mb-1">اجرا شده توسط</p>
                      <p className="text-white font-bold">{selectedData.executedBy}</p>
                    </div>
                  </div>
                </div>

                {/* آمار */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">آمار نتایج</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                      <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-blue-400 text-sm mb-1">کل ثبت‌نام</p>
                      <p className="text-3xl font-bold text-blue-300">{selectedData.totalRegistrations}</p>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 text-sm mb-1">موفق</p>
                      <p className="text-3xl font-bold text-green-300">{selectedData.successful}</p>
                    </div>
                    
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                      <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      <p className="text-red-400 text-sm mb-1">ناموفق</p>
                      <p className="text-3xl font-bold text-red-300">{selectedData.failed}</p>
                    </div>
                    
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-emerald-400 text-sm mb-1">نرخ موفقیت</p>
                      <p className="text-3xl font-bold text-emerald-300">{successRate}%</p>
                    </div>
                  </div>
                </div>

                {/* لاگ‌ها */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      لاگ‌های اجرا
                    </h3>
                    <button
                      onClick={() => setShowDetailedLog(!showDetailedLog)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      {showDetailedLog ? 'نمایش خلاصه' : 'نمایش کامل'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {sampleLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getLogIcon(log.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-lg text-xs ${getLogBadge(log.type)}`}>
                                {log.type === 'started' ? 'شروع' :
                                 log.type === 'assigned' ? 'تخصیص' :
                                 log.type === 'failed' ? 'ناموفق' : 'تکمیل'}
                              </span>
                              <span className="text-white/40 text-xs">{log.timestamp}</span>
                            </div>
                            <p className="text-white text-sm">{log.message}</p>
                            {showDetailedLog && log.studentName && (
                              <div className="mt-2 text-xs text-white/60">
                                <p>دانش‌آموز: {log.studentName}</p>
                                {log.className && <p>کلاس: {log.className}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* تاییدیه */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-emerald-300 font-bold mb-2">تأییدیه شفافیت</h4>
                      <p className="text-emerald-200/80 text-sm leading-relaxed">
                        این قرعه‌کشی با رعایت کامل اصول عدالت و شفافیت انجام شده است. 
                        تمامی ثبت‌نام‌ها به صورت تصادفی شافل شده و به ترتیب پردازش شده‌اند.
                        هیچ‌گونه دخالت انسانی در فرآیند قرعه‌کشی وجود نداشته است.
                      </p>
                      <div className="mt-4 pt-4 border-t border-emerald-500/20">
                        <p className="text-emerald-300 text-sm">
                          ✓ الگوریتم: Random Shuffle با توزیع یکنواخت
                        </p>
                        <p className="text-emerald-300 text-sm">
                          ✓ زمان‌بندی: طبق برنامه اعلام شده
                        </p>
                        <p className="text-emerald-300 text-sm">
                          ✓ ذخیره: تمام لاگ‌ها در دیتابیس ثبت شده
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر | گزارش قابل ارائه به ناظران و والدین</p>
        </footer>
      </div>
    </div>
  )
}

