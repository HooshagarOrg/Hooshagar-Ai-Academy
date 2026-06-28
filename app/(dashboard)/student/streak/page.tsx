'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxStatGrid } from '@/components/lux/lux-stat-grid'
import { LuxDashboardSection, LuxSectionBlock } from '@/components/lux/lux-dashboard-section'
import { LuxErrorState, LuxSkeletonCards } from '@/components/lux/lux-page-states'

export default function StudentStreakPage() {
  const [current, setCurrent] = useState(0)
  const [longest, setLongest] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStreak = () => {
    setLoading(true)
    setError('')
    fetch('/api/xp/balance')
      .then(async (r) => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((d) => {
        setCurrent(d.current_streak ?? 0)
        setLongest(d.longest_streak ?? 0)
      })
      .catch(() => setError('دریافت اطلاعات استریک ناموفق بود. لطفاً دوباره تلاش کنید.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStreak()
  }, [])

  return (
    <LuxDashboardSection header={<LuxPageHeader title="استریک یادگیری" subtitle="روزهای پیاپی فعالیت" />}>
      {loading ? (
        <LuxSectionBlock><LuxSkeletonCards count={2} variant="lux" className="grid-cols-2" /></LuxSectionBlock>
      ) : error ? (
        <LuxSectionBlock>
          <LuxErrorState message={error} onRetry={loadStreak} variant="lux" />
        </LuxSectionBlock>
      ) : (
        <>
          <LuxSectionBlock>
            <LuxStatGrid
              items={[
                { label: 'استریک فعلی', value: current, icon: <Flame className="h-5 w-5" />, accent: '#FF6B35' },
                { label: 'رکورد', value: longest, icon: <Flame className="h-5 w-5" />, accent: 'var(--lux-gold)' },
              ]}
              className="grid-cols-2 lg:grid-cols-2"
            />
          </LuxSectionBlock>
          <LuxSectionBlock>
            <LuxCard>
              <p className="text-sm leading-8 text-[var(--lux-text-muted)]">
                هر روز با یک فعالیت کوتاه در هوشاگر (مطالعه، تمرین یا گفتگو با هوشیار) استریکت را حفظ کن.
              </p>
            </LuxCard>
          </LuxSectionBlock>
        </>
      )}
    </LuxDashboardSection>
  )
}
