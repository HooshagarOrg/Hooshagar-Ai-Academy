'use client'

import { useState, useEffect } from 'react'
import { 
  Send, 
  FileText, 
  Plus, 
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Calendar,
  Search,
  Filter
} from 'lucide-react'

interface Template {
  id: string
  title: string
  body: string
  category: string
  usage_count: number
}

interface Student {
  id: string
  full_name: string
  class_name: string
  parent_name: string
  parent_phone: string
  remaining_amount?: number
}

interface SmsLog {
  id: string
  recipient_name: string
  recipient_phone: string
  message: string
  status: string
  sent_at: string
  cost: number
}

export default function SMSManagementPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history'>('send')
  const [templates, setTemplates] = useState<Template[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [smsHistory, setSmsHistory] = useState<SmsLog[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [message, setMessage] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // فرم الگوی جدید
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    body: '',
    category: 'financial'
  })

  useEffect(() => {
    loadTemplates()
    loadStudents()
    loadSmsHistory()
  }, [])

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/sms/templates')
      const data = await res.json()
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('خطا در دریافت الگوها:', error)
    }
  }

  const loadStudents = async () => {
    try {
      // فرض می‌کنیم API لیست دانش‌آموزان را برمی‌گرداند
      const res = await fetch('/api/students')
      const data = await res.json()
      if (data.success) {
        setStudents(data.students)
      }
    } catch (error) {
      console.error('خطا در دریافت دانش‌آموزان:', error)
    }
  }

  const loadSmsHistory = async () => {
    try {
      const res = await fetch('/api/sms/logs')
      const data = await res.json()
      if (data.success) {
        setSmsHistory(data.logs)
      }
    } catch (error) {
      console.error('خطا در دریافت تاریخچه:', error)
    }
  }

  const handleSendSMS = async () => {
    if (!message || selectedStudents.length === 0) {
      alert('لطفاً متن پیامک و گیرندگان را انتخاب کنید')
      return
    }

    setSending(true)
    try {
      const recipients = selectedStudents.map(studentId => {
        const student = students.find(s => s.id === studentId)
        return {
          phone: student?.parent_phone,
          name: student?.parent_name,
          student_id: studentId
        }
      })

      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          message,
          template_id: selectedTemplate || null
        })
      })

      const data = await res.json()
      
      if (data.success) {
        alert(`✅ ${data.sent} پیامک ارسال شد!`)
        setMessage('')
        setSelectedStudents([])
        loadSmsHistory()
      } else {
        alert(`❌ خطا: ${data.error}`)
      }
    } catch (error) {
      console.error('خطا در ارسال پیامک:', error)
      alert('❌ خطا در ارسال پیامک')
    } finally {
      setSending(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.title || !newTemplate.body) {
      alert('لطفاً عنوان و متن الگو را وارد کنید')
      return
    }

    try {
      const res = await fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      })

      const data = await res.json()
      
      if (data.success) {
        alert('✅ الگو با موفقیت ایجاد شد')
        setShowNewTemplate(false)
        setNewTemplate({ title: '', body: '', category: 'financial' })
        loadTemplates()
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('خطا در ایجاد الگو:', error)
      alert('❌ خطا در ایجاد الگو')
    }
  }

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.id))
    }
  }

  const filteredStudents = students.filter(s => 
    s.full_name.includes(searchQuery) || 
    s.parent_name.includes(searchQuery) ||
    s.parent_phone.includes(searchQuery)
  )

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      financial: '💰 مالی',
      academic: '📚 تحصیلی',
      event: '📅 رویداد',
      other: '📢 سایر'
    }
    return labels[category] || category
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
          <CheckCircle2 className="w-3 h-3" /> ارسال شد
        </span>
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
          <Clock className="w-3 h-3" /> در انتظار
        </span>
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
          <XCircle className="w-3 h-3" /> ناموفق
        </span>
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-900 to-blue-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">مدیریت پیامک</h1>
              <p className="text-white/60 mt-1">ارسال و مدیریت پیامک‌های مدرسه</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          {[
            { key: 'send', label: 'ارسال پیامک', icon: Send },
            { key: 'templates', label: 'الگوها', icon: FileText },
            { key: 'history', label: 'تاریخچه', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-teal-900 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tab: ارسال پیامک */}
          {activeTab === 'send' && (
            <>
              {/* فرم ارسال */}
              <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-teal-400" />
                  ارسال پیامک جدید
                </h2>

                {/* انتخاب الگو */}
                <div className="mb-4">
                  <label className="text-white/70 text-sm mb-2 block">انتخاب الگو (اختیاری)</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value)
                      const template = templates.find(t => t.id === e.target.value)
                      if (template) setMessage(template.body)
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option value="" className="bg-slate-800">بدون الگو</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-800">
                        {t.title} ({t.usage_count} بار)
                      </option>
                    ))}
                  </select>
                </div>

                {/* متن پیامک */}
                <div className="mb-4">
                  <label className="text-white/70 text-sm mb-2 block">
                    متن پیامک
                    <span className="text-xs text-white/50 mr-2">
                      (از متغیرها استفاده کنید: {'{student_name}'}, {'{parent_name}'}, {'{amount}'})
                    </span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="متن پیامک خود را وارد کنید..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                  />
                  <div className="flex justify-between text-xs text-white/50 mt-1">
                    <span>{message.length} کاراکتر</span>
                    <span>{Math.ceil(message.length / 70)} پیامک</span>
                  </div>
                </div>

                {/* دکمه ارسال */}
                <button
                  onClick={handleSendSMS}
                  disabled={sending || !message || selectedStudents.length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${
                    sending || !message || selectedStudents.length === 0
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg'
                  }`}
                >
                  {sending ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      ارسال به {selectedStudents.length} نفر
                    </>
                  )}
                </button>
              </div>

              {/* انتخاب گیرندگان */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-400" />
                    گیرندگان ({selectedStudents.length})
                  </h3>
                  <button
                    onClick={handleSelectAllStudents}
                    className="text-sm text-teal-400 hover:text-teal-300"
                  >
                    {selectedStudents.length === students.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
                  </button>
                </div>

                {/* جستجو */}
                <div className="relative mb-4">
                  <Search className="absolute right-3 top-3 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی دانش‌آموز یا والد..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl pr-10 pl-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm"
                  />
                </div>

                {/* لیست دانش‌آموزان */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredStudents.map(student => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id])
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                          }
                        }}
                        className="w-5 h-5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{student.full_name}</p>
                        <p className="text-white/50 text-xs">{student.parent_name} • {student.parent_phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tab: الگوها */}
          {activeTab === 'templates' && (
            <div className="lg:col-span-3">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    الگوهای پیامک ({templates.length})
                  </h2>
                  <button
                    onClick={() => setShowNewTemplate(!showNewTemplate)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl text-white font-bold hover:from-teal-600 hover:to-cyan-700 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    الگوی جدید
                  </button>
                </div>

                {/* فرم الگوی جدید */}
                {showNewTemplate && (
                  <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                    <h3 className="text-white font-bold mb-4">ایجاد الگوی جدید</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={newTemplate.title}
                        onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                        placeholder="عنوان الگو"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      />
                      <select
                        value={newTemplate.category}
                        onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      >
                        <option value="financial" className="bg-slate-800">💰 مالی</option>
                        <option value="academic" className="bg-slate-800">📚 تحصیلی</option>
                        <option value="event" className="bg-slate-800">📅 رویداد</option>
                        <option value="other" className="bg-slate-800">📢 سایر</option>
                      </select>
                      <textarea
                        value={newTemplate.body}
                        onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                        rows={4}
                        placeholder="متن الگو (از متغیرها استفاده کنید)"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleCreateTemplate}
                          className="flex-1 px-4 py-2 bg-teal-600 rounded-xl text-white font-bold hover:bg-teal-700 transition-all"
                        >
                          ذخیره
                        </button>
                        <button
                          onClick={() => setShowNewTemplate(false)}
                          className="px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* لیست الگوها */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white font-bold">{template.title}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/70">
                          {getCategoryLabel(template.category)}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mb-3 line-clamp-3">{template.body}</p>
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>استفاده: {template.usage_count} بار</span>
                        <button
                          onClick={() => {
                            setSelectedTemplate(template.id)
                            setMessage(template.body)
                            setActiveTab('send')
                          }}
                          className="text-teal-400 hover:text-teal-300"
                        >
                          استفاده
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: تاریخچه */}
          {activeTab === 'history' && (
            <div className="lg:col-span-3">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-400" />
                  تاریخچه ارسال ({smsHistory.length})
                </h2>

                <div className="space-y-3">
                  {smsHistory.map(log => (
                    <div
                      key={log.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">{log.recipient_name}</p>
                          <p className="text-white/50 text-sm">{log.recipient_phone}</p>
                        </div>
                        {getStatusBadge(log.status)}
                      </div>
                      <p className="text-white/70 text-sm mb-2">{log.message}</p>
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>{new Date(log.sent_at).toLocaleDateString('fa-IR')} {new Date(log.sent_at).toLocaleTimeString('fa-IR')}</span>
                        <span>هزینه: {log.cost.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

