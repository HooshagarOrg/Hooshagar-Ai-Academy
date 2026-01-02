'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Notification } from '@/types/notifications.types';

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  pollingInterval?: number; // milliseconds
}

export function useNotificationsPolling(options: UseNotificationsOptions = {}) {
  const {
    limit = 20,
    unreadOnly = false,
    pollingInterval = 5000, // 5 ثانیه
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Polling
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log(`🔄 Polling notifications every ${pollingInterval / 1000}s`);

    intervalRef.current = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotifications, pollingInterval]);

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

