'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { NotificationPreferences } from '@/types/notifications.types';
import { PageErrorState, PageLoading } from '@/components/ui/page-states';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const res = await fetch('/api/notifications/preferences');
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();

      if (data.success) {
        setPreferences(data.preferences);
      } else {
        setLoadError(data.error || 'دریافت تنظیمات ناموفق بود');
      }
    } catch {
      setLoadError('اتصال برقرار نشد. لطفاً دوباره تلاش کنید.');
      toast({
        title: 'خطا',
        description: 'دریافت تنظیمات ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'موفق',
          description: 'تنظیمات با موفقیت ذخیره شد',
        });
      } else {
        toast({
          title: 'خطا',
          description: data.error || 'ذخیره تنظیمات ناموفق بود',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error);
      toast({
        title: 'خطا',
        description: 'خطای شبکه',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageLoading label="در حال بارگذاری تنظیمات..." compact />
      </div>
    );
  }

  if (loadError || !preferences) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageErrorState
          message={loadError || 'دریافت تنظیمات ناموفق بود'}
          onRetry={fetchPreferences}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="min-h-10 w-fit gap-2"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          بازگشت
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold sm:text-3xl">تنظیمات اعلان‌ها</h1>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">
            مدیریت انواع اعلان‌های دریافتی
          </p>
        </div>
      </div>

      {/* انواع اعلان‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>انواع اعلان‌ها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="report_published" className="cursor-pointer">
              گزارش منتشر شده
            </Label>
            <Switch
              id="report_published"
              checked={preferences.report_published_enabled}
              onCheckedChange={() => handleToggle('report_published_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="grade_added" className="cursor-pointer">
              نمره جدید
            </Label>
            <Switch
              id="grade_added"
              checked={preferences.grade_added_enabled}
              onCheckedChange={() => handleToggle('grade_added_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="attendance_alert" className="cursor-pointer">
              هشدار غیبت
            </Label>
            <Switch
              id="attendance_alert"
              checked={preferences.attendance_alert_enabled}
              onCheckedChange={() => handleToggle('attendance_alert_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="homework_due" className="cursor-pointer">
              یادآوری تکلیف
            </Label>
            <Switch
              id="homework_due"
              checked={preferences.homework_due_enabled}
              onCheckedChange={() => handleToggle('homework_due_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="homework_graded" className="cursor-pointer">
              نمره تکلیف
            </Label>
            <Switch
              id="homework_graded"
              checked={preferences.homework_graded_enabled}
              onCheckedChange={() => handleToggle('homework_graded_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="achievement" className="cursor-pointer">
              دستاوردها
            </Label>
            <Switch
              id="achievement"
              checked={preferences.achievement_enabled}
              onCheckedChange={() => handleToggle('achievement_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="badge_earned" className="cursor-pointer">
              نشان‌ها
            </Label>
            <Switch
              id="badge_earned"
              checked={preferences.badge_earned_enabled}
              onCheckedChange={() => handleToggle('badge_earned_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="xp_milestone" className="cursor-pointer">
              سطح جدید
            </Label>
            <Switch
              id="xp_milestone"
              checked={preferences.xp_milestone_enabled}
              onCheckedChange={() => handleToggle('xp_milestone_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="system" className="cursor-pointer">
              سیستم
            </Label>
            <Switch
              id="system"
              checked={preferences.system_enabled}
              onCheckedChange={() => handleToggle('system_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="announcement" className="cursor-pointer">
              اطلاعیه‌ها
            </Label>
            <Switch
              id="announcement"
              checked={preferences.announcement_enabled}
              onCheckedChange={() => handleToggle('announcement_enabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* کانال‌های دریافت */}
      <Card>
        <CardHeader>
          <CardTitle>کانال‌های دریافت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="in_app" className="cursor-pointer">
              داخل برنامه
            </Label>
            <Switch
              id="in_app"
              checked={preferences.in_app_enabled}
              onCheckedChange={() => handleToggle('in_app_enabled')}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="email" className="cursor-pointer">
              ایمیل
            </Label>
            <Switch
              id="email"
              checked={preferences.email_enabled}
              onCheckedChange={() => handleToggle('email_enabled')}
              disabled
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="push" className="cursor-pointer">
              اعلان Push
            </Label>
            <Switch
              id="push"
              checked={preferences.push_enabled}
              onCheckedChange={() => handleToggle('push_enabled')}
              disabled
            />
          </div>

          <p className="text-sm text-muted-foreground">
            * ایمیل و Push در نسخه‌های آینده فعال خواهد شد
          </p>
        </CardContent>
      </Card>

      {/* دکمه ذخیره */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => router.back()} className="min-h-10">
          انصراف
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="min-h-10">
          {isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </Button>
      </div>
    </div>
  );
}

