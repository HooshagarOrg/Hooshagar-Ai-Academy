'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Notification } from '@/types/notifications.types';
import { subscribeToNotifications } from '@/lib/notifications/realtime';
import { createClient } from '@/lib/supabase-client';

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  /** Realtime فعال + polling پشتیبان کند */
  realtime?: boolean;
  /** polling پشتیبان (ms) — فقط وقتی تب visible است */
  fallbackPollMs?: number;
}

const DEFAULT_FALLBACK_POLL_MS = 60_000;

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    limit = 20,
    unreadOnly = false,
    realtime = true,
    fallbackPollMs = DEFAULT_FALLBACK_POLL_MS,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const initialLoadDone = useRef(false);

  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      if (!silent && !initialLoadDone.current) {
        setIsLoading(true);
      } else if (silent) {
        setIsRefreshing(true);
      }
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
      initialLoadDone.current = true;
    } catch {
      setError('خطای شبکه');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [limit, unreadOnly]);

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
    } catch {
      return false;
    }
  }, []);

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
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    void fetchNotifications(false);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!realtime) return;

    const supabase = createClient();
    let unsubscribe: (() => void) | null = null;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;

      unsubscribe = subscribeToNotifications(data.user.id, {
        onInsert: (notification) => {
          setNotifications((prev) => [notification, ...prev].slice(0, limit));
          if (!notification.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
        },
        onUpdate: (notification) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? notification : n))
          );
          if (notification.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        },
        onDelete: (id) => {
          setNotifications((prev) => {
            const removed = prev.find((n) => n.id === id);
            if (removed && !removed.is_read) {
              setUnreadCount((count) => Math.max(0, count - 1));
            }
            return prev.filter((n) => n.id !== id);
          });
        },
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [realtime, limit]);

  useEffect(() => {
    if (!realtime || fallbackPollMs <= 0) return;

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      void fetchNotifications(true);
    };

    const intervalId = setInterval(tick, fallbackPollMs);
    return () => clearInterval(intervalId);
  }, [realtime, fallbackPollMs, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    markAsRead,
    markAllAsRead,
    refresh: () => fetchNotifications(true),
  };
}
