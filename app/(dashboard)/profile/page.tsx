'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, Mail, School, Shield, KeyRound, ChevronLeft, Loader2 } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { usePersianDateString } from '@/lib/hooks/use-persian-date'
import { getRoleExperienceLabel } from '@/lib/ui/role-tone'

type ProfileData = {
  full_name?: string
  email?: string
  role?: string
  school_name?: string
}

export default function ProfilePage() {
  const persianDate = usePersianDateString()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const name = profile?.full_name || 'کاربر'
  const roleLabel = profile?.role ? getRoleExperienceLabel(profile.role) : '—'

  return (
    <DashboardPage
      meta={persianDate}
      title="پروفایل من"
      description="اطلاعات حساب، نقش و تنظیمات حریم خصوصی"
      actions={
        <Link href="/change-password">
          <Button variant="outline" size="sm">
            <KeyRound className="w-4 h-4" />
            تغییر رمز
          </Button>
        </Link>
      }
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <GlassCard elevated className="p-6 lg:col-span-1 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-brand-pink to-brand-purple flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-glow">
              {name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold">{name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{roleLabel}</p>
          </GlassCard>

          <GlassCard className="p-6 lg:col-span-2 space-y-4">
            {[
              { icon: User, label: 'نام کامل', value: name },
              { icon: Mail, label: 'ایمیل', value: profile?.email || '—' },
              { icon: Shield, label: 'نقش', value: roleLabel },
              { icon: School, label: 'مدرسه', value: profile?.school_name || '—' },
            ].map((row) => {
              const Icon = row.icon
              return (
                <div
                  key={row.label}
                  className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <div className="p-2.5 rounded-xl bg-brand-purple/10 text-brand-purple">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 text-right flex-1">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="font-medium truncate">{row.value}</p>
                  </div>
                </div>
              )
            })}
          </GlassCard>

          <GlassCard quiet className="p-5 lg:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium">حریم خصوصی و داده‌ها</p>
              <p className="text-sm text-muted-foreground">مدیریت رضایت و تنظیمات حساب</p>
            </div>
            <Link href="/account/privacy">
              <Button variant="ghost" size="sm">
                مشاهده
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          </GlassCard>
        </div>
      )}
    </DashboardPage>
  )
}
