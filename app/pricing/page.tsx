'use client'

import { useState, useEffect } from 'react'
import { Check, Zap, Star, Building2, Gift } from 'lucide-react'
import Link from 'next/link'

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
  free: 'border-gray-200 bg-white',
  basic: 'border-blue-200 bg-blue-50',
  premium: 'border-purple-400 bg-purple-50 shadow-xl scale-105',
  enterprise: 'border-gray-800 bg-gray-900 text-white',
}
const PLAN_BTN: Record<string, string> = {
  free: 'bg-gray-800 text-white hover:bg-gray-700',
  basic: 'bg-blue-600 text-white hover:bg-blue-700',
  premium: 'bg-purple-600 text-white hover:bg-purple-700',
  enterprise: 'bg-white text-gray-900 hover:bg-gray-100',
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* هدر */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">پلن‌های هوشاگر</h1>
          <p className="text-xl text-gray-600 mb-6">شروع کنید — هیچ نیازی به کارت بانکی نیست</p>
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
            <button onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!yearly ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              ماهانه
            </button>
            <button onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${yearly ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              سالانه
              <span className="mr-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">۱۷٪ تخفیف</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">در حال بارگذاری...</div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6 items-start">
            {plans.map(plan => {
              const price = yearly ? Math.round(plan.price_yearly / 12) : plan.price_monthly
              const isFeatured = plan.name === 'premium'
              const isEnterprise = plan.name === 'enterprise'
              return (
                <div key={plan.id}
                  className={`relative rounded-2xl border-2 p-6 transition-all ${PLAN_COLORS[plan.name] || 'border-gray-200 bg-white'}`}>
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                      محبوب‌ترین
                    </div>
                  )}
                  <div className={`mb-4 ${isEnterprise ? 'text-white' : 'text-gray-700'}`}>
                    {PLAN_ICONS[plan.name]}
                  </div>
                  <h3 className={`text-xl font-bold mb-1 ${isEnterprise ? 'text-white' : 'text-gray-900'}`}>
                    {plan.display_name}
                  </h3>
                  <p className={`text-sm mb-4 ${isEnterprise ? 'text-gray-400' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    {isEnterprise ? (
                      <p className="text-2xl font-black text-white">تماس بگیرید</p>
                    ) : (
                      <>
                        <span className={`text-3xl font-black ${isEnterprise ? 'text-white' : 'text-gray-900'}`}>
                          {fmt(price)}
                        </span>
                        {price > 0 && <span className="text-sm text-gray-400 mr-1">/ماه</span>}
                      </>
                    )}
                  </div>
                  <Link
                    href={plan.price_monthly === 0 ? '/auth/login' : `/checkout?plan=${plan.name}`}
                    className={`block w-full text-center py-3 rounded-xl font-bold transition-all ${PLAN_BTN[plan.name]}`}>
                    {plan.name === 'free' ? 'شروع رایگان' : isEnterprise ? 'درخواست دمو' : 'انتخاب این پلن'}
                  </Link>
                  <div className="mt-6 space-y-2">
                    <p className={`text-xs font-bold mb-2 ${isEnterprise ? 'text-gray-400' : 'text-gray-500'}`}>
                      شامل می‌شود:
                    </p>
                    {(plan.features || []).map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isEnterprise ? 'text-green-400' : 'text-green-600'}`} />
                        <span className={`text-sm ${isEnterprise ? 'text-gray-300' : 'text-gray-700'}`}>{f}</span>
                      </div>
                    ))}
                    <div className={`pt-2 border-t text-xs ${isEnterprise ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-400'}`}>
                      <p>تا {plan.max_students.toLocaleString('fa-IR')} دانش‌آموز</p>
                      <p>{plan.ai_calls_per_month.toLocaleString('fa-IR')} درخواست AI / ماه</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-gray-400 text-sm mt-12">
          پرداخت امن از طریق درگاه زرین‌پال | پشتیبانی: support@hooshagar.ir
        </p>
      </div>
    </div>
  )
}
