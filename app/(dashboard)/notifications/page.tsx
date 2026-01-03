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
import type { NotificationType } from '@/types/notifications.types';

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
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">اعلان‌ها</h1>
          <p className="text-muted-foreground mt-1">
            مشاهده و مدیریت اعلان‌های خود
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {unreadCount} خوانده نشده
          </Badge>
          <Link href="/notifications/settings">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
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
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm">نوع:</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
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
            
            <div className="flex items-center gap-2">
              <span className="text-sm">وضعیت:</span>
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="w-[140px]">
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

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  خواندن همه
                </Button>
              )}
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                className="gap-2"
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={refresh} variant="outline" className="mt-4">
                تلاش مجدد
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isLoading && notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
              <p>در حال بارگذاری...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">اعلانی یافت نشد</p>
              <p className="text-sm mt-2">
                {filterType !== 'all' || filterRead !== 'all'
                  ? 'فیلترهای دیگری را امتحان کنید'
                  : 'اعلانی برای نمایش وجود ندارد'}
              </p>
            </div>
          </CardContent>
        </Card>
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

