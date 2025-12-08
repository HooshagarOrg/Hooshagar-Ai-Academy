/**
 * API Endpoint: Universal AI Provider
 * POST /api/ai/universal
 * 
 * استفاده از سیستم 6 لایه AI با fallback خودکار
 */

import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/universal-provider-v2';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // احراز هویت
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'لطفاً وارد شوید' },
        { status: 401 }
      );
    }
    
    // دریافت پروفایل برای school_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();
    
    const body = await request.json();
    const { feature, prompt, image } = body;
    
    // اعتبارسنجی ورودی
    if (!feature || typeof feature !== 'string') {
      return NextResponse.json(
        { error: 'پارامتر feature الزامی است' },
        { status: 400 }
      );
    }
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'پارامتر prompt الزامی است' },
        { status: 400 }
      );
    }
    
    if (prompt.length > 10000) {
      return NextResponse.json(
        { error: 'prompt بیش از حد طولانی است (حداکثر 10000 کاراکتر)' },
        { status: 400 }
      );
    }
    
    // فراخوانی AI با سیستم 6 لایه
    const result = await callAI({
      feature,
      prompt,
      image,
      userId: user.id,
      schoolId: profile?.school_id
    });
    
    return NextResponse.json({
      success: true,
      content: result.content,
      metadata: {
        tier: result.tier,
        model: result.model,
        cost: result.cost,
        responseTime: result.responseTime,
        tokensUsed: result.tokensUsed,
        isFree: ['A', 'B', 'C', 'D'].includes(result.tier)
      }
    });
    
  } catch (error: any) {
    console.error('AI API error:', error);
    
    // خطاهای مشخص
    if (error.message?.includes('همه Tier ها ناموفق')) {
      return NextResponse.json(
        { 
          error: 'سرویس AI موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    if (error.message?.includes('بودجه')) {
      return NextResponse.json(
        { 
          error: 'محدودیت بودجه. لطفاً با مدیر سیستم تماس بگیرید.',
          details: error.message
        },
        { status: 429 }
      );
    }
    
    // خطای عمومی
    return NextResponse.json(
      { 
        error: 'خطا در پردازش درخواست',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/universal
 * دریافت لیست قابلیت‌های موجود
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // احراز هویت
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'لطفاً وارد شوید' },
        { status: 401 }
      );
    }
    
    // دریافت لیست قابلیت‌ها
    const { data: features, error } = await supabase
      .from('ai_model_settings')
      .select('feature_name, feature_title, feature_description')
      .order('feature_name');
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      features: features || []
    });
    
  } catch (error: any) {
    console.error('AI features list error:', error);
    
    return NextResponse.json(
      { 
        error: 'خطا در دریافت لیست قابلیت‌ها',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

