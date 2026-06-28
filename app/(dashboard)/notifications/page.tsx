'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationsPolling } from '@/hooks/use-notifications-polling';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { 
  Bell, 
  Settings, 
  CheckCheck, 
  Trash2,
  Filter,
  RefreshCw 
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { notificationIcons } from '@/types/notifications.types';
import { EmptyState } from '@/components/ui/empty-state';
import { PageErrorState, PageLoading } from '@/components/ui/page-states';

export default function NotificationsPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotificationsPolling({
    limit: 50,
    unreadOnly: filterRead === 'unread',
    pollingInterval: 10000, // 10 ثانیه
  });

  // فیلتر محلی بر اساس نوع
  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'all') return true;
    return n.notification_type === filterType;
  });

  const getIconEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      report_published: '📊',
      grade_added: '📝',
      attendance_alert: '⚠️',
      homework_due: '📚',
      homework_graded: '✅',
      achievement: '🎯',
      badge_earned: '🏆',
      xp_milestone: '⚡',
      system: '⚙️',
      announcement: '📢',
    };
    return emojiMap[type] || '🔔';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">اعلان‌ها</h1>
          <p className="mt-1 text-sm leading-7 text-muted-foreground sm:text-base">
            مشاهده و مدیریت اعلان‌های خود
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {unreadCount} خوانده نشده
          </Badge>
          <Link href="/notifications/settings">
            <Button variant="outline" size="sm" className="min-h-10 gap-2">
              <Settings className="h-4 w-4" aria-hidden />
              تنظیمات
            </Button>
          </Link>
        </div>
      </div>

      {/* فیلترها */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-sm">نوع:</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="report_published">گزارش منتشر شده</SelectItem>
                  <SelectItem value="grade_added">نمره جدید</SelectItem>
                  <SelectItem value="attendance_alert">هشدار غیبت</SelectItem>
                  <SelectItem value="homework_due">تکلیف</SelectItem>
                  <SelectItem value="homework_graded">نمره تکلیف</SelectItem>
                  <SelectItem value="achievement">دستاورد</SelectItem>
                  <SelectItem value="badge_earned">نشان</SelectItem>
                  <SelectItem value="xp_milestone">سطح جدید</SelectItem>
                  <SelectItem value="system">سیستم</SelectItem>
                  <SelectItem value="announcement">اطلاعیه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-sm">وضعیت:</span>
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="unread">خوانده نشده</SelectItem>
                  <SelectItem value="read">خوانده شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1" />

            <div className="flex flex-wrap items-center gap-2 sm:mr-auto">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  size="sm"
                  className="min-h-10 flex-1 gap-2 sm:flex-none"
                >
                  <CheckCheck className="h-4 w-4" />
                  خواندن همه
                </Button>
              )}
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                className="min-h-10 flex-1 gap-2 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                بروزرسانی
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* لیست اعلان‌ها */}
      {error ? (
        <PageErrorState
          message={error || 'دریافت اعلان‌ها ناموفق بود. لطفاً دوباره تلاش کنید.'}
          onRetry={refresh}
        />
      ) : isLoading && notifications.length === 0 ? (
        <PageLoading label="در حال بارگذاری اعلان‌ها..." compact />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="اعلانی یافت نشد"
          description={
            filterType !== 'all' || filterRead !== 'all'
              ? 'فیلترهای دیگری را امتحان کنید'
              : 'اعلانی برای نمایش وجود ندارد'
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notif) => {
            const iconConfig = notificationIcons[notif.notification_type];
            
            const NotificationContent = (
              <Card
                className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                  !notif.is_read ? 'bg-blue-50/50 border-l-blue-500' : 'border-l-transparent'
                }`}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-3 rounded-full ${iconConfig.bgColor}`}>
                      <span className="text-2xl">
                        {getIconEmoji(notif.notification_type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-base">
                            {notif.title}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {notif.notification_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        {!notif.is_read && (
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-blue-600 rounded-full" />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                        {notif.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: faIR,
                          })}
                        </span>
                        {notif.action_url && (
                          <Link href={notif.action_url}>
                            <Button variant="link" size="sm" className="h-auto p-0">
                              مشاهده جزئیات ←
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );

            return <div key={notif.id}>{NotificationContent}</div>;
          })}
        </div>
      )}
    </div>
  );
}

