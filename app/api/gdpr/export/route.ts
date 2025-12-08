import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ثبت درخواست
    const { data: gdprRequest } = await supabase
      .from('gdpr_requests')
      .insert({
        user_id: user.id,
        request_type: 'export',
        status: 'processing'
      })
      .select()
      .single();
    
    // Export داده‌ها
    const { data, error } = await supabase
      .rpc('export_user_data', { p_user_id: user.id });
    
    if (error) throw error;
    
    // بروزرسانی وضعیت
    await supabase
      .from('gdpr_requests')
      .update({
        status: 'completed',
        response_data: data,
        processed_at: new Date().toISOString()
      })
      .eq('id', gdprRequest?.id);
    
    logger.info({ userId: user.id }, 'GDPR data export completed');
    
    return NextResponse.json({
      success: true,
      data: data,
      requestId: gdprRequest?.id
    });
    
  } catch (error: any) {
    logger.error({ error: error.message }, 'GDPR export failed');
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
