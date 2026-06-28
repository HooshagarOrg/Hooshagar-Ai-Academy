'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { KeyRound, Loader2, Mail, School, Shield, User } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import { getRoleExperienceLabel } from '@/lib/ui/role-tone'

type ProfileData = {
  full_name?: string
  email?: string
  role?: string
  school_name?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .finally(() => setLoading(false))
  }, [])

  const name = profile?.full_name || 'کاربر'

  return (
    <div dir="rtl">
      <LuxFadeUp>
        <LuxPageHeader
          title="پروفایل من"
          subtitle="اطلاعات حساب و تنظیمات"
          action={
            <Link href="/change-password" className="lux-btn-ghost min-h-10 px-4 text-sm">
              <KeyRound className="h-4 w-4" /> تغییر رمز
            </Link>
          }
        />
      </LuxFadeUp>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--lux-primary)]" /></div>
      ) : (
        <LuxStagger className="grid gap-5 lg:grid-cols-3" stagger={0.1}>
          <LuxStaggerItem className="lg:col-span-1">
            <LuxCard className="text-center h-full">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black text-[var(--lux-text)]" style={{ background: 'linear-gradient(135deg, var(--lux-primary), var(--lux-accent))' }}>
                {name.charAt(0)}
              </div>
              <h2 className="text-xl font-black text-[var(--lux-text)]">{name}</h2>
              <p className="mt-1 text-sm text-[var(--lux-text-muted)]">{profile?.role ? getRoleExperienceLabel(profile.role) : '—'}</p>
            </LuxCard>
          </LuxStaggerItem>
          <LuxStaggerItem className="lg:col-span-2">
            <LuxCard className="space-y-4 h-full">
              {[
                { icon: User, label: 'نام', value: name },
                { icon: Mail, label: 'ایمیل', value: profile?.email || '—' },
                { icon: Shield, label: 'نقش', value: profile?.role ? getRoleExperienceLabel(profile.role) : '—' },
                { icon: School, label: 'مدرسه', value: profile?.school_name || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-[var(--lux-surface)] bg-[var(--lux-card)] p-3">
                  <Icon className="h-5 w-5 text-[var(--lux-primary)]" />
                  <div>
                    <p className="text-xs text-[var(--lux-text-muted)]">{label}</p>
                    <p className="font-bold text-[var(--lux-text)]">{value}</p>
                  </div>
                </div>
              ))}
            </LuxCard>
          </LuxStaggerItem>
        </LuxStagger>
      )}
    </div>
  )
}
