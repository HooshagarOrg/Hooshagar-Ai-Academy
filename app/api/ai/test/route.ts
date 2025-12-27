import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase-server'

/**
 * API Route تستی برای سیستم AI
 * 
 * POST /api/ai/test
 * Body: {
 *   capability: string (مثلاً 'study_buddy')
 *   prompt: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    
    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً ابتدا وارد شوید' },
        { status: 401 }
      )
    }

    // دریافت داده‌های درخواست
    const body = await req.json()
    const { capability, prompt } = body

    if (!capability || !prompt) {
      return NextResponse.json(
        { error: 'فیلدهای capability و prompt الزامی هستند' },
        { status: 400 }
      )
    }

    console.log(`[AI Test] User: ${user.id}, Capability: ${capability}`)

    // فراخوانی AI با Fallback
    const result = await callAI({
      capability,
      prompt,
      userId: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        model_used: result.model_used,
        tier_used: result.tier_used,
        tokens: result.tokens,
        response_time_ms: result.response_time_ms,
      },
    })
  } catch (error) {
    console.error('[AI Test] Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/test
 * لیست قابلیت‌های موجود
 */
export async function GET() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('ai_model_configs')
      .select('capability_key, capability_name, capability_description')
      .eq('is_active', true)
      .order('priority')

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      capabilities: data,
    })
  } catch (error) {
    console.error('[AI Test] Error:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

