'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Settings, Shield, Brain, Bell, Database, Mail, Lock,
  ChevronLeft, Globe, Key, Activity, DollarSign, Calendar,
  Sliders, Users, Building, GraduationCap, Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

interface SettingsCard {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  bg: string
}

const SETTINGS_GROUPS: { title: string; cards: SettingsCard[] }[] = [
  {
    title: 'مدیریت سازمان',
    cards: [
      {
        title: 'مدارس',
        description: 'افزودن، ویرایش و مدیریت مدارس تحت پلتفرم',
        icon: Building,
        href: '/admin/schools',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
      },
      {
        title: 'کاربران',
        description: 'مدیریت کارکنان، معلمان، دانش‌آموزان و والدین',
        icon: Users,
        href: '/admin/users',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        title: 'سال تحصیلی',
        description: 'تنظیم سال تحصیلی فعال و بازه‌های زمانی',
        icon: Calendar,
        href: '/admin/academic-years',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
    ],
  },
  {
    title: 'هوش مصنوعی',
    cards: [
      {
        title: 'مدل‌های AI',
        description: 'پیکربندی مدل‌های AI برای هر قابلیت',
        icon: Brain,
        href: '/admin/ai-models',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
      },
      {
        title: 'کنترل دسترسی',
        description: 'مدیریت دسترسی کاربران به قابلیت‌های AI',
        icon: Key,
        href: '/admin/ai-access-control',
        color: 'text-fuchsia-600',
        bg: 'bg-fuchsia-50',
      },
      {
        title: 'محدودیت‌های AI',
        description: 'تعیین سقف استفاده روزانه/ماهانه',
        icon: Sliders,
        href: '/admin/ai-limits',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
      {
        title: 'مصرف AI',
        description: 'گزارش مصرف و آمار استفاده از AI',
        icon: Activity,
        href: '/admin/ai-usage-dashboard',
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
      },
    ],
  },
  {
    title: 'مالی',
    cards: [
      {
        title: 'شهریه',
        description: 'تنظیم میزان شهریه و بازه‌های پرداخت',
        icon: DollarSign,
        href: '/admin/tuition-settings',
        color: 'text-green-600',
        bg: 'bg-green-50',
      },
      {
        title: 'اعتبار AI',
        description: 'مدیریت اعتبار خریداری شده',
        icon: Sparkles,
        href: '/admin/ai-credits',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
      },
    ],
  },
  {
    title: 'امنیت و نظارت',
    cards: [
      {
        title: 'مرکز امنیت',
        description: 'لاگ‌های امنیتی، IP‌های مسدود و فعالیت مشکوک',
        icon: Shield,
        href: '/admin/security',
        color: 'text-red-600',
        bg: 'bg-red-50',
      },
      {
        title: 'هشدار زودهنگام',
        description: 'تشخیص دانش‌آموزان در معرض افت تحصیلی',
        icon: Bell,
        href: '/admin/early-warning',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
      },
      {
        title: 'ممیزی قرعه‌کشی',
        description: 'بررسی شفافیت قرعه‌کشی‌های انجام‌شده',
        icon: Lock,
        href: '/admin/lottery/audit',
        color: 'text-stone-600',
        bg: 'bg-stone-50',
      },
    ],
  },
  {
    title: 'قابلیت‌ها',
    cards: [
      {
        title: 'مدیریت قابلیت‌ها',
        description: 'فعال/غیرفعال کردن قابلیت‌های مختلف سیستم',
        icon: Sliders,
        href: '/admin/features-management',
        color: 'text-teal-600',
        bg: 'bg-teal-50',
      },
      {
        title: 'انتقال دانش‌آموزان',
        description: 'ارتقاء دانش‌آموزان به پایه بالاتر',
        icon: GraduationCap,
        href: '/admin/progression',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
    ],
  },
]

export default function AdminSettingsPage() {
  return (
    <div dir="rtl">
      <PageHeader
        title="تنظیمات سیستم"
        description="پیکربندی کامل پلتفرم هوشاگر"
        icon={Settings}
        iconColor="text-gray-700"
        iconBg="bg-gray-100"
      />

      <div className="space-y-8">
        {SETTINGS_GROUPS.map((group, gIdx) => (
          <div key={gIdx}>
            <h2 className="text-sm font-bold text-gray-500 mb-3 px-1">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.cards.map((card, cIdx) => {
                const Icon = card.icon
                return (
                  <Link
                    key={cIdx}
                    href={card.href}
                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', card.bg)}>
                        <Icon className={cn('w-5 h-5', card.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
