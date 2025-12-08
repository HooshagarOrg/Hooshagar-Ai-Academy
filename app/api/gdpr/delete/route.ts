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
    
    const { confirmation } = await request.json();
    
    if (confirmation !== 'DELETE_MY_DATA') {
      return NextResponse.json(
        { error: 'Invalid confirmation' },
        { status: 400 }
      );
    }
    
    // ثبت درخواست
    const { data: gdprRequest } = await supabase
      .from('gdpr_requests')
      .insert({
        user_id: user.id,
        request_type: 'delete',
        status: 'processing'
      })
      .select()
      .single();
    
    // حذف داده‌ها
    const { error } = await supabase
      .rpc('delete_user_data', { p_user_id: user.id });
    
    if (error) throw error;
    
    // بروزرسانی وضعیت
    await supabase
      .from('gdpr_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', gdprRequest?.id);
    
    // Sign out
    await supabase.auth.signOut();
    
    logger.info({ userId: user.id }, 'GDPR data deletion completed');
    
    return NextResponse.json({
      success: true,
      message: 'تمام داده‌های شما حذف شد',
      requestId: gdprRequest?.id
    });
    
  } catch (error: any) {
    logger.error({ error: error.message }, 'GDPR deletion failed');
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
