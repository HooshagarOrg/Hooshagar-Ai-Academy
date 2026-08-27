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
  /** polling پشتیبان (ms) — فقط وقتی تب visible است؛ پیش‌فرض ۱۲۰s */
  fallbackPollMs?: number;
}

const DEFAULT_FALLBACK_POLL_MS = 120_000;

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
  const [realtimeOk, setRealtimeOk] = useState(true);
  const initialLoadDone = useRef(false);
  const lastUnreadRef = useRef<number | null>(null);

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
      lastUnreadRef.current = data.unread_count;
      initialLoadDone.current = true;
    } catch {
      setError('خطای شبکه');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [limit, unreadOnly]);

  const fetchUnreadOnly = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      const data = await res.json();
      if (!data.success) return;
      const next = typeof data.count === 'number' ? data.count : 0;
      if (lastUnreadRef.current !== null && next !== lastUnreadRef.current) {
        await fetchNotifications(true);
      } else {
        setUnreadCount(next);
        lastUnreadRef.current = next;
      }
    } catch {
      // silent
    }
  }, [fetchNotifications]);

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
        setUnreadCount((prev) => {
          const next = Math.max(0, prev - 1);
          lastUnreadRef.current = next;
          return next;
        });
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
        lastUnreadRef.current = 0;
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

      try {
        unsubscribe = subscribeToNotifications(data.user.id, {
          onInsert: (notification) => {
            setRealtimeOk(true);
            setNotifications((prev) => [notification, ...prev].slice(0, limit));
            if (!notification.is_read) {
              setUnreadCount((prev) => {
                const next = prev + 1;
                lastUnreadRef.current = next;
                return next;
              });
            }
          },
          onUpdate: (notification) => {
            setRealtimeOk(true);
            setNotifications((prev) =>
              prev.map((n) => (n.id === notification.id ? notification : n))
            );
            if (notification.is_read) {
              setUnreadCount((prev) => {
                const next = Math.max(0, prev - 1);
                lastUnreadRef.current = next;
                return next;
              });
            }
          },
          onDelete: (id) => {
            setRealtimeOk(true);
            setNotifications((prev) => {
              const removed = prev.find((n) => n.id === id);
              if (removed && !removed.is_read) {
                setUnreadCount((count) => {
                  const next = Math.max(0, count - 1);
                  lastUnreadRef.current = next;
                  return next;
                });
              }
              return prev.filter((n) => n.id !== id);
            });
          },
        });
      } catch {
        setRealtimeOk(false);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [realtime, limit]);

  useEffect(() => {
    if (!realtime || fallbackPollMs <= 0) return;

    // اگر Realtime قطع باشد، polling را دو برابر سریع‌تر کن
    const interval = realtimeOk ? fallbackPollMs : Math.min(fallbackPollMs, 60_000);

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      void fetchUnreadOnly();
    };

    const intervalId = setInterval(tick, interval);
    return () => clearInterval(intervalId);
  }, [realtime, fallbackPollMs, fetchUnreadOnly, realtimeOk]);

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
