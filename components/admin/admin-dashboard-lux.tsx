'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity, AlertCircle, BarChart3, Brain, Building, Calendar, CreditCard,
  DollarSign, FileText, GraduationCap, Key, Loader2, Send, Settings, Shield,
  Sliders, Sparkles, Trophy, Users, Video, Zap,
} from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxStatGrid } from '@/components/lux/lux-stat-grid'
import { LuxHubGrid, type LuxHubGroup } from '@/components/lux/lux-hub-grid'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'

const ADMIN_HUB: LuxHubGroup[] = [
  {
    title: 'مدیریت سازمان',
    cards: [
      {
        title: 'مدارس',
        description: 'افزودن، ویرایش و مدیریت مدارس تحت پلتفرم',
        icon: Building,
        href: '/admin/schools',
        color: 'text-brand-purple',
        bg: 'bg-brand-purple/15 border border-brand-purple/20',
      },
      {
        title: 'کاربران',
        description: 'مدیریت کارکنان، معلمان، دانش‌آموزان و والدین',
        icon: Users,
        href: '/admin/users',
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/15 border border-brand-cyan/20',
        featured: true,
      },
      {
        title: 'واردسازی گروهی',
        description: 'بارگذاری انبوه دانش‌آموزان و کاربران',
        icon: FileText,
        href: '/admin/bulk-import',
        color: 'text-brand-green',
        bg: 'bg-brand-green/15 border border-brand-green/20',
      },
      {
        title: 'ارتقاء پایه',
        description: 'ارتقاء دانش‌آموزان به پایه بالاتر',
        icon: GraduationCap,
        href: '/admin/progression',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border border-emerald-500/20',
      },
      {
        title: 'انتقال بین‌مدرسه‌ای',
        description: 'تأیید و مدیریت انتقال دانش‌آموزان',
        icon: Activity,
        href: '/admin/transfers',
        color: 'text-brand-yellow',
        bg: 'bg-brand-yellow/15 border border-brand-yellow/20',
      },
      {
        title: 'کلاس مجازی',
        description: 'اتصال کلاس‌ها به اسکای‌روم',
        icon: Video,
        href: '/admin/virtual-classes',
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/15 border border-brand-cyan/20',
      },
    ],
  },
  {
    title: 'هوش مصنوعی',
    cards: [
      {
        title: 'مدل‌های AI',
        description: 'پیکربندی مدل‌ها برای هر قابلیت',
        icon: Brain,
        href: '/admin/ai-models',
        color: 'text-brand-purple',
        bg: 'bg-brand-purple/15 border border-brand-purple/20',
      },
      {
        title: 'محدودیت‌های AI',
        description: 'سقف استفاده روزانه و ماهانه',
        icon: Sliders,
        href: '/admin/ai-limits',
        color: 'text-brand-yellow',
        bg: 'bg-brand-yellow/15 border border-brand-yellow/20',
      },
      {
        title: 'کنترل دسترسی',
        description: 'دسترسی نقش‌ها به قابلیت‌های AI',
        icon: Key,
        href: '/admin/ai-access-control',
        color: 'text-brand-pink',
        bg: 'bg-brand-pink/15 border border-brand-pink/20',
      },
      {
        title: 'مصرف AI',
        description: 'آمار و گزارش مصرف',
        icon: BarChart3,
        href: '/admin/ai-usage-dashboard',
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/15 border border-brand-cyan/20',
      },
      {
        title: 'اعتبار AI',
        description: 'مدیریت اعتبار خریداری‌شده',
        icon: Sparkles,
        href: '/admin/ai-credits',
        color: 'text-brand-yellow',
        bg: 'bg-brand-yellow/15 border border-brand-yellow/20',
      },
      {
        title: 'تست AI',
        description: 'آزمایش مدل‌ها و fallback',
        icon: Zap,
        href: '/admin/ai-test',
        color: 'text-brand-green',
        bg: 'bg-brand-green/15 border border-brand-green/20',
      },
    ],
  },
  {
    title: 'گزارش، ارتباط و نظارت',
    cards: [
      {
        title: 'گزارشات',
        description: 'گزارش‌های تحلیلی و عملکرد',
        icon: BarChart3,
        href: '/admin/reports',
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/15 border border-brand-cyan/20',
      },
      {
        title: 'پیام گروهی',
        description: 'ارسال اعلان به گروه‌های کاربری',
        icon: Send,
        href: '/admin/broadcast',
        color: 'text-brand-purple',
        bg: 'bg-brand-purple/15 border border-brand-purple/20',
      },
      {
        title: 'هشدار زودهنگام',
        description: 'شناسایی دانش‌آموزان در معرض ریسک',
        icon: AlertCircle,
        href: '/admin/early-warning',
        color: 'text-brand-orange',
        bg: 'bg-brand-orange/15 border border-brand-orange/20',
      },
      {
        title: 'مرکز امنیت',
        description: 'لاگ امنیتی و رویدادهای مشکوک',
        icon: Shield,
        href: '/admin/security',
        color: 'text-red-400',
        bg: 'bg-red-500/15 border border-red-500/20',
      },
      {
        title: 'قرعه‌کشی',
        description: 'مدیریت قرعه‌کشی کلاس‌ها',
        icon: Trophy,
        href: '/admin/lottery',
        color: 'text-brand-gold',
        bg: 'bg-brand-gold/15 border border-brand-gold/20',
      },
      {
        title: 'تحلیل پلتفرم',
        description: 'آمار کلی و روندها',
        icon: Activity,
        href: '/admin/analytics',
        color: 'text-brand-green',
        bg: 'bg-brand-green/15 border border-brand-green/20',
      },
    ],
  },
  {
    title: 'تنظیمات و مالی',
    cards: [
      {
        title: 'تنظیمات سیستم',
        description: 'مرکز پیکربندی کامل پلتفرم',
        icon: Settings,
        href: '/admin/settings',
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/15 border border-brand-cyan/20',
      },
      {
        title: 'برندینگ مدرسه',
        description: 'لوگو، رنگ و هویت بصری',
        icon: Building,
        href: '/admin/school-settings',
        color: 'text-brand-purple',
        bg: 'bg-brand-purple/15 border border-brand-purple/20',
      },
      {
        title: 'سال تحصیلی',
        description: 'تنظیم سال فعال',
        icon: Calendar,
        href: '/admin/academic-years',
        color: 'text-brand-green',
        bg: 'bg-brand-green/15 border border-brand-green/20',
      },
      {
        title: 'شهریه',
        description: 'تعرفه و بازه‌های پرداخت',
        icon: DollarSign,
        href: '/admin/tuition-settings',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border border-emerald-500/20',
      },
      {
        title: 'اشتراک‌ها',
        description: 'پلن‌ها و بسته‌های سرویس',
        icon: CreditCard,
        href: '/admin/subscriptions',
        color: 'text-brand-pink',
        bg: 'bg-brand-pink/15 border border-brand-pink/20',
      },
      {
        title: 'ظرفیت و سهمیه',
        description: 'سهمیه پلتفرم و مدرسه',
        icon: Sliders,
        href: '/admin/quota-settings',
        color: 'text-brand-yellow',
        bg: 'bg-brand-yellow/15 border border-brand-yellow/20',
      },
    ],
  },
]

export function AdminDashboardLux() {
  const [stats, setStats] = useState({ schools: 0, users: 0, students: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--arc-admin)]" />
      </div>
    )
  }

  return (
    <div className="space-y-8" dir="rtl">
      <LuxFadeUp>
        <LuxPageHeader
          kicker="مرکز فرمان"
          title="داشبورد مدیریت"
          subtitle="کنترل کامل پلتفرم، هوش مصنوعی، کاربران و گزارش‌ها"
          action={
            <Link
              href="/admin/users"
              className="lux-btn-accent min-h-10 px-4 text-sm"
              style={{ background: 'var(--arc-admin)' }}
            >
              مدیریت کاربران
            </Link>
          }
        />
      </LuxFadeUp>

      <LuxStagger className="space-y-8" stagger={0.08}>
        <LuxStaggerItem>
          <LuxStatGrid
            items={[
              { label: 'مدارس', value: stats.schools, icon: <Building className="h-5 w-5" />, accent: 'var(--arc-admin)' },
              { label: 'کاربران', value: stats.users, icon: <Users className="h-5 w-5" />, accent: 'var(--lux-primary)' },
              { label: 'دانش‌آموزان', value: stats.students, icon: <Zap className="h-5 w-5" />, accent: 'var(--lux-secondary)' },
            ]}
            className="lg:grid-cols-3"
          />
        </LuxStaggerItem>

        <LuxStaggerItem>
          <LuxHubGrid groups={ADMIN_HUB} />
        </LuxStaggerItem>
      </LuxStagger>
    </div>
  )
}
