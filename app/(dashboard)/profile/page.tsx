'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { KeyRound, Mail, School, Shield, User } from 'lucide-react'
import { LuxCard } from '@/components/lux/lux-card'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'
import { LuxErrorState, LuxSkeletonCards } from '@/components/lux/lux-page-states'
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
  const [error, setError] = useState('')

  const loadProfile = () => {
    setLoading(true)
    setError('')
    fetch('/api/profile')
      .then(async (r) => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((data) => setProfile(data))
      .catch(() => setError('دریافت پروفایل ناموفق بود. لطفاً دوباره تلاش کنید.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const name = profile?.full_name || 'کاربر'

  return (
    <DashboardPage
      title="پروفایل من"
      description="اطلاعات حساب و تنظیمات"
      actions={
        <Link href="/change-password" className="lux-btn-ghost min-h-10 w-full px-4 text-sm sm:w-auto">
          <KeyRound className="h-4 w-4" aria-hidden /> تغییر رمز
        </Link>
      }
    >
      {loading ? (
        <LuxSkeletonCards count={2} variant="lux" className="lg:grid-cols-3" />
      ) : error ? (
        <LuxErrorState message={error} onRetry={loadProfile} variant="lux" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <DashboardSectionBlock className="lg:col-span-1">
            <LuxCard className="text-center h-full">
              <div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black text-[var(--lux-text)]"
                style={{ background: 'linear-gradient(135deg, var(--lux-primary), var(--lux-accent))' }}
                aria-hidden
              >
                {name.charAt(0)}
              </div>
              <h2 className="text-xl font-black text-[var(--lux-text)]">{name}</h2>
              <p className="mt-1 text-sm text-[var(--lux-text-muted)]">
                {profile?.role ? getRoleExperienceLabel(profile.role) : '—'}
              </p>
            </LuxCard>
          </DashboardSectionBlock>
          <DashboardSectionBlock className="lg:col-span-2">
            <LuxCard className="space-y-4 h-full">
              {[
                { icon: User, label: 'نام', value: name },
                { icon: Mail, label: 'ایمیل', value: profile?.email || '—' },
                { icon: Shield, label: 'نقش', value: profile?.role ? getRoleExperienceLabel(profile.role) : '—' },
                { icon: School, label: 'مدرسه', value: profile?.school_name || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-[var(--lux-surface)] bg-[var(--lux-card)] p-3">
                  <Icon className="h-5 w-5 shrink-0 text-[var(--lux-primary)]" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--lux-text-muted)]">{label}</p>
                    <p className="truncate font-bold text-[var(--lux-text)]">{value}</p>
                  </div>
                </div>
              ))}
            </LuxCard>
          </DashboardSectionBlock>
        </div>
      )}
    </DashboardPage>
  )
}
