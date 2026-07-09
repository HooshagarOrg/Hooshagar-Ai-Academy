import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard';

/**
 * GET /api/admin/ai-alerts
 * دریافت لیست هشدارهای AI
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const supabase = await createClient();

      // دریافت هشدارها (فقط 50 تای اخیر)
      const { data: alerts, error } = await supabase
        .from('ai_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, alerts });
    } catch (error: any) {
      console.error('Error fetching AI alerts:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }, { roles: ADMIN_ROLES });
}
