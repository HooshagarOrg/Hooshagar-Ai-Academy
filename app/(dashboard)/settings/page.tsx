'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, KeyRound, Lock, LogOut, Mail, Shield,
  Smartphone, User, Volume2,
} from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
          <div
            key={i}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lux-surface)] text-[var(--lux-text-muted)]"
                aria-hidden
              >
                {row.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--lux-text)]">{row.title}</p>
                <p className="mt-0.5 text-xs leading-6 text-[var(--lux-text-muted)]">{row.description}</p>
              </div>
            </div>
            <div className="shrink-0 sm:mr-auto">{row.action}</div>
          </div>
        ))}
      </LuxCard>
    </div>
  )
}

function Toggle({ defaultChecked = false, label }: { defaultChecked?: boolean; label: string }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn(!on)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors lux-focus-ring',
        on ? 'bg-[var(--lux-primary)]' : 'bg-white/20',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [role, setRole] = useState<string>('')
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setRole(d?.role || ''))
      .catch(() => {})
  }, [])

  const linkAction = (href: string, label: string) => (
    <Link href={href} className="lux-focus-ring lux-btn-ghost min-h-9 px-3 text-xs font-semibold">
      {label}
    </Link>
  )

  const accountRows: SettingRow[] = [
    {
      icon: <User className="h-4 w-4" />,
      title: 'ویرایش پروفایل',
      description: 'نام، عکس و اطلاعات شخصی',
      action: linkAction('/profile', 'ویرایش'),
    },
    {
      icon: <KeyRound className="h-4 w-4" />,
      title: 'تغییر رمز عبور',
      description: 'به‌روزرسانی رمز حساب کاربری',
      action: linkAction('/change-password', 'تغییر'),
    },
    {
      icon: <Mail className="h-4 w-4" />,
      title: 'ایمیل',
      description: 'مدیریت آدرس ایمیل',
      action: linkAction('/profile', 'مشاهده'),
    },
  ]

  const notifRows: SettingRow[] = [
    {
      icon: <Bell className="h-4 w-4" />,
      title: 'اعلانات درون‌برنامه‌ای',
      description: 'دریافت هشدار و پیام در داشبورد',
      action: <Toggle defaultChecked label="اعلانات درون‌برنامه‌ای" />,
    },
    {
      icon: <Smartphone className="h-4 w-4" />,
      title: 'اعلانات پوش',
      description: 'دریافت نوتیفیکیشن روی مرورگر',
      action: <Toggle label="اعلانات پوش" />,
    },
    {
      icon: <Volume2 className="h-4 w-4" />,
      title: 'صدای اعلان',
      description: 'پخش صدا هنگام دریافت اعلان',
      action: <Toggle defaultChecked label="صدای اعلان" />,
    },
  ]

  const privacyRows: SettingRow[] = [
    {
      icon: <Lock className="h-4 w-4" />,
      title: 'حریم خصوصی',
      description: 'صادرات یا حذف داده‌های شخصی',
      action: linkAction('/account/privacy', 'مشاهده'),
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: 'امنیت حساب',
      description: 'فعالیت‌های اخیر و ورود به سیستم',
      action: linkAction('/account/security', 'بررسی'),
    },
  ]

  return (
    <div dir="rtl" className="mx-auto max-w-2xl space-y-6 pb-10">
      <LuxFadeUp>
        <LuxPageHeader title="تنظیمات" subtitle="مدیریت حساب، اعلانات و حریم خصوصی" />
      </LuxFadeUp>

      <LuxStagger className="space-y-6" stagger={0.08}>
        <LuxStaggerItem>
          <SettingsSection title="حساب کاربری" rows={accountRows} />
        </LuxStaggerItem>
        <LuxStaggerItem>
          <SettingsSection title="اعلانات" rows={notifRows} />
        </LuxStaggerItem>
        <LuxStaggerItem>
          <div className="flex justify-end">
            <Link href="/notifications/settings" className="lux-btn-ghost min-h-10 px-4 text-sm">
              تنظیمات پیشرفته اعلان‌ها
            </Link>
          </div>
        </LuxStaggerItem>
        <LuxStaggerItem>
          <SettingsSection title="امنیت و حریم خصوصی" rows={privacyRows} />
        </LuxStaggerItem>

        {(role === 'admin' || role === 'platform_admin') && (
          <LuxStaggerItem>
            <div>
              <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-[var(--lux-text-muted)]">
                مدیریت سیستم
              </h2>
              <LuxCard className="overflow-hidden p-0">
                <Link
                  href="/admin/settings"
                  className="lux-focus-ring flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lux-surface)] text-[var(--lux-primary)]">
                    <Shield className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--lux-text)]">تنظیمات سیستم</p>
                    <p className="mt-0.5 text-xs text-[var(--lux-text-muted)]">پیکربندی کامل پلتفرم هوشاگر</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--lux-primary)]">ورود</span>
                </Link>
              </LuxCard>
            </div>
          </LuxStaggerItem>
        )}

        <LuxStaggerItem>
          <LuxCard className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="lux-focus-ring flex w-full items-center gap-4 px-5 py-4 text-red-400 transition-colors hover:bg-red-500/10"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <LogOut className="h-4 w-4" aria-hidden />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-semibold">خروج از حساب</p>
                <p className="mt-0.5 text-xs text-[var(--lux-text-muted)]">از تمام دستگاه‌ها خارج شوید</p>
              </div>
            </button>
          </LuxCard>
        </LuxStaggerItem>
      </LuxStagger>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent dir="rtl" className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">خروج از حساب</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-7">
              آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <AlertDialogAction
              onClick={() => router.push('/api/auth/logout')}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              بله، خارج می‌شوم
            </AlertDialogAction>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
