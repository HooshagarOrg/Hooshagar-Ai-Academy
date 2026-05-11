import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'

const ZARINPAL_MERCHANT = process.env.ZARINPAL_MERCHANT_ID || 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
const ZARINPAL_REQUEST_URL = 'https://api.zarinpal.com/pg/v4/payment/request.json'
const ZARINPAL_VERIFY_URL  = 'https://api.zarinpal.com/pg/v4/payment/verify.json'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hooshagar.ir'

// ============================================
// POST: درخواست پرداخت (شروع تراکنش)
// ============================================
export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    const supabase = await createClient()
    const body = await request.json()
    const { plan_name, school_id } = body

    // دریافت اطلاعات پلن
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', plan_name)
      .single()

    if (!plan) return NextResponse.json({ error: 'پلن یافت نشد' }, { status: 404 })
    if (plan.price_monthly === 0) return NextResponse.json({ error: 'پلن رایگان نیاز به پرداخت ندارد' }, { status: 400 })

    // ساخت رکورد تراکنش در انتظار
    const { data: tx, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        school_id: school_id || null,
        owner_id: ctx.userId,
        amount: plan.price_monthly,
        currency: 'IRR',
        gateway: 'zarinpal',
        status: 'pending',
        description: `اشتراک پلن ${plan.display_name} - ماهانه`,
        metadata: { plan_name, plan_id: plan.id },
      })
      .select()
      .single()

    if (txError) return NextResponse.json({ error: txError.message }, { status: 400 })

    // درخواست به زرین‌پال
    const callbackUrl = `${APP_URL}/api/payment/verify?tx_id=${tx.id}`

    const zpRes = await fetch(ZARINPAL_REQUEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT,
        amount: plan.price_monthly * 10, // تومان → ریال
        description: `هوشاگر - پلن ${plan.display_name}`,
        callback_url: callbackUrl,
        metadata: { mobile: '', email: '' },
      }),
    }).catch(() => null)

    if (!zpRes?.ok) {
      // در محیط dev: بازگشت URL آزمایشی
      if (process.env.APP_ENV === 'development') {
        return NextResponse.json({
          success: true,
          payment_url: `${APP_URL}/api/payment/verify?tx_id=${tx.id}&Authority=dev-test&Status=OK`,
          dev_mode: true,
          message: 'محیط توسعه: بدون اتصال واقعی به درگاه',
        })
      }
      return NextResponse.json({ error: 'خطا در اتصال به درگاه پرداخت' }, { status: 502 })
    }

    const zpData = await zpRes.json()
    if (zpData.data?.code !== 100) {
      return NextResponse.json({
        error: `خطای درگاه: ${zpData.errors?.message || 'کد ' + zpData.data?.code}`
      }, { status: 400 })
    }

    // ذخیره Authority درگاه
    await supabase
      .from('payment_transactions')
      .update({ gateway_ref_id: zpData.data.authority })
      .eq('id', tx.id)

    const paymentUrl = `https://www.zarinpal.com/pg/StartPay/${zpData.data.authority}`
    return NextResponse.json({ success: true, payment_url: paymentUrl, transaction_id: tx.id })
  }, {})
}

// ============================================
// GET: تأیید پرداخت (Callback از زرین‌پال)
// ============================================
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const txId     = searchParams.get('tx_id')
  const authority = searchParams.get('Authority')
  const status   = searchParams.get('Status')

  if (!txId || status !== 'OK') {
    return NextResponse.redirect(`${APP_URL}/pricing?error=cancelled`)
  }

  // دریافت تراکنش
  const { data: tx } = await supabase
    .from('payment_transactions')
    .select('*, metadata')
    .eq('id', txId)
    .single()

  if (!tx || tx.status !== 'pending') {
    return NextResponse.redirect(`${APP_URL}/pricing?error=invalid`)
  }

  // تأیید با زرین‌پال
  const verifyRes = await fetch(ZARINPAL_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: ZARINPAL_MERCHANT,
      amount: tx.amount * 10,
      authority,
    }),
  }).catch(() => null)

  const isDevMode = authority === 'dev-test'
  const isVerified = isDevMode || (verifyRes?.ok && (await verifyRes.json()).data?.code === 100)

  if (!isVerified) {
    await supabase
      .from('payment_transactions')
      .update({ status: 'failed' })
      .eq('id', txId)
    return NextResponse.redirect(`${APP_URL}/pricing?error=payment_failed`)
  }

  // تأیید موفق — فعال‌سازی پلن
  const planName = (tx.metadata as Record<string, string>)?.plan_name
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  await supabase
    .from('payment_transactions')
    .update({
      status: 'paid',
      gateway_tracking_code: authority,
      paid_at: new Date().toISOString(),
    })
    .eq('id', txId)

  if (tx.school_id && planName) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', planName)
      .single()

    if (plan) {
      await supabase
        .from('subscriptions')
        .upsert({
          school_id: tx.school_id,
          plan_id: plan.id,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          auto_renew: false,
        }, { onConflict: 'school_id' })
    }
  }

  return NextResponse.redirect(`${APP_URL}/dashboard?payment=success`)
}
