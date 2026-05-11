import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'

// ============================================
// GET: پلن‌ها و اشتراک فعلی
// ============================================
export async function GET(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'plans'

    if (type === 'plans') {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      return NextResponse.json({ plans: data || [] })
    }

    if (type === 'my_subscription') {
      // اشتراک مدرسه کاربر جاری
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', ctx.userId)
        .single()

      if (!profile?.school_id) {
        // پلن رایگان پیش‌فرض
        const { data: freePlan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('name', 'free')
          .single()
        return NextResponse.json({ subscription: null, plan: freePlan })
      }

      const { data: sub } = await supabase
        .from('active_subscriptions')
        .select('*')
        .eq('school_id', profile.school_id)
        .single()

      return NextResponse.json({ subscription: sub })
    }

    if (type === 'all' && ADMIN_ROLES.includes(ctx.role as never)) {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(name,display_name,price_monthly), schools(name)')
        .order('created_at', { ascending: false })
      return NextResponse.json({ subscriptions: data || [] })
    }

    return NextResponse.json({ error: 'نوع نامعتبر' }, { status: 400 })
  }, {})
}

// ============================================
// POST: ارتقاء یا تغییر پلن (ادمین)
// ============================================
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    const supabase = await createClient()
    const body = await request.json()
    const { school_id, plan_name, expires_at, notes } = body

    if (!school_id || !plan_name) {
      return NextResponse.json({ error: 'مدرسه و پلن الزامی است' }, { status: 400 })
    }

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', plan_name)
      .single()

    if (!plan) return NextResponse.json({ error: 'پلن یافت نشد' }, { status: 404 })

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        school_id,
        plan_id: plan.id,
        status: 'active',
        expires_at: expires_at || null,
        notes: notes || null,
      }, { onConflict: 'school_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, message: `پلن ${plan_name} برای مدرسه فعال شد` })
  }, { roles: ADMIN_ROLES })
}
