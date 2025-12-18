'use client';

import { useState, useEffect } from 'react';
import { Users, School, BookOpen, TrendingUp, Award, Activity, DollarSign, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Stats {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  total_parents: number;
  active_users_today: number;
  total_xp_earned: number;
  total_badges_unlocked: number;
  completion_rate: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - باید از API واقعی بیاید
    setTimeout(() => {
      setStats({
        total_schools: 12,
        total_students: 1834,
        total_teachers: 156,
        total_parents: 1200,
        active_users_today: 523,
        total_xp_earned: 145000,
        total_badges_unlocked: 892,
        completion_rate: 78.5,
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">پنل مدیریت کل</h1>
          </div>
          <p className="text-blue-100">نمای کلی سیستم هوشاگر</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* آمار کلیدی */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-600">مدارس</CardTitle>
                <School className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.total_schools}</div>
              <p className="text-xs text-gray-500">مدرسه فعال</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-600">دانش‌آموزان</CardTitle>
                <Users className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.total_students}</div>
              <p className="text-xs text-gray-500">دانش‌آموز ثبت‌نام شده</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-600">معلمان</CardTitle>
                <BookOpen className="w-5 h-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats?.total_teachers}</div>
              <p className="text-xs text-gray-500">معلم فعال</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-600">فعالیت امروز</CardTitle>
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.active_users_today}</div>
              <p className="text-xs text-gray-500">کاربر فعال</p>
            </CardContent>
          </Card>
        </div>

        {/* Gamification Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>امتیازات XP</CardTitle>
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {stats?.total_xp_earned.toLocaleString('fa-IR')}
              </div>
              <p className="text-sm text-gray-600">مجموع امتیازات کسب شده</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>نشان‌های کسب شده</CardTitle>
                <Award className="w-6 h-6 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {stats?.total_badges_unlocked}
              </div>
              <p className="text-sm text-gray-600">نشان باز شده</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>نرخ تکمیل</CardTitle>
                <Activity className="w-6 h-6 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {stats?.completion_rate}%
              </div>
              <Progress value={stats?.completion_rate} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>فعالیت‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { user: 'علی محمدی', action: 'دریافت نشان "🎯 اولین قدم"', time: '5 دقیقه پیش', type: 'badge' },
                { user: 'مدرسه امام خمینی', action: 'ثبت 15 دانش‌آموز جدید', time: '1 ساعت پیش', type: 'school' },
                { user: 'فاطمه احمدی', action: 'ارتقا به سطح 5', time: '2 ساعت پیش', type: 'level' },
                { user: 'استاد رضایی', action: 'ایجاد 3 آزمون جدید', time: '3 ساعت پیش', type: 'exam' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

