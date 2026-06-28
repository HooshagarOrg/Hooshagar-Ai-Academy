'use client'

import { useEffect, useState } from 'react'
import { Award, Loader2 } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxDashboardSection, LuxSectionBlock } from '@/components/lux/lux-dashboard-section'

type Badge = { id: string; name: string; description: string; earned: boolean }

export default function StudentBadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/xp/balance')
      .then((r) => r.json())
      .then((d) => {
        const level = d.level ?? 1
        setBadges([
          { id: '1', name: 'کاوشگر', description: 'اولین قدم در مسیر یادگیری', earned: level >= 1 },
          { id: '2', name: 'پژوهشگر', description: 'رسیدن به سطح ۳', earned: level >= 3 },
          { id: '3', name: 'استاد مسیر', description: 'استریک ۷ روزه', earned: (d.current_streak ?? 0) >= 7 },
          { id: '4', name: 'نابغه آینده', description: 'سطح ۵ و بالاتر', earned: level >= 5 },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <LuxDashboardSection header={<LuxPageHeader title="گالری نشان‌ها" subtitle="دستاوردهای یادگیری و گیمیفیکیشن" />}>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[var(--lux-gold)]" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => (
              <LuxSectionBlock key={b.id}>
                <LuxCard className={!b.earned ? 'opacity-50' : ''}>
              <Award className="mb-3 h-8 w-8 text-[var(--lux-gold)]" />
              <p className="font-black text-[var(--lux-text)]">{b.name}</p>
              <p className="mt-1 text-sm text-[var(--lux-text-muted)]">{b.description}</p>
              <p className="mt-2 text-xs font-bold" style={{ color: b.earned ? 'var(--lux-success)' : 'var(--lux-text-muted)' }}>
                {b.earned ? 'کسب شده' : 'قفل'}
              </p>
                </LuxCard>
              </LuxSectionBlock>
            ))}
          </div>
          {badges.every((b) => !b.earned) && (
            <LuxSectionBlock>
              <LuxEmptyState className="mt-4" title="هنوز نشانی کسب نکردی" description="با مطالعه و فعالیت در هوشاگر نشان‌ها را باز کن." actionLabel="شروع یادگیری" actionHref="/student/study-buddy" />
            </LuxSectionBlock>
          )}
        </>
      )}
    </LuxDashboardSection>
  )
}
