'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Notification } from '@/types/notifications.types';

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  pollingInterval?: number;
}

const DEFAULT_POLL_MS = 30_000;

export function useNotificationsPolling(options: UseNotificationsOptions = {}) {
  const {
    limit = 20,
    unreadOnly = false,
    pollingInterval = DEFAULT_POLL_MS,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      void fetchNotifications(true);
    };

    intervalRef.current = setInterval(tick, pollingInterval);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchNotifications(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchNotifications, pollingInterval]);

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
