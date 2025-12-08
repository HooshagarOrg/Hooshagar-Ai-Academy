'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { title: string; content: string }[]
  timestamp: Date
}

export default function TestStudyBuddy() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [grade, setGrade] = useState(8)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // بارگذاری تاریخچه از localStorage
  useEffect(() => {
    const saved = localStorage.getItem('study-buddy-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })))
      } catch (e) {
        console.error('Error loading history:', e)
      }
    }
  }, [])

  // ذخیره تاریخچه در localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('study-buddy-history', JSON.stringify(messages))
    }
  }, [messages])

  // Scroll به آخرین پیام
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/study-buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          grade
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'خطا در دریافت پاسخ')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error: any) {
      toast.error(`❌ ${error.message}`)
      // حذف پیام کاربر در صورت خطا
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('📋 کپی شد!')
  }

  const handleClear = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید تاریخچه را پاک کنید؟')) {
      setMessages([])
      localStorage.removeItem('study-buddy-history')
      toast.success('🗑️ تاریخچه پاک شد')
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      <div className="max-w-4xl mx-auto flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                🎓
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">دستیار هوشمند درسی</h1>
                <p className="text-sm text-gray-500">هر سوالی داری، بپرس!</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* انتخاب پایه */}
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl">
                <span className="text-sm text-indigo-600">پایه:</span>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                    <option key={g} value={g}>
                      {g === 1 ? 'اول' : g === 2 ? 'دوم' : g === 3 ? 'سوم' : 
                       g === 4 ? 'چهارم' : g === 5 ? 'پنجم' : g === 6 ? 'ششم' :
                       g === 7 ? 'هفتم' : g === 8 ? 'هشتم' : g === 9 ? 'نهم' :
                       g === 10 ? 'دهم' : g === 11 ? 'یازدهم' : 'دوازدهم'}
                    </option>
                  ))}
                </select>
              </div>

              {/* دکمه پاک کردن */}
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="پاک کردن تاریخچه"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">سلام! من دستیار درسی تو هستم</h2>
              <p className="text-gray-500 mb-6">هر سوال درسی که داری از من بپرس</p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  'معادله درجه اول چیست؟',
                  'فتوسنتز چگونه انجام می‌شود؟',
                  'انواع مثلث را توضیح بده',
                  'چرخه آب چیست؟'
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="p-3 bg-white rounded-xl text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-gray-200 text-right"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-md border border-gray-100'
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">
                      {message.role === 'user' ? '👤' : '🤖'}
                    </span>
                    <span className={`text-xs ${message.role === 'user' ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {message.role === 'user' ? 'شما' : 'دستیار هوشمند'} • {formatTime(message.timestamp)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className={`whitespace-pre-wrap leading-relaxed ${message.role === 'user' ? '' : 'text-gray-700'}`}>
                    {message.content}
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">📖 منابع استفاده شده:</div>
                      <div className="space-y-2">
                        {message.sources.map((source, i) => (
                          <div key={i} className="bg-indigo-50 p-2 rounded-lg text-xs">
                            <div className="font-semibold text-indigo-700">{source.title}</div>
                            <div className="text-gray-600 mt-1">{source.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copy Button */}
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(message.content)}
                      className="mt-3 text-xs text-gray-400 hover:text-indigo-500 flex items-center gap-1"
                    >
                      📋 کپی پاسخ
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-sm p-4 shadow-md border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg animate-bounce">🤖</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-sm text-gray-500">در حال فکر کردن...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input Form */}
        <footer className="bg-white/80 backdrop-blur-sm border-t border-indigo-100 p-4 sticky bottom-0">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="سوال درسی خود را بنویسید..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent disabled:opacity-50 text-gray-700 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  صبر کنید...
                </>
              ) : (
                <>
                  <span>🤖</span>
                  بپرس
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-gray-400 mt-2">
            پایه {grade} • دستیار هوشمند درسی هوشاگر
          </div>
        </footer>
      </div>
    </div>
  )
}




























