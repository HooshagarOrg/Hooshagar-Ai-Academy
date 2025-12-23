'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, AlertTriangle, CheckCircle, Camera, Clock } from 'lucide-react'
import Link from 'next/link'

export default function SecurityDashboard() {
  const stats = [
    { label: 'ورود امروز', value: '342', icon: Users, color: 'bg-blue-500' },
    { label: 'خروج امروز', value: '285', icon: Users, color: 'bg-green-500' },
    { label: 'موارد قابل توجه', value: '2', icon: AlertTriangle, color: 'bg-yellow-500' },
    { label: 'حاضران', value: '57', icon: CheckCircle, color: 'bg-purple-500' },
  ]

  const quickLinks = [
    { title: 'ثبت ورود', href: '#', icon: CheckCircle, color: 'bg-green-500' },
    { title: 'ثبت خروج', href: '#', icon: Clock, color: 'bg-blue-500' },
    { title: 'گزارش رخدادها', href: '#', icon: AlertTriangle, color: 'bg-yellow-500' },
    { title: 'دوربین‌ها', href: '#', icon: Camera, color: 'bg-purple-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">داشبورد نگهبانی</h1>
          <p className="text-gray-600 mt-1">مدیریت امنیت مدرسه</p>
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

      {/* موارد قابل توجه */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-600">موارد قابل توجه امروز</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium">ورود دیرهنگام</p>
                <p className="text-sm text-gray-600">3 دانش‌آموز - ساعت 8:30</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">بازدید مهمان</p>
                <p className="text-sm text-gray-600">والدین برای ملاقات - ساعت 10:00</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* وضعیت درب‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>وضعیت درب‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">درب اصلی</span>
              </div>
              <p className="text-sm text-gray-600">باز - نگهبان حاضر</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="font-medium">درب پارکینگ</span>
              </div>
              <p className="text-sm text-gray-600">بسته</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

