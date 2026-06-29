'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  GraduationCap,
  BarChart3,
  AlertCircle,
  Loader2,
  TrendingUp,
  School,
  FileText,
} from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageLoading } from '@/components/ui/page-states'
import { StatCard } from '@/components/ui/stat-card'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumPanel } from '@/components/ui/premium-panel'
import { cn } from '@/lib/utils'

type Stats = {
  students: number
  teachers: number
  parents: number
  grades_today: number
  avg_grade: number
  attendance_rate: number
  pending_issues: number
}

export default function PrincipalDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/data-flow')
      .then((r) => r.json())
      .then((d) => {
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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" dir="rtl">
        <PageLoading label="در حال بارگذاری داشبورد مدیر مدرسه..." compact />
      </div>
    )
  }

  return (
    <DashboardPage
      meta={today}
      title={
        <span className="flex items-center gap-2">
          <School className="w-7 h-7 text-brand-purple" />
          داشبورد مدیر مدرسه
        </span>
      }
      description="نمای کلی مدرسه، کاربران و سلامت جریان داده"
      animatedSections={false}
    >
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/admin/users?role=student">
          <StatCard
            label="دانش‌آموزان"
            value={stats?.students || 0}
            icon={<GraduationCap className="w-6 h-6" />}
            accentClass="text-brand-cyan"
            className="h-full cursor-pointer"
          />
        </Link>
        <Link href="/admin/users?role=teacher">
          <StatCard
            label="معلمان"
            value={stats?.teachers || 0}
            icon={<Users className="w-6 h-6" />}
            accentClass="text-brand-green"
            className="h-full cursor-pointer"
          />
        </Link>
        <Link href="/admin/users?role=parent">
          <StatCard
            label="والدین"
            value={stats?.parents || 0}
            icon={<Users className="w-6 h-6" />}
            accentClass="text-brand-purple"
            className="h-full cursor-pointer"
          />
        </Link>
        <Link href="/admin/data-flow">
          <StatCard
            label="مشکلات سیستم"
            value={stats?.pending_issues || 0}
            icon={<AlertCircle className="w-6 h-6" />}
            accentClass={
              stats?.pending_issues ? 'text-destructive' : 'text-muted-foreground'
            }
            className="h-full cursor-pointer"
          />
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PremiumPanel
          title={
            <span className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-cyan" />
              دسترسی سریع
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'مدیریت کاربران', href: '/admin/users', icon: '👥' },
              { label: 'ثبت‌نام مدارس', href: '/admin/schools', icon: '🏫' },
              { label: 'قرعه‌کشی کلاس', href: '/admin/lottery', icon: '🎲' },
              { label: 'انتقال دانش‌آموزان', href: '/admin/progression', icon: '⬆️' },
              { label: 'واردسازی گروهی', href: '/admin/bulk-import', icon: '📥' },
              { label: 'جریان داده', href: '/admin/data-flow', icon: '🔁' },
              { label: 'امنیت', href: '/admin/security', icon: '🔒' },
              { label: 'تنظیمات', href: '/admin/settings', icon: '⚙️' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 p-3 rounded-xl glass-panel-quiet hover:border-white/[0.12] transition-colors"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </PremiumPanel>

        <PremiumPanel
          title={
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-purple" />
              وضعیت سیستم
            </span>
          }
        >
          <div className="space-y-3">
            <StatusRow label="اتصال کاربران به دانش‌آموزان" ok={!!stats && stats.students > 0} />
            <StatusRow label="اتصال والد به فرزند" ok={!!stats && stats.parents > 0} />
            <StatusRow label="ثبت نمره توسط معلمان" ok={!!stats && stats.grades_today > 0} />
            <StatusRow label="مشکلات جریان داده" ok={!stats?.pending_issues} reverseColor />
            <div className="pt-2 border-t border-white/[0.06]">
              <Link
                href="/admin/data-flow"
                className="text-sm text-brand-cyan hover:opacity-80 flex items-center gap-1"
              >
                <TrendingUp size={14} />
                مشاهده گزارش کامل جریان داده
              </Link>
            </div>
          </div>
        </PremiumPanel>
      </div>
    </DashboardPage>
  )
}

function StatusRow({
  label,
  ok,
  reverseColor,
}: {
  label: string
  ok: boolean
  reverseColor?: boolean
}) {
  const isGood = reverseColor ? !ok : ok
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'flex items-center gap-1 font-medium',
          isGood ? 'text-brand-green' : 'text-brand-orange',
        )}
      >
        {isGood ? 'سالم' : 'نیاز به توجه'}
      </span>
    </div>
  )
}
