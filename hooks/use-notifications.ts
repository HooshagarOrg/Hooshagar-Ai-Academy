'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Notification } from '@/types/notifications.types';
import { subscribeToNotifications } from '@/lib/notifications/realtime';
import { shouldUseNotificationRealtime } from '@/lib/notifications/staff-roles';
import { createClient } from '@/lib/supabase-client';

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  /** نقش کاربر — Realtime فقط برای کارمندان */
  role?: string | null;
  /** اگر ست شود، تصمیم نقش را نادیده می‌گیرد */
  realtime?: boolean;
  /** polling پشتیبان (ms) — فقط وقتی تب visible است */
  fallbackPollMs?: number;
}

const STAFF_FALLBACK_POLL_MS = 120_000;
const POLL_ONLY_MS = 60_000;

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 20, unreadOnly = false, role = null } = options;

  const useRealtime =
    options.realtime !== undefined
      ? options.realtime
      : shouldUseNotificationRealtime(role);

  const fallbackPollMs =
    options.fallbackPollMs ?? (useRealtime ? STAFF_FALLBACK_POLL_MS : POLL_ONLY_MS);

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
    if (!useRealtime) return;

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const start = () => {
      if (unsubscribe || cancelled) return;
      const supabase = createClient();

      supabase.auth.getUser().then(({ data }) => {
        if (cancelled || !data.user || unsubscribe) return;

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
    };

    const stop = () => {
      unsubscribe?.();
      unsubscribe = null;
    };

    const onVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        start();
        void fetchUnreadOnly();
      } else {
        stop();
      }
    };

    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      start();
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      cancelled = true;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
      stop();
    };
  }, [useRealtime, limit, fetchUnreadOnly]);

  useEffect(() => {
    if (fallbackPollMs <= 0) return;

    const interval =
      useRealtime && realtimeOk
        ? fallbackPollMs
        : Math.min(fallbackPollMs, POLL_ONLY_MS);

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      void fetchUnreadOnly();
    };

    const intervalId = setInterval(tick, interval);
    return () => clearInterval(intervalId);
  }, [useRealtime, fallbackPollMs, fetchUnreadOnly, realtimeOk]);

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
