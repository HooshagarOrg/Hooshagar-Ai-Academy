import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/logger';
import { withAuth } from '@/lib/security/api-guard';

export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const supabase = await createClient();

      const { confirmation } = await request.json();

      if (confirmation !== 'DELETE_MY_DATA') {
        return NextResponse.json(
          { error: 'Invalid confirmation' },
          { status: 400 }
        );
      }

      const { data: gdprRequest } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: ctx.userId,
          request_type: 'delete',
          status: 'processing'
        })
        .select()
        .single();

      const { error } = await supabase
        .rpc('delete_user_data', { p_user_id: ctx.userId });

      if (error) throw error;

      await supabase
        .from('gdpr_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', gdprRequest?.id);

      await supabase.auth.signOut();

      logger.info({ userId: ctx.userId }, 'GDPR data deletion completed');

      return NextResponse.json({
        success: true,
        message: 'تمام داده‌های شما حذف شد',
        requestId: gdprRequest?.id
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message }, 'GDPR deletion failed');
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}
