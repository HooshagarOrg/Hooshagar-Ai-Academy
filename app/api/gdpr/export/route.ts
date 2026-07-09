import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/logger';
import { withAuth } from '@/lib/security/api-guard';

export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const supabase = await createClient();

      const { data: gdprRequest } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: ctx.userId,
          request_type: 'export',
          status: 'processing'
        })
        .select()
        .single();

      const { data, error } = await supabase
        .rpc('export_user_data', { p_user_id: ctx.userId });

      if (error) throw error;

      await supabase
        .from('gdpr_requests')
        .update({
          status: 'completed',
          response_data: data,
          processed_at: new Date().toISOString()
        })
        .eq('id', gdprRequest?.id);

      logger.info({ userId: ctx.userId }, 'GDPR data export completed');

      return NextResponse.json({
        success: true,
        data: data,
        requestId: gdprRequest?.id
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message }, 'GDPR export failed');
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}
