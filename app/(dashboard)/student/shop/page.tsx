'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Coins, ShoppingBag } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxDashboardSection, LuxSectionBlock } from '@/components/lux/lux-dashboard-section'
import { LuxErrorState, LuxSkeletonCards } from '@/components/lux/lux-page-states'

type ShopItem = { id: string; name: string; description: string; price_coins: number }

export default function StudentShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [coins, setCoins] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadShop = () => {
    setLoading(true)
    setError('')
    Promise.all([
      fetch('/api/shop/items').then(async (r) => {
        if (!r.ok) throw new Error('shop failed')
        return r.json()
      }),
      fetch('/api/xp/balance').then(async (r) => {
        if (!r.ok) throw new Error('xp failed')
        return r.json()
      }),
    ])
      .then(([shop, xp]) => {
        setItems(shop.items || [])
        setCoins(xp.coins ?? 0)
      })
      .catch(() => setError('دریافت فروشگاه ناموفق بود. لطفاً دوباره تلاش کنید.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadShop()
  }, [])

  return (
    <LuxDashboardSection
      header={
        <LuxPageHeader
          title="فروشگاه گیمیفیکیشن"
          subtitle={`موجودی: ${coins.toLocaleString('fa-IR')} سکه`}
          action={
            <Link href="/student/shop/my-items" className="lux-btn-ghost min-h-10 px-4 text-sm">
              آیتم‌های من
            </Link>
          }
        />
      }
    >
      {loading ? (
        <LuxSectionBlock><LuxSkeletonCards variant="lux" className="sm:grid-cols-2 lg:grid-cols-3" /></LuxSectionBlock>
      ) : error ? (
        <LuxSectionBlock>
          <LuxErrorState message={error} onRetry={loadShop} variant="lux" />
        </LuxSectionBlock>
      ) : items.length === 0 ? (
        <LuxSectionBlock>
          <LuxEmptyState icon={<ShoppingBag className="h-6 w-6" />} title="آیتمی برای فروش نیست" description="به‌زودی آیتم‌های جدید اضافه می‌شوند." />
        </LuxSectionBlock>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <LuxSectionBlock key={item.id}>
              <LuxCard interactive>
              <ShoppingBag className="mb-3 h-7 w-7 text-[var(--lux-primary)]" />
              <p className="font-black text-[var(--lux-text)]">{item.name}</p>
              <p className="mt-1 text-sm text-[var(--lux-text-muted)]">{item.description}</p>
              <p className="mt-3 flex items-center gap-1 text-sm font-bold text-[var(--lux-gold)]">
                <Coins className="h-4 w-4" />
                {item.price_coins.toLocaleString('fa-IR')} سکه
              </p>
            </LuxCard>
            </LuxSectionBlock>
          ))}
        </div>
      )}
    </LuxDashboardSection>
  )
}
