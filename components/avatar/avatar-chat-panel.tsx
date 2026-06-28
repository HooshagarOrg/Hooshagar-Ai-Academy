'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, Mic, MicOff, Volume2, VolumeX, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { HooshiarCharacter, type HooshiarMood } from './hooshiar-character'
import { useSpeechInput } from '@/hooks/use-speech-input'
import { useSpeechOutput } from '@/hooks/use-speech-output'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface QuickAction {
  label: string
  message: string
}

interface AvatarChatPanelProps {
  open: boolean
  onClose: () => void
}

export function AvatarChatPanel({ open, onClose }: AvatarChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [mood, setMood] = useState<HooshiarMood>('idle')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [canChat, setCanChat] = useState(true)
  const [dailyLimit, setDailyLimit] = useState(15)
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const appendTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text))
    inputRef.current?.focus()
  }, [])

  const { supported: speechSupported, listening, toggle: toggleSpeech } = useSpeechInput({
    lang: 'fa-IR',
    onTranscript: appendTranscript,
  })

  const { supported: ttsSupported, speaking, speak, stop: stopSpeak } = useSpeechOutput({
    lang: 'fa-IR',
    enabled: ttsEnabled,
  })

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [])

  const applyWelcome = useCallback((welcomeMessage?: string) => {
    if (welcomeMessage) {
      setMessages([{ id: 'welcome', role: 'assistant', content: welcomeMessage }])
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/avatar/chat', {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        if (res.ok) {
          const data = (await res.json()) as {
            remainingMessages: number
            dailyLimit: number
            canChat: boolean
            welcomeMessage?: string
            quickActions?: QuickAction[]
            history?: ChatMessage[]
          }
          setRemaining(data.remainingMessages)
          setDailyLimit(data.dailyLimit)
          setCanChat(data.canChat)
          setQuickActions(data.quickActions ?? [])

          if (data.history && data.history.length > 0) {
            setMessages(data.history)
          } else {
            applyWelcome(data.welcomeMessage)
          }
        }
      } catch {
        // نادیده
      }
    }

    void fetchStatus()
    inputRef.current?.focus()
  }, [open, applyWelcome])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) stopSpeak()
  }, [open, stopSpeak])

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setMood('thinking')
    stopSpeak()

    try {
      const res = await fetch('/api/avatar/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ message: text }),
      })

      const data = (await res.json()) as {
        reply?: string
        error?: string
        remainingMessages?: number
      }

      if (typeof data.remainingMessages === 'number') {
        setRemaining(data.remainingMessages)
        setCanChat(data.remainingMessages > 0)
      }

      if (!res.ok) {
        setMood('error')
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            content: data.error || 'متأسفانه خطایی پیش اومد. دوباره امتحان کن.',
          },
        ])
        setTimeout(() => setMood('idle'), 800)
        return
      }

      const reply = data.reply || 'پاسخی دریافت نشد.'
      setMood('talking')
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
        },
      ])
      speak(reply)
      setTimeout(() => setMood('idle'), 1200)
    } catch {
      setMood('error')
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: 'اتصال برقرار نشد. اینترنتت رو چک کن.',
        },
      ])
      setTimeout(() => setMood('idle'), 800)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (clearing) return
    setClearing(true)
    stopSpeak()
    try {
      const res = await fetch('/api/avatar/chat', {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = (await res.json()) as { welcomeMessage?: string; error?: string }
      if (res.ok) {
        applyWelcome(data.welcomeMessage)
      }
    } finally {
      setClearing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm motion-overlay"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          'fixed z-[70] flex flex-col',
          'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl',
          'sm:inset-x-auto sm:bottom-6 sm:left-6 sm:right-auto',
          'sm:w-[min(100vw-2rem,24rem)] sm:max-h-[32rem] sm:rounded-2xl',
          'motion-drawer'
        )}
        role="dialog"
        aria-label="گفتگو با هوشیار"
      >
        <GlassCard luxury glow="scholar" className="flex flex-col h-full overflow-hidden border-0 rounded-t-2xl sm:rounded-2xl">
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <HooshiarCharacter mood={mood} size="sm" />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-foreground leading-tight">هوشیار</h2>
              <p className="text-xs text-muted-foreground truncate">
                دستیار هوشمند تو
                {remaining !== null && (
                  <span className="mr-1">
                    · {remaining} پیام AI باقی‌مانده از {dailyLimit}
                  </span>
                )}
              </p>
            </div>
            {ttsSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setTtsEnabled((v) => !v)}
                aria-label={ttsEnabled ? 'خاموش کردن صدا' : 'روشن کردن صدا'}
              >
                {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void clearHistory()}
              disabled={clearing || messages.length === 0}
              aria-label="پاک کردن تاریخچه"
            >
              {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {quickActions.length > 0 && (
            <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendMessage(action.message)}
                  className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-foreground hover:bg-white/10 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[12rem] max-h-[50vh] sm:max-h-[18rem]"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-start' : 'justify-end'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-primary/20 text-foreground rounded-br-sm'
                      : 'bg-white/10 text-foreground rounded-bl-sm'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {speaking ? 'داره می‌گه...' : 'داره فکر می‌کنه...'}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/10 flex gap-2 items-end">
            {speechSupported && (
              <Button
                type="button"
                size="icon"
                variant={listening ? 'default' : 'outline'}
                onClick={toggleSpeech}
                disabled={loading}
                aria-label={listening ? 'توقف ضبط صدا' : 'ضبط صدا'}
                className={cn(listening && 'animate-pulse')}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                speechSupported
                  ? 'پیامت رو بنویس یا میکروفون بزن...'
                  : 'پیامت رو بنویس...'
              }
              rows={1}
              disabled={loading}
              className={cn(
                'flex-1 resize-none rounded-xl border border-white/10 bg-white/5',
                'px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/40',
                'min-h-[44px] max-h-24 leading-relaxed'
              )}
              dir="rtl"
            />
            <Button
              type="button"
              size="icon"
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="ارسال"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </GlassCard>
      </div>
    </>
  )
}
