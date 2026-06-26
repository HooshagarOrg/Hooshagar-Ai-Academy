'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bell, KeyRound, Lock, LogOut, Mail, Moon, Shield,
  Smartphone, User, Volume2,
} from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { cn } from '@/lib/utils'

interface SettingRow {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
}

function SettingsSection({ title, rows }: { title: string; rows: SettingRow[] }) {
  return (
    <div>
      <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-[var(--lux-text-muted)]">
        {title}
      </h2>
      <LuxCard className="divide-y divide-white/[0.06] overflow-hidden p-0">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lux-surface)] text-[var(--lux-text-muted)]">
              {row.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--lux-text)]">{row.title}</p>
              <p className="text-xs text-[var(--lux-text-muted)] mt-0.5">{row.description}</p>
            </div>
            <div className="shrink-0">{row.action}</div>
          </div>
        ))}
      </LuxCard>
    </div>
  )
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lux-primary)]',
        on ? 'bg-[var(--lux-primary)]' : 'bg-white/20'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [role, setRole] = useState<string>('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setRole(d?.role || ''))
      .catch(() => {})
  }, [])

  const accountRows: SettingRow[] = [
    {
      icon: <User className="h-4 w-4" />,
      title: 'ویرایش پروفایل',
      description: 'نام، عکس و اطلاعات شخصی',
      action: (
        <Link href="/profile" className="text-xs font-semibold text-[var(--lux-primary)] hover:underline">
          ویرایش
        </Link>
      ),
    },
    {
      icon: <KeyRound className="h-4 w-4" />,
      title: 'تغییر رمز عبور',
      description: 'به‌روزرسانی رمز حساب کاربری',
      action: (
        <Link href="/account/change-password" className="text-xs font-semibold text-[var(--lux-primary)] hover:underline">
          تغییر
        </Link>
      ),
    },
    {
      icon: <Mail className="h-4 w-4" />,
      title: 'ایمیل',
      description: 'مدیریت آدرس ایمیل',
      action: (
        <Link href="/profile" className="text-xs font-semibold text-[var(--lux-primary)] hover:underline">
          مشاهده
        </Link>
      ),
    },
  ]

  const notifRows: SettingRow[] = [
    {
      icon: <Bell className="h-4 w-4" />,
      title: 'اعلانات درون‌برنامه‌ای',
      description: 'دریافت هشدار و پیام در داشبورد',
      action: <Toggle defaultChecked />,
    },
    {
      icon: <Smartphone className="h-4 w-4" />,
      title: 'اعلانات پوش',
      description: 'دریافت نوتیفیکیشن روی مرورگر',
      action: <Toggle />,
    },
    {
      icon: <Volume2 className="h-4 w-4" />,
      title: 'صدای اعلان',
      description: 'پخش صدا هنگام دریافت اعلان',
      action: <Toggle defaultChecked />,
    },
  ]

  const privacyRows: SettingRow[] = [
    {
      icon: <Lock className="h-4 w-4" />,
      title: 'حریم خصوصی',
      description: 'صادرات یا حذف داده‌های شخصی (GDPR)',
      action: (
        <Link href="/account/privacy" className="text-xs font-semibold text-[var(--lux-primary)] hover:underline">
          مشاهده
        </Link>
      ),
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: 'امنیت حساب',
      description: 'فعالیت‌های اخیر و ورود به سیستم',
      action: (
        <Link href="/account/security" className="text-xs font-semibold text-[var(--lux-primary)] hover:underline">
          بررسی
        </Link>
      ),
    },
  ]

  return (
    <div dir="rtl" className="mx-auto max-w-2xl space-y-6 pb-10">
      <LuxPageHeader
        title="تنظیمات"
        subtitle="مدیریت حساب، اعلانات و حریم خصوصی"
      />

      <SettingsSection title="حساب کاربری" rows={accountRows} />
      <SettingsSection title="اعلانات" rows={notifRows} />
      <SettingsSection title="امنیت و حریم خصوصی" rows={privacyRows} />

      {role === 'admin' || role === 'platform_admin' ? (
        <div>
          <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-[var(--lux-text-muted)]">
            مدیریت سیستم
          </h2>
          <LuxCard className="p-0 overflow-hidden">
            <Link
              href="/admin/settings"
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lux-surface)] text-[var(--lux-primary)]">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--lux-text)]">تنظیمات سیستم</p>
                <p className="text-xs text-[var(--lux-text-muted)] mt-0.5">پیکربندی کامل پلتفرم هوشاگر</p>
              </div>
              <span className="text-xs font-semibold text-[var(--lux-primary)]">ورود</span>
            </Link>
          </LuxCard>
        </div>
      ) : null}

      <div className="pt-2">
        <LuxCard className="overflow-hidden p-0">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <LogOut className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">خروج از حساب</p>
              <p className="text-xs text-[var(--lux-text-muted)] mt-0.5">از تمام دستگاه‌ها خارج شوید</p>
            </div>
          </a>
        </LuxCard>
      </div>
    </div>
  )
}
