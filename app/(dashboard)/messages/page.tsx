'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  User,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { DashboardPage } from '@/components/layout/dashboard-page'

type ProfileBrief = { id: string; full_name: string | null; role: string }

type ApiMessage = {
  id: string
  sender_id: string
  receiver_id: string
  subject: string | null
  content: string
  is_read: boolean
  created_at: string
  sender?: ProfileBrief | ProfileBrief[] | null
  receiver?: ProfileBrief | ProfileBrief[] | null
}

type Contact = { id: string; name: string; role: string }

type Conversation = {
  peerId: string
  peerName: string
  peerRole: string
  lastMessage: ApiMessage
  unreadCount: number
}

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    teacher: 'معلم',
    art_teacher: 'معلم هنر',
    sports_teacher: 'معلم ورزش',
    parent: 'والد',
    admin: 'ادمین',
    principal: 'مدیر',
    counselor: 'مشاور',
    student: 'دانش‌آموز',
    educational_vp: 'معاون آموزشی',
    disciplinary_vp: 'معاون انضباطی',
    health_vp: 'معاون بهداشت',
    financial_vp: 'معاون مالی',
    evaluation_vp: 'معاون ارزشیابی',
    secretary: 'منشی',
  }
  return map[role] || role
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function buildConversations(messages: ApiMessage[], currentUserId: string): Conversation[] {
  const map = new Map<string, Conversation>()

  for (const msg of messages) {
    const peerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
    const peerProfile =
      msg.sender_id === currentUserId ? asOne(msg.receiver) : asOne(msg.sender)
    const peerName = peerProfile?.full_name || 'کاربر'
    const peerRole = peerProfile?.role || ''

    const existing = map.get(peerId)
    const isUnread = msg.receiver_id === currentUserId && !msg.is_read

    if (!existing) {
      map.set(peerId, {
        peerId,
        peerName,
        peerRole,
        lastMessage: msg,
        unreadCount: isUnread ? 1 : 0,
      })
      continue
    }

    if (new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
      existing.lastMessage = msg
    }
    if (isUnread) existing.unreadCount += 1
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.lastMessage.created_at).getTime() -
      new Date(a.lastMessage.created_at).getTime()
  )
}

export default function MessagesPage() {
  const [currentUserId, setCurrentUserId] = useState('')
  const [allMessages, setAllMessages] = useState<ApiMessage[]>([])
  const [thread, setThread] = useState<ApiMessage[]>([])
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const [newOpen, setNewOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactQ, setContactQ] = useState('')
  const [contactsLoading, setContactsLoading] = useState(false)
  const [newReceiverId, setNewReceiverId] = useState('')
  const [newText, setNewText] = useState('')

  const endRef = useRef<HTMLDivElement>(null)

  const loadInbox = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/messages?type=all&limit=200')
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'خطا در دریافت پیام‌ها')
        return
      }
      setCurrentUserId(data.current_user_id || '')
      setAllMessages(data.messages || [])
    } catch {
      toast.error('خطای شبکه در دریافت پیام‌ها')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadInbox()
  }, [loadInbox])

  const conversations = useMemo(
    () => (currentUserId ? buildConversations(allMessages, currentUserId) : []),
    [allMessages, currentUserId]
  )

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.trim().toLowerCase()
    return conversations.filter(
      (c) =>
        c.peerName.toLowerCase().includes(q) ||
        roleLabel(c.peerRole).includes(searchQuery.trim())
    )
  }, [conversations, searchQuery])

  const selectedConversation = conversations.find((c) => c.peerId === selectedPeerId) || null

  const openConversation = async (peerId: string) => {
    setSelectedPeerId(peerId)
    setThreadLoading(true)
    try {
      const res = await fetch(
        `/api/messages?type=conversation&with=${encodeURIComponent(peerId)}&limit=200`
      )
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'خطا در دریافت گفتگو')
        return
      }
      setThread(data.messages || [])
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peer_id: peerId }),
      })
      setAllMessages((prev) =>
        prev.map((m) =>
          m.sender_id === peerId && m.receiver_id === currentUserId
            ? { ...m, is_read: true }
            : m
        )
      )
    } catch {
      toast.error('خطای شبکه')
    } finally {
      setThreadLoading(false)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const sendToPeer = async (peerId: string, content: string) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: peerId, content }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'ارسال ناموفق')
    }
    return data.message as ApiMessage
  }

  const handleSend = async () => {
    if (!selectedPeerId || !draft.trim() || sending) return
    setSending(true)
    try {
      const msg = await sendToPeer(selectedPeerId, draft.trim())
      setDraft('')
      setThread((prev) => [...prev, msg])
      void loadInbox()
      toast.success('پیام ارسال شد')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ارسال ناموفق')
    } finally {
      setSending(false)
    }
  }

  const loadContacts = async (q = '') => {
    setContactsLoading(true)
    try {
      const res = await fetch(
        `/api/messages/contacts?q=${encodeURIComponent(q)}&limit=50`
      )
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'خطا در دریافت مخاطبین')
        return
      }
      setContacts(data.contacts || [])
    } catch {
      toast.error('خطای شبکه')
    } finally {
      setContactsLoading(false)
    }
  }

  const openNewDialog = () => {
    setNewOpen(true)
    setNewReceiverId('')
    setNewText('')
    setContactQ('')
    void loadContacts()
  }

  const handleStartConversation = async () => {
    if (!newReceiverId || !newText.trim()) {
      toast.error('گیرنده و متن پیام را وارد کنید')
      return
    }
    setSending(true)
    try {
      await sendToPeer(newReceiverId, newText.trim())
      setNewOpen(false)
      void loadInbox()
      await openConversation(newReceiverId)
      toast.success('گفتگو شروع شد')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ارسال ناموفق')
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardPage
      title={
        <span className="flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-[var(--lux-primary)]" />
          پیام‌ها
        </span>
      }
      description="پیام‌رسانی مستقیم داخل مدرسه"
      actions={
        <div className="flex gap-2">
          <Button onClick={openNewDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            پیام جدید
          </Button>
          <Link href="/">
            <Button variant="outline" size="icon" aria-label="بازگشت">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      }
      animatedSections={false}
      className="max-w-6xl"
    >
      <div className="lux-dash-card flex h-[calc(100vh-180px)] min-h-[420px] overflow-hidden border border-white/10">
        {/* Sidebar */}
        <aside className="flex w-full max-w-[340px] flex-col border-l border-white/10 bg-[var(--lux-card)]">
          <div className="border-b border-white/[0.06] p-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی گفتگو..."
                className="pr-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--lux-primary)]" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground leading-7">
                هنوز گفتگویی نیست. با «پیام جدید» شروع کنید.
              </p>
            ) : (
              filteredConversations.map((c) => (
                <button
                  key={c.peerId}
                  type="button"
                  onClick={() => void openConversation(c.peerId)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-3 text-right transition-colors hover:bg-white/[0.04]',
                    selectedPeerId === c.peerId && 'bg-white/[0.06]'
                  )}
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--lux-primary)]/20 text-[var(--lux-primary)]">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-sm">{c.peerName}</p>
                      {c.unreadCount > 0 && (
                        <Badge className="bg-[var(--lux-primary)] text-xs">{c.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{roleLabel(c.peerRole)}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {c.lastMessage.content}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!selectedPeerId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <MessageSquare className="h-12 w-12 opacity-40" />
              <p className="text-sm leading-7">یک گفتگو را انتخاب کنید</p>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div>
                  <p className="font-semibold">
                    {selectedConversation?.peerName || 'گفتگو'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabel(selectedConversation?.peerRole || '')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPeerId(null)}
                  aria-label="بستن"
                >
                  <X className="h-4 w-4" />
                </Button>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {threadLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  thread.map((m) => {
                    const mine = m.sender_id === currentUserId
                    return (
                      <div
                        key={m.id}
                        className={cn('flex', mine ? 'justify-start' : 'justify-end')}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-7',
                            mine
                              ? 'bg-[var(--lux-primary)] text-white'
                              : 'bg-white/10 text-[var(--lux-text)]'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <p
                            className={cn(
                              'mt-1 text-[10px]',
                              mine ? 'text-white/70' : 'text-muted-foreground'
                            )}
                          >
                            {formatTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={endRef} />
              </div>

              <footer className="border-t border-white/[0.06] p-3">
                <div className="flex gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    className="min-h-[48px] resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void handleSend()
                      }
                    }}
                  />
                  <Button
                    onClick={() => void handleSend()}
                    disabled={sending || !draft.trim()}
                    className="shrink-0 self-end"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>پیام جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm">جستجوی مخاطب</label>
              <Input
                value={contactQ}
                onChange={(e) => {
                  const v = e.target.value
                  setContactQ(v)
                  void loadContacts(v)
                }}
                placeholder="نام..."
              />
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 p-2">
              {contactsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : contacts.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  مخاطبی یافت نشد
                </p>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewReceiverId(c.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-white/5',
                      newReceiverId === c.id && 'bg-[var(--lux-primary)]/20'
                    )}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {roleLabel(c.role)}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm">متن پیام</label>
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={4}
                placeholder="سلام..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              انصراف
            </Button>
            <Button onClick={() => void handleStartConversation()} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ارسال'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  )
}
