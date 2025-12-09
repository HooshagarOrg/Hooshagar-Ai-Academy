import { NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase/server'
import { AI_FEATURES } from '@/lib/check-ai-limit'

/**
 * GET /api/admin/ai-limits
 * دریافت تمام محدودیت‌ها
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'global'
    const scopeId = searchParams.get('scopeId')

    // در محیط واقعی:
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // // بررسی دسترسی ادمین
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user?.id)
    //   .single()
    // 
    // if (!profile || !['admin', 'principal'].includes(profile.role)) {
    //   return NextResponse.json(
    //     { error: 'دسترسی غیرمجاز' },
    //     { status: 403 }
    //   )
    // }
    // 
    // let query = supabase
    //   .from('ai_usage_limits')
    //   .select('*')
    //   .eq('scope', scope)
    // 
    // if (scopeId) {
    //   query = query.eq('scope_id', scopeId)
    // } else {
    //   query = query.is('scope_id', null)
    // }
    // 
    // const { data, error } = await query.order('feature_name')

    // داده نمونه
    const limits = Object.entries(AI_FEATURES).map(([name, feature]) => ({
      id: `limit-${name}`,
      featureName: name,
      featureLabel: feature.label,
      featureIcon: feature.icon,
      scope,
      scopeId,
      dailyLimit: feature.dailyLimit,
      weeklyLimit: feature.weeklyLimit,
      monthlyLimit: feature.monthlyLimit,
      creditCost: feature.creditCost,
      isEnabled: feature.isEnabled,
      usageThisMonth: Math.floor(Math.random() * 5000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    return NextResponse.json({ limits })
  } catch (error) {
    console.error('Error fetching AI limits:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت محدودیت‌ها' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/ai-limits
 * ایجاد یا بروزرسانی محدودیت
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      featureName,
      scope,
      scopeId,
      dailyLimit,
      weeklyLimit,
      monthlyLimit,
      creditCost,
      isEnabled,
      expiresAt,
      reason,
    } = body

    // اعتبارسنجی
    if (!featureName || !scope) {
      return NextResponse.json(
        { error: 'نام قابلیت و سطح محدودیت الزامی است' },
        { status: 400 }
      )
    }

    if (!AI_FEATURES[featureName]) {
      return NextResponse.json(
        { error: 'قابلیت نامعتبر است' },
        { status: 400 }
      )
    }

    if (!['global', 'school', 'role', 'user'].includes(scope)) {
      return NextResponse.json(
        { error: 'سطح محدودیت نامعتبر است' },
        { status: 400 }
      )
    }

    // در محیط واقعی:
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // // بررسی دسترسی ادمین
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user?.id)
    //   .single()
    // 
    // if (!profile || !['admin', 'principal'].includes(profile.role)) {
    //   return NextResponse.json(
    //     { error: 'دسترسی غیرمجاز' },
    //     { status: 403 }
    //   )
    // }
    // 
    // const { data, error } = await supabase
    //   .from('ai_usage_limits')
    //   .upsert({
    //     feature_name: featureName,
    //     feature_label: AI_FEATURES[featureName].label,
    //     feature_icon: AI_FEATURES[featureName].icon,
    //     scope,
    //     scope_id: scopeId || null,
    //     daily_limit: dailyLimit,
    //     weekly_limit: weeklyLimit,
    //     monthly_limit: monthlyLimit,
    //     credit_cost: creditCost,
    //     is_enabled: isEnabled,
    //     expires_at: expiresAt,
    //     reason,
    //     created_by: user.id,
    //   }, {
    //     onConflict: 'feature_name,scope,COALESCE(scope_id,\'null\')'
    //   })
    //   .select()
    //   .single()

    console.log('[AI Limit Updated]', body)

    return NextResponse.json({
      success: true,
      message: 'محدودیت با موفقیت ذخیره شد',
      limit: {
        id: `limit-${featureName}-${Date.now()}`,
        featureName,
        featureLabel: AI_FEATURES[featureName].label,
        scope,
        scopeId,
        dailyLimit,
        weeklyLimit,
        monthlyLimit,
        creditCost,
        isEnabled,
      },
    })
  } catch (error) {
    console.error('Error saving AI limit:', error)
    return NextResponse.json(
      { error: 'خطا در ذخیره محدودیت' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/ai-limits
 * حذف محدودیت
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitId = searchParams.get('id')

    if (!limitId) {
      return NextResponse.json(
        { error: 'شناسه محدودیت الزامی است' },
        { status: 400 }
      )
    }

    // در محیط واقعی:
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // // بررسی دسترسی ادمین
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user?.id)
    //   .single()
    // 
    // if (!profile || !['admin', 'principal'].includes(profile.role)) {
    //   return NextResponse.json(
    //     { error: 'دسترسی غیرمجاز' },
    //     { status: 403 }
    //   )
    // }
    // 
    // const { error } = await supabase
    //   .from('ai_usage_limits')
    //   .delete()
    //   .eq('id', limitId)

    console.log('[AI Limit Deleted]', limitId)

    return NextResponse.json({
      success: true,
      message: 'محدودیت با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Error deleting AI limit:', error)
    return NextResponse.json(
      { error: 'خطا در حذف محدودیت' },
      { status: 500 }
    )
  }
}





















