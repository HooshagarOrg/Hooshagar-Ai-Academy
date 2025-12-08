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
    
    logger.info({ userId: user.id }, 'GDPR export request initiated');
    
    // ثبت درخواست
    const { data: gdprRequest, error: requestError } = await supabase
      .from('gdpr_requests')
      .insert({
        user_id: user.id,
        request_type: 'export',
        status: 'processing'
      })
      .select()
      .single();
    
    if (requestError) throw requestError;
    
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
      .eq('id', gdprRequest.id);
    
    logger.info({ userId: user.id, requestId: gdprRequest.id }, 'GDPR data export completed');
    
    return NextResponse.json({
      success: true,
      data: data,
      requestId: gdprRequest.id,
      message: 'داده‌های شما با موفقیت استخراج شد'
    });
    
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'GDPR export failed');
    Sentry.captureException(error, {
      tags: { endpoint: '/api/gdpr/export' }
    });
    
    return NextResponse.json(
      { 
        error: 'خطا در استخراج داده‌ها',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

