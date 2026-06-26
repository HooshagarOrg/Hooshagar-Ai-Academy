'use client'

import { useEffect, useState } from 'react'
import { Flame, Loader2 } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxStatGrid } from '@/components/lux/lux-stat-grid'

export default function StudentStreakPage() {
  const [current, setCurrent] = useState(0)
  const [longest, setLongest] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/xp/balance')
      .then((r) => r.json())
      .then((d) => {
        setCurrent(d.current_streak ?? 0)
        setLongest(d.longest_streak ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div dir="rtl">
      <LuxPageHeader title="استریک یادگیری" subtitle="روزهای پیاپی فعالیت" />
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" /></div>
      ) : (
        <>
          <LuxStatGrid
            items={[
              { label: 'استریک فعلی', value: current, icon: <Flame className="h-5 w-5" />, accent: '#FF6B35' },
              { label: 'رکورد', value: longest, icon: <Flame className="h-5 w-5" />, accent: 'var(--lux-gold)' },
            ]}
            className="grid-cols-2 lg:grid-cols-2"
          />
          <LuxCard className="mt-5">
            <p className="text-sm leading-8 text-[var(--lux-text-muted)]">
              هر روز با یک فعالیت کوتاه در هوشاگر (مطالعه، تمرین یا گفتگو با هوشیار) استریکت را حفظ کن.
            </p>
          </LuxCard>
                        </>
                      )}
    </div>
  )
}
