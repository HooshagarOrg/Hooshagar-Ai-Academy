import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard';

/**
 * POST /api/admin/ai-alerts/[id]/acknowledge
 * تأیید یک هشدار
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (ctx) => {
    try {
      const supabase = await createClient();

      // تأیید هشدار
      const { data, error } = await supabase
        .from('ai_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: ctx.userId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, alert: data });
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }, { roles: ADMIN_ROLES });
}
