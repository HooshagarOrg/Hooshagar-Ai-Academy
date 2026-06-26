'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Settings, Shield, Brain, Bell, Database, Mail, Lock,
  ChevronLeft, Globe, Key, Activity, DollarSign, Calendar,
  Sliders, Users, Building, GraduationCap, Sparkles, Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { cn } from '@/lib/utils'

interface SettingsCard {
  title: string
  description: string
  icon: LucideIcon
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
      },
      {
        title: 'سال تحصیلی',
        description: 'تنظیم سال تحصیلی فعال و بازه‌های زمانی',
        icon: Calendar,
        href: '/admin/academic-years',
        color: 'text-brand-green',
        bg: 'bg-brand-green/15 border border-brand-green/20',
      },
      {
        title: 'کلاس مجازی (اسکای‌روم)',
        description: 'اتصال کلاس درسی به اتاق اسکای‌روم و زمان‌بندی جلسات',
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
        description: 'پیکربندی مدل‌های AI برای هر قابلیت',
        icon: Brain,
        href: '/admin/ai-models',
        color: 'text-brand-purple',
        bg: 'bg-brand-purple/15 border border-brand-purple/20',
      },
      {
        title: 'کنترل دسترسی',
        description: 'مدیریت دسترسی کاربران به قابلیت‌های AI',
        icon: Key,
        href: '/admin/ai-access-control',
        color: 'text-brand-pink',
        bg: 'bg-brand-pink/15 border border-brand-pink/20',
      },
      {
        title: 'محدودیت‌های AI',
        description: 'تعیین سقف استفاده روزانه/ماهانه',
        icon: Sliders,
        href: '/admin/ai-limits',
        color: 'text-brand-yellow',
        bg: 'bg-brand-yellow/15 border border-brand-yellow/20',
      },
      {
        title: 'مصرف AI',
        description: 'گزارش مصرف و آمار استفاده از AI',
        icon: Activity,
        href: '/admin/ai-usage-dashboard',
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/15 border border-brand-cyan/20',
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
        color: 'text-brand-green',
        bg: 'bg-brand-green/15 border border-brand-green/20',
      },
      {
        title: 'اعتبار AI',
        description: 'مدیریت اعتبار خریداری شده',
        icon: Sparkles,
        href: '/admin/ai-credits',
        color: 'text-brand-yellow',
        bg: 'bg-brand-yellow/15 border border-brand-yellow/20',
      },
    ],
  },
  {
    title: 'امنیت و نظارت',
    cards: [
      {
        title: 'حریم خصوصی حساب',
        description: 'صادرات یا حذف داده شخصی (GDPR)',
        icon: Lock,
        href: '/account/privacy',
        color: 'text-brand-purple',
        bg: 'bg-brand-purple/15 border border-brand-purple/20',
      },
      {
        title: 'سیاست حریم خصوصی',
        description: 'سند عمومی حریم خصوصی و کوکی‌ها',
        icon: Shield,
        href: '/privacy',
        color: 'text-brand-purple',
        bg: 'bg-brand-purple/15 border border-brand-purple/20',
      },
      {
        title: 'مرکز امنیت',
        description: 'لاگ‌های امنیتی، IP‌های مسدود و فعالیت مشکوک',
        icon: Shield,
        href: '/admin/security',
        color: 'text-destructive',
        bg: 'bg-destructive/15 border border-destructive/20',
      },
      {
        title: 'هشدار زودهنگام',
        description: 'تشخیص دانش‌آموزان در معرض افت تحصیلی',
        icon: Bell,
        href: '/admin/early-warning',
        color: 'text-brand-orange',
        bg: 'bg-brand-orange/15 border border-brand-orange/20',
      },
      {
        title: 'ممیزی قرعه‌کشی',
        description: 'بررسی شفافیت قرعه‌کشی‌های انجام‌شده',
        icon: Lock,
        href: '/admin/lottery/audit',
        color: 'text-muted-foreground',
        bg: 'bg-white/10 border border-white/[0.08]',
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
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/15 border border-brand-cyan/20',
      },
      {
        title: 'انتقال دانش‌آموزان',
        description: 'ارتقاء دانش‌آموزان به پایه بالاتر',
        icon: GraduationCap,
        href: '/admin/progression',
        color: 'text-brand-green',
        bg: 'bg-brand-green/15 border border-brand-green/20',
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
        iconColor="text-brand-cyan"
        iconBg="bg-brand-cyan/15 border border-brand-cyan/20"
      />

      <div className="space-y-8">
        {SETTINGS_GROUPS.map((group, gIdx) => (
          <div key={gIdx}>
            <h2 className="text-sm font-bold text-muted-foreground mb-3 px-1">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.cards.map((card, cIdx) => {
                const Icon = card.icon
                return (
                  <Link key={cIdx} href={card.href} className="block group">
                    <GlassCard hover className="p-5 h-full">
                      <div className="flex items-start gap-3">
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', card.bg)}>
                          <Icon className={cn('w-5 h-5', card.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm mb-1 group-hover:text-brand-cyan transition-colors">
                            {card.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </GlassCard>
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
