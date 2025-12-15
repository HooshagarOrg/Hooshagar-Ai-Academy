'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Paperclip,
  Smile,
  Mic,
  Star,
  Archive,
  MoreVertical,
  Check,
  CheckCheck,
  Phone,
  Video,
  Info,
  X,
  Image as ImageIcon,
  FileText,
  Download,
  Eye,
  Trash2,
  Flag,
  Ban,
  ArrowDown,
  Loader2,
  Settings,
  ChevronLeft,
  User,
  Users,
  Clock,
  Circle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

interface User {
  id: string
  name: string
  role: 'teacher' | 'parent' | 'admin' | 'principal' | 'student'
  avatar?: string
  isOnline: boolean
  lastSeen?: string
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  attachmentUrl?: string
  attachmentType?: string
  attachmentName?: string
  isRead: boolean
  readAt?: string
  createdAt: string
  deletedForSender: boolean
  deletedForAll: boolean
}

interface Conversation {
  id: string
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  isStarred: boolean
  isArchived: boolean
  updatedAt: string
}

// ============================================
// داده‌های نمونه
// ============================================

const CURRENT_USER_ID = 'current-user-id'

const SAMPLE_USERS: User[] = [
  { id: 'u1', name: 'علی رضایی', role: 'teacher', isOnline: true },
  { id: 'u2', name: 'سارا احمدی', role: 'parent', isOnline: false, lastSeen: '10 دقیقه پیش' },
  { id: 'u3', name: 'محمد کریمی', role: 'admin', isOnline: true },
  { id: 'u4', name: 'فاطمه موسوی', role: 'teacher', isOnline: false, lastSeen: 'دیروز' },
  { id: 'u5', name: 'حسین نوری', role: 'principal', isOnline: true },
  { id: 'u6', name: 'زهرا حسینی', role: 'parent', isOnline: false, lastSeen: '2 ساعت پیش' },
]

const ALL_USERS: User[] = [
  ...SAMPLE_USERS,
  { id: 'u7', name: 'امیر عباسی', role: 'teacher', isOnline: false },
  { id: 'u8', name: 'مریم قاسمی', role: 'parent', isOnline: true },
  { id: 'u9', name: 'رضا محمدی', role: 'teacher', isOnline: false },
  { id: 'u10', name: 'نازنین کریمی', role: 'parent', isOnline: true },
]

const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participants: [SAMPLE_USERS[0]],
    lastMessage: {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'u1',
      content: 'سلام، درباره نمره آزمون می‌خواستم صحبت کنم...',
      isRead: false,
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      deletedForSender: false,
      deletedForAll: false,
    },
    unreadCount: 3,
    isStarred: false,
    isArchived: false,
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'c2',
    participants: [SAMPLE_USERS[1]],
    lastMessage: {
      id: 'm2',
      conversationId: 'c2',
      senderId: CURRENT_USER_ID,
      content: 'ممنون از راهنماییتون',
      isRead: true,
      readAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      deletedForSender: false,
      deletedForAll: false,
    },
    unreadCount: 0,
    isStarred: false,
    isArchived: false,
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'c3',
    participants: [SAMPLE_USERS[2]],
    lastMessage: {
      id: 'm3',
      conversationId: 'c3',
      senderId: 'u3',
      content: 'جلسه فردا ساعت 10 صبح',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      deletedForSender: false,
      deletedForAll: false,
    },
    unreadCount: 0,
    isStarred: true,
    isArchived: false,
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'c4',
    participants: [SAMPLE_USERS[3]],
    lastMessage: {
      id: 'm4',
      conversationId: 'c4',
      senderId: 'u4',
      content: 'گزارش ماهانه آماده شد',
      isRead: false,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      deletedForSender: false,
      deletedForAll: false,
    },
    unreadCount: 1,
    isStarred: false,
    isArchived: false,
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'c5',
    participants: [SAMPLE_USERS[4]],
    lastMessage: {
      id: 'm5',
      conversationId: 'c5',
      senderId: CURRENT_USER_ID,
      content: 'بله، حتماً بررسی می‌کنم',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      deletedForSender: false,
      deletedForAll: false,
    },
    unreadCount: 0,
    isStarred: true,
    isArchived: false,
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

const generateSampleMessages = (conversationId: string): Message[] => {
  const now = Date.now()
  const messages: Message[] = []
  
  const sampleTexts = [
    { sender: 'other', text: 'سلام! حالتون چطوره؟' },
    { sender: 'me', text: 'سلام، ممنون خوبم. شما چطورید؟' },
    { sender: 'other', text: 'خوبم، ممنون. می‌خواستم درباره نمره آزمون محمد باهاتون صحبت کنم.' },
    { sender: 'me', text: 'بله، بفرمایید. در خدمتم.' },
    { sender: 'other', text: 'محمد در آزمون ریاضی نمره ۱۵ گرفته. می‌خواستم بدونم چطور می‌تونیم کمکش کنیم.' },
    { sender: 'me', text: 'محمد در درس ریاضی کمی ضعیف‌تر از سایر دروسه. پیشنهاد می‌کنم کلاس تقویتی شرکت کنه.' },
    { sender: 'other', text: 'کلاس تقویتی چه روزایی هست؟' },
    { sender: 'me', text: 'شنبه و چهارشنبه‌ها ساعت ۴ بعدازظهر.' },
    { sender: 'other', text: 'خیلی ممنون. حتماً ثبت‌نام می‌کنیم.' },
    { sender: 'me', text: 'خواهش می‌کنم. اگر سوال دیگه‌ای داشتید در خدمتم.' },
  ]

  sampleTexts.forEach((msg, index) => {
    messages.push({
      id: `${conversationId}-m${index}`,
      conversationId,
      senderId: msg.sender === 'me' ? CURRENT_USER_ID : 'u1',
      content: msg.text,
      isRead: index < 8,
      readAt: index < 8 ? new Date(now - (10 - index) * 60000).toISOString() : undefined,
      createdAt: new Date(now - (10 - index) * 60000).toISOString(),
      deletedForSender: false,
      deletedForAll: false,
    })
  })

  // Add a message with attachment
  messages.push({
    id: `${conversationId}-attachment`,
    conversationId,
    senderId: CURRENT_USER_ID,
    content: 'گزارش نمرات',
    attachmentUrl: 'https://example.com/report.pdf',
    attachmentType: 'application/pdf',
    attachmentName: 'گزارش_نمرات.pdf',
    isRead: true,
    createdAt: new Date(now - 5 * 60000).toISOString(),
    deletedForSender: false,
    deletedForAll: false,
  })

  return messages
}

// ============================================
// کامپوننت‌های کمکی
// ============================================

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) {
    return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'دیروز'
  } else if (diffDays < 7) {
    return `${diffDays} روز پیش`
  } else {
    return date.toLocaleDateString('fa-IR')
  }
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    teacher: 'معلم',
    parent: 'والد',
    admin: 'مدیر',
    principal: 'مدیر مدرسه',
    student: 'دانش‌آموز',
  }
  return labels[role] || role
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}) {
  const participant = conversation.participants[0]
  const lastMessage = conversation.lastMessage
  const isMyMessage = lastMessage?.senderId === CURRENT_USER_ID

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-right',
        isActive ? 'bg-blue-100' : 'hover:bg-gray-100'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {participant.name.charAt(0)}
        </div>
        {participant.isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 truncate">{participant.name}</span>
            {conversation.isStarred && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
          </div>
          <span className="text-xs text-gray-500">
            {lastMessage && formatTime(lastMessage.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 truncate max-w-[180px]">
            {isMyMessage && <span className="text-gray-400">شما: </span>}
            {lastMessage?.content || 'مکالمه جدید'}
          </p>
          {conversation.unreadCount > 0 && (
            <Badge className="bg-blue-500 text-white h-5 min-w-[20px] text-xs">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{getRoleLabel(participant.role)}</p>
      </div>
    </button>
  )
}

function MessageBubble({
  message,
  isMe,
  showAvatar = true,
}: {
  message: Message
  isMe: boolean
  showAvatar?: boolean
}) {
  const hasAttachment = message.attachmentUrl

  return (
    <div className={cn('flex gap-2 mb-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar space */}
      {showAvatar ? (
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
            isMe ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-400 to-blue-500'
          )}
        >
          {isMe ? 'م' : 'ع'}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message */}
      <div className={cn('max-w-[70%]', isMe ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2 relative',
            isMe
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          )}
        >
          {hasAttachment && (
            <div
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg mb-2',
                isMe ? 'bg-blue-600' : 'bg-gray-200'
              )}
            >
              <FileText className="w-8 h-8" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.attachmentName}</p>
                <p className={cn('text-xs', isMe ? 'text-blue-200' : 'text-gray-500')}>
                  {message.attachmentType?.split('/')[1]?.toUpperCase()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Time & Status */}
        <div className={cn('flex items-center gap-1 mt-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-xs text-gray-400">{formatMessageTime(message.createdAt)}</span>
          {isMe && (
            <span className="text-blue-500">
              {message.isRead ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
        ع
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-4 my-4">
      <Separator className="flex-1" />
      <span className="text-xs text-gray-400 bg-white px-2">{date}</span>
      <Separator className="flex-1" />
    </div>
  )
}

// ============================================
// Emoji Picker (ساده)
// ============================================

const EMOJI_LIST = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '👍', '👎', '👌', '🙏', '🤝', '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '💯', '✅', '❌', '⭐', '🌟', '✨', '🎉', '🎊']

function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1 p-2 max-h-[200px] overflow-y-auto">
      {EMOJI_LIST.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function MessagesPage() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'starred'>('all')

  // New message dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [selectedRecipients, setSelectedRecipients] = useState<User[]>([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  // UI State
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ============================================
  // Effects
  // ============================================

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      const loadedMessages = generateSampleMessages(selectedConversation.id)
      setMessages(loadedMessages)

      // Mark as read
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c
        )
      )
    }
  }, [selectedConversation])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Typing indicator simulation
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.senderId === CURRENT_USER_ID) {
        setIsTyping(true)
        const timer = setTimeout(() => setIsTyping(false), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [selectedConversation, messages])

  // Check scroll position for scroll-to-bottom button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100)
  }, [])

  // ============================================
  // Filtered Conversations
  // ============================================

  const filteredConversations = useMemo(() => {
    let result = [...conversations]

    // Filter by tab
    if (activeTab === 'unread') {
      result = result.filter((c) => c.unreadCount > 0)
    } else if (activeTab === 'starred') {
      result = result.filter((c) => c.isStarred)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((c) =>
        c.participants.some((p) => p.name.toLowerCase().includes(query))
      )
    }

    // Sort by date
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return result
  }, [conversations, activeTab, searchQuery])

  // Available users for new conversation
  const availableUsers = useMemo(() => {
    if (!recipientSearch) return ALL_USERS
    const query = recipientSearch.toLowerCase()
    return ALL_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        getRoleLabel(u.role).includes(query)
    )
  }, [recipientSearch])

  // ============================================
  // Handlers
  // ============================================

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Date.now().toString(),
      conversationId: selectedConversation.id,
      senderId: CURRENT_USER_ID,
      content: newMessage.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
      deletedForSender: false,
      deletedForAll: false,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage('')

    // Update conversation
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() }
          : c
      )
    )

    // Focus textarea
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedConversation) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از 5MB باشد')
      return
    }

    // Mock upload
    toast.success(`فایل ${file.name} آپلود شد`)

    const message: Message = {
      id: Date.now().toString(),
      conversationId: selectedConversation.id,
      senderId: CURRENT_USER_ID,
      content: file.name,
      attachmentUrl: URL.createObjectURL(file),
      attachmentType: file.type,
      attachmentName: file.name,
      isRead: false,
      createdAt: new Date().toISOString(),
      deletedForSender: false,
      deletedForAll: false,
    }

    setMessages((prev) => [...prev, message])

    // Reset input
    e.target.value = ''
  }

  const handleToggleStar = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, isStarred: !c.isStarred } : c
      )
    )
    toast.success('ستاره‌گذاری تغییر کرد')
  }

  const handleArchive = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, isArchived: true } : c
      )
    )
    setSelectedConversation(null)
    toast.success('مکالمه بایگانی شد')
  }

  const handleStartNewConversation = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('گیرنده را انتخاب کنید')
      return
    }
    if (!initialMessage.trim()) {
      toast.error('پیام را وارد کنید')
      return
    }

    setIsSending(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newConversation: Conversation = {
        id: Date.now().toString(),
        participants: selectedRecipients,
        lastMessage: {
          id: Date.now().toString(),
          conversationId: Date.now().toString(),
          senderId: CURRENT_USER_ID,
          content: initialMessage.trim(),
          isRead: false,
          createdAt: new Date().toISOString(),
          deletedForSender: false,
          deletedForAll: false,
        },
        unreadCount: 0,
        isStarred: false,
        isArchived: false,
        updatedAt: new Date().toISOString(),
      }

      setConversations((prev) => [newConversation, ...prev])
      setSelectedConversation(newConversation)
      setNewDialogOpen(false)
      setSelectedRecipients([])
      setInitialMessage('')
      toast.success('مکالمه ایجاد شد')
    } finally {
      setIsSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  // ============================================
  // Render
  // ============================================

  return (
    <div className="h-[calc(100vh-100px)] bg-gray-50 rounded-xl overflow-hidden flex" dir="rtl">
      {/* Sidebar */}
      <div className="w-[350px] bg-white border-l flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              پیام‌ها
              {totalUnread > 0 && (
                <Badge className="bg-blue-500">{totalUnread}</Badge>
              )}
            </h1>
            <Button onClick={() => setNewDialogOpen(true)} size="icon" className="rounded-full">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در پیام‌ها..."
              className="pr-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">همه</TabsTrigger>
              <TabsTrigger value="unread">
                خوانده نشده
                {conversations.filter((c) => c.unreadCount > 0).length > 0 && (
                  <Badge className="mr-1 h-4 w-4 p-0 text-xs bg-red-500">
                    {conversations.filter((c) => c.unreadCount > 0).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="starred">ستاره‌دار</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">مکالمه‌ای یافت نشد</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={selectedConversation?.id === conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedConversation.participants[0].name.charAt(0)}
                  </div>
                  {selectedConversation.participants[0].isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">
                    {selectedConversation.participants[0].name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.participants[0].isOnline ? (
                      <span className="text-green-600">آنلاین</span>
                    ) : (
                      selectedConversation.participants[0].lastSeen || 'آفلاین'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">
                  <Search className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleStar(selectedConversation.id)}
                >
                  <Star
                    className={cn(
                      'w-5 h-5',
                      selectedConversation.isStarred && 'text-yellow-500 fill-yellow-500'
                    )}
                  />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleArchive(selectedConversation.id)}>
                      <Archive className="w-4 h-4 ml-2" />
                      بایگانی
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Flag className="w-4 h-4 ml-2" />
                      گزارش
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Ban className="w-4 h-4 ml-2" />
                      مسدود کردن
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
            >
              <DateSeparator date="امروز" />

              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMe={message.senderId === CURRENT_USER_ID}
                  showAvatar={
                    index === 0 ||
                    messages[index - 1].senderId !== message.senderId
                  }
                />
              ))}

              {isTyping && <TypingIndicator />}

              <div ref={messagesEndRef} />

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <Button
                  onClick={scrollToBottom}
                  size="icon"
                  className="fixed bottom-32 left-8 rounded-full shadow-lg"
                >
                  <ArrowDown className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end gap-2">
                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                {/* Emoji Picker */}
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <Smile className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <EmojiPicker onSelect={handleEmojiSelect} />
                  </PopoverContent>
                </Popover>

                {/* Textarea */}
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                  rows={1}
                />

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">پیام‌های شما</h3>
            <p className="text-gray-500 mb-4">یک مکالمه را انتخاب کنید یا پیام جدید بفرستید</p>
            <Button onClick={() => setNewDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              پیام جدید
            </Button>
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              پیام جدید
            </DialogTitle>
            <DialogDescription>
              گیرنده را انتخاب کرده و پیام خود را بنویسید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Recipient Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">گیرنده *</label>
              <Command className="border rounded-lg">
                <CommandInput
                  value={recipientSearch}
                  onValueChange={setRecipientSearch}
                  placeholder="جستجوی نام یا نقش..."
                />
                <CommandList>
                  <CommandEmpty>کاربری یافت نشد</CommandEmpty>
                  <CommandGroup>
                    {availableUsers
                      .filter((u) => !selectedRecipients.some((r) => r.id === u.id))
                      .map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => setSelectedRecipients([...selectedRecipients, user])}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                          </div>
                          {user.isOnline && (
                            <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                          )}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>

              {/* Selected Recipients */}
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRecipients.map((user) => (
                    <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                      {user.name}
                      <button
                        onClick={() =>
                          setSelectedRecipients(selectedRecipients.filter((r) => r.id !== user.id))
                        }
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">پیام *</label>
              <Textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                className="min-h-[100px]"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">پیوست (اختیاری)</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <Paperclip className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">آپلود فایل (PDF, DOCX, JPG, PNG)</p>
                <p className="text-xs text-gray-400">حداکثر 5MB</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleStartNewConversation} disabled={isSending} className="gap-2">
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              ارسال پیام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}












































