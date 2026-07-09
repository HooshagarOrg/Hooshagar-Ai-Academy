'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { faIR } from 'date-fns/locale'
import {
  Bell,
  Settings,
  CheckCheck,
  Filter,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notificationIcons } from '@/types/notifications.types'
import { EmptyState } from '@/components/ui/empty-state'
import { PageErrorState, PageLoading } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const [filterType, setFilterType] = useState<string>('all')
  const [filterRead, setFilterRead] = useState<string>('all')

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications({
    limit: 50,
    unreadOnly: filterRead === 'unread',
    realtime: true,
    fallbackPollMs: 60_000,
  })

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'all') return true
    return n.notification_type === filterType
  })

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
    }
    return emojiMap[type] || '🔔'
  }

  return (
    <DashboardPage
      title="اعلان‌ها"
      description="مشاهده و مدیریت اعلان‌های خود"
      actions={
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
      }
    >
      <DashboardSectionBlock>
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
                <span className="text-sm text-[var(--lux-text)]">نوع:</span>
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
                <span className="text-sm text-[var(--lux-text)]">وضعیت:</span>
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
                  <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                  بروزرسانی
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
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
              const iconConfig = notificationIcons[notif.notification_type]

              return (
                <Card
                  key={notif.id}
                  className={cn(
                    'cursor-pointer border-r-4 transition-shadow hover:shadow-md',
                    !notif.is_read
                      ? 'border-r-[var(--lux-primary)] bg-[var(--lux-primary)]/8'
                      : 'border-r-transparent',
                  )}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn('flex-shrink-0 rounded-full p-3', iconConfig.bgColor)}>
                        <span className="text-2xl">{getIconEmoji(notif.notification_type)}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-base font-semibold text-[var(--lux-text)]">
                              {notif.title}
                            </div>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {notif.notification_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          {!notif.is_read && (
                            <div className="h-3 w-3 flex-shrink-0 rounded-full bg-[var(--lux-primary)]" />
                          )}
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--lux-text-muted)]">
                          {notif.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-[var(--lux-text-muted)]">
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
              )
            })}
          </div>
        )}
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
