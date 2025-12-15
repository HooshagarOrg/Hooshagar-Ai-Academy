import { NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase/server'
import { AI_FEATURES } from '@/lib/check-ai-limit'

/**
 * GET /api/admin/ai-access
 * دریافت وضعیت دسترسی قابلیت‌ها
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') as 'school' | 'class' | 'user' | null
    const scopeId = searchParams.get('scopeId')

    if (!scope || !scopeId) {
      return NextResponse.json(
        { error: 'scope و scopeId الزامی است' },
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
    // const { data } = await supabase.rpc('get_ai_feature_access_status', {
    //   p_scope: scope,
    //   p_scope_id: scopeId
    // })

    // داده نمونه
    const features = Object.entries(AI_FEATURES).map(([name, feature]) => ({
      id: `access-${name}-${scopeId}`,
      featureName: name,
      featureLabel: feature.label,
      featureIcon: feature.icon,
      scope,
      scopeId,
      isEnabled: Math.random() > 0.1, // 90% فعال
      disabledReason: Math.random() > 0.9 ? 'تست محدودیت' : null,
      disabledUntil: null,
      updatedAt: new Date().toISOString(),
    }))

    return NextResponse.json({ features })
  } catch (error) {
    console.error('Error fetching AI access:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت وضعیت دسترسی' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/ai-access
 * تنظیم دسترسی قابلیت
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      featureName,
      scope,
      scopeId,
      isEnabled,
      reason,
      disabledUntil,
      scopeName,
    } = body

    // اعتبارسنجی
    if (!featureName || !scope || !scopeId) {
      return NextResponse.json(
        { error: 'featureName، scope و scopeId الزامی است' },
        { status: 400 }
      )
    }

    if (!['school', 'class', 'user'].includes(scope)) {
      return NextResponse.json(
        { error: 'scope نامعتبر است' },
        { status: 400 }
      )
    }

    if (!AI_FEATURES[featureName]) {
      return NextResponse.json(
        { error: 'قابلیت نامعتبر است' },
        { status: 400 }
      )
    }

    // برای غیرفعال کردن، دلیل الزامی است
    if (!isEnabled && !reason) {
      return NextResponse.json(
        { error: 'دلیل غیرفعال‌سازی الزامی است' },
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
    // const { data, error } = await supabase.rpc('set_ai_feature_access', {
    //   p_feature_name: featureName,
    //   p_scope: scope,
    //   p_scope_id: scopeId,
    //   p_is_enabled: isEnabled,
    //   p_reason: reason,
    //   p_disabled_until: disabledUntil,
    //   p_user_id: user.id,
    //   p_scope_name: scopeName
    // })

    console.log('[AI Access Updated]', {
      featureName,
      scope,
      scopeId,
      isEnabled,
      reason,
      disabledUntil,
      scopeName,
    })

    return NextResponse.json({
      success: true,
      message: isEnabled ? 'قابلیت فعال شد' : 'قابلیت غیرفعال شد',
    })
  } catch (error) {
    console.error('Error setting AI access:', error)
    return NextResponse.json(
      { error: 'خطا در تنظیم دسترسی' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/ai-access
 * فعال کردن همه قابلیت‌ها
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { scope, scopeId, isEnabled } = body

    if (!scope || !scopeId) {
      return NextResponse.json(
        { error: 'scope و scopeId الزامی است' },
        { status: 400 }
      )
    }

    // در محیط واقعی:
    // const supabase = createServerClient()
    // 
    // for (const featureName of Object.keys(AI_FEATURES)) {
    //   await supabase.rpc('set_ai_feature_access', {
    //     p_feature_name: featureName,
    //     p_scope: scope,
    //     p_scope_id: scopeId,
    //     p_is_enabled: isEnabled,
    //   })
    // }

    console.log('[AI Access Bulk Updated]', { scope, scopeId, isEnabled, count: Object.keys(AI_FEATURES).length })

    return NextResponse.json({
      success: true,
      message: isEnabled ? 'همه قابلیت‌ها فعال شد' : 'همه قابلیت‌ها غیرفعال شد',
      count: Object.keys(AI_FEATURES).length,
    })
  } catch (error) {
    console.error('Error bulk updating AI access:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی دسترسی' },
      { status: 500 }
    )
  }
}










































