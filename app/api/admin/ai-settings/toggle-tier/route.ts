import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/ai-settings/toggle-tier
 * فعال/غیرفعال کردن Tier پولی
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // احراز هویت Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { tier, enabled } = body;
    
    if (!tier || !['E', 'F'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be E or F' },
        { status: 400 }
      );
    }
    
    // بروزرسانی وضعیت
    const field = tier === 'E' ? 'tier_e_enabled' : 'tier_f_enabled';
    
    const { data, error } = await supabase
      .from('ai_general_settings')
      .update({ [field]: enabled })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // ثبت هشدار
    await supabase.from('ai_alerts').insert({
      alert_type: 'tier_toggle',
      severity: 'info',
      message: `Tier ${tier} توسط Admin ${enabled ? 'فعال' : 'غیرفعال'} شد`,
      details: { tier, enabled, admin_id: user.id }
    });
    
    return NextResponse.json({ success: true, settings: data });
    
  } catch (error: any) {
    console.error('Error toggling tier:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}






















