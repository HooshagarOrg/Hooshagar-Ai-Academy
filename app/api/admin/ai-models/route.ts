import { NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase-server'
import { AVAILABLE_MODELS, DEFAULT_FEATURE_CONFIGS } from '@/lib/ai-model-manager'

/**
 * GET /api/admin/ai-models
 * دریافت تنظیمات مدل‌ها
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'configs' // 'configs', 'available', 'history'
    const featureName = searchParams.get('feature')

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

    if (type === 'available') {
      return NextResponse.json({
        models: AVAILABLE_MODELS,
      })
    }

    if (type === 'history') {
      // در محیط واقعی از Supabase
      // const { data } = await supabase
      //   .from('ai_model_change_history')
      //   .select('*')
      //   .order('created_at', { ascending: false })
      //   .limit(50)

      const mockHistory = [
        {
          id: '1',
          featureName: 'story_wizard',
          oldProvider: 'gemini',
          oldModel: 'gemini-1.5-flash',
          newProvider: 'gemini',
          newModel: 'gemini-2.0-flash-exp',
          changeType: 'primary',
          reason: 'ارتقا به نسخه جدید',
          changedBy: 'admin',
          createdAt: new Date().toISOString(),
        },
      ]

      return NextResponse.json({ history: mockHistory })
    }

    // تنظیمات قابلیت‌ها
    // const { data: configs } = await supabase
    //   .from('ai_model_configs')
    //   .select('*')
    //   .order('feature_name')

    const mockConfigs = Object.entries(DEFAULT_FEATURE_CONFIGS).map(([name, config]) => ({
      id: `config-${name}`,
      featureName: name,
      featureLabel: config.featureLabel || name,
      featureIcon: config.featureIcon || '🤖',
      primaryProvider: config.primaryProvider || 'gemini',
      primaryModel: config.primaryModel || 'gemini-1.5-flash',
      fallbackProvider: config.fallbackProvider,
      fallbackModel: config.fallbackModel,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      topP: 0.9,
      enableFallback: true,
      isEnabled: true,
      totalRequests: Math.floor(Math.random() * 5000),
      successfulRequests: Math.floor(Math.random() * 4900),
      failedRequests: Math.floor(Math.random() * 100),
      fallbackUsedCount: Math.floor(Math.random() * 50),
      avgResponseTimeMs: Math.floor(Math.random() * 2000) + 500,
      totalCostThisMonth: Math.random() * 5,
    }))

    if (featureName) {
      const config = mockConfigs.find(c => c.featureName === featureName)
      return NextResponse.json({ config })
    }

    return NextResponse.json({ configs: mockConfigs })
  } catch (error) {
    console.error('Error fetching AI models:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/ai-models
 * ذخیره تنظیمات مدل
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      featureName,
      primaryProvider,
      primaryModel,
      fallbackProvider,
      fallbackModel,
      temperature,
      maxTokens,
      topP,
      enableFallback,
      customSystemPrompt,
      reason,
    } = body

    // اعتبارسنجی
    if (!featureName || !primaryProvider || !primaryModel) {
      return NextResponse.json(
        { error: 'نام قابلیت و مدل اصلی الزامی است' },
        { status: 400 }
      )
    }

    // بررسی معتبر بودن مدل
    const model = AVAILABLE_MODELS.find(
      m => m.provider === primaryProvider && m.modelId === primaryModel
    )
    if (!model) {
      return NextResponse.json(
        { error: 'مدل انتخابی نامعتبر است' },
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
    //   .from('ai_model_configs')
    //   .upsert({
    //     feature_name: featureName,
    //     primary_provider: primaryProvider,
    //     primary_model: primaryModel,
    //     fallback_provider: fallbackProvider,
    //     fallback_model: fallbackModel,
    //     temperature,
    //     max_tokens: maxTokens,
    //     top_p: topP,
    //     enable_fallback: enableFallback,
    //     custom_system_prompt: customSystemPrompt,
    //     updated_by: user.id,
    //   }, {
    //     onConflict: 'feature_name'
    //   })
    //   .select()
    //   .single()

    console.log('[AI Model Config Updated]', body)

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد',
      config: {
        featureName,
        primaryProvider,
        primaryModel,
        fallbackProvider,
        fallbackModel,
        temperature,
        maxTokens,
        topP,
        enableFallback,
      },
    })
  } catch (error) {
    console.error('Error saving AI model config:', error)
    return NextResponse.json(
      { error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    )
  }
}


