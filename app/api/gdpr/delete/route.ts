import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { confirmation } = body;
    
    if (confirmation !== 'DELETE_MY_DATA') {
      return NextResponse.json(
        { error: 'کد تأیید نامعتبر است. لطفاً "DELETE_MY_DATA" را وارد کنید.' },
        { status: 400 }
      );
    }
    
    logger.warn({ userId: user.id }, 'GDPR deletion request initiated');
    
    // ثبت درخواست
    const { data: gdprRequest, error: requestError } = await supabase
      .from('gdpr_requests')
      .insert({
        user_id: user.id,
        request_type: 'delete',
        status: 'processing',
        request_data: { confirmation_code: confirmation }
      })
      .select()
      .single();
    
    if (requestError) throw requestError;
    
    // حذف داده‌ها
    const { data, error } = await supabase
      .rpc('delete_user_data', { p_user_id: user.id });
    
    if (error) throw error;
    
    // بروزرسانی وضعیت
    await supabase
      .from('gdpr_requests')
      .update({
        status: 'completed',
        response_data: data,
        processed_at: new Date().toISOString()
      })
      .eq('id', gdprRequest.id);
    
    // Sign out
    await supabase.auth.signOut();
    
    logger.info({ userId: user.id, requestId: gdprRequest.id }, 'GDPR data deletion completed');
    
    return NextResponse.json({
      success: true,
      message: 'تمام داده‌های شما با موفقیت حذف شد',
      requestId: gdprRequest.id,
      deletedRecords: data?.deleted_records
    });
    
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'GDPR deletion failed');
    Sentry.captureException(error, {
      tags: { endpoint: '/api/gdpr/delete' }
    });
    
    return NextResponse.json(
      { 
        error: 'خطا در حذف داده‌ها',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

