'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  ArrowRight,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Filter,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface SMSTemplate {
  id: string
  title: string
  content: string
  category: string
}

interface SMSLog {
  id: string
  recipient: string
  recipientName: string
  message: string
  status: 'sent' | 'failed' | 'pending'
  sentAt: string
  cost: number
}

// ============================================
// داده‌های نمونه
// ============================================
const templates: SMSTemplate[] = [
  {
    id: '1',
    title: 'یادآوری شهریه',
    content: 'والدین گرامی {parent_name}، شهریه ماه {month} فرزندتان {student_name} تا تاریخ {due_date} باید پرداخت شود.',
    category: 'financial',
  },
  {
    id: '2',
    title: 'غیبت دانش‌آموز',
    content: '{parent_name} عزیز، فرزندتان {student_name} امروز {date} غیبت داشته است.',
    category: 'attendance',
  },
  {
    id: '3',
    title: 'دعوت به جلسه',
    content: 'والدین گرامی {parent_name}، لطفاً در تاریخ {meeting_date} برای مشاوره فرزندتان {student_name} به مدرسه مراجعه فرمایید.',
    category: 'general',
  },
]

const logs: SMSLog[] = [
  {
    id: '1',
    recipient: '09123456789',
    recipientName: 'علی محمدی',
    message: 'والدین گرامی، شهریه ماه آذر فرزندتان تا ۱۵ آذر باید پرداخت شود.',
    status: 'sent',
    sentAt: '۱۴۰۳/۰۹/۱۶ - ۱۰:۳۰',
    cost: 350,
  },
  {
    id: '2',
    recipient: '09121234567',
    recipientName: 'سارا رضایی',
    message: 'سارا عزیز، فرزندتان امروز غیبت داشته است.',
    status: 'sent',
    sentAt: '۱۴۰۳/۰۹/۱۶ - ۰۹:۱۵',
    cost: 300,
  },
  {
    id: '3',
    recipient: '09129876543',
    recipientName: 'محمد احمدی',
    message: 'والدین گرامی، لطفاً در تاریخ ۲۰ آذر برای مشاوره به مدرسه مراجعه فرمایید.',
    status: 'pending',
    sentAt: '۱۴۰۳/۰۹/۱۶ - ۱۱:۰۰',
    cost: 380,
  },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function SMSPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'logs'>('send')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [phoneNumbers, setPhoneNumbers] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSendSMS = async () => {
    setIsSending(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSending(false)
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setPhoneNumbers('')
      setMessage('')
      setSelectedTemplate('')
    }, 2000)
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setMessage(template.content)
    }
  }

  const getStatusIcon = (status: SMSLog['status']) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
    }
  }

  const getStatusLabel = (status: SMSLog['status']) => {
    switch (status) {
      case 'sent': return 'ارسال شده'
      case 'failed': return 'ناموفق'
      case 'pending': return 'در حال ارسال'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
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
                <MessageSquare className="w-8 h-8 text-purple-400" />
                سیستم پیامک
              </h1>
              <p className="text-white/60 mt-1">
                ارسال و مدیریت پیامک‌های مدرسه
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex border-b border-white/10">
            {[
              { key: 'send', label: 'ارسال پیامک', icon: Send },
              { key: 'templates', label: 'الگوهای پیام', icon: FileText },
              { key: 'logs', label: 'تاریخچه ارسال', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all ${
                    activeTab === tab.key
                      ? 'bg-white/10 text-white border-b-2 border-purple-500'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-6">
            {/* ارسال پیامک */}
            {activeTab === 'send' && (
              <div className="space-y-6">
                {/* انتخاب الگو */}
                <div>
                  <label className="text-white/70 text-sm mb-2 block">انتخاب الگوی پیام (اختیاری)</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="" className="bg-slate-800">بدون الگو (پیام دلخواه)</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-800">
                        {t.title} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* شماره موبایل */}
                <div>
                  <label className="text-white/70 text-sm mb-2 block">شماره موبایل گیرندگان</label>
                  <textarea
                    value={phoneNumbers}
                    onChange={(e) => setPhoneNumbers(e.target.value)}
                    placeholder="۰۹۱۲۱۲۳۴۵۶۷&#10;۰۹۱۲۳۴۵۶۷۸۹&#10;(هر شماره در یک خط)"
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <p className="text-white/40 text-xs mt-1">
                    💡 می‌توانید چندین شماره را هر کدام در یک خط وارد کنید
                  </p>
                </div>

                {/* متن پیام */}
                <div>
                  <label className="text-white/70 text-sm mb-2 block">متن پیام</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="متن پیامک خود را بنویسید..."
                    rows={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>{message.length} کاراکتر</span>
                    <span>هزینه تقریبی: {Math.ceil(message.length / 70) * 350} ریال</span>
                  </div>
                </div>

                {/* دکمه ارسال */}
                <button
                  onClick={handleSendSMS}
                  disabled={isSending || !phoneNumbers || !message}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${
                    isSending || !phoneNumbers || !message
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : sent
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
                  }`}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال ارسال...
                    </>
                  ) : sent ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      ارسال شد!
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      ارسال پیامک
                    </>
                  )}
                </button>
              </div>
            )}

            {/* الگوهای پیام */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-bold">{template.title}</h3>
                        <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-lg">
                          {template.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed mt-3">
                      {template.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* تاریخچه ارسال */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">تاریخچه ارسال پیامک</h3>
                  <button className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all text-sm">
                    <Filter className="w-4 h-4" />
                    فیلتر
                  </button>
                </div>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(log.status)}
                          <span className="text-white font-bold">{log.recipientName}</span>
                        </div>
                        <p className="text-white/50 text-sm">{log.recipient}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        log.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                        log.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {getStatusLabel(log.status)}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-3 leading-relaxed">
                      {log.message}
                    </p>
                    <div className="flex items-center justify-between text-white/40 text-xs">
                      <span>{log.sentAt}</span>
                      <span>هزینه: {log.cost.toLocaleString('fa-IR')} ریال</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

