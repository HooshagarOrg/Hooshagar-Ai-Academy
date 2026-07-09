'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, Shield, CreditCard, ArrowRight, Loader2, AlertCircle, Gift, Zap, Star, Building2 } from 'lucide-react'
import Link from 'next/link'
import { MarketingShell } from '@/components/layout/marketing-shell'

// ─────────────────────────────────────────────────────────────
// تایپ‌ها
// ─────────────────────────────────────────────────────────────
type Plan = {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  max_students: number
  max_teachers: number
  ai_calls_per_month: number
  features: string[]
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free:       <Gift className="w-6 h-6" />,
  basic:      <Zap className="w-6 h-6" />,
  premium:    <Star className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
}
const PLAN_COLORS: Record<string, string> = {
  free:       'border-gray-200 bg-gray-50',
  basic:      'border-blue-300 bg-blue-50',
  premium:    'border-purple-400 bg-purple-50',
  enterprise: 'border-gray-700 bg-gray-900',
}

// ─────────────────────────────────────────────────────────────
// محتوای اصلی (درون Suspense)
// ─────────────────────────────────────────────────────────────
function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const planName = searchParams.get('plan') || 'basic'
  const isYearly = searchParams.get('billing') === 'yearly'

  const [plan, setPlan]         = useState<Plan | null>(null)
  const [loading, setLoading]   = useState(true)
  const [paying, setPaying]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState('')
  const [agreed, setAgreed]     = useState(false)

  // دریافت اطلاعات پلن
  useEffect(() => {
    fetch('/api/subscription?type=plans')
      .then(r => r.json())
      .then(d => {
        const found = (d.plans || []).find((p: Plan) => p.name === planName)
        setPlan(found || null)
      })
      .catch(() => setError('خطا در دریافت اطلاعات پلن'))
      .finally(() => setLoading(false))
  }, [planName])

  // بررسی پارامترهای callback از زرین‌پال
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
      router.replace('/dashboard?payment=success')
    }
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const msgs: Record<string, string> = {
        cancelled:      'پرداخت لغو شد.',
        payment_failed: 'تأیید پرداخت ناموفق بود. در صورت کسر وجه با پشتیبانی تماس بگیرید.',
        invalid:        'تراکنش نامعتبر است.',
      }
      setError(msgs[errorParam] || 'خطا در پرداخت')
    }
  }, [searchParams, router])

  const price = plan
    ? isYearly ? Math.round(plan.price_yearly / 12) : plan.price_monthly
    : 0

  const handlePayment = async () => {
    if (!plan || !agreed) return
    setPaying(true)
    setError(null)

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: plan.name,
          billing:   isYearly ? 'yearly' : 'monthly',
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'خطا در اتصال به درگاه پرداخت')
        return
      }

      if (data.dev_mode) {
        // محیط توسعه: شبیه‌سازی موفقیت
        router.push('/dashboard?payment=success')
        return
      }

      if (data.payment_url) {
        window.location.href = data.payment_url
      }
    } catch {
      setError('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <MarketingShell backHref="/pricing" backLabel="قیمت‌ها">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--lux-primary)]" />
        </div>
      </MarketingShell>
    )
  }

  if (!plan) {
    return (
      <MarketingShell backHref="/pricing" backLabel="قیمت‌ها">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-[var(--lux-text-muted)]">پلن یافت نشد.</p>
          <Link href="/pricing" className="text-sm text-[var(--lux-primary)] hover:underline">بازگشت به صفحه قیمت‌ها</Link>
        </div>
      </MarketingShell>
    )
  }

  const isEnterprise = plan.name === 'enterprise'
  const isFree = plan.price_monthly === 0

  return (
    <MarketingShell backHref="/pricing" backLabel="قیمت‌ها">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--lux-text-muted)]">
          <Link href="/" className="hover:text-[var(--lux-text)]">خانه</Link>
          <span>/</span>
          <Link href="/pricing" className="hover:text-[var(--lux-text)]">قیمت‌ها</Link>
          <span>/</span>
          <span className="font-bold text-[var(--lux-text)]">پرداخت</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-5">

          {/* ──── ستون اصلی ──── */}
          <div className="md:col-span-3 space-y-6">

            <div>
              <h1 className="text-2xl font-black text-gray-900">تکمیل خرید</h1>
              <p className="text-gray-500 text-sm mt-1">
                شما در حال خرید <strong>{plan.display_name}</strong> هستید
              </p>
            </div>

            {/* نمایش خطا */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {isEnterprise ? (
              /* سازمانی: فرم تماس */
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-bold text-gray-800">درخواست دمو و قیمت سازمانی</h2>
                <p className="text-sm text-gray-500">
                  برای پلن سازمانی با تیم فروش ما تماس بگیرید تا پیشنهاد ویژه‌ای برای مدرسه/مجتمع شما آماده کنیم.
                </p>
                <div className="space-y-3">
                  <input
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="نام مدرسه یا مجتمع آموزشی"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <a
                    href={`mailto:sales@hooshagar.ir?subject=درخواست دمو پلن سازمانی - ${schoolName}`}
                    className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
                  >
                    ارسال درخواست
                  </a>
                </div>
              </div>
            ) : isFree ? (
              /* رایگان: مستقیم به ثبت‌نام */
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-4">
                <Gift className="w-12 h-12 text-gray-400 mx-auto" />
                <h2 className="font-bold text-gray-800">پلن رایگان — بدون نیاز به پرداخت</h2>
                <p className="text-sm text-gray-500">برای شروع کافی است ثبت‌نام کنید.</p>
                <Link
                  href="/auth/register"
                  className="block bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-all"
                >
                  ثبت‌نام رایگان
                </Link>
              </div>
            ) : (
              /* پرداخت واقعی */
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                <h2 className="font-bold text-gray-800">اطلاعات پرداخت</h2>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">نام مدرسه (اختیاری)</label>
                  <input
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="نام مدرسه یا آموزشگاه"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>

                <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
                  <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    پرداخت از طریق درگاه امن <strong>زرین‌پال</strong> انجام می‌شود.
                    اطلاعات کارت شما نزد ما ذخیره نمی‌شود.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-1 accent-purple-600"
                  />
                  <span className="text-sm text-gray-600">
                    <Link href="/terms" className="text-purple-600 hover:underline">قوانین و مقررات</Link>
                    {' '}و{' '}
                    <Link href="/privacy" className="text-purple-600 hover:underline">حریم خصوصی</Link> هوشاگر را می‌پذیرم
                  </span>
                </label>

                <button
                  onClick={handlePayment}
                  disabled={!agreed || paying}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-4 rounded-xl font-bold text-base hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {paying ? (
                    <><Loader2 className="animate-spin w-5 h-5" /> در حال اتصال به درگاه...</>
                  ) : (
                    <><CreditCard className="w-5 h-5" /> پرداخت {price.toLocaleString('fa-IR')} تومان</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ──── ستون خلاصه پلن ──── */}
          <div className="md:col-span-2">
            <div className={`rounded-2xl border-2 p-6 sticky top-6 ${PLAN_COLORS[plan.name] || 'border-gray-200 bg-white'}`}>
              <div className={`mb-3 ${isEnterprise ? 'text-white' : 'text-gray-700'}`}>
                {PLAN_ICONS[plan.name]}
              </div>
              <h3 className={`text-xl font-black mb-1 ${isEnterprise ? 'text-white' : 'text-gray-900'}`}>
                {plan.display_name}
              </h3>
              <p className={`text-sm mb-4 ${isEnterprise ? 'text-gray-400' : 'text-gray-500'}`}>
                {plan.description}
              </p>

              {!isEnterprise && (
                <div className="mb-5">
                  <span className={`text-3xl font-black ${isEnterprise ? 'text-white' : 'text-gray-900'}`}>
                    {isFree ? 'رایگان' : price.toLocaleString('fa-IR') + ' تومان'}
                  </span>
                  {!isFree && <span className="text-sm text-gray-400 mr-1">/ماه</span>}
                  {isYearly && !isFree && (
                    <span className="block text-xs text-green-600 font-medium mt-1">
                      ۱۷٪ تخفیف سالانه اعمال شد
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2 border-t border-current/10 pt-4">
                {(plan.features || []).map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isEnterprise ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-sm ${isEnterprise ? 'text-gray-300' : 'text-gray-700'}`}>{f}</span>
                  </div>
                ))}
              </div>

              <div className={`mt-4 pt-4 border-t text-xs space-y-1 ${isEnterprise ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-400'}`}>
                <p>تا {plan.max_students.toLocaleString('fa-IR')} دانش‌آموز</p>
                <p>{plan.ai_calls_per_month.toLocaleString('fa-IR')} درخواست AI / ماه</p>
              </div>

              <Link
                href="/pricing"
                className={`mt-4 flex items-center gap-1 text-xs hover:underline ${isEnterprise ? 'text-gray-400' : 'text-gray-400'}`}
              >
                <ArrowRight className="w-3 h-3" /> تغییر پلن
              </Link>
            </div>
          </div>

        </div>
      </div>
    </MarketingShell>
  )
}

// ─────────────────────────────────────────────────────────────
// Export با Suspense (چون از useSearchParams استفاده می‌شود)
// ─────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <MarketingShell backHref="/pricing" backLabel="قیمت‌ها">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--lux-primary)]" />
        </div>
      </MarketingShell>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
