'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Loader2, Users, Zap } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxStatGrid } from '@/components/lux/lux-stat-grid'
import { LuxCard } from '@/components/lux/lux-card'

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
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[var(--arc-admin)]" /></div>
  }

  return (
    <div className="space-y-6" dir="rtl">
      <LuxPageHeader
        kicker="مرکز فرمان"
        title="داشبورد مدیریت"
        subtitle="آمار کل پلتفرم و دسترسی سریع"
        action={
          <Link href="/admin/users" className="lux-btn-accent min-h-10 px-4 text-sm" style={{ background: 'var(--arc-admin)' }}>
            مدیریت کاربران
          </Link>
        }
      />
      <LuxStatGrid
        items={[
          { label: 'مدارس', value: stats.schools, icon: <Building2 className="h-5 w-5" />, accent: 'var(--arc-admin)' },
          { label: 'کاربران', value: stats.users, icon: <Users className="h-5 w-5" />, accent: 'var(--lux-primary)' },
          { label: 'دانش‌آموزان', value: stats.students, icon: <Zap className="h-5 w-5" />, accent: 'var(--lux-secondary)' },
        ]}
        className="lg:grid-cols-3"
      />
      <LuxCard>
        <h3 className="mb-3 font-black text-[var(--lux-text)]">دسترسی سریع</h3>
        <div className="flex flex-wrap gap-2">
          {[
            ['/admin/schools', 'مدارس'],
            ['/admin/bulk-import', 'واردسازی گروهی'],
            ['/admin/ai-test', 'تست AI'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="lux-btn-ghost min-h-9 px-4 text-xs">
              {label}
            </Link>
          ))}
        </div>
      </LuxCard>
    </div>
  )
}
