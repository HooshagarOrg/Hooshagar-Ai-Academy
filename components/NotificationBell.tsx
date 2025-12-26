'use client'

/**
 * Notification Bell Component
 * 
 * نمایش اعلان‌های داخل برنامه با آیکون زنگ
 * استراتژی: Polling هر 15 ثانیه (بدون نیاز به Realtime)
 */

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { formatDistanceToNow } from 'date-fns'
import { faIR } from 'date-fns/locale'

// تنظیمات Polling
const POLLING_INTERVAL = 15000 // 15 ثانیه
const POLLING_INTERVAL_WHEN_OPEN = 5000 // 5 ثانیه وقتی dropdown باز است

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link_url?: string
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousUnreadCountRef = useRef(0)

  const supabase = createClient()

  // Load notifications on mount
  useEffect(() => {
    loadNotifications()
  }, [])

  // Detect when tab/window is visible or hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
      if (!document.hidden) {
        // وقتی tab دوباره visible شد، بلافاصله چک کن
        console.log('👁️ Tab visible again - checking notifications')
        loadNotifications()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Setup polling based on dropdown state and visibility
  useEffect(() => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // فقط اگر tab visible است polling کن
    if (!isVisible) {
      console.log('👁️ Tab hidden - pausing polling')
      return
    }

    // Set interval based on dropdown state
    const interval = isOpen ? POLLING_INTERVAL_WHEN_OPEN : POLLING_INTERVAL
    
    console.log(`🔄 Polling notifications every ${interval / 1000}s`)
    
    pollingIntervalRef.current = setInterval(() => {
      loadNotifications()
    }, interval)

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [isOpen, isVisible])

  async function loadNotifications() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      // بررسی تغییرات
      const newUnreadCount = data.filter(n => !n.is_read).length
      if (newUnreadCount > previousUnreadCountRef.current) {
        console.log(`🔔 ${newUnreadCount - previousUnreadCountRef.current} new notification(s)!`)
      }
      
      previousUnreadCountRef.current = newUnreadCount
      setNotifications(data)
      setUnreadCount(newUnreadCount)
    }
    setLoading(false)
  }

  async function markAsRead(id: string) {
    await supabase
      .from('in_app_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('in_app_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
        aria-label="اعلان‌ها"
        title={`اعلان‌ها (بررسی خودکار هر ${isOpen ? '5' : '15'} ثانیه)`}
      >
        <Bell className={`w-6 h-6 text-gray-700 transition-transform ${loading ? 'scale-110' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Polling indicator (subtle pulse) */}
        {loading && (
          <span className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-lg">اعلان‌ها</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  خواندن همه
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  در حال بارگذاری...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  اعلانی وجود ندارد
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notif.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon based on type */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">
                          {notif.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {notif.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: faIR
                          })}
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notif.is_read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'report':
      return <span className="text-xl">📊</span>
    case 'message':
      return <span className="text-xl">💬</span>
    case 'alert':
      return <span className="text-xl">⚠️</span>
    case 'achievement':
      return <span className="text-xl">🏆</span>
    case 'announcement':
      return <span className="text-xl">📢</span>
    default:
      return <span className="text-xl">🔔</span>
  }
}
