'use client';

/**
 * Notification Bell Component v2.0
 * 
 * نمایش اعلان‌های real-time با Supabase Realtime
 * استراتژی: Real-time subscription + useNotifications hook
 */

import { useState } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { notificationIcons } from '@/types/notifications.types';
import type { Notification } from '@/types/notifications.types';
import Link from 'next/link';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    limit: 20,
    realtime: true,
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // اگر action_url داشت، بستن dropdown
    if (notification.action_url) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
        aria-label="اعلان‌ها"
        title="اعلان‌های real-time"
      >
        <Bell className={`w-6 h-6 text-gray-700 transition-transform ${isLoading ? 'scale-110' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Loading indicator */}
        {isLoading && (
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">اعلان‌ها</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {unreadCount} خوانده نشده
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    title="خواندن همه"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  title="بستن"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
                  <p className="mt-2">در حال بارگذاری...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>اعلانی وجود ندارد</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const iconConfig = notificationIcons[notif.notification_type];
                  const NotificationContent = (
                    <div
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                        !notif.is_read ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent'
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 mt-1 p-2 rounded-full ${iconConfig.bgColor}`}>
                          <span className={`text-lg ${iconConfig.color}`}>
                            {getIconEmoji(notif.notification_type)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900">
                            {notif.title}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notif.message}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(notif.created_at), {
                              addSuffix: true,
                              locale: faIR,
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
                  );

                  // اگر action_url داشت، با Link wrap کن
                  if (notif.action_url) {
                    return (
                      <Link key={notif.id} href={notif.action_url}>
                        {NotificationContent}
                      </Link>
                    );
                  }

                  return <div key={notif.id}>{NotificationContent}</div>;
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                <Link
                  href="/notifications"
                  className="text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  مشاهده همه اعلان‌ها
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function getIconEmoji(type: string) {
  switch (type) {
    case 'report_published':
      return '📊';
    case 'grade_added':
      return '📝';
    case 'attendance_alert':
      return '⚠️';
    case 'homework_due':
      return '📚';
    case 'homework_graded':
      return '✅';
    case 'achievement':
      return '🎯';
    case 'badge_earned':
      return '🏆';
    case 'xp_milestone':
      return '⚡';
    case 'system':
      return '⚙️';
    case 'announcement':
      return '📢';
    default:
      return '🔔';
  }
}
