'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Camera,
  Copy,
  Lightbulb,
  Loader2,
  MessageCircle,
  Mic,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { HooshiarCharacter, type HooshiarMood } from '@/components/avatar/hooshiar-character'
import { LuxCard } from '@/components/lux/lux-card'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  sources?: { title: string; content: string }[]
  timestamp: Date
}

const STORAGE_KEY = 'study-buddy-history'

const QUICK_ACTIONS = [
  { label: 'حل مسئله', icon: Lightbulb, prompt: 'این مسئله را مرحله‌به‌مرحله حل کن: ' },
  { label: 'توضیح مفهوم', icon: BookOpen, prompt: 'این مفهوم را با مثال ساده توضیح بده: ' },
  { label: 'تمرین', icon: Sparkles, prompt: '۳ تمرین مناسب سطح من پیشنهاد بده برای: ' },
  { label: 'مشاوره', icon: MessageCircle, prompt: 'برای بهبود یادگیری در این درس راهنمایی‌ام کن: ' },
]

const SUBJECTS = [
  { id: 'math', label: 'ریاضی', color: 'var(--lux-primary)' },
  { id: 'physics', label: 'فیزیک', color: 'var(--lux-secondary)' },
  { id: 'literature', label: 'ادبیات', color: 'var(--lux-accent)' },
  { id: 'science', label: 'علوم', color: 'var(--lux-success)' },
]

const GRADE_LABELS: Record<number, string> = {
  1: 'اول', 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم', 6: 'ششم',
  7: 'هفتم', 8: 'هشتم', 9: 'نهم', 10: 'دهم', 11: 'یازدهم', 12: 'دوازدهم',
}

function XpFloat({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className="pointer-events-none fixed left-1/2 top-1/3 z-50 text-lg font-black text-[var(--lux-gold)]"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -48 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          +۱۰ XP
        </motion.span>
      )}
    </AnimatePresence>
  )
}

export function StudyBuddyClient() {
  const reduce = useReducedMotion()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [grade, setGrade] = useState(8)
  const [subject, setSubject] = useState('math')
  const [isLoading, setIsLoading] = useState(false)
  const [mood, setMood] = useState<HooshiarMood>('idle')
  const [xpFlash, setXpFlash] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>
      setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const statusLabel =
    mood === 'thinking' ? 'فکر می‌کند...' : mood === 'talking' ? 'صحبت می‌کند' : mood === 'error' ? 'خطا' : 'آنلاین'

  const sendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      imageUrl: preview ?? undefined,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setPreview(null)
    setIsLoading(true)
    setMood('thinking')

    try {
      const endpoint = imageBase64 ? '/api/ocr' : '/api/study-buddy'
      const body = imageBase64
        ? { image: imageBase64, question: text }
        : { question: userMessage.content, grade }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'خطا در دریافت پاسخ')

      const answer = data.answer || data.solution || data.explanation || 'پاسخی دریافت نشد.'
      setMood('talking')
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: answer,
          sources: data.sources,
          timestamp: new Date(),
        },
      ])
      setMood('happy')
      setXpFlash(true)
      setTimeout(() => setXpFlash(false), 1200)
      setTimeout(() => setMood('idle'), 2000)
    } catch (error) {
      setMood('error')
      toast.error(error instanceof Error ? error.message : 'خطای ناشناخته')
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      setTimeout(() => setMood('idle'), 1500)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void sendMessage(input)
  }

  const handleImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حداکثر حجم تصویر ۵ مگابایت است')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPreview(result)
      setInput('این مسئله را حل کن')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-[var(--lux-hero)] -m-4 sm:-m-5 md:-m-6 lg:-m-8 p-4 sm:p-5 md:p-6 lg:p-8" dir="rtl">
      <XpFloat show={xpFlash} />

      <div className="grid gap-5 lg:grid-cols-[35%_65%]">
        <LuxCard className="flex flex-col items-center text-center">
          <motion.div
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <HooshiarCharacter mood={mood} size="xl" className="mx-auto" />
          </motion.div>
          <h1 className="mt-4 text-2xl font-black text-[var(--lux-text)]">هوشیار</h1>
          <p className="mt-1 text-sm text-[var(--lux-text-muted)]">{statusLabel}</p>

          <div className="mt-6 grid w-full grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => setInput(prompt)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[var(--lux-surface)] bg-[var(--lux-card)] px-3 py-2.5 text-xs font-bold text-[var(--lux-text)] transition-colors hover:border-[var(--lux-primary)]/40"
              >
                <Icon className="h-4 w-4 text-[var(--lux-primary)]" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubject(s.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-bold transition-colors',
                  subject === s.id ? 'text-[var(--lux-text)]' : 'text-[var(--lux-text-muted)]',
                )}
                style={{
                  background: subject === s.id ? `${s.color}33` : 'var(--lux-surface)',
                  border: `1px solid ${subject === s.id ? s.color : 'transparent'}`,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </LuxCard>

        <LuxCard className="flex min-h-[70vh] flex-col p-0 lg:min-h-[calc(100dvh-10rem)]">
          <div className="flex items-center justify-between border-b border-[var(--lux-surface)] px-4 py-3">
            <p className="text-sm font-bold text-[var(--lux-text)]">گفتگو با هوشیار</p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--lux-text-muted)]">پایه</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="rounded-lg border border-[var(--lux-surface)] bg-[var(--lux-card)] px-2 py-1 text-xs text-[var(--lux-text)]"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>{GRADE_LABELS[g]}</option>
                ))}
              </select>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('تاریخچه پاک شود؟')) return
                    setMessages([])
                    localStorage.removeItem(STORAGE_KEY)
                  }}
                  className="rounded-lg p-2 text-[var(--lux-text-muted)] hover:bg-[var(--lux-surface)]"
                  aria-label="پاک کردن"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <p className="text-lg font-black text-[var(--lux-text)]">سلام! من هوشیارم</p>
                <p className="mt-2 max-w-md text-sm leading-8 text-[var(--lux-text-muted)]">
                  سوال درسی، تکلیف یا مفهوم سخت را بپرس — مرحله‌به‌مرحله راهنمایی‌ات می‌کنم.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-2', message.role === 'user' ? 'justify-start' : 'justify-end')}
                >
                  {message.role === 'assistant' && (
                    <HooshiarCharacter mood="idle" size="sm" className="mt-1 shrink-0" />
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'rounded-tr-sm border border-[var(--lux-primary)]/40 bg-[var(--lux-primary)]/20 text-[var(--lux-text)]'
                        : 'rounded-tl-sm border border-[var(--lux-surface)] bg-[var(--lux-card)] text-[var(--lux-text)]',
                    )}
                  >
                    {message.imageUrl && (
                      <div className="relative mb-2 h-32 w-full overflow-hidden rounded-xl">
                        <Image src={message.imageUrl} alt="پیوست" fill className="object-contain" unoptimized />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content)
                          toast.success('کپی شد')
                        }}
                        className="mt-2 flex items-center gap-1 text-xs text-[var(--lux-text-muted)]"
                      >
                        <Copy className="h-3 w-3" /> کپی
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-end gap-2">
                <HooshiarCharacter mood="thinking" size="sm" />
                <div className="rounded-2xl border border-[var(--lux-surface)] bg-[var(--lux-card)] px-4 py-3">
                  <p className="mb-2 text-xs text-[var(--lux-text-muted)]">هوشیار دارد فکر می‌کند...</p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-[var(--lux-primary)]"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {preview && (
            <div className="border-t border-[var(--lux-surface)] px-4 py-2">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl">
                <Image src={preview} alt="پیش‌نمایش" fill className="object-cover" unoptimized />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[var(--lux-surface)] p-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--lux-surface)] text-[var(--lux-primary)]" aria-label="آپلود تصویر">
              <Camera className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="سوال درسی خود را بنویسید..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-[var(--lux-surface)] bg-[var(--lux-card)] px-4 py-2.5 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lux-primary)]/30 disabled:opacity-50"
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="lux-btn-accent min-h-11 px-5 text-sm disabled:opacity-50">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ارسال'}
            </button>
          </form>
        </LuxCard>
      </div>
    </div>
  )
}
