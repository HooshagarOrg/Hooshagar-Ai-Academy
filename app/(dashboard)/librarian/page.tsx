'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, TrendingUp, Clock, Search, Plus } from 'lucide-react'
import Link from 'next/link'

export default function LibrarianDashboard() {
  const stats = [
    { label: 'کتاب‌های امانت', value: '47', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'اعضای فعال', value: '124', icon: Users, color: 'bg-green-500' },
    { label: 'بازدید امروز', value: '28', icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'تأخیرات', value: '5', icon: Clock, color: 'bg-red-500' },
  ]

  const quickLinks = [
    { title: 'امانت کتاب', href: '#', icon: Plus, color: 'bg-blue-500' },
    { title: 'عودت کتاب', href: '#', icon: BookOpen, color: 'bg-green-500' },
    { title: 'جستجو در کتابخانه', href: '#', icon: Search, color: 'bg-purple-500' },
    { title: 'لیست اعضا', href: '#', icon: Users, color: 'bg-indigo-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">داشبورد کتابدار</h1>
          <p className="text-gray-600 mt-1">مدیریت کتابخانه مدرسه</p>
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

      {/* کتاب‌های پرطرفدار */}
      <Card>
        <CardHeader>
          <CardTitle>کتاب‌های پرطرفدار این هفته</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">شاهنامه فردوسی</p>
                  <p className="text-sm text-gray-600">امانت: 8 بار</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">رتبه 1</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">علم و زندگی</p>
                  <p className="text-sm text-gray-600">امانت: 6 بار</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">رتبه 2</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تأخیرات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">کتاب‌های تأخیردار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium">علی محمدی - پایه پنجم</p>
                <p className="text-sm text-gray-600">کتاب: ریاضیات سرگرم‌کننده</p>
              </div>
              <span className="text-sm text-red-600">3 روز تأخیر</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

