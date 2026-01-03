'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Notification } from '@/types/notifications.types';
import { subscribeToNotifications } from '@/lib/notifications/realtime';
import { createClient } from '@/lib/supabase-client';

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  realtime?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    limit = 20,
    unreadOnly = false,
    realtime = true,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // دریافت اعلان‌ها
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      let url = `/api/notifications?limit=${limit}`;
      if (unreadOnly) {
        url += '&unread_only=true';
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'دریافت اعلان‌ها ناموفق بود');
        return;
      }

      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('خطا در دریافت اعلان‌ها:', err);
      setError('خطای شبکه');
    } finally {
      setIsLoading(false);
    }
  }, [limit, unreadOnly]);

  // خواندن یک اعلان
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      const data = await res.json();

      if (data.success) {
        // بروزرسانی local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      return data.success;
    } catch (err) {
      console.error('خطا در خواندن اعلان:', err);
      return false;
    }
  }, []);

  // خواندن همه اعلان‌ها
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (data.success) {
        // بروزرسانی local state
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }

      return data.success;
    } catch (err) {
      console.error('خطا در خواندن همه اعلان‌ها:', err);
      return false;
    }
  }, []);

  // بارگذاری اولیه
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!realtime) {
      console.log('⏸️ Realtime disabled');
      return;
    }

    console.log('🔌 Attempting to setup realtime subscription...');
    const supabase = createClient();
    let unsubscribe: (() => void) | null = null;
    
    // دریافت user_id و subscribe
    supabase.auth.getUser().then(({ data }) => {
      console.log('👤 User from getUser():', data.user ? data.user.id : 'NO USER');
      
      if (!data.user) {
        console.error('❌ No authenticated user found for realtime!');
        return;
      }

      console.log(`🚀 Subscribing to notifications for user: ${data.user.id}`);
      unsubscribe = subscribeToNotifications(data.user.id, {
        onInsert: (notification) => {
          console.log('🔔 New notification received:', notification);
          // اضافه کردن اعلان جدید
          setNotifications((prev) => [notification, ...prev].slice(0, limit));
          if (!notification.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
        },
        onUpdate: (notification) => {
          console.log('🔄 Notification updated:', notification);
          // بروزرسانی اعلان
          setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? notification : n))
          );
          // بروزرسانی تعداد خوانده نشده
          fetchNotifications();
        },
        onDelete: (id) => {
          console.log('🗑️ Notification deleted:', id);
          // حذف اعلان
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          fetchNotifications();
        },
      });
    });

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log('🔌 Unsubscribing from notifications');
        unsubscribe();
      }
    };
  }, [realtime, limit, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}

