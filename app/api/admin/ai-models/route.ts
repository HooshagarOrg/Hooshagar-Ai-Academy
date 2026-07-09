import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard';

/**
 * GET /api/admin/ai-models
 * دریافت لیست مدل‌ها و آمار آنها
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const supabase = await createClient();

      // دریافت مدل‌ها
      const { data: models, error } = await supabase
        .from('ai_model_settings')
        .select('*')
        .order('feature_name');

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, models });
    } catch (error: any) {
      console.error('Error fetching AI models:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }, { roles: ADMIN_ROLES });
}
