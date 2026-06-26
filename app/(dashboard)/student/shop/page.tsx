'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Coins, Loader2, ShoppingBag } from 'lucide-react'
import { LuxPageHeader } from '@/components/lux/lux-page-header'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'

type ShopItem = { id: string; name: string; description: string; price_coins: number }

export default function StudentShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [coins, setCoins] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/shop/items').then((r) => r.json()),
      fetch('/api/xp/balance').then((r) => r.json()),
    ])
      .then(([shop, xp]) => {
        setItems(shop.items || [])
        setCoins(xp.coins ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div dir="rtl">
      <LuxPageHeader
        title="فروشگاه گیمیفیکیشن"
        subtitle={`موجودی: ${coins.toLocaleString('fa-IR')} سکه`}
        action={
          <Link href="/student/shop/my-items" className="lux-btn-ghost min-h-10 px-4 text-sm">
            آیتم‌های من
          </Link>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[var(--lux-gold)]" /></div>
      ) : items.length === 0 ? (
        <LuxEmptyState icon={<ShoppingBag className="h-6 w-6" />} title="آیتمی برای فروش نیست" description="به‌زودی آیتم‌های جدید اضافه می‌شوند." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <LuxCard key={item.id} interactive>
              <ShoppingBag className="mb-3 h-7 w-7 text-[var(--lux-primary)]" />
              <p className="font-black text-[var(--lux-text)]">{item.name}</p>
              <p className="mt-1 text-sm text-[var(--lux-text-muted)]">{item.description}</p>
              <p className="mt-3 flex items-center gap-1 text-sm font-bold text-[var(--lux-gold)]">
                <Coins className="h-4 w-4" />
                {item.price_coins.toLocaleString('fa-IR')} سکه
              </p>
            </LuxCard>
          ))}
            </div>
          )}
    </div>
  )
}
