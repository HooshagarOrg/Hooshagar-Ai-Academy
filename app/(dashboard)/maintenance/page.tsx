'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wrench, AlertCircle, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function MaintenanceDashboard() {
  const stats = [
    { label: 'درخواست‌های باز', value: '8', icon: AlertCircle, color: 'bg-yellow-500' },
    { label: 'انجام‌شده امروز', value: '5', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'در حال انجام', value: '3', icon: Clock, color: 'bg-blue-500' },
    { label: 'تعمیرات برنامه‌ای', value: '2', icon: Calendar, color: 'bg-purple-500' },
  ]

  const quickLinks = [
    { title: 'ثبت درخواست جدید', href: '#', icon: Wrench, color: 'bg-blue-500' },
    { title: 'لیست درخواست‌ها', href: '#', icon: AlertCircle, color: 'bg-yellow-500' },
    { title: 'برنامه تعمیرات', href: '#', icon: Calendar, color: 'bg-purple-500' },
    { title: 'گزارش‌ها', href: '#', icon: CheckCircle, color: 'bg-green-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">داشبورد خدمات و تعمیرات</h1>
          <p className="text-gray-600 mt-1">مدیریت نگهداری و تعمیرات مدرسه</p>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* دسترسی سریع */}
      <Card>
        <CardHeader>
          <CardTitle>عملیات سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="flex items-center gap-3 p-4 rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className={`${link.color} p-2 rounded-lg`}>
                  <link.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">{link.title}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* درخواست‌های فوری */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">درخواست‌های فوری</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">نشتی لوله کلاس 3-الف</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    طبقه سوم
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    2 ساعت پیش
                  </span>
                </div>
              </div>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">فوری</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* در حال انجام */}
      <Card>
        <CardHeader>
          <CardTitle>تعمیرات در حال انجام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">تعمیر سیستم گرمایش سالن</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    سالن ورزشی
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">60% تکمیل</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تعمیرات برنامه‌ای */}
      <Card>
        <CardHeader>
          <CardTitle>تعمیرات برنامه‌ای هفته آینده</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium">سرویس دوره‌ای کولرها</p>
                  <p className="text-sm text-gray-600">شنبه - ساعت 14:00</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

