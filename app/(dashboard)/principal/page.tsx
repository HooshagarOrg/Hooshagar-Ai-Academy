'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, BarChart3, AlertCircle, Loader2, TrendingUp, School, FileText } from 'lucide-react'
import Link from 'next/link'

type Stats = {
  students: number; teachers: number; parents: number
  grades_today: number; avg_grade: number
  attendance_rate: number; pending_issues: number
}

export default function PrincipalDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // بارگذاری آمار از API جریان داده
    fetch('/api/admin/data-flow')
      .then(r => r.json())
      .then(d => {
        const s = d.stats || {}
        setStats({
          students: s.students_total || 0,
          teachers: s.teachers_total || 0,
          parents: s.parents_total || 0,
          grades_today: s.grades_total || 0,
          avg_grade: 0,
          attendance_rate: 0,
          pending_issues: d.issues?.length || 0,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const today = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date())

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <School className="text-indigo-600" /> داشبورد مدیر مدرسه
        </h1>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto" size={32} /></div>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard label="دانش‌آموزان" value={stats?.students || 0} icon={<GraduationCap />} color="blue" link="/admin/users?role=student" />
            <StatCard label="معلمان" value={stats?.teachers || 0} icon={<Users />} color="green" link="/admin/users?role=teacher" />
            <StatCard label="والدین" value={stats?.parents || 0} icon={<Users />} color="purple" link="/admin/users?role=parent" />
            <StatCard label="مشکلات سیستم" value={stats?.pending_issues || 0} icon={<AlertCircle />} color={stats?.pending_issues ? 'red' : 'gray'} link="/admin/data-flow" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* دسترسی‌های سریع */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 size={20} /> دسترسی سریع</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {[
                  { label: 'مدیریت کاربران', href: '/admin/users', icon: '👥' },
                  { label: 'ثبت‌نام مدارس', href: '/admin/schools', icon: '🏫' },
                  { label: 'قرعه‌کشی کلاس', href: '/admin/lottery', icon: '🎲' },
                  { label: 'انتقال دانش‌آموزان', href: '/admin/progression', icon: '⬆️' },
                  { label: 'واردسازی گروهی', href: '/admin/bulk-import', icon: '📥' },
                  { label: 'جریان داده', href: '/admin/data-flow', icon: '🔁' },
                  { label: 'امنیت', href: '/admin/security', icon: '🔒' },
                  { label: 'تنظیمات', href: '/admin/settings', icon: '⚙️' },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* راهنمای مدیر */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={20} /> وضعیت سیستم</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <StatusRow label="اتصال کاربران به دانش‌آموزان" ok={!!stats && stats.students > 0} />
                <StatusRow label="اتصال والد به فرزند" ok={!!stats && stats.parents > 0} />
                <StatusRow label="ثبت نمره توسط معلمان" ok={!!stats && stats.grades_today > 0} />
                <StatusRow label="مشکلات جریان داده" ok={!stats?.pending_issues} reverseColor />
                <div className="pt-2 border-t">
                  <Link href="/admin/data-flow" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    <TrendingUp size={14} /> مشاهده گزارش کامل جریان داده
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color, link }: {
  label: string; value: number; icon: React.ReactNode; color: string; link?: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600', red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-400',
  }
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold">{value.toLocaleString('fa-IR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
  return link ? <Link href={link}>{content}</Link> : content
}

function StatusRow({ label, ok, reverseColor }: { label: string; ok: boolean; reverseColor?: boolean }) {
  const isGood = reverseColor ? !ok : ok
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700">{label}</span>
      <span className={`flex items-center gap-1 font-medium ${isGood ? 'text-green-600' : 'text-orange-600'}`}>
        {isGood ? '✅ سالم' : '⚠️ نیاز به توجه'}
      </span>
    </div>
  )
}
