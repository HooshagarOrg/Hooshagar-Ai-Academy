'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  reference_type?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // دریافت notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=50');
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        toast.error(data.error || 'خطا در دریافت اعلانات');
      }
    } catch (error) {
      console.error('خطا در دریافت اعلانات:', error);
      toast.error('خطا در دریافت اعلانات');
    } finally {
      setIsLoading(false);
    }
  };

  // فیلتر کردن notifications
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredNotifications(notifications);
    } else if (activeTab === 'unread') {
      setFilteredNotifications(notifications.filter((n) => !n.is_read));
    } else {
      setFilteredNotifications(notifications.filter((n) => n.type === activeTab));
    }
  }, [activeTab, notifications]);

  // علامت‌گذاری به عنوان خوانده‌شده
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        toast.success('اعلان خوانده شد');
      }
    } catch (error) {
      console.error('خطا در به‌روزرسانی اعلان:', error);
      toast.error('خطا در به‌روزرسانی');
    }
  };

  // علامت‌گذاری همه به عنوان خوانده‌شده
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
        toast.success('همه اعلانات خوانده شدند');
      }
    } catch (error) {
      console.error('خطا در به‌روزرسانی اعلانات:', error);
      toast.error('خطا در به‌روزرسانی');
    }
  };

  // حذف notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
        toast.success('اعلان حذف شد');
      }
    } catch (error) {
      console.error('خطا در حذف اعلان:', error);
      toast.error('خطا در حذف');
    }
  };

  // دریافت اولیه
  useEffect(() => {
    fetchNotifications();
  }, []);

  // آیکون بر اساس نوع
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      badge: '🏆',
      xp: '⚡',
      assignment: '📝',
      exam: '📊',
      announcement: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
    };
    return icons[type] || 'ℹ️';
  };

  // رنگ بر اساس priority
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      urgent: { variant: 'destructive', label: 'فوری' },
      high: { variant: 'default', label: 'مهم' },
      normal: { variant: 'secondary', label: 'عادی' },
      low: { variant: 'outline', label: 'کم‌اهمیت' },
    };
    const config = variants[priority] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // فرمت زمان
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-8 h-8 text-white" />
                <h1 className="text-3xl font-bold text-white">اعلانات</h1>
              </div>
              <p className="text-blue-100">مدیریت اعلانات و پیام‌های سیستم</p>
            </div>
            <div className="text-left">
              <div className="text-5xl font-bold text-white">{unreadCount}</div>
              <div className="text-blue-100 text-sm">خوانده‌نشده</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <Button onClick={fetchNotifications} variant="outline" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
        <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
          <Check className="w-4 h-4 ml-2" />
          خواندن همه
        </Button>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full mb-6">
            <TabsTrigger value="all">همه</TabsTrigger>
            <TabsTrigger value="unread">خوانده‌نشده</TabsTrigger>
            <TabsTrigger value="badge">نشان‌ها</TabsTrigger>
            <TabsTrigger value="xp">امتیازات</TabsTrigger>
            <TabsTrigger value="assignment">تکالیف</TabsTrigger>
            <TabsTrigger value="announcement">اطلاعیه‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-4" />
                <p className="text-gray-500">در حال بارگذاری...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">اعلانی برای نمایش وجود ندارد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`transition-all hover:shadow-lg ${
                      !notification.is_read
                        ? 'border-r-4 border-r-blue-500 bg-blue-50/30'
                        : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-3xl">{getTypeIcon(notification.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg">
                                {notification.title}
                              </CardTitle>
                              {!notification.is_read && (
                                <Badge variant="default">جدید</Badge>
                              )}
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <CardDescription>
                              {formatDateTime(notification.created_at)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              title="علامت به عنوان خوانده‌شده"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">
                        {notification.message}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

