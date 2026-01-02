// ============================================
// Notifications Real-time Subscription
// ============================================

import { createClient } from '@/lib/supabase-client';
import type { Notification } from '@/types/notifications.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class NotificationRealtime {
  private channel: RealtimeChannel | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribe(
    onInsert?: (notification: Notification) => void,
    onUpdate?: (notification: Notification) => void,
    onDelete?: (id: string) => void
  ) {
    const supabase = createClient();

    this.channel = supabase
      .channel(`notifications:user:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          if (onInsert && payload.new) {
            onInsert(payload.new as Notification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          if (onUpdate && payload.new) {
            onUpdate(payload.new as Notification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          if (onDelete && payload.old) {
            onDelete((payload.old as Notification).id);
          }
        }
      )
      .subscribe();

    return this;
  }

  /**
   * Unsubscribe from real-time notifications
   */
  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }
}

/**
 * Helper hook for using notifications with React
 * (به صورت مستقیم در Component استفاده نشود - از useNotifications استفاده کنید)
 */
export function subscribeToNotifications(
  userId: string,
  callbacks: {
    onInsert?: (notification: Notification) => void;
    onUpdate?: (notification: Notification) => void;
    onDelete?: (id: string) => void;
  }
) {
  const realtime = new NotificationRealtime(userId);
  realtime.subscribe(callbacks.onInsert, callbacks.onUpdate, callbacks.onDelete);

  return () => {
    realtime.unsubscribe();
  };
}

