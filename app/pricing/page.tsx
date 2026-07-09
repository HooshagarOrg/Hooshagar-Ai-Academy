'use client'

import { useState, useEffect } from 'react'
import { Check, Zap, Star, Building2, Gift } from 'lucide-react'
import Link from 'next/link'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { TiltCard } from '@/components/landing/motion'

type Plan = {
  id: string; name: string; display_name: string; description: string
  price_monthly: number; price_yearly: number
  max_students: number; max_teachers: number; ai_calls_per_month: number
  features: string[]; sort_order: number
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Gift className="w-8 h-8" />,
  basic: <Zap className="w-8 h-8" />,
  premium: <Star className="w-8 h-8" />,
  enterprise: <Building2 className="w-8 h-8" />,
}
const PLAN_COLORS: Record<string, string> = {
  free: 'lux-card',
  basic: 'lux-card',
  premium: 'lp-gold-border',
  enterprise: 'lp-glass',
}
const PLAN_BTN: Record<string, string> = {
  free: 'lux-btn-ghost',
  basic: 'lux-btn-accent',
  premium: 'lux-btn-accent',
  enterprise: 'lux-btn-ghost',
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subscription?type=plans')
      .then(r => r.json())
      .then(d => setPlans(d.plans || []))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n === 0 ? 'رایگان' : n.toLocaleString('fa-IR') + ' تومان'

  return (
    <MarketingShell backHref="/" backLabel="صفحه اصلی">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="lux-kicker lp-kicker-gold mb-4">تعرفه</p>
          <h1 className="lux-h2 mb-4">پلن‌های هوشاگر</h1>
          <p className="lux-body mb-6">شروع کنید — هیچ نیازی به کارت بانکی نیست</p>
          <div className="inline-flex items-center gap-1 rounded-full border border-[rgba(232,236,244,0.12)] bg-[rgba(15,17,23,0.6)] p-1">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${!yearly ? 'bg-[var(--lux-primary)] text-white' : 'text-[var(--lux-text-muted)]'}`}
            >
              ماهانه
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${yearly ? 'bg-[var(--lux-primary)] text-white' : 'text-[var(--lux-text-muted)]'}`}
            >
              سالانه
              <span className="mr-2 rounded-full bg-[rgba(57,217,138,0.15)] px-2 py-0.5 text-xs text-[var(--lux-success)]">۱۷٪ تخفیف</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[var(--lux-text-muted)]">در حال بارگذاری...</div>
        ) : (
          <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const price = yearly ? Math.round(plan.price_yearly / 12) : plan.price_monthly
              const isFeatured = plan.name === 'premium'
              const isEnterprise = plan.name === 'enterprise'
              return (
                <TiltCard
                  key={plan.id}
                  className={`relative h-full p-6 ${PLAN_COLORS[plan.name] || 'lux-card'} ${isFeatured ? 'scale-[1.02]' : ''}`}
                  maxTilt={5}
                >
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--lux-accent)] px-3 py-1 text-xs font-bold text-white">
                      محبوب‌ترین
                    </div>
                  )}
                  <div className="mb-4 text-[var(--lux-primary)]">{PLAN_ICONS[plan.name]}</div>
                  <h3 className="mb-1 text-xl font-black text-[var(--lux-text)]">{plan.display_name}</h3>
                  <p className="mb-4 text-sm text-[var(--lux-text-muted)]">{plan.description}</p>
                  <div className="mb-6">
                    {isEnterprise ? (
                      <p className="text-2xl font-black text-[var(--lux-text)]">تماس بگیرید</p>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-[var(--lux-text)]">{fmt(price)}</span>
                        {price > 0 && <span className="mr-1 text-sm text-[var(--lux-text-muted)]">/ماه</span>}
                      </>
                    )}
                  </div>
                  <Link
                    href={plan.price_monthly === 0 ? '/login' : `/checkout?plan=${plan.name}`}
                    className={`block w-full rounded-full py-3 text-center text-sm font-bold ${PLAN_BTN[plan.name]}`}
                  >
                    {plan.name === 'free' ? 'شروع رایگان' : isEnterprise ? 'درخواست دمو' : 'انتخاب این پلن'}
                  </Link>
                  <div className="mt-6 space-y-2">
                    <p className="mb-2 text-xs font-bold text-[var(--lux-text-muted)]">شامل می‌شود:</p>
                    {(plan.features || []).map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lux-success)]" />
                        <span className="text-sm text-[var(--lux-text-muted)]">{f}</span>
                      </div>
                    ))}
                    <div className="border-t border-[rgba(232,236,244,0.08)] pt-2 text-xs text-[var(--lux-text-muted)]">
                      <p>تا {plan.max_students.toLocaleString('fa-IR')} دانش‌آموز</p>
                      <p>{plan.ai_calls_per_month.toLocaleString('fa-IR')} درخواست AI / ماه</p>
                    </div>
                  </div>
                </TiltCard>
              )
            })}
          </div>
        )}

        <p className="mt-12 text-center text-sm text-[var(--lux-text-muted)]">
          پرداخت امن از طریق درگاه زرین‌پال | پشتیبانی: support@hooshagar.ir
        </p>
      </div>
    </MarketingShell>
  )
}
