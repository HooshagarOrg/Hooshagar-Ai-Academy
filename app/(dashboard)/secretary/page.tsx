'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Phone, Calendar, Mail, Bell } from 'lucide-react'
import Link from 'next/link'

export default function SecretaryDashboard() {
  const stats = [
    { label: 'پیام‌های امروز', value: '12', icon: Mail, color: 'bg-blue-500' },
    { label: 'تماس‌های ثبت‌شده', value: '8', icon: Phone, color: 'bg-green-500' },
    { label: 'جلسات هفته', value: '15', icon: Calendar, color: 'bg-purple-500' },
    { label: 'یادآوری‌ها', value: '5', icon: Bell, color: 'bg-yellow-500' },
  ]

  const quickLinks = [
    { title: 'ثبت مکاتبات', href: '#', icon: FileText, color: 'bg-blue-500' },
    { title: 'لیست تماس‌ها', href: '#', icon: Phone, color: 'bg-green-500' },
    { title: 'مدیریت جلسات', href: '#', icon: Calendar, color: 'bg-purple-500' },
    { title: 'دفتر حضور و غیاب', href: '#', icon: Users, color: 'bg-indigo-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">داشبورد منشی</h1>
          <p className="text-gray-600 mt-1">مدیریت دفتر و امور اداری</p>
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
          <CardTitle>دسترسی سریع</CardTitle>
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

      {/* یادآوری */}
      <Card>
        <CardHeader>
          <CardTitle>یادآوری‌های امروز</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium">جلسه شورای معلمان</p>
                <p className="text-sm text-gray-600">امروز ساعت 10:00</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">پاسخ به مکاتبه اداره آموزش</p>
                <p className="text-sm text-gray-600">ضرب‌الاجل: پایان امروز</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

